import { requireUser } from "@/lib/auth";
import { getCourseById, listSupportTickets } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";
import { TicketStatusButton } from "@/components/TicketStatusButton";

export default async function SupportAdminPage() {
  const user = await requireUser(["admin", "ceo"]);
  const tickets = await listSupportTickets();

  const rows = await Promise.all(
    tickets.map(async (ticket) => ({
      ticket,
      course: ticket.courseId ? await getCourseById(ticket.courseId) : null,
    })),
  );

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Support tickets
          </h1>
          <p className="mt-3 mb-6 text-muted">
            Requests from the contact form and in-course help.
          </p>
          <div className="space-y-3">
            {rows.length === 0 && (
              <div className="panel p-5 text-muted">No tickets yet.</div>
            )}
            {rows.map(({ ticket, course }) => (
              <article key={ticket.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                      {ticket.status.replace("_", " ")}
                      {course ? ` · ${course.title}` : ""}
                    </p>
                    <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-navy">
                      {ticket.subject}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {ticket.name} · {ticket.email} · {formatDate(ticket.createdAt)}
                    </p>
                    <p className="mt-3 text-ink/85">{ticket.message}</p>
                  </div>
                  <TicketStatusButton
                    ticketId={ticket.id}
                    status={ticket.status}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
