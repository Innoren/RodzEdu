import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getCourseBySlug, listEnrollmentsForUser } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || !course.published) notFound();

  const user = await getSessionUser();
  const enrollments =
    user?.role === "student" ? await listEnrollmentsForUser(user.id) : [];
  const alreadyEnrolled = enrollments.some((e) => e.courseId === course.id);

  return (
    <section className="section">
      <div className="section-inner grid gap-8 md:grid-cols-[1.4fr_0.8fr]">
        <div>
          <Link href="/courses" className="text-sm font-semibold text-teal">
            ← Back to catalog
          </Link>
          <p className="eyebrow mt-4">{course.category}</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy md:text-5xl">
            {course.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{course.description}</p>
          <div className="panel mt-8 p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              Course materials
            </h2>
            <p className="mt-3 leading-relaxed text-muted">{course.content}</p>
            <p className="mt-4 text-sm text-muted">
              After completing modules, open a dedicated exam window to take
              your continuing education test.
            </p>
          </div>
        </div>

        <aside className="panel h-fit p-6 md:sticky md:top-24">
          <p className="text-3xl font-semibold text-accent">
            {formatMoney(course.priceCents)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {course.credits} CE credits · Online exam included
          </p>
          <ul className="mt-5 space-y-2 text-sm text-ink/80">
            <li>• Instant portal access after purchase</li>
            <li>• Progress tracking for students & teachers</li>
            <li>• Exam opens in a separate testing window</li>
          </ul>

          {alreadyEnrolled ? (
            <Link href="/student" className="btn btn-navy mt-6 w-full">
              Go to my progress
            </Link>
          ) : user?.role === "student" ? (
            <form action="/api/checkout" method="post" className="mt-6">
              <input type="hidden" name="courseId" value={course.id} />
              <button type="submit" className="btn btn-primary w-full">
                Enroll & Pay
              </button>
              <p className="mt-2 text-center text-xs text-muted">
                Demo mode enrolls instantly when Stripe keys are not configured.
              </p>
            </form>
          ) : (
            <Link
              href={`/login?next=/courses/${course.slug}`}
              className="btn btn-primary mt-6 w-full"
            >
              Log in as student to enroll
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}
