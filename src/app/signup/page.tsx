import { ArrowLeft, BadgeCheck, ShipWheel } from "lucide-react";
import Link from "next/link";
import { signUpAction } from "@/app/login/actions";
import { PasswordInput } from "@/components/password-input";
import { customerTypeOptions } from "@/lib/customer-types";

const errorMessages: Record<string, string> = {
  credentials: "Signup failed. Check the email, password, or existing account.",
  invalid: "Complete all required fields and make sure passwords match.",
};

const noticeMessages: Record<string, string> = {
  demo: "Signup needs live Supabase auth before customer self-registration can work.",
};

type SignupPageProps = {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
    reason?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const errorMessage = params?.error ? errorMessages[params.error] : null;
  const noticeMessage = params?.notice ? noticeMessages[params.notice] : null;
  const errorReason = params?.reason ? decodeURIComponent(params.reason) : null;

  return (
    <main className="grid min-h-screen bg-surface text-on-surface lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-primary-container text-on-primary lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,6,22,0.96),rgba(11,31,59,0.78)),linear-gradient(90deg,rgba(254,210,85,0.18)_1px,transparent_1px),linear-gradient(0deg,rgba(254,210,85,0.12)_1px,transparent_1px)] bg-[length:auto,80px_80px,80px_80px]" />
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-on-primary text-primary">
              <ShipWheel className="h-7 w-7" />
            </div>
            <div>
              <p className="font-heading text-3xl font-bold">Dire Cargo</p>
              <p className="font-data text-sm text-white/70">Customer Signup</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="font-data text-sm font-semibold uppercase tracking-wide text-secondary-container">
              Customer self registration
            </p>
            <h1 className="mt-4 font-heading text-5xl font-bold leading-tight">
              Create your shipment account and enter the customer portal.
            </h1>
            <p className="mt-5 max-w-xl font-body text-lg leading-8 text-white/75">
              New customer accounts are automatically provisioned with a customer
              profile and default customer role after signup.
            </p>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/8 p-4 backdrop-blur">
            <div className="flex gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary-container" />
              <div>
                <p className="font-data text-sm font-bold text-white">
                  Automatic customer setup
                </p>
                <p className="mt-1 font-body text-sm text-white/75">
                  You choose the customer type during signup, then Supabase provisions
                  the customer role and customer record automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-2xl">
          <Link
            className="mb-6 inline-flex items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
            href="/login?force=1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <div>
            <h2 className="font-heading text-3xl font-bold text-primary md:text-4xl">
              Create customer account
            </h2>
            <p className="mt-3 font-body text-base text-on-surface-variant">
              Fill in your profile once. The system will assign the customer role
              automatically after signup. If the account type needs correction,
              admin can update it later.
            </p>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-data text-sm font-semibold text-error">
              <p>{errorMessage}</p>
              {errorReason ? (
                <p className="mt-1 font-body text-xs font-semibold text-error/90">
                  {errorReason}
                </p>
              ) : null}
            </div>
          ) : null}

          {noticeMessage ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 font-data text-sm font-semibold text-success">
              {noticeMessage}
            </div>
          ) : null}

          <form action={signUpAction} className="mt-8 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">First name</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  name="firstName"
                  required
                  type="text"
                />
              </label>
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Last name</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  name="lastName"
                  required
                  type="text"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Email</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  name="email"
                  required
                  type="email"
                />
              </label>
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Phone</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  name="phone"
                  required
                  type="text"
                />
              </label>
            </div>

            <label className="block">
              <span className="font-data text-sm font-bold text-on-surface">
                Company / organization name
              </span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                name="companyName"
                placeholder="Required for business, government, and NGO accounts"
                type="text"
              />
              <span className="mt-2 block font-body text-xs text-on-surface-variant">
                Leave blank only if this is a personal individual account.
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  Existing customer code
                </span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm uppercase text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  name="customerCode"
                  placeholder="Optional, e.g. DC100245"
                  type="text"
                />
                <span className="mt-2 block font-body text-xs text-on-surface-variant">
                  Use this if Dire Cargo already created your customer record in the office.
                </span>
              </label>
              <div className="hidden md:block" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Customer type</span>
                <select
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue="individual"
                  name="customerType"
                >
                  {customerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block font-body text-xs text-on-surface-variant">
                  Choose the account type that best matches you or your organization.
                </span>
              </label>
              <div className="hidden md:block" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Country</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  name="country"
                  required
                  type="text"
                />
              </label>
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">City</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  name="city"
                  required
                  type="text"
                />
              </label>
            </div>

            <label className="block">
              <span className="font-data text-sm font-bold text-on-surface">Address</span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                name="address"
                type="text"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Password</span>
                <PasswordInput name="password" />
              </label>
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Confirm password</span>
                <PasswordInput name="confirmPassword" />
              </label>
            </div>

            <div className="pt-2">
              <button
                className="inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-primary px-6 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container"
                type="submit"
              >
                Create account
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
