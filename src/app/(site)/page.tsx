import Link from "next/link";
import { connection } from "next/server";
import {
  getSettings,
  listFeaturedCourses,
  listPublishedTestimonials,
} from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function HomePage() {
  // Opt into a fresh request so Office Hours / contact details stay live.
  await connection();
  const [courses, settings, testimonials] = await Promise.all([
    listFeaturedCourses(),
    getSettings(),
    listPublishedTestimonials(),
  ]);

  return (
    <>
      {settings.announcement && (
        <div className="border-b border-teal/20 bg-[#0e3348] px-5 py-2.5 text-center text-sm text-white/90">
          {settings.announcement}
        </div>
      )}

      <section className="hero-plane">
        <div className="relative z-10 w-full px-5 pb-16 pt-28 md:pb-24">
          <div className="mx-auto w-full max-w-[1120px]">
            <p className="rise-in font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight text-white md:text-7xl lg:text-8xl">
              RodzEdu
            </p>
            <h1 className="rise-in-delay mt-6 max-w-2xl font-[family-name:var(--font-display)] text-2xl font-medium leading-snug text-white/95 md:text-[2rem]">
              Continuing education imaging professionals can trust.
            </h1>
            <p className="rise-in-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/78 md:text-lg">
              Clear courses. Credible credits. Support when you need it —
              so your CE investment is time well spent.
            </p>
            <div className="rise-in-delay-2 mt-9 flex flex-wrap gap-3">
              <Link href="/courses" className="btn btn-primary">
                Browse CE courses
              </Link>
              <Link href="/contact" className="btn btn-secondary">
                Talk with our team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-band">
        <div className="section-inner grid gap-8 px-5 py-7 md:grid-cols-3 md:gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
              Real people, real help
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              Questions about an order or certificate? Reach us during office
              hours — we&apos;re here to help.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
              Office hours
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              Monday–Friday · 9am–5pm EST
              {settings.phone ? (
                <>
                  <br />
                  {settings.phone}
                </>
              ) : null}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
              Built for working techs
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              Study around your shifts. Complete modules online. Take your exam
              when you&apos;re ready.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="acceptances">
        <div className="section-inner grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <p className="eyebrow">Why techs choose RodzEdu</p>
            <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl leading-tight text-navy md:text-[2.75rem]">
              Education that respects your license — and your time.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              Every course is written for practicing radiologic technologists and
              imaging specialists. You get focused content, a clear exam path, and
              CE credit that supports ARRT® certification and registration
              requirements accepted by most state licensing agencies.
            </p>
          </div>
          <div className="assurance-list">
            {[
              "Category A / A+ style CE credit focus",
              "Homestudy format you can finish on your schedule",
              "Online testing with immediate result feedback",
              "Direct support if something goes wrong with your order",
            ].map((item) => (
              <p key={item} className="assurance-item">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white" id="courses">
        <div className="section-inner">
          <div className="max-w-2xl">
            <p className="eyebrow">Featured courses</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
              Radiology CE worth the enrollment
            </h2>
            <p className="mt-4 text-muted">
              Practical, exam-ready courses for radiography, mammography, CT, and
              related imaging specialties — priced clearly, no surprises.
            </p>
          </div>

          <div className="mt-10 divide-y divide-line border-y border-line">
            {courses.map((course) => (
              <article
                key={course.id}
                className="grid gap-4 py-7 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                    {course.featured ? "Featured · " : ""}
                    {course.category} · {course.credits} CE credits
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-navy md:text-[1.75rem]">
                    {course.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                    {course.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 md:flex-col md:items-end md:gap-3">
                  <p className="text-xl font-semibold text-navy">
                    {formatMoney(course.priceCents)}
                  </p>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="btn btn-navy !px-4 !py-2.5 text-sm"
                  >
                    View course
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/courses" className="text-sm font-semibold text-teal hover:underline">
              View the full catalog →
            </Link>
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="section" id="testimonials">
          <div className="section-inner">
            <p className="eyebrow">From the imaging floor</p>
            <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
              What technologists say about RodzEdu
            </h2>
            <div className="mt-10 divide-y divide-line border-y border-line">
              {testimonials.map((item) => (
                <blockquote key={item.id} className="py-7">
                  <p className="max-w-3xl text-lg leading-relaxed text-ink/90">
                    “{item.quote}”
                  </p>
                  <footer className="mt-3 text-sm text-muted">
                    <span className="font-semibold text-navy">{item.name}</span>
                    {item.credentials ? ` · ${item.credentials}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" id="how-it-works">
        <div className="section-inner">
          <p className="eyebrow">A straightforward process</p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
            Enroll with confidence. Finish with clarity.
          </h2>
          <ol className="mt-10 grid gap-0 border-t border-line md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Select your course",
                body: "See credits, content focus, and price up front — then enroll when it fits your renewal timeline.",
              },
              {
                step: "02",
                title: "Study on your schedule",
                body: "Work through modules online at your own pace. Progress saves so you can return after a shift.",
              },
              {
                step: "03",
                title: "Complete your exam",
                body: "Take the CE exam in a focused testing view and confirm completion when you pass.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="border-b border-line px-0 py-8 md:border-b-0 md:border-r md:px-6 md:py-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
              >
                <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.18em] text-teal">
                  {item.step}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-navy">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section bg-white">
        <div className="section-inner grid gap-10 md:grid-cols-[1fr_1fr] md:items-center">
          <div>
            <p className="eyebrow">Your investment, protected by support</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
              We treat CE purchases like professional commitments — because they are.
            </h2>
          </div>
          <div className="space-y-5 text-sm leading-relaxed text-muted md:text-base">
            <p>
              You&apos;re not buying a random PDF. You&apos;re paying for structured
              continuing education, a clear exam path, and a team that can help if
              access, certificates, or order questions come up.
            </p>
            <p>
              {settings.phone ? (
                <>
                  Prefer to order by phone? Call{" "}
                  <span className="font-semibold text-navy">{settings.phone}</span>
                  {settings.email ? (
                    <>
                      {" "}
                      or email{" "}
                      <span className="font-semibold text-navy">
                        {settings.email}
                      </span>
                    </>
                  ) : null}
                  .
                </>
              ) : settings.email ? (
                <>
                  Prefer to reach us by email? Write{" "}
                  <span className="font-semibold text-navy">{settings.email}</span>.
                </>
              ) : (
                <>Prefer to talk before you enroll? Use the contact page.</>
              )}
            </p>
            <Link href="/contact" className="btn btn-ghost !px-4 !py-2.5 text-sm">
              Contact RodzEdu
            </Link>
          </div>
        </div>
      </section>

      <section className="section bg-navy text-white">
        <div className="section-inner max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-bright">
            Start with a course that fits
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight md:text-4xl">
            Choose radiology CE you can stand behind when renewal season arrives.
          </h2>
          <p className="mt-4 max-w-xl text-white/75">
            Browse the catalog, enroll online, and keep your credentials moving
            forward with education built for the imaging floor — not filler hours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="btn btn-primary">
              Explore courses
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Return to my courses
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
