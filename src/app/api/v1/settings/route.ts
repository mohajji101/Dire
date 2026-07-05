import { ok } from "@/lib/api-responses";
import { getSettingsOverviewData } from "@/lib/supabase/dire-data";

export async function GET() {
  const settings = await getSettingsOverviewData();

  return ok(
    {
      branches: settings.branches,
      currencies: settings.currencies,
      notificationRules: settings.notificationRules,
      pricingRules: settings.pricingRules,
      roles: settings.roles,
      users: settings.users,
    },
    { mode: settings.mode },
  );
}
