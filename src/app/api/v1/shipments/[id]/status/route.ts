import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { demoShipments } from "@/lib/demo-data";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureShipmentInvoiceForFinalStage } from "@/lib/supabase/auto-invoices";
import { getShipmentInvoiceSummary } from "@/lib/supabase/invoice-balance";
import { sendCustomerNotification } from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";
import { validateShipmentTransition } from "@/lib/workflow-guards";

const statusSchema = z.object({
  status: z.string().min(2),
  notes: z.string().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function updateShipmentStatus(
  supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>,
  id: string,
  status: string,
  notes?: string,
) {
  const { data: currentShipment, error: currentShipmentError } = await supabase
    .from("shipments")
    .select("id, status")
    .eq("id", id)
    .single();

  if (currentShipmentError || !currentShipment) {
    return apiError(
      "SUPABASE_ERROR",
      currentShipmentError?.message ?? "Shipment was not found.",
      currentShipmentError?.code === "42501" ? 403 : currentShipmentError ? 500 : 404,
      currentShipmentError,
    );
  }

  const previousStatus = currentShipment.status;
  const transition = validateShipmentTransition(previousStatus, status);
  let previousShelfAssignments:
    | Array<{ id: string; warehouse_shelf_id: string | null }>
    | null = null;

  if (!transition.ok) {
    return apiError("WORKFLOW_ERROR", transition.message, 409);
  }

  if (status === "ready_for_pickup") {
    const invoiceEnsureResult = await ensureShipmentInvoiceForFinalStage(supabase, id);
    if (!invoiceEnsureResult.ok) {
      return apiError("WORKFLOW_ERROR", invoiceEnsureResult.error, 409);
    }
  }

  if (status === "delivered") {
    const invoiceSummary = await getShipmentInvoiceSummary(supabase, id);
    if (!invoiceSummary.hasInvoice) {
      return apiError(
        "WORKFLOW_ERROR",
        "Shipment cannot be completed until an invoice has been created.",
        409,
      );
    }
    if (invoiceSummary.balanceDue > 0) {
      return apiError(
        "WORKFLOW_ERROR",
        `Shipment cannot be completed until invoice ${
          invoiceSummary.invoiceNumber ?? ""
        } is fully paid. Remaining balance: ${invoiceSummary.balanceDue.toFixed(2)} ${invoiceSummary.currency}.`,
        409,
      );
    }

    const { data: packageRows, error: packageRowsError } = await supabase
      .from("shipment_packages")
      .select("id, warehouse_shelf_id")
      .eq("shipment_id", id)
      .not("warehouse_shelf_id", "is", null);

    if (packageRowsError) {
      return apiError(
        "SUPABASE_ERROR",
        packageRowsError.message,
        packageRowsError.code === "42501" ? 403 : 500,
        packageRowsError,
      );
    }

    previousShelfAssignments = (packageRows ?? []).map((pkg) => ({
      id: pkg.id,
      warehouse_shelf_id: pkg.warehouse_shelf_id,
    }));
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .single();

  if (shipmentError || !shipment) {
    return apiError(
      "SUPABASE_ERROR",
      shipmentError?.message ?? "Shipment was not found.",
      shipmentError?.code === "42501" ? 403 : shipmentError ? 500 : 404,
      shipmentError,
    );
  }

  if (status === "delivered" && previousShelfAssignments?.length) {
    const packageIds = previousShelfAssignments.map((pkg) => pkg.id);
    const { error: shelfReleaseError } = await supabase
      .from("shipment_packages")
      .update({ warehouse_shelf_id: null })
      .in("id", packageIds);

    if (shelfReleaseError) {
      await supabase.from("shipments").update({ status: previousStatus }).eq("id", id);
      return apiError(
        "SUPABASE_ERROR",
        shelfReleaseError.message,
        shelfReleaseError.code === "42501" ? 403 : 500,
        shelfReleaseError,
      );
    }
  }

  const { error: historyError } = await supabase
    .from("shipment_status_history")
    .insert({
      notes: notes ?? null,
      shipment_id: id,
      status,
    });

  if (historyError) {
    await supabase.from("shipments").update({ status: previousStatus }).eq("id", id);
    if (status === "delivered" && previousShelfAssignments?.length) {
      for (const pkg of previousShelfAssignments) {
        await supabase
          .from("shipment_packages")
          .update({ warehouse_shelf_id: pkg.warehouse_shelf_id })
          .eq("id", pkg.id);
      }
    }
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
    .eq("id", id)
    .maybeSingle();

  if (shipmentContext?.customer_id) {
    await sendCustomerNotification({
      customerId: shipmentContext.customer_id,
      message: `Shipment ${shipmentContext.tracking_number ?? id} is now marked as ${status.replaceAll("_", " ")}.`,
      title: "Shipment Status Updated",
      type: "shipment_status_updated",
    });
  }

  return ok(
    {
      event: "shipment_status_changed",
      notes: notes ?? null,
      previousStatus,
      shipmentId: id,
      status,
    },
    { mode: "supabase" },
  );
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiRole(["super_admin", "operations"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (hasSupabaseEnv()) {
    if (hasSupabaseServiceRole()) {
      return updateShipmentStatus(
        createAdminClient(),
        id,
        parsed.data.status,
        parsed.data.notes,
      );
    }

    const supabase = await createClient();
    return updateShipmentStatus(
      supabase,
      id,
      parsed.data.status,
      parsed.data.notes,
    );
  }

  const shipment = demoShipments.find((item) => item.id === id);

  if (!shipment) {
    return apiError("NOT_FOUND", "Shipment was not found.", 404);
  }

  return ok(
    {
      event: "shipment_status_changed",
      notes: parsed.data.notes ?? null,
      previousStatus: shipment.status,
      shipmentId: id,
      status: parsed.data.status,
    },
    { mode: "demo" },
  );
}
