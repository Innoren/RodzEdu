import Link from "next/link";
import { getDashboardStats } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function CeoReportsPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Reporting</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Revenue, completions & instructor performance
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Operational snapshot for CEO and admin planning. Revenue reflects
            catalog course value of enrollments.
          </p>
        </div>
        <Link href="/admin/support" className="btn btn-ghost">
          Open support tickets ({stats.openTickets})
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Gross course value", value: formatMoney(stats.revenueCents) },
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
                  {row.enrollments} enrolled
                  <br />
                  {row.completions} completed
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
                  {row.students} students
                  <br />
                  {row.enrollments} enrollments
                  <br />
                  {row.completions} completions
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
