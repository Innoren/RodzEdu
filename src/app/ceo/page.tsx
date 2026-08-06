import Link from "next/link";
import { getDashboardStats, listAllCourses, listUsers } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function CeoOverviewPage() {
  const [stats, courses, users] = await Promise.all([
    getDashboardStats(),
    listAllCourses(),
    listUsers(),
  ]);

  const cards = [
    { label: "Students", value: String(stats.students) },
    { label: "Teachers", value: String(stats.teachers) },
    { label: "Published courses", value: String(stats.publishedCourses) },
    { label: "Enrollments", value: String(stats.enrollments) },
    { label: "Completions", value: String(stats.completed) },
    { label: "Certificates issued", value: String(stats.certificates) },
    { label: "Bundles", value: String(stats.bundles) },
    { label: "Gross course value", value: formatMoney(stats.revenueCents) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Executive overview</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Manage RodzEdu from this console
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Use this console to steer the business without mixing into student
            or exam workflows.
          </p>
        </div>
        <Link href="/ceo/reports" className="btn btn-primary">
          Open reports
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
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
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              Courses
            </h2>
            <Link href="/admin" className="text-sm font-semibold text-teal">
              Open course manager →
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {courses.slice(0, 6).map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between border-b border-line/70 pb-2"
              >
                <span className="text-ink/90">{course.title}</span>
                <span className="text-muted">
                  {course.published ? "Live" : "Draft"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              Team & learners
            </h2>
            <Link href="/teacher" className="text-sm font-semibold text-teal">
              Manage students →
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {users.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between border-b border-line/70 pb-2"
              >
                <span className="text-ink/90">{person.name}</span>
                <span className="capitalize text-muted">{person.role}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
