import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { listShipments } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const createShipmentSchema = z.object({
  commodity: z.string().trim().max(160).optional(),
  customerId: z.string().min(1),
  description: z.string().trim().max(2000).optional(),
  shipmentType: z.enum(["AIR", "SEA", "BUY_AND_SHIP"]),
  originCountry: z.string().min(2),
  destinationCountry: z.string().min(2),
  expectedArrival: z.string().min(8),
  packageCount: z.number().int().positive().optional(),
  packages: z
    .array(
      z.object({
        weight: z.number().nonnegative(),
        length: z.number().nonnegative().optional(),
        width: z.number().nonnegative().optional(),
        height: z.number().nonnegative().optional(),
        volume: z.number().nonnegative().optional(),
        declaredValue: z.number().nonnegative().optional(),
      }),
    )
    .min(1),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const { items, mode } = await listShipments({ search, status, type });
  return ok(items, { count: items.length, mode });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "operations"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createShipmentSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const prefix =
    parsed.data.shipmentType === "SEA"
      ? "SEA"
      : parsed.data.shipmentType === "BUY_AND_SHIP"
        ? "BAS"
        : "AWB";
  let shipment: { id: string } | null = null;
  let trackingNumber = "";
  let shipmentError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")}`;
    trackingNumber = `${prefix}-${suffix}`;

    const insertResponse = await supabase
      .from("shipments")
      .insert({
        commodity: parsed.data.commodity?.trim() || null,
        customer_id: parsed.data.customerId,
        description: parsed.data.description?.trim() || null,
        destination_country: parsed.data.destinationCountry,
        expected_arrival: parsed.data.expectedArrival,
        origin_country: parsed.data.originCountry,
        package_count: parsed.data.packageCount ?? parsed.data.packages.length,
        shipment_type: parsed.data.shipmentType,
        status: "pending",
        tracking_number: trackingNumber,
      })
      .select("*")
      .single();

    if (!insertResponse.error && insertResponse.data) {
      shipment = insertResponse.data;
      shipmentError = null;
      break;
    }

    shipmentError = {
      code: insertResponse.error?.code,
      message: insertResponse.error?.message ?? "Failed to create shipment.",
    };

    if (insertResponse.error?.code !== "23505") {
      break;
    }
  }

  if (!shipment) {
    return apiError(
      "SUPABASE_ERROR",
      shipmentError?.message ?? "Failed to create shipment.",
      shipmentError?.code === "42501" ? 403 : 500,
      shipmentError,
    );
  }

  const packageRows = parsed.data.packages.map((pkg, index) => ({
    declared_value: pkg.declaredValue ?? null,
    height: pkg.height ?? null,
    length: pkg.length ?? null,
    package_code: `${trackingNumber}-PKG-${index + 1}`,
    shipment_id: shipment.id,
    volume: pkg.volume ?? null,
    weight: pkg.weight,
    width: pkg.width ?? null,
  }));

  const { error: packageError } = await supabase
    .from("shipment_packages")
    .insert(packageRows);

  if (packageError) {
    await supabase.from("shipments").delete().eq("id", shipment.id);
    return apiError(
      "SUPABASE_ERROR",
      packageError.code === "42501"
        ? "Shipment package insert was blocked by Supabase RLS. Run the updated shipment_packages policies from supabase/rls_setup.sql."
        : packageError.message,
      packageError.code === "42501" ? 403 : 500,
      packageError,
    );
  }

  return ok(
    {
      id: shipment.id,
      trackingNumber,
      ...parsed.data,
      status: "pending",
    },
    { mode: "supabase" },
  );
}

export function DELETE() {
  return apiError(
    "METHOD_NOT_ALLOWED",
    "Use DELETE /api/v1/shipments/:id once shipment detail routes are enabled.",
    405,
  );
}
