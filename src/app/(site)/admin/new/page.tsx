import { requireUser } from "@/lib/auth";
import { PortalNav } from "@/components/PortalNav";
import { CourseUploadForm } from "@/components/CourseUploadForm";

export default async function AdminNewCoursePage() {
  const user = await requireUser(["admin", "ceo"]);

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Upload a course
          </h1>
          <p className="mt-3 mb-6 text-muted">
            Add title, pricing, content, and exam questions. Publish when ready
            for students to enroll.
          </p>
          <CourseUploadForm />
        </div>
      </div>
    </section>
  );
}
