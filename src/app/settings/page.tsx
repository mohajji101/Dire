import {
  Bell,
  Building2,
  Coins,
  History,
  Search,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AssignUserRoleForm } from "@/components/assign-user-role-form";
import { DeletePricingRuleButton } from "@/components/delete-pricing-rule-button";
import { DeleteExchangeRateButton } from "@/components/delete-exchange-rate-button";
import { DeleteUserButton } from "@/components/delete-user-button";
import { EditBranchForm } from "@/components/edit-branch-form";
import { EditCurrencyForm } from "@/components/edit-currency-form";
import { EditPricingRuleForm } from "@/components/edit-pricing-rule-form";
import { NewBranchForm } from "@/components/new-branch-form";
import { NewCurrencyForm } from "@/components/new-currency-form";
import { NewExchangeRateForm } from "@/components/new-exchange-rate-form";
import { NewPricingRuleForm } from "@/components/new-pricing-rule-form";
import { RevokeUserRoleButton } from "@/components/revoke-user-role-button";
import { getSettingsOverviewData } from "@/lib/supabase/dire-data";

function titleize(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

type SettingsPageProps = {
  searchParams?: Promise<{
    search?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = (await searchParams) ?? {};
  const settings = await getSettingsOverviewData();
  const search = params.search?.trim().toLowerCase() ?? "";
  const matchesSearch = (...values: Array<string | number | undefined>) =>
    search.length === 0 ||
    values
      .filter((value): value is string | number => value !== undefined)
      .join(" ")
      .toLowerCase()
      .includes(search);
  const filteredUsers = settings.users.filter((user) =>
    matchesSearch(user.email, user.status, user.roles.map((role) => role.name).join(" ")),
  );
  const filteredBranches = settings.branches.filter((branch) =>
    matchesSearch(branch.name, branch.city, branch.country, branch.branchType, branch.status),
  );
  const filteredCurrencies = settings.currencies.filter((currency) =>
    matchesSearch(currency.code, currency.name, currency.symbol, currency.exchangeRateToUsd),
  );
  const filteredExchangeRates = settings.exchangeRates.filter((rate) =>
    matchesSearch(rate.fromCurrency, rate.toCurrency, rate.rate, rate.effectiveDate),
  );
  const filteredNotificationRules = settings.notificationRules.filter((rule) =>
    matchesSearch(rule.event, rule.channel, rule.audience),
  );
  const filteredPricingRules = settings.pricingRules.filter((rule) =>
    matchesSearch(rule.shipmentType, rule.currency, rule.range, rule.price),
  );
  const filteredAuditLogs = settings.auditLogs.filter((entry) =>
    matchesSearch(entry.action, entry.module, entry.summary, entry.userEmail, entry.detail),
  );

  return (
    <AppShell activeItem="Settings">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            Settings
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            System Settings
          </h1>
          <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
            Configure users, roles, permissions, branches, warehouses,
            notifications, workflow rules, currencies, and pricing foundations.
          </p>
          <p className="mt-4 font-body text-sm text-on-surface-variant">
            {settings.mode === "supabase"
              ? "Settings are reading live configuration from Supabase."
              : "Settings are showing demo data because live Supabase configuration is not available."}
          </p>
          <form className="mt-5 max-w-xl" method="get">
            <label className="relative block">
              <span className="sr-only">Search settings</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                defaultValue={params.search ?? ""}
                name="search"
                placeholder="Search users, branches, currencies, rules..."
              />
            </label>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Roles", value: settings.roles.length, icon: Shield },
            { label: "Branches", value: settings.branches.length, icon: Building2 },
            { label: "Currencies", value: settings.currencies.length, icon: Coins },
            {
              label: "Notification Types",
              value: settings.notificationRules.length,
              icon: Bell,
            },
          ].map((stat) => (
            <article
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              key={stat.label}
            >
              <div className="flex items-center justify-between">
                <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                  {stat.label}
                </p>
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 font-heading text-3xl font-bold text-primary">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex flex-col gap-4 border-b border-outline-variant p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-2xl font-bold text-primary">
                  Roles & Permissions
                </h2>
              </div>
              <AssignUserRoleForm
                roles={settings.roles.map((role) => ({
                  id: role.id,
                  label: role.name,
                }))}
                triggerClassName="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary"
                users={filteredUsers.map((user) => ({
                  id: user.id,
                  label: `${user.email} (${user.roles.map((role) => role.name).join(", ") || "No role"})`,
                }))}
              />
            </div>
            <div className="divide-y divide-surface-container-high">
              {filteredUsers.map((user) => (
                <div className="p-5" key={user.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-data text-sm font-bold text-on-surface">
                        {user.email}
                      </p>
                      <p className="mt-1 font-body text-sm text-on-surface-variant">
                        Status: {user.status}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-3 py-1 font-data text-xs font-bold text-on-surface-variant">
                      {user.roles.length} roles
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <div
                          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-2 py-1"
                          key={role.assignmentId}
                        >
                          <span className="font-data text-xs font-semibold text-on-surface">
                            {role.name}
                          </span>
                          <RevokeUserRoleButton
                            assignmentId={role.assignmentId}
                            label={`${role.name} from ${user.email}`}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                        No roles assigned
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <DeleteUserButton email={user.email} userId={user.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex flex-col gap-4 border-b border-outline-variant p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-2xl font-bold text-primary">
                  Branches
                </h2>
              </div>
              <NewBranchForm
                triggerClassName="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary"
              />
            </div>
            <div className="divide-y divide-surface-container-high">
              {filteredBranches.map((branch) => (
                <div className="grid gap-2 p-5 md:grid-cols-[1fr_auto]" key={branch.id}>
                  <div>
                    <p className="font-data text-sm font-bold text-on-surface">
                      {branch.name}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {branch.city}, {branch.country}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        branch.status === "active"
                          ? "h-fit rounded-full bg-emerald-50 px-3 py-1 font-data text-xs font-bold text-success"
                          : "h-fit rounded-full bg-red-50 px-3 py-1 font-data text-xs font-bold text-error"
                      }
                    >
                      {branch.branchType}
                    </span>
                    <EditBranchForm branch={branch} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex flex-col gap-4 border-b border-outline-variant p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-2xl font-bold text-primary">
                  Currencies
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <NewCurrencyForm triggerClassName="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-4 font-data text-sm font-bold text-on-surface" />
                <NewExchangeRateForm
                  currencies={filteredCurrencies.map((currency) => ({
                    code: currency.code,
                    label: `${currency.code} - ${currency.name}`,
                  }))}
                  triggerClassName="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary"
                />
              </div>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              {filteredCurrencies.map((currency, index) => (
                <div
                  className="border-b border-outline-variant p-5 md:border-r md:even:border-r-0"
                  key={currency.id ?? `${currency.code}-${currency.name}-${currency.symbol}-${index}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-data text-sm font-bold text-on-surface">
                        {currency.code} / {currency.symbol}
                      </p>
                      <p className="mt-1 font-body text-sm text-on-surface-variant">
                        {currency.name}
                      </p>
                      <p className="mt-3 font-data text-xs font-semibold text-on-surface-variant">
                        USD rate: {currency.exchangeRateToUsd}
                      </p>
                    </div>
                    {currency.id ? (
                      <EditCurrencyForm
                        currency={{
                          code: currency.code,
                          id: currency.id,
                          name: currency.name,
                          symbol: currency.symbol,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-outline-variant p-5">
              <h3 className="font-data text-sm font-bold uppercase text-on-surface">
                Exchange Rate History
              </h3>
              <div className="mt-4 space-y-3">
                {filteredExchangeRates.length > 0 ? (
                  filteredExchangeRates.slice(0, 8).map((rate) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-3"
                      key={rate.id}
                    >
                      <div>
                        <p className="font-data text-sm font-bold text-on-surface">
                          {rate.fromCurrency} to {rate.toCurrency}
                        </p>
                        <p className="mt-1 font-body text-sm text-on-surface-variant">
                          Rate {rate.rate} / Effective {rate.effectiveDate}
                        </p>
                      </div>
                      <DeleteExchangeRateButton
                        id={rate.id}
                        label={`${rate.fromCurrency} ${rate.effectiveDate}`}
                      />
                    </div>
                  ))
                ) : (
                  <p className="font-body text-sm text-on-surface-variant">
                    No exchange-rate history yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-3 border-b border-outline-variant p-5">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-primary">
                Notification Activity
              </h2>
            </div>
            <div className="divide-y divide-surface-container-high">
              {filteredNotificationRules.map((rule) => (
                <div className="flex items-center justify-between gap-4 p-5" key={rule.id}>
                  <div>
                    <p className="font-data text-sm font-bold text-on-surface">
                      {titleize(rule.event)}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {titleize(rule.channel)} / {rule.audience}
                    </p>
                  </div>
                  <span
                    className={
                      rule.enabled
                        ? "rounded-full bg-emerald-50 px-3 py-1 font-data text-xs font-bold text-success"
                        : "rounded-full bg-red-50 px-3 py-1 font-data text-xs font-bold text-error"
                    }
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col gap-4 border-b border-outline-variant p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-primary">
                Pricing Rules
              </h2>
            </div>
            <NewPricingRuleForm
              currencies={filteredCurrencies.map((currency) => ({
                code: currency.code,
                label: `${currency.code} - ${currency.name}`,
              }))}
              triggerClassName="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary"
            />
          </div>
          <div className="grid gap-0 md:grid-cols-3">
            {filteredPricingRules.length > 0 ? (
              filteredPricingRules.map((rule) => (
                <div
                  className="border-b border-outline-variant p-5 md:border-r md:[&:nth-child(3n)]:border-r-0"
                  key={rule.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-data text-sm font-bold text-on-surface">
                      {rule.shipmentType}
                    </p>
                    <div className="flex items-center gap-2">
                      <EditPricingRuleForm
                        currencies={filteredCurrencies.map((currency) => ({
                          code: currency.code,
                          label: `${currency.code} - ${currency.name}`,
                        }))}
                        rule={{
                          chargeType: rule.chargeType,
                          currency: rule.currency,
                          id: rule.id,
                          maximumValue: rule.range.includes("+")
                            ? ""
                            : rule.range.split(" - ")[1] ?? "",
                          minimumValue: rule.range === "Fixed charge"
                            ? "0"
                            : rule.range.split(" - ")[0]?.replace("+", "") ?? "",
                          priceRaw: rule.price.replace(/[^0-9.]/g, ""),
                          shipmentType:
                            rule.shipmentType.startsWith("Sea")
                              ? "SEA"
                              : rule.shipmentType.startsWith("Buy And Ship")
                                ? "BUY_AND_SHIP"
                                : "AIR",
                        }}
                      />
                      <DeletePricingRuleButton
                        label={`${rule.shipmentType} ${rule.range}`}
                        ruleId={rule.id}
                      />
                    </div>
                  </div>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Range {rule.range}
                  </p>
                  <p className="mt-3 font-data text-xs font-semibold text-on-surface-variant">
                    Price {rule.price} / {rule.currency}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full p-5">
                <p className="font-data text-sm font-bold text-on-surface">
                  No pricing rules yet
                </p>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  Add rows to `pricing_rules` in Supabase to populate this section.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-3 border-b border-outline-variant p-5">
            <History className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-heading text-2xl font-bold text-primary">
                Recent Audit Activity
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                Latest settings and access-control changes recorded from live actions.
              </p>
            </div>
          </div>
          <div className="divide-y divide-surface-container-high">
            {filteredAuditLogs.length > 0 ? (
              filteredAuditLogs.map((entry) => (
                <div
                  className="grid gap-3 p-5 md:grid-cols-[160px_140px_1fr_220px]"
                  key={entry.id}
                >
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Action
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {entry.action}
                    </p>
                  </div>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Module
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {entry.module}
                    </p>
                  </div>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Summary
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface">
                      {entry.summary}
                    </p>
                    {entry.detail ? (
                      <p className="mt-1 font-data text-xs font-semibold text-on-surface-variant">
                        {entry.detail}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      User / Time
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface">
                      {entry.userEmail}
                    </p>
                    <p className="mt-1 font-data text-xs font-semibold text-on-surface-variant">
                      {entry.createdAt}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5">
                <p className="font-data text-sm font-bold text-on-surface">
                  No audit activity yet
                </p>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  Create or update settings records and recent actions will appear here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
