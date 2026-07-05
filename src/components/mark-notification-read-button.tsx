"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck } from "lucide-react";

type MarkNotificationReadButtonProps = {
  id: string;
  read: boolean;
};

export function MarkNotificationReadButton({
  id,
  read,
}: MarkNotificationReadButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (read) {
      return;
    }

    setIsSubmitting(true);
    const response = await fetch(`/api/v1/notifications/${id}/read`, {
      method: "PUT",
    });

    if (response.ok) {
      router.refresh();
      return;
    }

    setIsSubmitting(false);
    window.alert("Mark as read failed.");
  }

  return (
    <button
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-xs font-bold text-on-surface disabled:opacity-60"
      disabled={read || isSubmitting}
      onClick={handleClick}
      type="button"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      {read ? "Read" : isSubmitting ? "Saving..." : "Mark Read"}
    </button>
  );
}
