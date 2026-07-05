import { Bell, CheckCheck, Search, Send } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MarkNotificationReadButton } from "@/components/mark-notification-read-button";
import { SendNotificationForm } from "@/components/send-notification-form";
import {
  getCurrentAppUser,
  getNotificationCenterData,
  getSettingsOverviewData,
} from "@/lib/supabase/dire-data";

function titleize(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

type NotificationsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
  }>;
};

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const params = (await searchParams) ?? {};
  const [notifications, settings, currentUser] = await Promise.all([
    getNotificationCenterData(),
    getSettingsOverviewData(),
    getCurrentAppUser(),
  ]);
  const canSendNotifications = currentUser.role !== "customer";
  const statusFilter =
    params.status === "read" || params.status === "unread" ? params.status : "all";
  const search = params.search?.trim().toLowerCase() ?? "";
  const filteredItems = notifications.items.filter((item) =>
    (statusFilter === "unread" ? !item.read : statusFilter === "read" ? item.read : true) &&
    (search.length === 0
      ? true
      : [item.title, item.message, item.type, item.createdAt]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search)),
  );
  const filterLinks = [
    { href: "/notifications", key: "all", label: "All" },
    { href: "/notifications?status=unread", key: "unread", label: "Unread" },
    { href: "/notifications?status=read", key: "read", label: "Read" },
  ] as const;

  return (
    <AppShell activeItem="Notifications">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Notifications
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              Notification Center
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
              Review alerts, mark items as read, and send operational notices to
              specific users.
            </p>
          </div>
          {canSendNotifications ? (
            <SendNotificationForm
              triggerClassName="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
              users={settings.users.map((user) => ({
                id: user.id,
                label: `${user.email} (${user.roles.map((role) => role.name).join(", ") || "No role"})`,
              }))}
            />
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Notifications", value: notifications.items.length, icon: Bell },
            { label: "Unread", value: notifications.unreadCount, icon: CheckCheck },
            { label: "Delivery Mode", value: notifications.mode, icon: Send },
          ].map((stat) => (
            <article
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              key={stat.label}
            >
              <div className="flex items-center justify-between">
                <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                  {stat.label}
                </p>
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 font-heading text-3xl font-bold capitalize text-primary">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Recent Notifications
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              {notifications.mode === "supabase"
                ? "Live notifications for the current signed-in user."
                : "Demo notifications are showing because Supabase is not configured."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-outline-variant p-5 md:border-t-0">
            <form className="mr-2 min-w-[260px] flex-1 md:max-w-sm" method="get">
              <input name="status" type="hidden" value={statusFilter === "all" ? "" : statusFilter} />
              <label className="relative block">
                <span className="sr-only">Search notifications</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container px-9 font-data text-sm font-semibold text-on-surface"
                  defaultValue={params.search ?? ""}
                  name="search"
                  placeholder="Search notifications..."
                />
              </label>
            </form>
            {filterLinks.map((filter) => (
              <Link
                className={
                  statusFilter === filter.key
                    ? "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 font-data text-xs font-bold text-on-primary"
                    : "inline-flex h-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-xs font-bold text-on-surface"
                }
                href={`${filter.href}${params.search ? `${filter.href.includes("?") ? "&" : "?"}search=${encodeURIComponent(params.search)}` : ""}`}
                key={filter.key}
              >
                {filter.label}
              </Link>
            ))}
          </div>

          <div className="divide-y divide-surface-container-high">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div className="p-5" key={item.id}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-data text-sm font-bold text-on-surface">
                          {item.title}
                        </p>
                        <span
                          className={
                            item.read
                              ? "rounded-full bg-surface-container-high px-3 py-1 font-data text-xs font-bold text-on-surface-variant"
                              : "rounded-full bg-yellow-50 px-3 py-1 font-data text-xs font-bold text-yellow-800"
                          }
                        >
                          {item.read ? "Read" : "Unread"}
                        </span>
                        <span className="rounded-full bg-surface-container px-3 py-1 font-data text-xs font-bold text-on-surface-variant">
                          {titleize(item.type)}
                        </span>
                      </div>
                      <p className="mt-3 font-body text-sm text-on-surface">
                        {item.message}
                      </p>
                      <p className="mt-3 font-data text-xs font-semibold text-on-surface-variant">
                        {item.createdAt}
                      </p>
                    </div>
                    <MarkNotificationReadButton id={item.id} read={item.read} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5">
                <p className="font-data text-sm font-bold text-on-surface">
                  No notifications in this filter
                </p>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  New alerts will appear here after they are sent to this user.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Sent Activity
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Recent notification actions recorded for the current signed-in admin user.
            </p>
          </div>

          <div className="divide-y divide-surface-container-high">
            {notifications.sentActivity.filter((entry) =>
              search.length === 0
                ? true
                : [entry.action, entry.summary, entry.userEmail, entry.createdAt]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(search),
            ).length > 0 ? (
              notifications.sentActivity
                .filter((entry) =>
                  search.length === 0
                    ? true
                    : [entry.action, entry.summary, entry.userEmail, entry.createdAt]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(search),
                )
                .map((entry) => (
                <div
                  className="grid gap-3 p-5 md:grid-cols-[160px_1fr_220px]"
                  key={entry.id}
                >
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Action
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {entry.action}
                    </p>
                  </div>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Details
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface">
                      {entry.summary}
                    </p>
                    <p className="mt-1 font-data text-xs font-semibold text-on-surface-variant">
                      Target: {entry.userEmail}
                    </p>
                  </div>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Time
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface">
                      {entry.createdAt}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5">
                <p className="font-data text-sm font-bold text-on-surface">
                  No sent activity yet
                </p>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  Sent notifications and read actions by this admin user will appear here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
