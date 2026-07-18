import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { CourseForm } from "@/app/components/course-form";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/teacher/courses/new");
  if (user.role !== "TEACHER") redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/teacher"
        className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to studio
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-ink-900">Create a course</h1>
      <p className="mt-1 text-ink-500">
        You can add lessons after creating the course.
      </p>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CourseForm mode="create" error={error} />
      </div>
    </div>
  );
}
