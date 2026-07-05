import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerNotification } from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";
import { isShipmentCompleted } from "@/lib/workflow-guards";

const assignShelfSchema = z.object({
  packageId: z.string().min(3),
  shelfId: z.string().min(2),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "operations", "warehouse"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = assignShelfSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: packageRow, error: packageError } = await supabase
    .from("shipment_packages")
    .select("id, shipment_id, warehouse_shelf_id")
    .eq("id", parsed.data.packageId)
    .single();

  if (packageError || !packageRow) {
    return apiError(
      "SUPABASE_ERROR",
      packageError?.message ?? "Package not found.",
      packageError?.code === "42501" ? 403 : packageError ? 500 : 404,
      packageError,
    );
  }

  if (packageRow.warehouse_shelf_id) {
    return apiError(
      "WORKFLOW_ERROR",
      "This package is already assigned to a shelf.",
      409,
    );
  }

  const { data: shipmentRow, error: shipmentError } = await supabase
    .from("shipments")
    .select("id, status")
    .eq("id", packageRow.shipment_id)
    .single();

  if (shipmentError || !shipmentRow) {
    return apiError(
      "SUPABASE_ERROR",
      shipmentError?.message ?? "Shipment not found for this package.",
      shipmentError?.code === "42501" ? 403 : shipmentError ? 500 : 404,
      shipmentError,
    );
  }

  if (isShipmentCompleted(shipmentRow.status ?? "pending")) {
    return apiError(
      "WORKFLOW_ERROR",
      "This shipment is already completed, so warehouse shelf assignment is no longer allowed.",
      409,
    );
  }

  const [
    { data: shelfRow, error: shelfError },
    { data: receiptRows, error: receiptError },
  ] = await Promise.all([
    supabase
      .from("warehouse_shelves")
      .select("id, shelf_code, zone_id")
      .eq("id", parsed.data.shelfId)
      .single(),
    supabase
      .from("warehouse_receipts")
      .select("warehouse_id, received_date")
      .eq("shipment_id", packageRow.shipment_id)
      .order("received_date", { ascending: false })
      .limit(1),
  ]);

  if (shelfError || !shelfRow) {
    return apiError(
      "SUPABASE_ERROR",
      shelfError?.message ?? "Shelf not found.",
      shelfError?.code === "42501" ? 403 : shelfError ? 500 : 404,
      shelfError,
    );
  }

  if (receiptError || !receiptRows?.length || !receiptRows[0].warehouse_id) {
    return apiError(
      "SUPABASE_ERROR",
      receiptError?.message ?? "Latest warehouse receipt could not be loaded for this package.",
      receiptError?.code === "42501" ? 403 : receiptError ? 500 : 404,
      receiptError,
    );
  }

  const [zoneResponse, occupiedPackagesResponse] = await Promise.all([
    supabase
      .from("warehouse_zones")
      .select("id, zone_name, warehouse_id")
      .eq("id", shelfRow.zone_id)
      .single(),
    supabase
      .from("shipment_packages")
      .select("id, shipment_id")
      .eq("warehouse_shelf_id", parsed.data.shelfId)
      .limit(10),
  ]);

  if (zoneResponse.error || !zoneResponse.data) {
    return apiError(
      "SUPABASE_ERROR",
      zoneResponse.error?.message ?? "Shelf zone not found.",
      zoneResponse.error?.code === "42501" ? 403 : zoneResponse.error ? 500 : 404,
      zoneResponse.error,
    );
  }

  if (occupiedPackagesResponse.error) {
    return apiError(
      "SUPABASE_ERROR",
      occupiedPackagesResponse.error.message,
      occupiedPackagesResponse.error.code === "42501" ? 403 : 500,
      occupiedPackagesResponse.error,
    );
  }

  const occupiedShipmentIds = [
    ...new Set(
      (occupiedPackagesResponse.data ?? [])
        .map((pkg) => pkg.shipment_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const { data: occupiedShipmentRows, error: occupiedShipmentError } = occupiedShipmentIds.length
    ? await supabase
        .from("shipments")
        .select("id, status")
        .in("id", occupiedShipmentIds)
    : { data: [], error: null };

  if (occupiedShipmentError) {
    return apiError(
      "SUPABASE_ERROR",
      occupiedShipmentError.message,
      occupiedShipmentError.code === "42501" ? 403 : 500,
      occupiedShipmentError,
    );
  }

  const hasActiveOccupant = (occupiedPackagesResponse.data ?? []).some((pkg) => {
    const shipment = (occupiedShipmentRows ?? []).find((row) => row.id === pkg.shipment_id);
    return shipment ? !isShipmentCompleted(shipment.status ?? "pending") : true;
  });

  if (hasActiveOccupant) {
    return apiError("WORKFLOW_ERROR", "This shelf is already occupied.", 409);
  }

  if (zoneResponse.data.warehouse_id !== receiptRows[0].warehouse_id) {
    return apiError(
      "WORKFLOW_ERROR",
      "This shelf belongs to a different warehouse. Assign the package inside its current receiving warehouse only.",
      409,
    );
  }

  const { data, error } = await supabase
    .from("shipment_packages")
    .update({ warehouse_shelf_id: parsed.data.shelfId })
    .eq("id", parsed.data.packageId)
    .select("id")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to assign shelf.",
      500,
      error,
    );
  }

  const { error: historyError } = await supabase.from("shipment_status_history").insert({
    notes: `Package assigned to shelf ${shelfRow.shelf_code} in ${zoneResponse.data.zone_name}.`,
    shipment_id: packageRow.shipment_id,
    status: shipmentRow.status ?? "in_warehouse",
  });

  if (historyError) {
    await supabase
      .from("shipment_packages")
      .update({ warehouse_shelf_id: null })
      .eq("id", parsed.data.packageId);
    return apiError(
      "SUPABASE_ERROR",
      historyError.code === "42501"
        ? "Shipment status history insert was blocked by Supabase RLS. Run the updated shipment_status_history policies from supabase/rls_setup.sql."
        : historyError.message,
      historyError.code === "42501" ? 403 : 500,
      historyError,
    );
  }

  const { data: shipmentContext } = await supabase
    .from("shipments")
    .select("customer_id, tracking_number")
    .eq("id", packageRow.shipment_id)
    .maybeSingle();

  if (shipmentContext?.customer_id) {
    await sendCustomerNotification({
      customerId: shipmentContext.customer_id,
      message: `Shipment ${shipmentContext.tracking_number ?? packageRow.shipment_id} has been verified and stored on shelf ${shelfRow.shelf_code}.`,
      title: "Warehouse Verification Complete",
      type: "warehouse_verified",
    });
  }

  return ok(
    {
      ...parsed.data,
      status: "assigned",
      event: "warehouse_updated",
    },
    { mode: "supabase" },
  );
}
