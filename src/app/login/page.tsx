import {
  ArrowRight,
  BadgeCheck,
  Mail,
  ShieldCheck,
  ShipWheel,
  Smartphone,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  otpAction,
  passwordResetAction,
  signInAction,
} from "@/app/login/actions";
import { PasswordInput } from "@/components/password-input";

const accessCards = [
  { label: "Operations", value: "Shipment control" },
  { label: "Warehouse", value: "Receiving and storage" },
  { label: "Finance", value: "Invoices and payments" },
];

const errorMessages: Record<string, string> = {
  credentials: "Email/phone or password is incorrect.",
  invalid: "Enter a valid email/phone and password.",
};

const noticeMessages: Record<string, string> = {
  otp_demo: "OTP demo mode is active because Supabase auth is not configured.",
  otp_sent: "OTP sign-in code has been sent to your email or phone.",
  signup_success: "Account created successfully. Sign in with your new customer account.",
  signup_verify: "Account created. Check your email if confirmation is required, then sign in.",
  reset_demo:
    "Password reset demo mode is active because Supabase auth is not configured.",
  reset_email_only:
    "Password reset currently requires an email address, not a phone number.",
  reset_sent: "Password reset email has been sent.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    notice?: string;
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const rememberedIdentifier =
    cookieStore.get("dire_last_identifier")?.value ?? "admin@direcargo.com";
  const errorMessage = params?.error ? errorMessages[params.error] : null;
  const errorReason = params?.reason ? decodeURIComponent(params.reason) : null;
  const noticeMessage = params?.notice ? noticeMessages[params.notice] : null;

  return (
    <main className="grid min-h-screen bg-surface text-on-surface lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-primary-container text-on-primary lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,6,22,0.96),rgba(11,31,59,0.78)),linear-gradient(90deg,rgba(254,210,85,0.18)_1px,transparent_1px),linear-gradient(0deg,rgba(254,210,85,0.12)_1px,transparent_1px)] bg-[length:auto,80px_80px,80px_80px]" />
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full border border-secondary-container/30" />
        <div className="absolute bottom-16 left-16 h-40 w-40 rounded-full border border-secondary-container/20" />

        <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-on-primary text-primary">
              <ShipWheel className="h-7 w-7" />
            </div>
            <div>
              <p className="font-heading text-3xl font-bold">Dire Cargo</p>
              <p className="font-data text-sm text-white/70">
                Global Control Center
              </p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="font-data text-sm font-semibold uppercase tracking-wide text-secondary-container">
              Enterprise logistics platform
            </p>
            <h1 className="mt-4 font-heading text-5xl font-bold leading-tight">
              Secure access for global cargo operations.
            </h1>
            <p className="mt-5 max-w-xl font-body text-lg leading-8 text-white/75">
              Track shipments, receive warehouse packages, manage invoices, and
              monitor every operational handoff from one controlled workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {accessCards.map((card) => (
              <div
                className="rounded-lg border border-white/15 bg-white/8 p-4 backdrop-blur"
                key={card.label}
              >
                <p className="font-data text-xs font-semibold uppercase text-secondary-container">
                  {card.label}
                </p>
                <p className="mt-2 font-body text-sm text-white/75">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-on-primary">
              <ShipWheel className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-primary">
                Dire Cargo
              </p>
              <p className="font-data text-xs font-semibold text-on-surface-variant">
                Global Control Center
              </p>
            </div>
          </div>

          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-data text-xs font-bold text-on-surface-variant">
              <ShieldCheck className="h-4 w-4 text-success" />
              Authorized personnel only
            </div>
            <h2 className="font-heading text-3xl font-bold text-primary md:text-4xl">
              Sign in to your account
            </h2>
            <p className="mt-3 font-body text-base text-on-surface-variant">
              Use your email or phone number with password, or request a one-time code
              to access your assigned
              logistics workspace.
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

          <form action={signInAction} className="mt-8 space-y-5">
            <input name="next" type="hidden" value={params?.next ?? ""} />
            <label className="block">
              <span className="font-data text-sm font-bold text-on-surface">
                Email or phone
              </span>
              <span className="relative mt-2 block">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-10 font-data text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue={rememberedIdentifier}
                  name="identifier"
                  type="text"
                />
              </span>
            </label>

            <label className="block">
              <span className="font-data text-sm font-bold text-on-surface">
                Password
              </span>
              <PasswordInput name="password" />
            </label>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 font-data text-sm font-semibold text-on-surface-variant">
                <input
                  className="h-4 w-4 rounded border-outline-variant accent-primary"
                  defaultChecked={Boolean(cookieStore.get("dire_last_identifier")?.value)}
                  name="rememberDevice"
                  type="checkbox"
                />
                Remember device
              </label>
              <button
                className="font-data text-sm font-bold text-primary hover:underline"
                formAction={passwordResetAction}
                type="submit"
              >
                Forgot password?
              </button>
            </div>

            <div className="space-y-3">
              <button
                className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container"
                type="submit"
              >
                Sign In
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-data text-sm font-bold text-on-surface transition hover:bg-surface-container-high"
                formAction={otpAction}
                type="submit"
              >
                <Smartphone className="h-5 w-5" />
                Continue with OTP
              </button>
            </div>
          </form>

          <div className="mt-8 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <div className="flex gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="font-data text-sm font-bold text-on-surface">
                  Supabase Auth ready
                </p>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  Password sign-in, OTP sign-in, and password reset now route
                  through the live auth flow when Supabase is configured.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="font-body text-sm text-on-surface-variant">
              New customer?{" "}
              <Link className="font-data font-bold text-primary hover:underline" href="/signup">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
