"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";

type SupportReplyFormProps = {
  senderId: string;
  ticketId: string;
};

export function SupportReplyForm({
  senderId,
  ticketId,
}: SupportReplyFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/v1/support/tickets/${ticketId}/messages`, {
      body: JSON.stringify({ message, senderId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Reply failed.");
      setIsSubmitting(false);
      return;
    }

    setMessage("");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form
      className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
      onSubmit={handleSubmit}
    >
      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">Reply</span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a response..."
          required
          value={message}
        />
      </label>

      {error ? <p className="mt-3 font-data text-sm font-bold text-error">{error}</p> : null}

      <button
        className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        <Send className="h-4 w-4" />
        {isSubmitting ? "Sending..." : "Send Reply"}
      </button>
    </form>
  );
}
