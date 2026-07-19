import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAllCourses } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";

export default async function AdminPortalPage() {
  const user = await requireUser(["admin", "ceo"]);
  const courses = await listAllCourses();

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Admin portal</p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
                Course manager
              </h1>
              <p className="mt-3 text-muted">
                Upload and publish new continuing education courses for the
                RodzEdu catalog.
              </p>
            </div>
            <Link href="/admin/new" className="btn btn-primary">
              Upload new course
            </Link>
          </div>

          <div className="mt-8 space-y-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="panel flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                    {course.category}
                    {!course.published ? " · Draft" : " · Published"}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-navy">
                    {course.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {course.credits} credits · {formatMoney(course.priceCents)} ·{" "}
                    {course.examQuestions.length} exam questions
                  </p>
                </div>
                <Link
                  href={`/courses/${course.slug}`}
                  className="btn btn-ghost !px-3 !py-2 text-sm"
                >
                  Preview
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
