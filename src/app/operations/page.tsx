import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getOperationsBoardData } from "@/lib/supabase/dire-data";

const toneClasses: Record<string, string> = {
  blue: "bg-blue-100 text-primary-container",
  orange: "bg-orange-100 text-orange-700",
  yellow: "bg-secondary-container text-on-secondary-container",
};

const metricIcons = {
  "Active Shipments": Truck,
  "Pending Clearance": ClipboardList,
  "Warehouse Capacity": Boxes,
};

type OperationsPageProps = {
  searchParams?: Promise<{
    search?: string;
    stage?: string;
  }>;
};

export default async function OperationsPage({ searchParams }: OperationsPageProps) {
  const params = (await searchParams) ?? {};
  const board = await getOperationsBoardData();
  const search = params.search?.trim().toLowerCase() ?? "";
  const stage = params.stage?.trim().toLowerCase() ?? "";
  const filteredColumns = board.columns.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => {
      const matchesStage = stage.length === 0 || column.key === stage;
      const matchesSearch =
        search.length === 0
          ? true
          : [
              card.tracking,
              card.customer,
              card.route,
              card.title,
              card.footer,
              card.badge,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(search);
      return matchesStage && matchesSearch;
    }),
  }));
  const visibleCardCount = filteredColumns.reduce(
    (sum, column) => sum + column.cards.length,
    0,
  );
  const filteredBoardStats = [
    {
      label: "Visible Cards",
      value: String(visibleCardCount),
    },
    ...board.stats.slice(0, 3),
  ];

  return (
    <AppShell activeItem="Operations">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Operations
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              Operations Board
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
              Manage cargo from China Warehouse through Muqdisho HQ clearance,
              pickup, and final delivery.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-0">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-4 font-data text-sm font-bold text-on-surface transition hover:bg-surface-container-high"
              href="/shipments"
            >
              <Filter className="h-4 w-4" />
              Open Shipments
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container"
              href="/shipments/new"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-5 md:grid-cols-3">
            {board.metrics.map((metric) => {
              const Icon = metricIcons[metric.label as keyof typeof metricIcons];

              return (
                <article
                  className="relative min-h-48 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
                  key={metric.label}
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <h2 className="font-data text-base font-bold text-on-surface">
                      {metric.label}
                    </h2>
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-md ${
                        toneClasses[metric.tone]
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="relative z-10 mt-8">
                    <p className="font-heading text-5xl font-bold text-primary">
                      {metric.value}
                    </p>
                    <p
                      className={
                        metric.tone === "yellow"
                          ? "mt-2 font-data text-sm font-semibold text-error"
                          : "mt-2 font-data text-sm font-semibold text-primary-container"
                      }
                    >
                      {metric.delta}
                    </p>
                  </div>
                  <Icon className="absolute -bottom-6 -right-6 h-32 w-32 text-primary opacity-[0.03]" />
                </article>
              );
            })}
          </div>

          <aside className="relative min-h-48 overflow-hidden rounded-xl border border-yellow-400 bg-secondary-container p-6 text-on-secondary-container shadow-sm">
            <div className="absolute right-8 top-8 h-14 w-5 bg-yellow-300 opacity-70" />
            <div className="absolute right-8 top-24 h-5 w-5 rounded-full bg-yellow-300 opacity-70" />
            <h2 className="max-w-48 font-heading text-3xl font-bold">
              {board.action.title}
            </h2>
            <p className="mt-4 font-body text-base">{board.action.description}</p>
            <Link
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-secondary px-4 font-data text-sm font-bold text-white transition hover:bg-primary"
              href={board.action.ctaHref}
            >
              {board.action.ctaLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {filteredBoardStats.map((stat) => (
            <div
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-4 shadow-sm"
              key={stat.label}
            >
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                {stat.label}
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-primary">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col gap-4 border-b border-outline-variant p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="font-heading text-3xl font-bold text-primary">
                Workflow
              </h2>
              <div className="hidden h-8 w-px bg-outline-variant sm:block" />
              <div className="flex rounded-lg border border-outline-variant bg-surface-container p-1">
                <span className="rounded-md bg-surface-container-lowest px-3 py-2 font-data text-xs font-bold text-on-surface shadow-sm">
                  Board
                </span>
                <Link
                  className="rounded-md px-3 py-2 font-data text-xs font-bold text-on-surface-variant"
                  href="/shipments"
                >
                  List
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <form className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto]" method="get">
                <label className="relative">
                  <span className="sr-only">Search workflow</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container px-9 font-data text-sm font-semibold text-on-surface"
                    defaultValue={params.search ?? ""}
                    name="search"
                    placeholder="Tracking, customer, route..."
                  />
                </label>
                <select
                  className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                  defaultValue={params.stage ?? ""}
                  name="stage"
                >
                  <option value="">All Stages</option>
                  {board.columns.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.title}
                    </option>
                  ))}
                </select>
                <button
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container px-4 font-data text-sm font-bold text-on-surface"
                  type="submit"
                >
                  Filter
                </button>
              </form>
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 font-data text-sm font-bold text-on-surface transition hover:bg-surface-container-highest"
                href="/shipments?status=ready_for_pickup"
              >
                <CheckCircle2 className="h-4 w-4" />
                At Muqdisho HQ
              </Link>
            </div>
          </div>

          <div className="kanban-scroll grid gap-0 overflow-x-auto bg-surface-container-low md:grid-cols-4">
            {filteredColumns.map((column) => (
              <div
                className="min-w-[320px] border-r border-outline-variant p-5 last:border-r-0"
                key={column.key}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.indicator}`} />
                    <h3 className="font-data text-sm font-bold uppercase tracking-wide text-on-surface">
                      {column.title}
                    </h3>
                    <span className="rounded-full bg-surface-container-high px-2 py-1 font-data text-xs font-semibold text-on-surface-variant">
                      {column.count}
                    </span>
                  </div>
                  <Link
                    aria-label={`${column.title} shipments`}
                    className="rounded-full p-1 text-on-surface-variant transition hover:bg-surface-container-high"
                    href={`/shipments${column.key === "hq" ? "?status=ready_for_pickup" : ""}`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Link>
                </div>

                <div className="flex flex-col gap-4">
                  {column.cards.length > 0 ? (
                    column.cards.map((card) => (
                      <Link
                        className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-sm transition hover:border-primary/40 hover:bg-surface-container"
                        href={`/shipments/${card.id}`}
                        key={card.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-data text-base font-bold text-primary">
                            {card.tracking}
                          </h4>
                          {card.badge ? (
                            <span
                              className={`whitespace-nowrap rounded-md px-2 py-1 font-data text-xs font-semibold ${card.badgeClass}`}
                            >
                              {card.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-4 font-body text-base font-semibold text-on-surface">
                          {card.title}
                        </p>
                        <p className="mt-1 font-body text-sm text-on-surface-variant">
                          {card.route}
                        </p>
                        {typeof card.progress === "number" ? (
                          <div className="mt-5">
                            <div className="mb-2 flex justify-between font-data text-xs text-on-surface-variant">
                              <span>{card.footer}</span>
                              <span>{card.progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-surface-container-high">
                              <div
                                className="h-1.5 rounded-full bg-primary"
                                style={{ width: `${card.progress}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                        <div className="mt-5 border-t border-surface-container-high pt-3 font-data text-sm font-semibold text-on-surface">
                          {card.customer}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-5">
                      <p className="font-data text-sm font-bold text-on-surface">
                        No shipments
                      </p>
                      <p className="mt-2 font-body text-sm text-on-surface-variant">
                        This stage is currently clear.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-outline-variant px-5 py-4">
            <p className="font-body text-sm text-on-surface-variant">
              {board.mode === "supabase"
                ? "Operations board is using live Supabase shipment and warehouse records."
                : "Operations board is using demo data because live Supabase records are not available."}
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
