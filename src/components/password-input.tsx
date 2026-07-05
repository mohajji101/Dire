"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = {
  defaultValue?: string;
  name: string;
};

export function PasswordInput({ defaultValue, name }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative mt-2 block">
      <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
      <input
        className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-10 pr-12 font-data text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
        defaultValue={defaultValue}
        name={name}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </span>
  );
}
