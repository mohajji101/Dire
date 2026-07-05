"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

type DeletePricingRuleButtonProps = {
  label: string;
  ruleId: string;
};

export function DeletePricingRuleButton({
  label,
  ruleId,
}: DeletePricingRuleButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Delete pricing rule "${label}"?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    const response = await fetch(`/api/v1/settings/pricing-rules/${ruleId}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => null);

    if (response.ok) {
      router.refresh();
      return;
    }

    setIsSubmitting(false);
    window.alert(payload?.error?.message ?? "Pricing rule delete failed.");
  }

  return (
    <button
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 font-data text-xs font-bold text-red-700 disabled:opacity-60"
      disabled={isSubmitting}
      onClick={handleDelete}
      type="button"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isSubmitting ? "Deleting..." : "Delete"}
    </button>
  );
}
