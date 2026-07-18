import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  User,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { enrollAction } from "@/app/actions/courses";
import { formatPrice } from "@/lib/format";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { slug } = await params;
  const { canceled } = await searchParams;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { name: true } },
      lessons: { orderBy: { order: "asc" } },
    },
  });

  if (!course || !course.published) notFound();

  const user = await getCurrentUser();
  const enrollment = user
    ? await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      })
    : null;
  const isEnrolled = enrollment?.status === "ACTIVE";
  const isInstructor = user?.id === course.instructorId;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {canceled && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout was canceled. You can enroll again whenever you&apos;re ready.
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {course.category}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">
            {course.title}
          </h1>
          <p className="mt-3 text-lg text-ink-700">{course.summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-500">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {course.instructor.name}
            </span>
            {course.credits > 0 && (
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-brand-600" /> {course.credits} CE
                credits
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-brand-600" />{" "}
              {course.lessons.length} lessons
            </span>
          </div>

          <div className="prose-content mt-8 text-ink-700">
            {course.description}
          </div>

          <h2 className="mt-10 text-xl font-bold text-ink-900">
            Course content
          </h2>
          <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
            {course.lessons.length === 0 && (
              <p className="p-5 text-sm text-ink-500">
                Lessons are being prepared for this course.
              </p>
            )}
            {course.lessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="flex items-center gap-3 bg-white p-4"
              >
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-ink-900">{lesson.title}</p>
                </div>
                <PlayCircle className="h-5 w-5 text-slate-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Enrollment card */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-3xl font-extrabold text-ink-900">
              {formatPrice(course.priceCents)}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Lifetime access · Certificate on completion
            </p>

            {isEnrolled ? (
              <Link
                href={`/learn/${course.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700"
              >
                <CheckCircle2 className="h-5 w-5" /> Go to course
              </Link>
            ) : isInstructor ? (
              <Link
                href={`/teacher/courses/${course.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-ink-700 hover:bg-slate-50"
              >
                Manage course
              </Link>
            ) : (
              <form action={enrollAction} className="mt-6">
                <input type="hidden" name="courseId" value={course.id} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700"
                >
                  {course.priceCents === 0 ? "Enroll for free" : "Enroll now"}
                </button>
                {!user && (
                  <p className="mt-3 text-center text-xs text-ink-500">
                    You&apos;ll be asked to log in or create an account.
                  </p>
                )}
              </form>
            )}

            <ul className="mt-6 space-y-2 text-sm text-ink-700">
              {[
                "Self-paced home study",
                "ARRT-aligned content",
                "Track your progress",
                "Instant certificate",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
