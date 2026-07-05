"use client";

import { Printer } from "lucide-react";

export function PrintInvoiceButton() {
  return (
    <button
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary"
      onClick={() => window.print()}
      type="button"
    >
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </button>
  );
}
