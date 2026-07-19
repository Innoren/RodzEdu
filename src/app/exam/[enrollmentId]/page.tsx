import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getCourseById, getEnrollmentById } from "@/lib/db";
import { ExamClient } from "@/components/ExamClient";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { enrollmentId } = await params;
  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.userId !== user.id) notFound();

  const course = await getCourseById(enrollment.courseId);
  if (!course) notFound();

  if (enrollment.progressPercent < 100 && enrollment.status !== "completed") {
    return (
      <div className="exam-shell flex min-h-screen items-center justify-center px-5">
        <div className="panel max-w-lg p-8 text-center">
          <p className="eyebrow">Exam locked</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy">
            Finish your modules first
          </h1>
          <p className="mt-3 text-muted">
            Complete 100% of the course content in your student portal before
            opening this exam window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-shell px-5 py-8">
      <ExamClient enrollmentId={enrollment.id} course={course} />
    </div>
  );
}
