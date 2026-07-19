import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getCourseById,
  listEnrollmentsForUser,
} from "@/lib/db";
import { formatDate, statusLabel } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";
import { OpenExamButton } from "@/components/OpenExamButton";
import { UpdateProgressButton } from "@/components/UpdateProgressButton";

export default async function StudentPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string }>;
}) {
  const user = await requireUser(["student"]);
  const params = await searchParams;
  const enrollments = await listEnrollmentsForUser(user.id);

  const rows = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = await getCourseById(enrollment.courseId);
      return { enrollment, course };
    }),
  );

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Student portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Your CE progress
          </h1>
          <p className="mt-3 text-muted">
            Track modules, open exams in a dedicated window, and manage your
            radiology continuing education.
          </p>

          {params.purchased && (
            <div className="mt-5 rounded-sm border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-navy">
              Enrollment confirmed for <strong>{params.purchased}</strong>. Your
              course is ready below.
            </div>
          )}

          <div className="mt-8 space-y-4">
            {rows.length === 0 && (
              <div className="panel p-6">
                <p className="text-navy">No courses yet.</p>
                <Link href="/courses" className="btn btn-primary mt-4">
                  Browse & enroll
                </Link>
              </div>
            )}

            {rows.map(({ enrollment, course }) => {
              if (!course) return null;
              const examReady =
                enrollment.progressPercent >= 100 &&
                enrollment.status !== "completed";

              return (
                <article key={enrollment.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                        {course.category}
                      </p>
                      <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-navy">
                        {course.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        Purchased {formatDate(enrollment.purchasedAt)} ·{" "}
                        {statusLabel(enrollment.status)}
                        {typeof enrollment.score === "number"
                          ? ` · Score ${enrollment.score}%`
                          : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-navy">
                      {course.credits} CE credits
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted">Module progress</span>
                      <span className="font-semibold text-navy">
                        {enrollment.progressPercent}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <UpdateProgressButton
                      enrollmentId={enrollment.id}
                      current={enrollment.progressPercent}
                    />
                    <OpenExamButton
                      enrollmentId={enrollment.id}
                      disabled={!examReady && enrollment.status !== "completed"}
                    />
                    <Link
                      href={`/courses/${course.slug}`}
                      className="btn btn-ghost !px-3 !py-2 text-sm"
                    >
                      Course details
                    </Link>
                  </div>
                  {!examReady && enrollment.status !== "completed" && (
                    <p className="mt-3 text-xs text-muted">
                      Complete modules to 100% before the exam window unlocks.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
