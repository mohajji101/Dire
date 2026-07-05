import Link from "next/link";
import { ArrowRight, CircleUserRound, PackageSearch, ShieldCheck } from "lucide-react";
import { getDefaultRouteForRole } from "@/lib/access-control";
import { hasSupabaseEnv } from "@/lib/env";
import { getCurrentAppUser } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";
import { PublicShipmentTracker } from "@/components/public-shipment-tracker";

export default async function Home() {
  let workspaceHref = "/login";
  let isSignedIn = false;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profile = await getCurrentAppUser();
      workspaceHref = getDefaultRouteForRole(profile.role);
      isSignedIn = true;
    }
  }

  return (
    <main className="min-h-screen bg-surface-container-low text-on-surface">
      <section className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                Dire Cargo Logistics
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-5xl">
                Cargo tracking, customer access, and operations in one portal
              </h1>
              <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
                Public visitors can track shipments here. Staff and signed-in customers can
                continue into the full workspace only when they need protected actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary"
                href={workspaceHref}
              >
                {isSignedIn ? "Open Workspace" : "Login"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!isSignedIn ? (
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm font-bold text-primary"
                  href="/signup"
                >
                  Create Account
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: PackageSearch,
                label: "Public shipment tracking",
                text: "Customers can check cargo progress before signing in.",
              },
              {
                icon: CircleUserRound,
                label: "Customer portal access",
                text: "Sign in only when invoices, support, or profile updates are needed.",
              },
              {
                icon: ShieldCheck,
                label: "Protected staff workspace",
                text: "Warehouse, finance, settings, and operations stay behind login.",
              },
            ].map((item) => (
              <div
                className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
                key={item.label}
              >
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 font-data text-sm font-bold text-on-surface">{item.label}</p>
                <p className="mt-2 font-body text-sm text-on-surface-variant">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <PublicShipmentTracker />
      </div>
    </main>
  );
}
