import { apiError, ok } from "@/lib/api-responses";
import { getInvoiceDetail } from "@/lib/supabase/dire-data";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const detail = await getInvoiceDetail(id);

  if (!detail) {
    return apiError("NOT_FOUND", "Invoice was not found.", 404);
  }

  return ok(detail, { mode: detail.mode });
}
