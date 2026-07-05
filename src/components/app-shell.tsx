import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/login/actions";
import { canAccessNavItem } from "@/lib/access-control";
import { brandIcon as BrandIcon, navigationItems } from "@/lib/navigation";
import {
  getCurrentAppUser,
  getNotificationCenterData,
} from "@/lib/supabase/dire-data";

type AppShellProps = {
  activeItem?: string;
  children: React.ReactNode;
};

const moduleSearchTargets: Record<string, { action: string; placeholder: string }> = {
  "Buy & Ship": {
    action: "/buy-ship",
    placeholder: "Search requests, products, customers...",
  },
  Customers: {
    action: "/customers",
    placeholder: "Search customers, company, phone...",
  },
  Invoices: {
    action: "/invoices",
    placeholder: "Search invoices, tracking, customer...",
  },
  Operations: {
    action: "/operations",
    placeholder: "Search workflow, tracking, customer...",
  },
  Shipments: {
    action: "/shipments",
    placeholder: "Search shipments, airway bills, customers...",
  },
  Support: {
    action: "/support",
    placeholder: "Search tickets, subject, customer...",
  },
};

function NavigationLinks({
  activeItem,
  items,
  mobile = false,
}: {
  activeItem: string;
  items: ReadonlyArray<(typeof navigationItems)[number]>;
  mobile?: boolean;
}) {
  return (
    <nav
      className={
        mobile
          ? "flex flex-col gap-1"
          : "kanban-scroll flex flex-1 flex-col gap-1 overflow-y-auto"
      }
    >
      {items.map((item) => (
        <Link
          className={
            item.label === activeItem
              ? "flex items-center gap-3 rounded-lg bg-secondary-container px-4 py-3 font-data text-sm font-bold text-on-secondary-container"
              : "flex items-center gap-3 rounded-lg px-4 py-3 font-data text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
          }
          href={item.href}
          key={`${mobile ? "mobile" : "desktop"}-${item.label}`}
        >
          <item.icon aria-hidden="true" className="h-5 w-5" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function NavigationSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="h-11 rounded-lg bg-surface-container-high"
          key={`nav-skeleton-${index}`}
        />
      ))}
    </div>
  );
}

async function DesktopNavigation({ activeItem }: { activeItem: string }) {
  const user = await getCurrentAppUser();
  const visibleNavigationItems = navigationItems.filter((item) =>
    canAccessNavItem(user.role, item.label),
  );

  return (
    <NavigationLinks activeItem={activeItem} items={visibleNavigationItems} />
  );
}

async function MobileNavigation({ activeItem }: { activeItem: string }) {
  const user = await getCurrentAppUser();
  const visibleNavigationItems = navigationItems.filter((item) =>
    canAccessNavItem(user.role, item.label),
  );

  return (
    <NavigationLinks
      activeItem={activeItem}
      items={visibleNavigationItems}
      mobile
    />
  );
}

function HeaderNotificationSkeleton() {
  return <div className="h-10 w-10 rounded-full bg-surface-container-high" />;
}

async function HeaderNotifications() {
  const notifications = await getNotificationCenterData();

  return (
    <Link
      aria-label="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
      href="/notifications"
    >
      <Bell className="h-5 w-5" />
      {notifications.unreadCount > 0 ? (
        <>
          <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 font-data text-[10px] font-bold text-white">
            {Math.min(notifications.unreadCount, 9)}
          </span>
          <span className="sr-only">
            {notifications.unreadCount} unread notifications
          </span>
        </>
      ) : null}
    </Link>
  );
}

function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1">
      <div className="h-10 w-10 rounded-full bg-surface-container-high" />
      <div className="hidden md:block">
        <div className="h-4 w-24 rounded bg-surface-container-high" />
        <div className="mt-2 h-3 w-20 rounded bg-surface-container-high" />
      </div>
    </div>
  );
}

async function HeaderUserMenu() {
  const user = await getCurrentAppUser();

  return (
    <details className="relative">
      <summary className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 text-left transition hover:bg-surface-container-high list-none">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-data text-sm font-semibold text-on-primary">
          {user.initials}
        </span>
        <span className="hidden md:block">
          <span className="block font-data text-sm font-bold leading-4 text-on-surface">
            {user.name}
          </span>
          <span className="block font-data text-xs text-on-surface-variant">
            {user.role.replaceAll("_", " ")}
          </span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-on-surface-variant md:block" />
      </summary>
      <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-xl">
        {user.role === "customer" ? (
          <Link
            className="block rounded-lg px-4 py-3 font-data text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
            href="/profile"
          >
            My Profile
          </Link>
        ) : null}
        <Link
          className="block rounded-lg px-4 py-3 font-data text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
          href="/settings"
        >
          Settings
        </Link>
        <Link
          className="block rounded-lg px-4 py-3 font-data text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
          href="/notifications"
        >
          Notifications
        </Link>
      </div>
    </details>
  );
}

export function AppShell({ activeItem = "Dashboard", children }: AppShellProps) {
  const searchConfig = moduleSearchTargets[activeItem] ?? {
    action: "/search",
    placeholder: "Search shipments, customers, invoices, tickets...",
  };

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r border-outline-variant bg-surface-container-lowest shadow-sm md:block">
        <div className="flex h-full flex-col gap-2 p-4">
          <div className="mb-4 flex items-center gap-3 border-b border-surface-container-highest px-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-on-primary">
              <BrandIcon aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading text-2xl font-bold leading-none text-primary">
                Dire Cargo
              </p>
              <p className="mt-1 font-data text-xs font-medium text-on-surface-variant">
                Global Control Center
              </p>
            </div>
          </div>

          <Suspense fallback={<NavigationSkeleton />}>
            <DesktopNavigation activeItem={activeItem} />
          </Suspense>
        </div>
      </aside>

      <header className="fixed right-0 top-0 z-30 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 shadow-sm md:w-[calc(100%-260px)] md:px-6">
        <details className="relative md:hidden">
          <summary className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface list-none">
            <Menu className="h-5 w-5" />
          </summary>
          <div className="absolute left-0 top-12 z-50 w-64 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-xl">
            <Suspense fallback={<NavigationSkeleton />}>
              <MobileNavigation activeItem={activeItem} />
            </Suspense>
          </div>
        </details>

        <div className="hidden w-full max-w-xl items-center md:flex">
          <form action={searchConfig.action} className="w-full">
            <label className="relative block w-full">
              <span className="sr-only">Search</span>
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-10 font-data text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                name="search"
                placeholder={searchConfig.placeholder}
                type="search"
              />
            </label>
          </form>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Suspense fallback={<HeaderNotificationSkeleton />}>
            <HeaderNotifications />
          </Suspense>
          <Link
            aria-label="Currency settings"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary sm:flex"
            href="/settings"
          >
            <WalletCards className="h-5 w-5" />
          </Link>
          <div className="hidden h-8 w-px bg-outline-variant md:block" />
          <Suspense fallback={<HeaderUserSkeleton />}>
            <HeaderUserMenu />
          </Suspense>
          <form action={signOutAction}>
            <button
              className="flex h-10 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-data text-sm font-semibold text-on-surface transition hover:bg-surface-container-high hover:text-primary"
              type="submit"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </header>

      <main className="min-h-screen pt-16 md:ml-[260px]">{children}</main>
    </div>
  );
}
