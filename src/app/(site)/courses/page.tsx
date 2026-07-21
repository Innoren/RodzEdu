import Link from "next/link";
import { getSettings, listPublishedCourses } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function CoursesPage() {
  const [courses, settings] = await Promise.all([
    listPublishedCourses(),
    getSettings(),
  ]);

  return (
    <section className="section">
      <div className="section-inner">
        <p className="eyebrow">Course catalog</p>
        <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight text-navy md:text-5xl">
          Homestudy CE with clear credits, clear pricing, and a clear exam path
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Start with radiology — radiography, mammography, CT, and related imaging
          specialties. Every listing shows what you&apos;re paying for before you enroll.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink/75">
          {settings.phone ? <p>Questions? {settings.phone}</p> : null}
          {settings.email ? <p>{settings.email}</p> : null}
          <p>Office hours 9am–5pm EST, Mon–Fri</p>
        </div>

        <div className="mt-12 divide-y divide-line border-y border-line">
          {courses.map((course) => (
            <article
              key={course.id}
              className="grid gap-5 py-8 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                  {course.category} · {course.credits} CE credits · Online exam
                  included
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-navy md:text-3xl">
                  {course.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                  {course.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:flex-col md:items-end">
                <p className="text-2xl font-semibold text-navy">
                  {formatMoney(course.priceCents)}
                </p>
                <Link
                  href={`/courses/${course.slug}`}
                  className="btn btn-navy !px-4 !py-2.5 text-sm"
                >
                  Review & enroll
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
