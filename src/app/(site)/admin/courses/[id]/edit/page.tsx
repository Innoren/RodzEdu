import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCourseById } from "@/lib/db";
import { PortalNav } from "@/components/PortalNav";
import { CourseEditForm } from "@/components/CourseEditForm";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["admin", "ceo"]);
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <Link href="/admin" className="text-sm font-semibold text-teal">
            ← Back to course manager
          </Link>
          <p className="eyebrow mt-5">Admin portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Edit course
          </h1>
          <p className="mt-3 mb-6 text-muted">
            Update catalog details, publishing options, and the final exam for{" "}
            <strong>{course.title}</strong>.
          </p>
          <CourseEditForm course={course} />
        </div>
      </div>
    </section>
  );
}
