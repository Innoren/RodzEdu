import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCourseById, getEnrollmentById } from "@/lib/db";
import { CourseLearner } from "@/components/CourseLearner";
import { ContactForm } from "@/components/ContactForm";

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

        <div className="mt-12 max-w-2xl border-t border-line pt-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
            Help with this course
          </h2>
          <p className="mt-2 mb-5 text-muted">
            Questions about a module, quiz, exam, or certificate? Send a support
            request tied to this course. Prefer self-serve answers?{" "}
            <Link href="/faq" className="font-semibold text-teal hover:underline">
              Visit the FAQ
            </Link>
            .
          </p>
          <ContactForm
            defaultName={user.name}
            defaultEmail={user.email}
            courseId={course.id}
            courseTitle={course.title}
          />
        </div>
      </div>
    </section>
  );
}
