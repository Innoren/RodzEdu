import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAllCourses } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";
import { CourseDeleteButton } from "@/components/CourseDeleteButton";

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
                Upload, edit, publish, or remove continuing education courses.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/new" className="btn btn-primary">
                Upload new course
              </Link>
              <Link href="/admin/instructors" className="btn btn-ghost">
                Instructors
              </Link>
              <Link href="/admin/bundles" className="btn btn-ghost">
                Bundles
              </Link>
              <Link href="/admin/discounts" className="btn btn-ghost">
                Discounts
              </Link>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted">
            No course limit — upload as many CE courses as you need. Each can
            include modules, quizzes, and a final exam.
          </p>

          <div className="mt-8 space-y-3">
            {courses.length === 0 ? (
              <div className="panel p-6 text-muted">
                No courses yet.{" "}
                <Link href="/admin/new" className="font-semibold text-teal">
                  Upload your first course
                </Link>
                .
              </div>
            ) : null}
            {courses.map((course) => (
              <article
                key={course.id}
                className="panel flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                    {course.category}
                    {!course.published ? " · Draft" : " · Published"}
                    {course.featured ? " · Featured" : ""}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-navy">
                    {course.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {course.credits} credits · {formatMoney(course.priceCents)} ·{" "}
                    {course.modules?.length || 0} modules ·{" "}
                    {course.examQuestions.length} exam questions
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="btn btn-ghost !px-3 !py-2 text-sm"
                  >
                    Preview
                  </Link>
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="btn btn-navy !px-3 !py-2 text-sm"
                  >
                    Edit
                  </Link>
                  <CourseDeleteButton
                    courseId={course.id}
                    courseTitle={course.title}
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
