"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/password-input";

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
    };

    const response = await fetch("/api/v1/auth/password", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });

    const responsePayload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(responsePayload?.error?.message ?? "Password update failed.");
      setIsSubmitting(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Password updated successfully.");
    setIsSubmitting(false);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">New password</span>
        <PasswordInput name="newPassword" />
      </label>

      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">Confirm password</span>
        <PasswordInput name="confirmPassword" />
      </label>

      {error ? (
        <p className="font-data text-sm font-bold text-error">{error}</p>
      ) : null}
      {message ? (
        <p className="font-data text-sm font-bold text-success">{message}</p>
      ) : null}

      <div>
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Updating..." : "Change Password"}
        </button>
      </div>
    </form>
  );
}
