import { requireUser } from "@/lib/auth";
import { PortalNav } from "@/components/PortalNav";
import { CourseUploadForm } from "@/components/CourseUploadForm";
import { CourseDocumentUploadForm } from "@/components/CourseDocumentUploadForm";

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
            Create a course from your Word workbook + final exam. Word lesson
            formatting is applied by default, or enter everything manually
            below.
          </p>

          <CourseDocumentUploadForm />

          <div className="my-10 border-t border-line pt-10">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              Or enter a course manually
            </h2>
            <p className="mt-2 mb-6 text-sm text-muted">
              Use this form when you want to type or paste content yourself.
            </p>
            <CourseUploadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
