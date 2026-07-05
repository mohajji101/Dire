import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureShipmentInvoiceForFinalStage } from "@/lib/supabase/auto-invoices";
import { getShipmentInvoiceSummary } from "@/lib/supabase/invoice-balance";
import { sendCustomerNotification } from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";
import { isShipmentCompleted, validateShipmentTransition } from "@/lib/workflow-guards";

const releaseSchema = z.object({
  packageId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "operations", "warehouse"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = releaseSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: packageRow, error: packageError } = await supabase
    .from("shipment_packages")
    .select("id, shipment_id, package_code, warehouse_shelf_id")
    .eq("id", parsed.data.packageId)
    .single();

  if (packageError || !packageRow) {
    return apiError(
      "SUPABASE_ERROR",
      packageError?.message ?? "Package was not found.",
      packageError?.code === "42501" ? 403 : packageError ? 500 : 404,
      packageError,
    );
  }

  if (!packageRow.warehouse_shelf_id) {
    return apiError(
      "VALIDATION_ERROR",
      "This package is not currently assigned to a warehouse shelf.",
      422,
    );
  }

  const [{ data: shipmentRow, error: shipmentError }, { data: shelfRow, error: shelfError }] =
    await Promise.all([
      supabase
        .from("shipments")
        .select("id, status, tracking_number")
        .eq("id", packageRow.shipment_id)
        .single(),
      supabase
        .from("warehouse_shelves")
        .select("id, shelf_code, zone_id")
        .eq("id", packageRow.warehouse_shelf_id)
        .single(),
    ]);

  if (shipmentError || !shipmentRow || shelfError || !shelfRow) {
    return apiError(
      "SUPABASE_ERROR",
      shipmentError?.message ??
        shelfError?.message ??
        "Package release context could not be loaded.",
      shipmentError?.code === "42501" || shelfError?.code === "42501" ? 403 : 500,
      shipmentError ?? shelfError,
    );
  }

  if (isShipmentCompleted(shipmentRow.status ?? "pending")) {
    return apiError(
      "WORKFLOW_ERROR",
      "This shipment is already completed and can no longer be released from warehouse storage.",
      409,
    );
  }

  const { data: zoneRow, error: zoneError } = await supabase
    .from("warehouse_zones")
    .select("id, zone_name, warehouse_id")
    .eq("id", shelfRow.zone_id)
    .single();

  if (zoneError || !zoneRow) {
    return apiError(
      "SUPABASE_ERROR",
      zoneError?.message ?? "Warehouse zone was not found.",
      zoneError?.code === "42501" ? 403 : 500,
      zoneError,
    );
  }

  const { data: warehouseRow, error: warehouseError } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("id", zoneRow.warehouse_id)
    .single();

  if (warehouseError || !warehouseRow) {
    return apiError(
      "SUPABASE_ERROR",
      warehouseError?.message ?? "Warehouse was not found.",
      warehouseError?.code === "42501" ? 403 : 500,
      warehouseError,
    );
  }

  const warehouseName = warehouseRow.name;
  const nextStatus =
    warehouseName === "Mogadishu HQ" || warehouseName === "Muqdisho HQ"
      ? "ready_for_pickup"
      : "in_transit";

  if (nextStatus === "ready_for_pickup") {
    const invoiceEnsureResult = await ensureShipmentInvoiceForFinalStage(
      supabase,
      shipmentRow.id,
    );
    if (!invoiceEnsureResult.ok) {
      return apiError("WORKFLOW_ERROR", invoiceEnsureResult.error, 409);
    }

    const invoiceSummary = await getShipmentInvoiceSummary(supabase, shipmentRow.id);
    if (invoiceSummary.hasInvoice && invoiceSummary.balanceDue > 0) {
      return apiError(
        "WORKFLOW_ERROR",
        `Package cannot be released for final handoff while invoice ${invoiceSummary.invoiceNumber ?? ""} still has an unpaid balance of ${invoiceSummary.balanceDue.toFixed(2)} ${invoiceSummary.currency}.`,
        409,
      );
    }
  }
  const transition = validateShipmentTransition(shipmentRow.status ?? "pending", nextStatus);

  if (!transition.ok) {
    return apiError("WORKFLOW_ERROR", transition.message, 409);
  }

  const historyNote =
    nextStatus === "ready_for_pickup"
      ? `Package released from ${warehouseName} shelf ${shelfRow.shelf_code} for final customer handoff.`
      : `Package released from ${warehouseName} shelf ${shelfRow.shelf_code} for transit to Muqdisho HQ.`;

  const { error: packageUpdateError } = await supabase
    .from("shipment_packages")
    .update({ warehouse_shelf_id: null })
    .eq("id", parsed.data.packageId);

  if (packageUpdateError) {
    return apiError(
      "SUPABASE_ERROR",
      packageUpdateError.code === "42501"
        ? "Package release was blocked by Supabase RLS. Run the updated shipment_packages policies from supabase/rls_setup.sql."
        : packageUpdateError.message,
      packageUpdateError.code === "42501" ? 403 : 500,
      packageUpdateError,
    );
  }

  const previousStatus = shipmentRow.status ?? "pending";
  const { error: shipmentUpdateError } = await supabase
    .from("shipments")
    .update({ status: nextStatus })
    .eq("id", shipmentRow.id);

  if (shipmentUpdateError) {
    await supabase
      .from("shipment_packages")
      .update({ warehouse_shelf_id: packageRow.warehouse_shelf_id })
      .eq("id", parsed.data.packageId);
    return apiError(
      "SUPABASE_ERROR",
      shipmentUpdateError.code === "42501"
        ? "Shipment status update was blocked by Supabase RLS. Run the updated shipment policies from supabase/rls_setup.sql."
        : shipmentUpdateError.message,
      shipmentUpdateError.code === "42501" ? 403 : 500,
      shipmentUpdateError,
    );
  }

  const { error: historyError } = await supabase
    .from("shipment_status_history")
    .insert({
      notes: historyNote,
      shipment_id: shipmentRow.id,
      status: nextStatus,
    });

  if (historyError) {
    await supabase.from("shipments").update({ status: previousStatus }).eq("id", shipmentRow.id);
    await supabase
      .from("shipment_packages")
      .update({ warehouse_shelf_id: packageRow.warehouse_shelf_id })
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
    .eq("id", shipmentRow.id)
    .maybeSingle();

  if (shipmentContext?.customer_id) {
    await sendCustomerNotification({
      customerId: shipmentContext.customer_id,
      message:
        nextStatus === "ready_for_pickup"
          ? `Shipment ${shipmentContext.tracking_number ?? shipmentRow.id} is ready for final pickup at Muqdisho HQ.`
          : `Shipment ${shipmentContext.tracking_number ?? shipmentRow.id} has left ${warehouseName} and is now in transit.`,
      title: nextStatus === "ready_for_pickup" ? "Shipment Ready for Pickup" : "Shipment Released from Warehouse",
      type: nextStatus === "ready_for_pickup" ? "shipment_ready_for_pickup" : "warehouse_release",
    });
  }

  return ok(
    {
      event: "warehouse_release",
      nextStatus,
      packageId: packageRow.id,
      previousStatus,
      shipmentId: shipmentRow.id,
      trackingNumber: shipmentRow.tracking_number,
      warehouseName,
    },
    { mode: "supabase" },
  );
}
