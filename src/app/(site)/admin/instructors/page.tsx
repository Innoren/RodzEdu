import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listInstructors } from "@/lib/db";
import { PortalNav } from "@/components/PortalNav";
import { InstructorForm } from "@/components/InstructorForm";
import { InstructorProfileForm } from "@/components/InstructorProfileForm";

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
            Add instructors and edit public bios shown on the instructors page
            and course detail pages.
          </p>
          <p className="mb-6 text-sm">
            <Link href="/instructors" className="font-semibold text-teal hover:underline">
              View public instructors page →
            </Link>
          </p>
          <InstructorForm />
          <div className="mt-8 space-y-3">
            {instructors.map((instructor) => (
              <article key={instructor.id} className="panel p-4">
                <p className="font-semibold text-navy">{instructor.name}</p>
                <p className="text-sm text-muted">{instructor.email}</p>
                {instructor.credentials ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                    {instructor.credentials}
                  </p>
                ) : null}
                <InstructorProfileForm instructor={instructor} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
