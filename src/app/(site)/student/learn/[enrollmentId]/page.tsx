import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCourseById, getEnrollmentById } from "@/lib/db";
import { CourseLearner } from "@/components/CourseLearner";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const user = await requireUser(["student"]);
  const { enrollmentId } = await params;
  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.userId !== user.id) notFound();

  const course = await getCourseById(enrollment.courseId);
  if (!course) notFound();

  return (
    <section className="section">
      <div className="section-inner">
        <Link href="/student" className="text-sm font-semibold text-teal">
          ← Back to my progress
        </Link>
        <p className="eyebrow mt-5">{course.category}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
          {course.title}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Work through each module at your own pace. Quizzes save your progress
          so you can return later — then take the final exam for your
          certificate.
        </p>
        <div className="mt-8">
          <CourseLearner course={course} enrollment={enrollment} />
        </div>
      </div>
    </section>
  );
}
