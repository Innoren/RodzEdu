import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";

export default async function AdminReportsPage() {
  const user = await requireUser(["admin", "ceo"]);
  const stats = await getDashboardStats();

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Reporting dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Revenue, completions, popular courses, and instructor performance.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/support" className="btn btn-ghost">
              Support tickets ({stats.openTickets} open)
            </Link>
            {user.role === "ceo" ? (
              <Link href="/ceo/reports" className="btn btn-ghost">
                CEO reports console
              </Link>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Gross course value",
                value: formatMoney(stats.revenueCents),
              },
              { label: "Enrollments", value: String(stats.enrollments) },
              { label: "Completions", value: String(stats.completed) },
              { label: "Certificates", value: String(stats.certificates) },
            ].map((card) => (
              <div key={card.label} className="panel p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {card.label}
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="panel p-5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
                Popular courses
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {stats.popularCourses.length === 0 && (
                  <li className="text-muted">No enrollments yet.</li>
                )}
                {stats.popularCourses.map((row) => (
                  <li
                    key={row.courseId}
                    className="flex items-start justify-between gap-3 border-b border-line/70 pb-2"
                  >
                    <span className="text-ink/90">{row.title}</span>
                    <span className="shrink-0 text-right text-muted">
                      {row.enrollments} enrolled · {row.completions} completed
                      <br />
                      {formatMoney(row.revenueCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel p-5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
                Instructor performance
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {stats.instructorPerformance.length === 0 && (
                  <li className="text-muted">No instructors yet.</li>
                )}
                {stats.instructorPerformance.map((row) => (
                  <li
                    key={row.instructorId}
                    className="flex items-start justify-between gap-3 border-b border-line/70 pb-2"
                  >
                    <span className="text-ink/90">{row.name}</span>
                    <span className="shrink-0 text-right text-muted">
                      {row.students} students · {row.enrollments} enrollments
                      <br />
                      {row.completions} completions
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
