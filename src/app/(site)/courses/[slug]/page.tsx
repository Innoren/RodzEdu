import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getCourseBySlug, getSettings, listEnrollmentsForUser } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || !course.published) notFound();

  const [user, settings] = await Promise.all([
    getSessionUser(),
    getSettings(),
  ]);
  const enrollments =
    user?.role === "student" ? await listEnrollmentsForUser(user.id) : [];
  const alreadyEnrolled = enrollments.some((e) => e.courseId === course.id);

  return (
    <section className="section">
      <div className="section-inner grid gap-10 md:grid-cols-[1.35fr_0.75fr]">
        <div>
          <Link href="/courses" className="text-sm font-semibold text-teal">
            ← Back to catalog
          </Link>
          <p className="eyebrow mt-5">{course.category}</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-navy md:text-5xl">
            {course.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {course.description}
          </p>

          <div className="mt-8 border-y border-line py-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              What&apos;s included
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/80 md:text-base">
              <li>{course.credits} CE credits with a complete online exam</li>
              <li>
                {(course.modules?.length || 0) > 0
                  ? `${course.modules.length} learning modules with built-in quizzes`
                  : "Structured module content you can finish around your schedule"}
              </li>
              <li>Save progress and return later — certificate issued on pass</li>
              <li>Immediate access after enrollment — no shipping delay</li>
              <li>
                Support available
                {settings.phone ? " by phone or email" : " by email"} during
                office hours
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              Course modules
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-ink/85 md:text-base">
              {(course.modules || []).map((module, index) => (
                <li key={module.id}>
                  <span className="font-semibold text-navy">
                    {index + 1}. {module.title}
                  </span>
                  {module.quizQuestions.length > 0
                    ? " · includes quiz"
                    : ""}
                </li>
              ))}
            </ol>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              {course.content}
            </p>
          </div>
        </div>

        <aside className="h-fit border border-line bg-white p-6 md:sticky md:top-24">
          <p className="text-sm font-medium text-muted">Enrollment</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-navy">
            {formatMoney(course.priceCents)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {course.credits} CE credits · Exam included · Online access
          </p>

          <div className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-ink/80">
            <p>Transparent pricing — no add-on fees at checkout.</p>
            {settings.phone ? (
              <p>Need help choosing? Call {settings.phone}.</p>
            ) : settings.email ? (
              <p>Need help choosing? Email {settings.email}.</p>
            ) : null}
          </div>

          {alreadyEnrolled ? (
            <Link href="/student" className="btn btn-navy mt-6 w-full">
              Continue in my account
            </Link>
          ) : user?.role === "student" ? (
            <CheckoutForm courseId={course.id} className="mt-6" />
          ) : (
            <Link
              href={`/login?next=/courses/${course.slug}`}
              className="btn btn-primary mt-6 w-full"
            >
              Sign in to enroll
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}
