"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoveRight } from "lucide-react";

type ReleasePackageButtonProps = {
  packageCode: string;
  packageId: string;
  warehouseName: string;
};

export function ReleasePackageButton({
  packageCode,
  packageId,
  warehouseName,
}: ReleasePackageButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMogadishuHandoff =
    warehouseName === "Mogadishu HQ" || warehouseName === "Muqdisho HQ";

  async function handleRelease() {
    const confirmed = window.confirm(
      isMogadishuHandoff
        ? `Release package ${packageCode} from its shelf for final customer handoff?`
        : `Release package ${packageCode} from its shelf and move it to transit?`,
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/warehouse/release", {
      body: JSON.stringify({ packageId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Package release failed.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 font-data text-sm font-bold text-primary disabled:opacity-60"
        disabled={isSubmitting}
        onClick={handleRelease}
        type="button"
      >
        <MoveRight className="h-4 w-4" />
        {isSubmitting
          ? "Releasing..."
          : isMogadishuHandoff
            ? "Release for Handoff"
            : "Release to Transit"}
      </button>
      {error ? <p className="font-data text-xs font-bold text-error">{error}</p> : null}
    </div>
  );
}
