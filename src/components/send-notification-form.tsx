"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

type Option = {
  id: string;
  label: string;
};

type SendNotificationFormProps = {
  triggerClassName: string;
  users: Option[];
};

export function SendNotificationForm({
  triggerClassName,
  users,
}: SendNotificationFormProps) {
  const router = useRouter();
  const hasUsers = users.length > 0;
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    message: "",
    title: "",
    type: "manual_notice",
    userId: users[0]?.id ?? "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasUsers) {
      setError("No users are available for notification delivery yet.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/notifications", {
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Notification send failed.");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    setIsSubmitting(false);
    setForm({
      message: "",
      title: "",
      type: "manual_notice",
      userId: users[0]?.id ?? "",
    });
    router.refresh();
  }

  return (
    <>
      <button
        className={triggerClassName}
        disabled={!hasUsers}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Send Notification
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Notifications
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
                  Send Notification
                </h2>
              </div>
              <button
                className="rounded-lg px-3 py-2 font-data text-sm font-semibold text-on-surface-variant"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">User</span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, userId: event.target.value }))
                  }
                  required
                  value={form.userId}
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Title</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value }))
                    }
                    required
                    value={form.title}
                  />
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Type</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, type: event.target.value }))
                    }
                    required
                    value={form.type}
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Message</span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, message: event.target.value }))
                  }
                  required
                  value={form.message}
                />
              </label>

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
