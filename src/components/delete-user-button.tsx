"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

type DeleteUserButtonProps = {
  email: string;
  userId: string;
};

export function DeleteUserButton({ email, userId }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete user "${email}"?\n\nThis removes the login account from Supabase Auth and unlinks or cleans linked app records.`,
    );
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    const response = await fetch(`/api/v1/settings/users/${userId}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => null);

    if (response.ok) {
      router.refresh();
      return;
    }

    setIsSubmitting(false);
    window.alert(payload?.error?.message ?? "User delete failed.");
  }

  return (
    <button
      className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 font-data text-[11px] font-bold text-red-700 disabled:opacity-60"
      disabled={isSubmitting}
      onClick={handleDelete}
      type="button"
    >
      <Trash2 className="h-3 w-3" />
      {isSubmitting ? "..." : "Delete User"}
    </button>
  );
}
