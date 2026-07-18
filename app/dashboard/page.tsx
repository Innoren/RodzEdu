import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpen, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");
  if (user.role === "TEACHER") redirect("/teacher");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        include: { _count: { select: { lessons: true } } },
      },
      progress: { where: { completed: true } },
    },
  });

  const totalCredits = enrollments.reduce((sum, e) => {
    const total = e.course._count.lessons;
    const done = e.progress.length;
    return sum + (total > 0 && done === total ? e.course.credits : 0);
  }, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-ink-900">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-ink-500">Continue your continuing education.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          label="Enrolled courses"
          value={enrollments.length}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Lessons completed"
          value={enrollments.reduce((s, e) => s + e.progress.length, 0)}
        />
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="CE credits earned"
          value={totalCredits}
        />
      </div>

      <h2 className="mt-10 text-xl font-bold text-ink-900">My courses</h2>

      {enrollments.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-ink-500">You haven&apos;t enrolled in any courses yet.</p>
          <Link
            href="/courses"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {enrollments.map((e) => {
            const total = e.course._count.lessons;
            const done = e.progress.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link
                key={e.id}
                href={`/learn/${e.course.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    {e.course.category}
                  </span>
                  <span className="text-sm text-ink-500">
                    {done}/{total} lessons
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-ink-900 group-hover:text-brand-700">
                  {e.course.title}
                </h3>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-brand-700">
                  {pct === 100 ? "Completed ✓" : `${pct}% complete`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-ink-900">{value}</p>
        <p className="text-sm text-ink-500">{label}</p>
      </div>
    </div>
  );
}
