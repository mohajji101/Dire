import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  getCurrentAppUser,
  listBuyShipRequests,
  listCustomers,
  listInvoices,
  listShipments,
  listSupportTickets,
} from "@/lib/supabase/dire-data";

type SearchPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline-variant p-5">
        <h2 className="font-heading text-2xl font-bold text-primary">{title}</h2>
      </div>
      {empty ? (
        <p className="p-5 font-body text-sm text-on-surface-variant">
          No matching results in this section.
        </p>
      ) : (
        <div className="divide-y divide-surface-container-high">{children}</div>
      )}
    </section>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const currentUser = await getCurrentAppUser();
  const isCustomer = currentUser.role === "customer";

  const [
    shipmentResult,
    buyShipResult,
    invoiceResult,
    supportResult,
    customerResult,
  ] = await Promise.all([
    listShipments({ search }),
    listBuyShipRequests({ search }),
    listInvoices({ search }),
    listSupportTickets({ search }),
    isCustomer ? Promise.resolve({ items: [], mode: "supabase" as const }) : listCustomers({ search }),
  ]);

  const shipments = shipmentResult.items.slice(0, 8);
  const buyShipRequests = buyShipResult.items.slice(0, 8);
  const invoices = invoiceResult.items.slice(0, 8);
  const supportTickets = supportResult.items.slice(0, 8);
  const customers = customerResult.items.slice(0, 8);

  return (
    <AppShell activeItem="Search">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            Search
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            Global Search
          </h1>
          <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
            {search
              ? `Results for "${search}" across active modules.`
              : "Enter a shipment number, customer name, invoice, or ticket in the top search bar."}
          </p>
        </section>

        {search ? (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              {[
                { label: "Shipments", value: shipmentResult.items.length },
                { label: "Buy & Ship", value: buyShipResult.items.length },
                { label: "Invoices", value: invoiceResult.items.length },
                { label: "Support", value: supportResult.items.length },
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

            <div className="grid gap-6 xl:grid-cols-2">
              <Section empty={shipments.length === 0} title="Shipments">
                {shipments.map((shipment) => (
                  <Link
                    className="block p-5 transition hover:bg-surface-container-low"
                    href={`/shipments/${shipment.id}`}
                    key={shipment.id}
                  >
                    <p className="font-data text-sm font-bold text-primary">
                      {shipment.trackingNumber}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface">
                      {shipment.customer} / {shipment.customerCode}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {shipment.origin} to {shipment.destination}
                    </p>
                  </Link>
                ))}
              </Section>

              <Section empty={buyShipRequests.length === 0} title="Buy & Ship">
                {buyShipRequests.map((request) => (
                  <Link
                    className="block p-5 transition hover:bg-surface-container-low"
                    href={`/buy-ship/${request.id}`}
                    key={request.id}
                  >
                    <p className="font-data text-sm font-bold text-primary">
                      {request.requestNumber}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface">
                      {request.productName}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {request.customerName} / {request.customerCode}
                    </p>
                  </Link>
                ))}
              </Section>

              <Section empty={invoices.length === 0} title="Invoices">
                {invoices.map((invoice) => (
                  <Link
                    className="block p-5 transition hover:bg-surface-container-low"
                    href={`/invoices/${invoice.id}`}
                    key={invoice.id}
                  >
                    <p className="font-data text-sm font-bold text-primary">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface">
                      {invoice.customerName} / {invoice.customerCode}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {invoice.trackingNumber} / {invoice.totalAmount} {invoice.currency}
                    </p>
                  </Link>
                ))}
              </Section>

              <Section empty={supportTickets.length === 0} title="Support Tickets">
                {supportTickets.map((ticket) => (
                  <Link
                    className="block p-5 transition hover:bg-surface-container-low"
                    href={`/support/${ticket.id}`}
                    key={ticket.id}
                  >
                    <p className="font-data text-sm font-bold text-primary">
                      {ticket.ticketNumber}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface">
                      {ticket.subject}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {ticket.customerName} / {ticket.customerCode}
                    </p>
                  </Link>
                ))}
              </Section>

              {!isCustomer ? (
                <Section empty={customers.length === 0} title="Customers">
                  {customers.map((customer) => (
                    <Link
                      className="block p-5 transition hover:bg-surface-container-low"
                      href={`/customers/${customer.id}`}
                      key={customer.id}
                    >
                      <p className="font-data text-sm font-bold text-primary">
                        {customer.companyName ?? customer.name}
                      </p>
                      <p className="mt-1 font-body text-sm text-on-surface">
                        {customer.customerCode} / {customer.phone}
                      </p>
                      <p className="mt-1 font-body text-sm text-on-surface-variant">
                        {customer.city}, {customer.country}
                      </p>
                    </Link>
                  ))}
                </Section>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
