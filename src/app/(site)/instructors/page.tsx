import Link from "next/link";
import { listInstructors } from "@/lib/db";

export const metadata = {
  title: "Instructors | RodzEdu",
  description:
    "Meet RodzEdu instructors — practicing imaging professionals focused on practical, evidence-based continuing education.",
};

export default async function InstructorsPage() {
  const instructors = await listInstructors();

  return (
    <section className="section">
      <div className="section-inner max-w-3xl">
        <p className="eyebrow">Our team</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-navy md:text-5xl">
          Instructors behind RodzEdu
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
          Courses are shaped by clinicians who train students and work in
          hospital and outpatient imaging settings.
        </p>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {instructors.map((instructor) => (
            <article key={instructor.id} className="py-8">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy md:text-3xl">
                {instructor.name}
              </h2>
              {instructor.credentials ? (
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-teal">
                  {instructor.credentials}
                </p>
              ) : null}
              {instructor.bio ? (
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {instructor.bio}
                </p>
              ) : (
                <p className="mt-4 text-muted">
                  RodzEdu instructor supporting student progress and course
                  quality.
                </p>
              )}
            </article>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/about" className="text-sm font-semibold text-teal hover:underline">
            Read the founder story →
          </Link>
        </div>
      </div>
    </section>
  );
}
