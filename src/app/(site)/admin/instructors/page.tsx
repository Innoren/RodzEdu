import { requireUser } from "@/lib/auth";
import { listInstructors } from "@/lib/db";
import { PortalNav } from "@/components/PortalNav";
import { InstructorForm } from "@/components/InstructorForm";

export default async function InstructorsPage() {
  const user = await requireUser(["admin", "ceo"]);
  const instructors = await listInstructors();

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Instructors
          </h1>
          <p className="mt-3 mb-6 text-muted">
            Add instructors anytime. New teacher accounts can sign in and view
            assigned student progress.
          </p>
          <InstructorForm />
          <div className="mt-8 space-y-3">
            {instructors.map((instructor) => (
              <article key={instructor.id} className="panel p-4">
                <p className="font-semibold text-navy">{instructor.name}</p>
                <p className="text-sm text-muted">{instructor.email}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
