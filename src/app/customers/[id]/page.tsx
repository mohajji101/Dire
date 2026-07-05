import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Truck,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import { MergeCustomerForm } from "@/components/merge-customer-form";
import { getCustomerTypeLabel, isOrganizationCustomerType } from "@/lib/customer-types";
import { getCurrentAppUser, getCustomerDetail, listCustomers } from "@/lib/supabase/dire-data";

type CustomerProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerProfilePage({
  params,
}: CustomerProfilePageProps) {
  const { id } = await params;
  const [detail, currentUser, customerList] = await Promise.all([
    getCustomerDetail(id),
    getCurrentAppUser(),
    listCustomers(),
  ]);

  if (!detail) {
    return (
      <AppShell activeItem="Customers">
        <div className="p-6">
          <p className="font-data text-sm font-bold text-error">
            Customer not found.
          </p>
        </div>
      </AppShell>
    );
  }

  const { customer, shipments } = detail;
  const canManageCustomer = ["super_admin", "operations", "support"].includes(currentUser.role);
  const mergeCandidates = customerList.items
    .filter((item) => item.id !== customer.id)
    .map((item) => ({
      customerCode: item.customerCode,
      id: item.id,
      label: `${item.customerCode} - ${item.companyName ?? item.name}`,
      portalLinked: item.portalLinked,
      shipmentCount: item.shipmentCount,
    }));

  return (
    <AppShell activeItem="Customers">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <Link
          className="inline-flex w-fit items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
          href="/customers"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                {isOrganizationCustomerType(customer.customerType) ? (
                  <Building2 className="h-7 w-7" />
                ) : (
                  <UserRound className="h-7 w-7" />
                )}
              </span>
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  {customer.customerCode} / {customer.suiteNumber}
                </p>
                <h1 className="mt-1 font-heading text-3xl font-bold text-primary md:text-4xl">
                  {customer.companyName ?? customer.name}
                </h1>
                <p className="mt-2 font-body text-base text-on-surface-variant">
                  Primary contact: {customer.name}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 font-data text-xs font-bold capitalize text-success">
              {customer.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <span
              className={`rounded-full px-3 py-1 font-data text-xs font-bold ${
                customer.portalLinked
                  ? "bg-blue-50 text-blue-700"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              Portal {customer.portalLinked ? "Linked" : "Not Linked"}
            </span>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="grid gap-4">
            {[
              { icon: Mail, label: "Email", value: customer.email },
              { icon: Phone, label: "Phone", value: customer.phone },
              {
                icon: Building2,
                label: "Customer Type",
                value: getCustomerTypeLabel(customer.customerType),
              },
              {
                icon: MapPin,
                label: "Address",
                value: `${customer.address}, ${customer.city}, ${customer.country}`,
              },
              {
                icon: ReceiptText,
                label: "Outstanding",
                value: customer.outstandingBalance,
              },
              {
                icon: FileCheck2,
                label: "Documents",
                value: `${customer.documents} files`,
              },
              {
                icon: UserRound,
                label: "Portal Access",
                value: customer.portalLinked ? "Linked account" : "No linked account",
              },
            ].map((item) => (
              <div
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
                key={item.label}
              >
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-high text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      {item.label}
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {canManageCustomer ? (
              <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                <h2 className="font-heading text-xl font-bold text-primary">
                  Update Customer
                </h2>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  Edit contact details, account type, and customer status.
                </p>
                <div className="mt-5">
                  <CustomerProfileForm
                    allowAccountControls
                    customer={{
                      address: customer.address,
                      city: customer.city,
                      companyName: customer.companyName,
                      country: customer.country,
                      customerType: customer.customerType,
                      firstName: customer.name.split(" ")[0] ?? customer.name,
                      id: customer.id,
                      lastName: customer.name.split(" ").slice(1).join(" "),
                      phone: customer.phone,
                      status: customer.status,
                    }}
                  />
                </div>
              </div>
            ) : null}

            {canManageCustomer ? (
              <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                <h2 className="font-heading text-xl font-bold text-primary">
                  Merge Duplicate
                </h2>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  Move this customer&apos;s shipments, invoices, Buy & Ship requests,
                  support tickets, receipts, and documents into the correct record.
                </p>
                <div className="mt-5">
                  <MergeCustomerForm
                    currentCustomerCode={customer.customerCode}
                    currentCustomerId={customer.id}
                    options={mergeCandidates}
                  />
                </div>
              </div>
            ) : null}
          </aside>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Shipment History
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                {detail.mode === "supabase"
                  ? "Linked records from Supabase."
                  : "Linked records by customer code."}
              </p>
            </div>
            <div className="divide-y divide-surface-container-high">
              {shipments.length ? (
                shipments.map((shipment) => (
                  <Link
                    className="flex flex-col gap-3 p-5 transition hover:bg-surface-container-low md:flex-row md:items-center md:justify-between"
                    href={`/shipments/${shipment.id}`}
                    key={shipment.id}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-high text-primary">
                        <Truck className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-data text-sm font-bold text-primary">
                          {shipment.trackingNumber}
                        </p>
                        <p className="mt-1 font-body text-sm text-on-surface-variant">
                          {shipment.origin} to {shipment.destination}
                        </p>
                      </div>
                    </div>
                    <div className="font-data text-sm font-bold capitalize text-on-surface">
                      {shipment.status.replaceAll("_", " ")}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="p-5 font-body text-sm text-on-surface-variant">
                  No shipments linked to this customer yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Merge History
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                Customer merge actions that affected this record.
              </p>
            </div>
            <div className="divide-y divide-surface-container-high">
              {detail.mergeHistory.length > 0 ? (
                detail.mergeHistory.map((entry) => (
                  <div className="grid gap-3 p-5 md:grid-cols-[1fr_220px]" key={entry.id}>
                    <div>
                      <p className="font-body text-sm text-on-surface">{entry.summary}</p>
                    </div>
                    <div>
                      <p className="font-body text-sm text-on-surface">{entry.userEmail}</p>
                      <p className="mt-1 font-data text-xs font-semibold text-on-surface-variant">
                        {entry.createdAt}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-5 font-body text-sm text-on-surface-variant">
                  No merge history for this customer yet.
                </p>
              )}
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  );
}
