import Link from "next/link";
import { ArrowLeft, CircleHelp, MessageSquare, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SupportReplyForm } from "@/components/support-reply-form";
import { SupportTicketStatusForm } from "@/components/support-ticket-status-form";
import { getCurrentAppUser, getSupportTicketDetail } from "@/lib/supabase/dire-data";

type SupportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SupportDetailPage({
  params,
}: SupportDetailPageProps) {
  const { id } = await params;
  const [detail, currentUser] = await Promise.all([
    getSupportTicketDetail(id),
    getCurrentAppUser(),
  ]);

  if (!detail) {
    return (
      <AppShell activeItem="Support">
        <div className="p-6">
          <p className="font-data text-sm font-bold text-error">
            Support ticket not found.
          </p>
        </div>
      </AppShell>
    );
  }

  const { messages, ticket } = detail;
  const canManageTicket =
    currentUser.role === "super_admin" || currentUser.role === "support";

  return (
    <AppShell activeItem="Support">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 p-4 md:p-6">
        <Link
          className="inline-flex w-fit items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
          href="/support"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to support
        </Link>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            {ticket.ticketNumber}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            {ticket.subject}
          </h1>
          <p className="mt-3 font-body text-base text-on-surface-variant">
            {ticket.customerName} / {ticket.customerCode}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Message Thread
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                {detail.mode === "supabase"
                  ? "Conversation data from Supabase."
                  : "Conversation data from `/api/v1/support/tickets/:id`."}
              </p>
            </div>
            <div className="space-y-4 p-5">
              {messages.map((message) => (
                <article
                  className={
                    message.senderRole === "customer"
                      ? "rounded-lg border border-outline-variant bg-surface-container-low p-4"
                      : "rounded-lg border border-blue-100 bg-blue-50 p-4"
                  }
                  key={message.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-primary">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-data text-sm font-bold text-on-surface">
                        {message.sender}
                      </p>
                      <p className="font-data text-xs font-semibold capitalize text-on-surface-variant">
                        {message.senderRole} / {message.createdAt}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 font-body text-sm text-on-surface">
                    {message.message}
                  </p>
                </article>
              ))}

              <SupportReplyForm senderId={currentUser.id ?? "demo-user"} ticketId={id} />
            </div>
          </div>

          <aside className="grid gap-4">
            {[
              { icon: CircleHelp, label: "Status", value: ticket.status },
              { icon: MessageSquare, label: "Priority", value: ticket.priority },
              { icon: UserRound, label: "Assigned To", value: ticket.assignedTo },
            ].map((item) => (
              <div
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
                key={item.label}
              >
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-high text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      {item.label}
                    </p>
                    <p className="mt-1 font-data text-sm font-bold capitalize text-on-surface">
                      {item.value.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {canManageTicket ? (
              <SupportTicketStatusForm
                currentPriority={ticket.priority}
                currentStatus={ticket.status}
                ticketId={id}
              />
            ) : null}
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
