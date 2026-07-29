import Link from "next/link";

export const metadata = {
  title: "Trust & CE Standards | RodzEdu",
  description:
    "How RodzEdu approaches continuing education quality, support, certificates, and professional responsibility for imaging technologists.",
};

export default function TrustPage() {
  return (
    <>
      <section className="section">
        <div className="section-inner max-w-3xl">
          <p className="eyebrow">Trust & standards</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-navy md:text-5xl">
            Education built for licensed imaging professionals
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
            RodzEdu exists to make continuing education clear, practical, and
            accountable — with real support when something goes wrong.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="section-inner max-w-3xl space-y-10">
          {[
            {
              title: "Evidence-based course design",
              body: "Courses combine current professional guidelines with lessons from clinical practice — so CE time strengthens judgment on the floor, not just checkbox hours.",
            },
            {
              title: "Transparent enrollment",
              body: "Credits, pricing, modules, and exam expectations are visible before you enroll. Discount codes and bundles are applied clearly at checkout.",
            },
            {
              title: "Verified completion path",
              body: "Progress is saved module by module. Final exams require a passing score before a certificate is issued automatically with a unique certificate number.",
            },
            {
              title: "Human support",
              body: "Reach RodzEdu during office hours by phone or email, or open a support ticket from the contact form — including course-specific help from your student portal.",
            },
          ].map((item) => (
            <div key={item.title} className="border-b border-line pb-8 last:border-0">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
                {item.title}
              </h2>
              <p className="mt-3 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner max-w-3xl">
          <p className="text-sm text-muted">
            ARRT® is a registered trademark of The American Registry of
            Radiologic Technologists®. RodzEdu is not affiliated with or
            endorsed by ARRT®. Always confirm CE acceptance with your
            credentialing body or state board.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="btn btn-primary">
              Browse courses
            </Link>
            <Link href="/about" className="btn btn-ghost">
              About the founder
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
