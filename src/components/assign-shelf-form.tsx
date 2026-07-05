"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

type ShelfOption = {
  id: string;
  label: string;
};

type AssignShelfFormProps = {
  packageId: string;
  shelves: ShelfOption[];
};

export function AssignShelfForm({ packageId, shelves }: AssignShelfFormProps) {
  const router = useRouter();
  const [shelfId, setShelfId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasShelves = shelves.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/warehouse/assign-shelf", {
      body: JSON.stringify({ packageId, shelfId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Shelf assignment failed.");
      setIsSubmitting(false);
      return;
    }

    setShelfId("");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
      <select
        className="h-10 rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
        disabled={!hasShelves || isSubmitting}
        onChange={(event) => setShelfId(event.target.value)}
        required
        value={shelfId}
      >
        <option value="">Select shelf</option>
        {shelves.map((shelf) => (
          <option key={shelf.id} value={shelf.id}>
            {shelf.label}
          </option>
        ))}
      </select>

      {!hasShelves ? (
        <p className="font-data text-xs font-semibold text-on-surface-variant">
          No available shelves found in this warehouse yet.
        </p>
      ) : null}

      {error ? <p className="font-data text-xs font-bold text-error">{error}</p> : null}

      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
        disabled={!hasShelves || isSubmitting}
        type="submit"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isSubmitting ? "Assigning..." : "Assign Shelf"}
      </button>
    </form>
  );
}
