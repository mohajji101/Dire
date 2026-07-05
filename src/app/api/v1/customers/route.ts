import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { normalizeCustomerType } from "@/lib/customer-types";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { listCustomers } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const createCustomerSchema = z
  .object({
    customerType: z.enum(["individual", "business", "government", "ngo"]),
    firstName: z.string().min(1),
    lastName: z.string().min(1).optional(),
    companyName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().min(6),
    country: z.string().min(2),
    city: z.string().min(2),
    address: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.customerType !== "individual" &&
      !value.companyName?.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company or organization name is required for this customer type.",
        path: ["companyName"],
      });
    }
  });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const { items, mode } = await listCustomers({ search, status, type });
  return ok(items, { count: items.length, mode });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "operations", "support"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  let data: { id: string } | null = null;
  let customerCode = "";
  let suiteNumber = "";
  let lastError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const codeSeed = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")}`;
    customerCode = `DC${codeSeed}`;
    suiteNumber = `SU-${codeSeed}`;
    const payload = {
      address: parsed.data.address ?? null,
      city: parsed.data.city,
      company_name: parsed.data.companyName?.trim() ? parsed.data.companyName.trim() : null,
      country: parsed.data.country,
      customer_code: customerCode,
      customer_type: normalizeCustomerType(parsed.data.customerType),
      email: parsed.data.email,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName ?? null,
      phone: parsed.data.phone,
      status: "active",
      suite_number: suiteNumber,
    };

    const insertResponse = await supabase
      .from("customers")
      .insert(payload)
      .select("*")
      .single();

    if (!insertResponse.error && insertResponse.data) {
      data = insertResponse.data;
      break;
    }

    lastError = {
      code: insertResponse.error?.code,
      message: insertResponse.error?.message ?? "Customer creation failed.",
    };

    if (insertResponse.error?.code !== "23505") {
      break;
    }
  }

  if (!data) {
    return apiError(
      "SUPABASE_ERROR",
      lastError?.message ?? "Customer creation failed.",
      lastError?.code === "42501" ? 403 : 500,
      lastError,
    );
  }

  return ok(
    {
      id: data.id,
      customerCode,
      suiteNumber,
      status: "active",
      ...parsed.data,
    },
    { mode: "supabase" },
  );
}

export function DELETE() {
  return apiError(
    "METHOD_NOT_ALLOWED",
    "Use DELETE /api/v1/customers/:id for a specific customer.",
    405,
  );
}
