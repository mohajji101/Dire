import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerNotification } from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";
import { isShipmentCompleted, validateBuyShipTransition, validateShipmentTransition } from "@/lib/workflow-guards";

const receiveSchema = z.object({
  buyShipRequestId: z.string().uuid().optional(),
  customerCode: z.string().min(3),
  volume: z.number().nonnegative().optional(),
  sourceBranchId: z.uuid(),
  shipmentId: z.string().uuid().optional(),
  warehouseId: z.uuid(),
  weight: z.number().nonnegative(),
  photoUrl: z.string().url().optional(),
}).refine(
  (value) => Boolean(value.shipmentId) !== Boolean(value.buyShipRequestId),
  {
    message: "Provide either shipmentId or buyShipRequestId.",
    path: ["shipmentId"],
  },
);

function buildCode(prefix: string) {
  const suffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0")}`;
  return `${prefix}-${suffix}`;
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "operations", "warehouse"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = receiveSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const [branchResponse, warehouseResponse] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, country")
      .eq("id", parsed.data.sourceBranchId)
      .single(),
    supabase
      .from("warehouses")
      .select("id, name")
      .eq("id", parsed.data.warehouseId)
      .single(),
  ]);

  if (
    branchResponse.error ||
    !branchResponse.data ||
    warehouseResponse.error ||
    !warehouseResponse.data
  ) {
    return apiError(
      "SUPABASE_ERROR",
      branchResponse.error?.message ??
        warehouseResponse.error?.message ??
        "Location selection is invalid.",
      500,
      branchResponse.error ?? warehouseResponse.error,
    );
  }

  const sourceBranchName = branchResponse.data.name;
  const destinationWarehouseName = warehouseResponse.data.name;
  const sourceCountry = branchResponse.data.country ?? "China";

  let shipmentId = parsed.data.shipmentId ?? null;
  let shipmentStatus = "pending";
  let shipmentCustomerId = "";
  let reusedExistingPackage = false;
  let previousPackageState:
    | { id: string; volume: number | null; weight: number | null }
    | null = null;

  if (parsed.data.shipmentId) {
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("id, customer_id, status, shipment_type, customers(customer_code)")
      .eq("id", parsed.data.shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return apiError(
        "SUPABASE_ERROR",
        shipmentError?.message ?? "Shipment not found.",
        500,
        shipmentError,
      );
    }

    if (isShipmentCompleted(shipment.status ?? "pending")) {
      return apiError(
        "WORKFLOW_ERROR",
        "This shipment is already completed and can no longer receive warehouse packages.",
        409,
      );
    }

    const customerCode =
      shipment.customers &&
      typeof shipment.customers === "object" &&
      "customer_code" in shipment.customers
        ? String(shipment.customers.customer_code)
        : null;

    if (customerCode && customerCode !== parsed.data.customerCode) {
      return apiError("VALIDATION_ERROR", "Customer code does not match shipment.", 422);
    }

    shipmentId = shipment.id;
    shipmentStatus = shipment.status ?? "pending";
    shipmentCustomerId = shipment.customer_id;

    const transition = validateShipmentTransition(shipmentStatus, "in_warehouse");
    if (!transition.ok && shipmentStatus !== "in_warehouse") {
      return apiError("WORKFLOW_ERROR", transition.message, 409);
    }
  } else if (parsed.data.buyShipRequestId) {
    const { data: requestRow, error: requestError } = await supabase
      .from("buy_ship_requests")
      .select("id, customer_id, product_name, quantity, status, customers(customer_code, country)")
      .eq("id", parsed.data.buyShipRequestId)
      .single();

    if (requestError || !requestRow) {
      return apiError(
        "SUPABASE_ERROR",
        requestError?.message ?? "Buy & Ship request not found.",
        500,
        requestError,
      );
    }

    const buyShipTransition = validateBuyShipTransition(
      requestRow.status ?? "requested",
      "in_warehouse",
    );

    if (!buyShipTransition.ok) {
      return apiError("WORKFLOW_ERROR", buyShipTransition.message, 409);
    }

    const requestCustomerCode =
      requestRow.customers &&
      typeof requestRow.customers === "object" &&
      "customer_code" in requestRow.customers
        ? String(requestRow.customers.customer_code)
        : null;

    if (requestCustomerCode && requestCustomerCode !== parsed.data.customerCode) {
      return apiError("VALIDATION_ERROR", "Customer code does not match Buy & Ship request.", 422);
    }

    const customerCountry =
      requestRow.customers &&
      typeof requestRow.customers === "object" &&
      "country" in requestRow.customers &&
      requestRow.customers.country
        ? String(requestRow.customers.country)
        : "Somalia";

    let shipmentRow:
      | { customer_id: string; id: string; status: string | null }
      | null = null;
    let createShipmentError: { code?: string; message: string } | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const trackingNumber = buildCode("BAS");
      const insertResponse = await supabase
        .from("shipments")
        .insert({
          customer_id: requestRow.customer_id,
          destination_country: customerCountry,
          origin_country: sourceCountry,
          shipment_type: "BUY_AND_SHIP",
          status: "in_warehouse",
          tracking_number: trackingNumber,
        })
        .select("id, customer_id, status")
        .single();

      if (!insertResponse.error && insertResponse.data) {
        shipmentRow = insertResponse.data;
        createShipmentError = null;
        break;
      }

      createShipmentError = {
        code: insertResponse.error?.code,
        message:
          insertResponse.error?.message ?? "Failed to create shipment from Buy & Ship request.",
      };

      if (insertResponse.error?.code !== "23505") {
        break;
      }
    }

    if (createShipmentError || !shipmentRow) {
      return apiError(
        "SUPABASE_ERROR",
        createShipmentError?.message ?? "Failed to create shipment from Buy & Ship request.",
        createShipmentError?.code === "42501" ? 403 : 500,
        createShipmentError,
      );
    }

    const { error: buyShipUpdateError } = await supabase
      .from("buy_ship_requests")
      .update({ shipment_id: shipmentRow.id, status: "in_warehouse" })
      .eq("id", requestRow.id);

    if (buyShipUpdateError) {
      await supabase.from("shipments").delete().eq("id", shipmentRow.id);
      return apiError(
        "SUPABASE_ERROR",
        buyShipUpdateError.message.includes("row-level security")
          ? "Buy & Ship status update was blocked by Supabase RLS while moving the request into warehouse stage."
          : buyShipUpdateError.message,
        500,
        buyShipUpdateError,
      );
    }

    shipmentId = shipmentRow.id;
    shipmentStatus = shipmentRow.status ?? "in_warehouse";
    shipmentCustomerId = shipmentRow.customer_id;
  }

  let data: { id: string } | null = null;
  let packageCode = "";
  let error: { code?: string; message: string } | null = null;

  if (parsed.data.shipmentId && shipmentId) {
    const [{ data: existingPackages, error: existingPackagesError }, { count: existingReceiptCount, error: existingReceiptError }] =
      await Promise.all([
        supabase
          .from("shipment_packages")
          .select("id, package_code, weight, volume")
          .eq("shipment_id", shipmentId)
          .order("package_code", { ascending: true }),
        supabase
          .from("warehouse_receipts")
          .select("id", { count: "exact", head: true })
          .eq("shipment_id", shipmentId),
      ]);

    if (existingPackagesError || existingReceiptError) {
      return apiError(
        "SUPABASE_ERROR",
        existingPackagesError?.message ??
          existingReceiptError?.message ??
          "Failed to validate existing shipment packages.",
        500,
        existingPackagesError ?? existingReceiptError,
      );
    }

    if ((existingReceiptCount ?? 0) === 0 && (existingPackages?.length ?? 0) === 1) {
      const existingPackage = existingPackages?.[0];
      if (existingPackage) {
        previousPackageState = {
          id: existingPackage.id,
          volume:
            existingPackage.volume === null || existingPackage.volume === undefined
              ? null
              : Number(existingPackage.volume),
          weight:
            existingPackage.weight === null || existingPackage.weight === undefined
              ? null
              : Number(existingPackage.weight),
        };

        const updateResponse = await supabase
          .from("shipment_packages")
          .update({
            volume: parsed.data.volume ?? null,
            weight: parsed.data.weight,
          })
          .eq("id", existingPackage.id)
          .select("id, package_code")
          .single();

        if (updateResponse.error || !updateResponse.data) {
          return apiError(
            "SUPABASE_ERROR",
            updateResponse.error?.message ?? "Failed to reuse the existing shipment package.",
            updateResponse.error?.code === "42501" ? 403 : 500,
            updateResponse.error,
          );
        }

        reusedExistingPackage = true;
        data = { id: updateResponse.data.id };
        packageCode = updateResponse.data.package_code;
      }
    }
  }

  if (!data) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      packageCode = buildCode("PKG");
      const insertResponse = await supabase
        .from("shipment_packages")
        .insert({
          package_code: packageCode,
          shipment_id: shipmentId,
          volume: parsed.data.volume ?? null,
          weight: parsed.data.weight,
        })
        .select("id")
        .single();

      if (!insertResponse.error && insertResponse.data) {
        data = insertResponse.data;
        error = null;
        break;
      }

      error = {
        code: insertResponse.error?.code,
        message: insertResponse.error?.message ?? "Failed to receive package.",
      };

      if (insertResponse.error?.code !== "23505") {
        break;
      }
    }
  }

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to receive package.",
      error?.code === "42501" ? 403 : 500,
      error,
    );
  }

  const { error: receiptError } = await supabase.from("warehouse_receipts").insert({
    customer_id: shipmentCustomerId,
    received_date: new Date().toISOString(),
    shipment_id: shipmentId,
    warehouse_id: parsed.data.warehouseId,
  });

  if (receiptError) {
    if (reusedExistingPackage && previousPackageState) {
      await supabase
        .from("shipment_packages")
        .update({
          volume: previousPackageState.volume,
          weight: previousPackageState.weight,
        })
        .eq("id", previousPackageState.id);
    } else {
      await supabase.from("shipment_packages").delete().eq("id", data.id);
    }
    return apiError(
      "SUPABASE_ERROR",
      receiptError.message.includes("row-level security")
        ? 'Warehouse receipt insert was blocked by Supabase RLS. Run the updated warehouse policies from supabase/rls_setup.sql.'
        : receiptError.message,
      500,
      receiptError,
    );
  }

  const { error: historyError } = await supabase.from("shipment_status_history").insert({
    notes: `Package received at ${destinationWarehouseName} from ${sourceBranchName}.`,
    shipment_id: shipmentId,
    status: shipmentStatus,
  });

  if (historyError) {
    await supabase.from("warehouse_receipts").delete().eq("shipment_id", shipmentId).eq("warehouse_id", parsed.data.warehouseId);
    if (reusedExistingPackage && previousPackageState) {
      await supabase
        .from("shipment_packages")
        .update({
          volume: previousPackageState.volume,
          weight: previousPackageState.weight,
        })
        .eq("id", previousPackageState.id);
    } else {
      await supabase.from("shipment_packages").delete().eq("id", data.id);
    }
    return apiError(
      "SUPABASE_ERROR",
      historyError.message.includes("row-level security")
        ? 'Shipment status history insert was blocked by Supabase RLS. Run the updated warehouse policies from supabase/rls_setup.sql.'
        : historyError.message,
      500,
      historyError,
    );
  }

  if (shipmentCustomerId) {
    await sendCustomerNotification({
      customerId: shipmentCustomerId,
      message: `A package for customer code ${parsed.data.customerCode} has been received at ${destinationWarehouseName} from ${sourceBranchName}.`,
      title: "Package Received",
      type: "warehouse_received",
    });
  }

  return ok(
    {
      id: data.id,
      packageCode,
      status: "pending_verification",
      event: "package_received",
      ...parsed.data,
      sourceBranchName,
      warehouseName: destinationWarehouseName,
    },
    { mode: "supabase" },
  );
}
