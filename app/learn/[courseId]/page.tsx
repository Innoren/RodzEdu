import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, Award, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { toggleLessonAction } from "@/app/actions/courses";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string; enrolled?: string }>;
}) {
  const { courseId } = await params;
  const { lesson: lessonParam, enrolled } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/learn/${courseId}`);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!course) redirect("/dashboard");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    include: { progress: true },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") {
    redirect(`/courses/${course.slug}`);
  }

  const completedIds = new Set(
    enrollment.progress.filter((p) => p.completed).map((p) => p.lessonId),
  );

  const activeLesson =
    course.lessons.find((l) => l.id === lessonParam) ?? course.lessons[0];

  const doneCount = completedIds.size;
  const total = course.lessons.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const courseComplete = total > 0 && doneCount === total;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {enrolled && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          You&apos;re enrolled! Work through the lessons below to earn your CE
          credits.
        </div>
      )}

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my learning
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-ink-900">{course.title}</h2>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-brand-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-ink-500">
              {doneCount}/{total} lessons · {pct}%
            </p>

            <nav className="mt-4 space-y-1">
              {course.lessons.map((lesson, idx) => {
                const isActive = lesson.id === activeLesson?.id;
                const isDone = completedIds.has(lesson.id);
                return (
                  <Link
                    key={lesson.id}
                    href={`/learn/${courseId}?lesson=${lesson.id}`}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      isActive
                        ? "bg-brand-50 font-medium text-brand-700"
                        : "text-ink-700 hover:bg-slate-50"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 flex-none text-brand-600" />
                    ) : (
                      <Circle className="h-4 w-4 flex-none text-slate-300" />
                    )}
                    <span className="flex-1">
                      {idx + 1}. {lesson.title}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {courseComplete && (
              <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4 text-center">
                <Award className="mx-auto h-8 w-8 text-brand-600" />
                <p className="mt-2 text-sm font-semibold text-brand-800">
                  Course complete!
                </p>
                <p className="text-xs text-brand-700">
                  {course.credits} CE credits earned
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Lesson content */}
        <section className="lg:col-span-2">
          {activeLesson ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium text-brand-600">
                Lesson{" "}
                {course.lessons.findIndex((l) => l.id === activeLesson.id) + 1}{" "}
                of {total}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-ink-900">
                {activeLesson.title}
              </h1>
              <div className="prose-content mt-6 text-ink-700">
                {activeLesson.content}
              </div>

              <form
                action={toggleLessonAction}
                className="mt-8 border-t border-slate-100 pt-6"
              >
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="lessonId" value={activeLesson.id} />
                <input
                  type="hidden"
                  name="completed"
                  value={completedIds.has(activeLesson.id) ? "false" : "true"}
                />
                <button
                  type="submit"
                  className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold ${
                    completedIds.has(activeLesson.id)
                      ? "border border-slate-300 text-ink-700 hover:bg-slate-50"
                      : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  {completedIds.has(activeLesson.id) ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-brand-600" /> Completed —
                      mark as incomplete
                    </>
                  ) : (
                    <>
                      <Circle className="h-5 w-5" /> Mark lesson complete
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-ink-500">
              This course doesn&apos;t have any lessons yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
