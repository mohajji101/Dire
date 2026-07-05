import Link from "next/link";
import { CircleHelp, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NewTicketForm } from "@/components/new-ticket-form";
import { listCustomers, listSupportTickets } from "@/lib/supabase/dire-data";

const statusClasses = {
  open: "bg-blue-50 text-blue-800",
  waiting_customer: "bg-yellow-50 text-yellow-800",
  resolved: "bg-emerald-50 text-success",
  closed: "bg-surface-container-high text-on-surface-variant",
};

const priorityClasses = {
  low: "bg-surface-container-high text-on-surface-variant",
  normal: "bg-blue-50 text-blue-800",
  high: "bg-yellow-50 text-yellow-800",
  urgent: "bg-red-50 text-error",
};

type SupportPageProps = {
  searchParams: Promise<{
    priority?: string;
    search?: string;
    status?: string;
  }>;
};

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const filters = await searchParams;
  const [{ items: supportTickets, mode }, { items: customers }] = await Promise.all([
    listSupportTickets({
      priority: filters.priority,
      search: filters.search,
      status: filters.status,
    }),
    listCustomers(),
  ]);
  const openTickets = supportTickets.filter((ticket) => ticket.status === "open").length;
  const urgentTickets = supportTickets.filter(
    (ticket) => ticket.priority === "urgent",
  ).length;
  const waitingCustomer = supportTickets.filter(
    (ticket) => ticket.status === "waiting_customer",
  ).length;
  const resolved = supportTickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;

  return (
    <AppShell activeItem="Support">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Support
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              Support Center
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
              Manage customer tickets, priorities, message threads,
              attachments, and operational handoffs.
            </p>
          </div>
          <NewTicketForm
            customers={customers.map((customer) => ({
              id: customer.id,
              label: `${customer.companyName ?? customer.name} (${customer.customerCode})`,
            }))}
            triggerClassName="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Open", value: openTickets },
            { label: "Urgent", value: urgentTickets },
            { label: "Waiting Customer", value: waitingCustomer },
            { label: "Resolved", value: resolved },
          ].map((stat) => (
            <article
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              key={stat.label}
            >
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                {stat.label}
              </p>
              <p className="mt-3 font-heading text-3xl font-bold text-primary">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col gap-4 border-b border-outline-variant p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-primary">
                Ticket Queue
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                {mode === "supabase"
                  ? "Live support ticket queue from Supabase."
                  : "API-ready demo data from `/api/v1/support/tickets`."}
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto_auto_auto]" method="get">
              <label className="relative">
                <span className="sr-only">Search tickets</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue={filters.search ?? ""}
                  name="search"
                  placeholder="Ticket, customer, subject..."
                />
              </label>
              <select
                className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                defaultValue={filters.priority ?? ""}
                name="priority"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select
                className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container px-4 font-data text-sm font-bold text-on-surface"
                type="submit"
              >
                Filter
              </button>
            </form>
          </div>

          <div className="divide-y divide-surface-container-high">
            {supportTickets.map((ticket) => (
              <Link
                className="grid gap-4 p-5 transition hover:bg-surface-container-low lg:grid-cols-[1fr_180px_160px_140px]"
                href={`/support/${ticket.id}`}
                key={ticket.id}
              >
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-high text-primary">
                    <CircleHelp className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-data text-sm font-bold text-primary">
                      {ticket.ticketNumber}
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {ticket.subject}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {ticket.customerName} / {ticket.customerCode}
                    </p>
                  </div>
                </div>
                <div className="font-data text-sm font-semibold text-on-surface">
                  {ticket.assignedTo}
                </div>
                <div>
                  <span
                    className={`rounded-full px-3 py-1 font-data text-xs font-bold capitalize ${
                      priorityClasses[ticket.priority]
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </div>
                <div>
                  <span
                    className={`rounded-full px-3 py-1 font-data text-xs font-bold capitalize ${
                      statusClasses[ticket.status]
                    }`}
                  >
                    {ticket.status.replaceAll("_", " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
