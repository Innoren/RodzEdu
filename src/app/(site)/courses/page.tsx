import Link from "next/link";
import { listPublishedCourses } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function CoursesPage() {
  const courses = await listPublishedCourses();

  return (
    <section className="section">
      <div className="section-inner">
        <p className="eyebrow">Homestudy catalog</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy md:text-5xl">
          Choose and pay for your CE classes
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Starting with radiology — radiography, mammography, CT, and more
          imaging specialties. Enroll online and study at your pace.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {courses.map((course) => (
            <article key={course.id} className="panel flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                    {course.category}
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-navy">
                    {course.title}
                  </h2>
                </div>
                <p className="shrink-0 text-lg font-semibold text-accent">
                  {formatMoney(course.priceCents)}
                </p>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {course.description}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-navy">
                  {course.credits} CE credits · {course.examQuestions.length} exam
                  questions
                </span>
                <Link
                  href={`/courses/${course.slug}`}
                  className="btn btn-navy !px-3 !py-2 text-sm"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
