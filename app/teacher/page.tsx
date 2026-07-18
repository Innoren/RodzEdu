import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Users,
  BookOpen,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/teacher");
  if (user.role !== "TEACHER") redirect("/dashboard");

  const courses = await prisma.course.findMany({
    where: { instructorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { lessons: true, enrollments: true } },
    },
  });

  const totalStudents = await prisma.enrollment.count({
    where: { course: { instructorId: user.id }, status: "ACTIVE" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Instructor studio</h1>
          <p className="text-ink-500">
            Manage your courses and track student progress.
          </p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New course
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={<BookOpen className="h-5 w-5" />} label="Courses" value={courses.length} />
        <Stat
          icon={<Users className="h-5 w-5" />}
          label="Active students"
          value={totalStudents}
        />
        <Stat
          icon={<BookOpen className="h-5 w-5" />}
          label="Total lessons"
          value={courses.reduce((s, c) => s + c._count.lessons, 0)}
        />
      </div>

      <h2 className="mt-10 text-xl font-bold text-ink-900">Your courses</h2>

      {courses.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-ink-500">
            You haven&apos;t created any courses yet.
          </p>
          <Link
            href="/teacher/courses/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Create your first course
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-ink-500">
              <tr>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Lessons</th>
                <th className="px-5 py-3 font-medium">Students</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{c.title}</p>
                    <p className="text-xs text-ink-500">{c.category}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-700">
                    {formatPrice(c.priceCents)}
                  </td>
                  <td className="px-5 py-3 text-ink-700">{c._count.lessons}</td>
                  <td className="px-5 py-3 text-ink-700">
                    {c._count.enrollments}
                  </td>
                  <td className="px-5 py-3">
                    {c.published ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <Eye className="h-3 w-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-ink-500">
                        <EyeOff className="h-3 w-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/teacher/courses/${c.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-slate-100"
                    >
                      <Pencil className="h-3 w-3" /> Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
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
