import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CircleUserRound,
  Globe,
  Headphones,
  MapPinned,
  PackageCheck,
  PackageSearch,
  Plane,
  ShieldCheck,
  Ship,
  Warehouse,
} from "lucide-react";
import { PublicShipmentTracker } from "@/components/public-shipment-tracker";
import { getDefaultRouteForRole } from "@/lib/access-control";
import { hasSupabaseEnv } from "@/lib/env";
import { getCurrentAppUser } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const serviceHighlights = [
  {
    icon: Plane,
    title: "Air freight",
    text: "Priority cargo movement for urgent commercial, retail, and personal shipments across major routes.",
  },
  {
    icon: Ship,
    title: "Sea freight",
    text: "Container and consolidated cargo planning for businesses that need cost-efficient global movement.",
  },
  {
    icon: PackageCheck,
    title: "Buy & Ship",
    text: "Sourcing support, purchase coordination, invoice follow-up, and end-to-end shipment handoff.",
  },
  {
    icon: Warehouse,
    title: "Warehouse control",
    text: "China receiving, shelf assignment, verification, and release workflows managed in one system.",
  },
];

const trustPoints = [
  "China warehouse intake and verification",
  "Mogadishu office coordination and customer handoff",
  "Live shipment visibility with invoice and support access",
];

const routeStats = [
  { label: "Coverage", value: "China to Somalia" },
  { label: "Service model", value: "Air, Sea, Buy & Ship" },
  { label: "Portal access", value: "Customers, finance, warehouse, operations" },
];

const credibilityStats = [
  { value: "Public", label: "tracking access before login" },
  { value: "Role-based", label: "workspace security for staff actions" },
  { value: "Live", label: "shipment, warehouse, and invoice visibility" },
  { value: "End-to-end", label: "from origin intake to final handoff" },
];

const promisePoints = [
  {
    title: "Clear route visibility",
    text: "Customers should always know whether cargo is in intake, warehouse, transit, arrival, or final release stage.",
  },
  {
    title: "Operational discipline",
    text: "Receiving, verification, shelf assignment, invoice checks, and release rules stay connected instead of being tracked manually.",
  },
  {
    title: "Customer-ready communication",
    text: "Public tracking, protected portal access, and support workflows reduce confusion between front-office and warehouse updates.",
  },
];

const contactBlocks = [
  {
    icon: MapPinned,
    label: "Main office",
    value: "Mogadishu HQ, Somalia",
  },
  {
    icon: Globe,
    label: "International desk",
    value: "Guangzhou and China warehouse coordination",
  },
  {
    icon: Headphones,
    label: "Support",
    value: "Portal tickets, customer updates, and operations response",
  },
];

export default async function Home() {
  let workspaceHref = "/login";
  let isSignedIn = false;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profile = await getCurrentAppUser();
      workspaceHref = getDefaultRouteForRole(profile.role);
      isSignedIn = true;
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f2ef] text-on-surface">
      <section
        className="relative min-h-[92vh] overflow-hidden border-b border-black/10 bg-[#08101d] text-white"
        id="home"
      >
        <Image
          alt="Dire Cargo international logistics hero"
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/hero-logistics-international.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,24,0.88)_0%,rgba(5,12,24,0.72)_38%,rgba(5,12,24,0.35)_68%,rgba(5,12,24,0.22)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,24,0.25)_0%,rgba(5,12,24,0.1)_45%,rgba(5,12,24,0.8)_100%)]" />

        <div className="relative mx-auto flex min-h-[92vh] w-full max-w-[1440px] flex-col px-4 pb-8 pt-5 md:px-6 md:pb-10 md:pt-6">
          <header className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#08101d]/78 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="px-0 py-0">
                  <img
                    alt="Dire Cargo Logistics logo"
                    className="block h-[64px] w-auto max-w-none"
                    src="/Dire-horizontal.png"
                  />
                </div>
                <div className="hidden md:block">
                  <p className="font-data text-xs font-semibold uppercase tracking-[0.22em] text-[#d4b15a]">
                    International logistics
                  </p>
                  <p className="mt-1 font-body text-sm text-white/70">
                    Freight forwarding, customer access, and operations control
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/88 md:gap-5">
                  <a className="transition hover:text-[#f4cf73]" href="#home">
                    Home
                  </a>
                  <a className="transition hover:text-[#f4cf73]" href="#about">
                    About
                  </a>
                  <a className="transition hover:text-[#f4cf73]" href="#services">
                    Services
                  </a>
                  <a className="transition hover:text-[#f4cf73]" href="#tracking">
                    Tracking
                  </a>
                  <a className="transition hover:text-[#f4cf73]" href="#contact">
                    Contact Us
                  </a>
                </nav>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-white/20 bg-white/8 px-4 font-data text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/14"
                    href="/signup"
                  >
                    Create Account
                  </Link>
                  <Link
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#d4b15a] px-4 font-data text-sm font-bold text-[#07101b] transition hover:bg-[#e4c26c]"
                    href={workspaceHref}
                  >
                    {isSignedIn ? "Open Workspace" : "Login"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-1 items-center py-12 md:py-16">
            <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-end">
              <div className="max-w-4xl">
                <p className="font-data text-sm font-semibold uppercase tracking-[0.24em] text-[#f4cf73]">
                  Global cargo movement from origin to handoff
                </p>
                <h1 className="mt-4 max-w-5xl font-heading text-4xl font-extrabold leading-tight text-white md:text-6xl">
                  Reliable freight, public tracking, and customer access in one international logistics platform
                </h1>
                <p className="mt-5 max-w-3xl font-body text-base leading-8 text-white/80 md:text-lg">
                  Dire Cargo Logistics supports commercial cargo, personal shipments, and Buy & Ship workflows with
                  one portal for public tracking and one secure workspace for warehouse, finance, support, and
                  operations teams. Visitors can check shipment progress instantly, while customers and staff move into
                  protected workflows only when action is needed.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 font-data text-sm font-bold text-[#08101d] transition hover:bg-[#f6f2e8]"
                    href="#tracking"
                  >
                    Track Shipment
                    <PackageSearch className="h-4 w-4" />
                  </Link>
                  <Link
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/8 px-5 font-data text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/14"
                    href="#services"
                  >
                    Explore Services
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {routeStats.map((item) => (
                    <div
                      className="border-l-2 border-[#d4b15a] bg-white/6 px-4 py-3 backdrop-blur-sm"
                      key={item.label}
                    >
                      <p className="font-data text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                        {item.label}
                      </p>
                      <p className="mt-2 font-data text-sm font-bold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="grid gap-4 self-stretch">
                <div className="flex items-center gap-4 border border-white/14 bg-white/8 p-4 backdrop-blur-md">
                  <div className="p-0">
                    <img
                      alt="Dire logo mark"
                      className="block h-[78px] w-[78px] object-contain"
                      src="/Dire-icon-Logo.png"
                    />
                  </div>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase tracking-[0.18em] text-[#f4cf73]">
                      Dire identity
                    </p>
                    <p className="mt-2 font-body text-sm leading-6 text-white/78">
                      Built for modern cargo visibility, disciplined warehouse flow, and customer-ready service.
                    </p>
                  </div>
                </div>

                <div className="border border-white/14 bg-white/10 p-5 backdrop-blur-md">
                  <p className="font-data text-xs font-semibold uppercase tracking-[0.18em] text-[#f4cf73]">
                    Why customers use Dire
                  </p>
                  <div className="mt-4 grid gap-4">
                    {trustPoints.map((item) => (
                      <div className="flex gap-3" key={item}>
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#d4b15a]" />
                        <p className="font-body text-sm leading-6 text-white/82">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/14 bg-white/10 backdrop-blur-md">
                  <div className="bg-[#07111d]/70 p-5">
                    <p className="font-data text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                      Customer access
                    </p>
                    <p className="mt-3 font-heading text-2xl font-bold text-white">Portal</p>
                    <p className="mt-2 font-body text-sm leading-6 text-white/76">
                      Invoices, profile updates, support, and shipment visibility.
                    </p>
                  </div>
                  <div className="bg-[#0a1625]/70 p-5">
                    <p className="font-data text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                      Staff control
                    </p>
                    <p className="mt-3 font-heading text-2xl font-bold text-white">Workspace</p>
                    <p className="mt-2 font-body text-sm leading-6 text-white/76">
                      Warehouse, finance, support, operations, reports, and settings.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
            {[
              {
                icon: PackageSearch,
                label: "Public shipment tracking",
                text: "Track cargo status before login with a shipment or Buy & Ship reference.",
              },
              {
                icon: CircleUserRound,
                label: "Customer self-service",
                text: "Customers can sign in for invoices, notifications, support tickets, and profile updates.",
              },
              {
                icon: ShieldCheck,
                label: "Protected operations",
                text: "Internal write actions stay restricted to authorized warehouse, finance, and admin users.",
              },
            ].map((item) => (
              <div className="bg-[#091320]/82 p-5 backdrop-blur-sm" key={item.label}>
                <item.icon className="h-5 w-5 text-[#f4cf73]" />
                <p className="mt-4 font-data text-sm font-bold text-white">{item.label}</p>
                <p className="mt-2 max-w-md font-body text-sm leading-6 text-white/72">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#f8f5ef] py-8 md:py-10">
        <div className="mx-auto grid w-full max-w-[1440px] gap-px border-y border-black/10 bg-black/10 px-4 md:grid-cols-4 md:px-6">
          {credibilityStats.map((item) => (
            <div className="bg-[#f8f5ef] px-5 py-6" key={item.label}>
              <p className="font-heading text-3xl font-bold text-primary md:text-4xl">{item.value}</p>
              <p className="mt-2 max-w-xs font-body text-sm leading-6 text-on-surface-variant">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f4f2ef] py-16 md:py-20" id="about">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 md:grid-cols-[0.9fr_1.1fr] md:px-6">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex">
              <img
                alt="Dire Cargo Logistics logo"
                className="block h-[82px] w-auto max-w-none"
                src="/Dire-horizontal.png"
              />
            </div>
            <p className="font-data text-sm font-semibold uppercase tracking-[0.18em] text-[#8f6a10]">
              About Dire Cargo
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-5xl">
              One logistics company, multiple customer journeys, one connected system
            </h2>
          </div>
          <div className="grid gap-6">
            <p className="font-body text-base leading-8 text-on-surface-variant md:text-lg">
              Dire Cargo Logistics is built for customers who need visibility and for teams who need control. The
              platform supports shipment intake, warehouse receiving, verification, shelf assignment, finance review,
              support communication, and final customer handoff without splitting the workflow across separate tools.
            </p>
            <p className="font-body text-base leading-8 text-on-surface-variant md:text-lg">
              For public visitors, the site stays simple: track cargo, understand services, and know how to reach the
              team. For signed-in customers, the portal opens invoices, payment status, ticket history, and profile
              maintenance. For staff, the secure workspace handles operational decisions, warehouse movement, and
              reporting.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "International cargo and sourcing support",
                "Structured warehouse receiving and verification",
                "Role-based staff access across modules",
                "Live records backed by Supabase data",
              ].map((item) => (
                <div className="border border-black/10 bg-white p-4" key={item}>
                  <p className="font-data text-sm font-bold text-primary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf7] py-16 md:py-18">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 md:grid-cols-[0.85fr_1.15fr] md:px-6">
          <div className="max-w-xl">
            <p className="font-data text-sm font-semibold uppercase tracking-[0.18em] text-[#8f6a10]">
              What the homepage should communicate
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-5xl">
              Trust first, then action
            </h2>
            <p className="mt-5 font-body text-base leading-8 text-on-surface-variant md:text-lg">
              A strong logistics homepage should quickly answer three things for a visitor: what the company moves,
              how progress can be checked, and where protected customer or staff actions begin. This public page now
              does that without forcing visitors straight into login.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-black/10 bg-black/10">
            {promisePoints.map((item) => (
              <div className="bg-white px-5 py-6 md:px-6" key={item.title}>
                <p className="font-heading text-2xl font-bold text-primary">{item.title}</p>
                <p className="mt-3 max-w-3xl font-body text-sm leading-7 text-on-surface-variant md:text-base">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20" id="services">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">
          <div className="flex flex-col gap-4 md:max-w-3xl">
            <p className="font-data text-sm font-semibold uppercase tracking-[0.18em] text-[#8f6a10]">
              Services
            </p>
            <h2 className="font-heading text-3xl font-bold text-primary md:text-5xl">
              Built for freight movement, warehouse execution, and customer communication
            </h2>
            <p className="font-body text-base leading-8 text-on-surface-variant md:text-lg">
              The homepage introduces the public-facing side of the company, but the service model behind it supports
              international logistics from purchasing and receiving through invoicing and final release.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-black/10 bg-black/10 lg:grid-cols-4">
            {serviceHighlights.map((item) => (
              <div className="bg-[#faf8f4] p-6" key={item.title}>
                <item.icon className="h-6 w-6 text-[#0d2c5b]" />
                <h3 className="mt-6 font-heading text-2xl font-bold text-primary">{item.title}</h3>
                <p className="mt-3 font-body text-sm leading-7 text-on-surface-variant md:text-base">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0d1726] py-16 text-white md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 md:grid-cols-[1fr_0.95fr] md:px-6">
          <div>
            <p className="font-data text-sm font-semibold uppercase tracking-[0.18em] text-[#f4cf73]">
              Operational model
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold md:text-5xl">
              From China receiving to Mogadishu handoff
            </h2>
            <p className="mt-5 max-w-3xl font-body text-base leading-8 text-white/78 md:text-lg">
              Cargo can begin as a direct shipment or as a Buy & Ship request. From there, warehouse teams receive the
              package, verify it, assign shelf space, move it through route stages, coordinate finance requirements,
              and complete release or delivery based on the customer handoff method.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10">
            {[
              {
                label: "Origin handling",
                text: "China office intake, purchase coordination, and warehouse receiving.",
              },
              {
                label: "Transit visibility",
                text: "Public and customer portal tracking with milestone history and invoice status.",
              },
              {
                label: "Final release",
                text: "Pickup or delivery completion after operational and finance checks are satisfied.",
              },
            ].map((item) => (
              <div className="bg-[#0b1421] p-5" key={item.label}>
                <p className="font-data text-sm font-bold text-[#f4cf73]">{item.label}</p>
                <p className="mt-2 font-body text-sm leading-7 text-white/74">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f2ef] py-16 md:py-20" id="tracking">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-4 md:max-w-3xl">
            <p className="font-data text-sm font-semibold uppercase tracking-[0.18em] text-[#8f6a10]">
              Public tracking
            </p>
            <h2 className="font-heading text-3xl font-bold text-primary md:text-5xl">
              Search shipment progress without entering the private workspace
            </h2>
            <p className="font-body text-base leading-8 text-on-surface-variant md:text-lg">
              This public section is meant for speed. Customers can track route progress and readiness here first, then
              move to login only when they need invoices, support actions, profile updates, or protected workflow
              access.
            </p>
          </div>

          <PublicShipmentTracker />
        </div>
      </section>

      <section className="bg-[#091320] py-16 text-white md:py-18">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="max-w-3xl">
            <p className="font-data text-sm font-semibold uppercase tracking-[0.18em] text-[#f4cf73]">
              Ready to continue
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold md:text-5xl">
              Use public tracking first, then move into the portal only when work is needed
            </h2>
            <p className="mt-4 font-body text-base leading-8 text-white/74 md:text-lg">
              Customers can create accounts for invoices, support, shipment visibility, and profile maintenance.
              Internal teams continue into the workspace for operations, warehouse control, finance, and reporting.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-5 font-data text-sm font-bold text-[#08101d]"
              href="/signup"
            >
              Create Account
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#d4b15a] px-5 font-data text-sm font-bold text-[#07101b]"
              href={workspaceHref}
            >
              {isSignedIn ? "Open Workspace" : "Login"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20" id="contact">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="font-data text-sm font-semibold uppercase tracking-[0.18em] text-[#8f6a10]">
                Contact us
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-5xl">
                Speak with Dire Cargo when you need movement, visibility, or support
              </h2>
              <p className="mt-5 font-body text-base leading-8 text-on-surface-variant md:text-lg">
                The public site introduces the company and opens shipment tracking. Customers who need account-level
                actions can create a portal account or sign in, while internal teams continue into the protected
                workspace for warehouse, finance, and operations tasks.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-data text-sm font-bold text-on-primary"
                  href={workspaceHref}
                >
                  {isSignedIn ? "Open Workspace" : "Login"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!isSignedIn ? (
                  <Link
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-5 font-data text-sm font-bold text-primary"
                    href="/signup"
                  >
                    Create Account
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-px overflow-hidden border border-black/10 bg-black/10">
              {contactBlocks.map((item) => (
                <div className="bg-[#faf8f4] p-5" key={item.label}>
                  <item.icon className="h-5 w-5 text-[#0d2c5b]" />
                  <p className="mt-4 font-data text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    {item.label}
                  </p>
                  <p className="mt-2 font-heading text-2xl font-bold text-primary">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-[#08101d]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-6 text-white/72 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="inline-flex">
              <img
                alt="Dire Cargo Logistics logo"
                className="block h-[52px] w-auto max-w-none"
                src="/Dire-horizontal.png"
              />
            </div>
            <p className="font-body text-sm">
              Dire Cargo Logistics. Public access for tracking, protected access for operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-data text-sm font-semibold">
            <a className="transition hover:text-[#f4cf73]" href="#about">
              About
            </a>
            <a className="transition hover:text-[#f4cf73]" href="#services">
              Services
            </a>
            <a className="transition hover:text-[#f4cf73]" href="#tracking">
              Tracking
            </a>
            <a className="transition hover:text-[#f4cf73]" href="#contact">
              Contact Us
            </a>
            <Link className="transition hover:text-[#f4cf73]" href={workspaceHref}>
              {isSignedIn ? "Workspace" : "Login"}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
