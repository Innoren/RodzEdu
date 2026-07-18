import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Users, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { CourseForm } from "@/app/components/course-form";
import { addLessonAction, deleteLessonAction } from "@/app/actions/courses";
import { formatDate } from "@/lib/format";

export default async function ManageCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; lesson?: string }>;
}) {
  const { id } = await params;
  const { error, saved, lesson } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/teacher/courses/${id}`);
  if (user.role !== "TEACHER") redirect("/dashboard");

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: { order: "asc" } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          user: { select: { name: true, email: true } },
          progress: { where: { completed: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!course) notFound();
  if (course.instructorId !== user.id) redirect("/teacher");

  const lessonTotal = course.lessons.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/teacher"
        className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to studio
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-ink-900">{course.title}</h1>
        <Link
          href={`/courses/${course.slug}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-slate-50"
        >
          View public page
        </Link>
      </div>

      {saved && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Course saved.
        </div>
      )}
      {lesson === "added" && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Lesson added.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Left: details + lessons */}
        <div className="space-y-8 lg:col-span-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink-900">Course details</h2>
            <div className="mt-4">
              <CourseForm
                mode="edit"
                error={error}
                course={{
                  id: course.id,
                  title: course.title,
                  summary: course.summary,
                  description: course.description,
                  category: course.category,
                  imageUrl: course.imageUrl,
                  priceCents: course.priceCents,
                  credits: course.credits,
                  published: course.published,
                }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink-900">
              Lessons ({lessonTotal})
            </h2>

            <div className="mt-4 space-y-2">
              {course.lessons.map((l, idx) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-sm font-medium text-ink-900">
                    {l.title}
                  </p>
                  <form action={deleteLessonAction}>
                    <input type="hidden" name="lessonId" value={l.id} />
                    <input type="hidden" name="courseId" value={course.id} />
                    <button
                      type="submit"
                      className="rounded-md p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete lesson"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
              {lessonTotal === 0 && (
                <p className="text-sm text-ink-500">No lessons yet. Add one below.</p>
              )}
            </div>

            <form
              action={addLessonAction}
              className="mt-6 space-y-3 border-t border-slate-100 pt-6"
            >
              <input type="hidden" name="courseId" value={course.id} />
              <h3 className="font-semibold text-ink-900">Add a lesson</h3>
              <input
                name="title"
                required
                placeholder="Lesson title"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
              <textarea
                name="content"
                required
                rows={5}
                placeholder="Lesson content / study material…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" /> Add lesson
              </button>
            </form>
          </section>
        </div>

        {/* Right: enrolled students & progress */}
        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
              <Users className="h-5 w-5 text-brand-600" /> Students (
              {course.enrollments.length})
            </h2>

            {course.enrollments.length === 0 ? (
              <p className="mt-4 text-sm text-ink-500">
                No students enrolled yet.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {course.enrollments.map((e) => {
                  const done = e.progress.length;
                  const pct =
                    lessonTotal > 0
                      ? Math.round((done / lessonTotal) * 100)
                      : 0;
                  return (
                    <div key={e.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-ink-900">
                            {e.user.name}
                          </p>
                          <p className="text-xs text-ink-500">{e.user.email}</p>
                        </div>
                        {pct === 100 && (
                          <CheckCircle2 className="h-5 w-5 text-brand-600" />
                        )}
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-brand-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-ink-500">
                        {done}/{lessonTotal} lessons · {pct}% · enrolled{" "}
                        {formatDate(e.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
