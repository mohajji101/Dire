import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NewShipmentForm } from "@/components/new-shipment-form";
import { listCustomers } from "@/lib/supabase/dire-data";

export default async function NewShipmentPage() {
  const { items: customers } = await listCustomers();

  return (
    <AppShell activeItem="Shipments">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 p-4 md:p-6">
        <Link
          className="inline-flex w-fit items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
          href="/shipments"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shipments
        </Link>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            Create Shipment
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            New Shipment Booking
          </h1>
          <p className="mt-3 font-body text-base text-on-surface-variant">
            Capture customer, route, package, and pricing inputs.
          </p>
        </section>

        <NewShipmentForm
          customers={customers.map((customer) => ({
            id: customer.id,
            label: `${customer.companyName ?? customer.name} (${customer.customerCode})`,
          }))}
        />
      </div>
    </AppShell>
  );
}
