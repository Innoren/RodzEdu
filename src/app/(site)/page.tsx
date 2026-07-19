import Link from "next/link";
import { listPublishedCourses, getSettings } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { OpenCeoConsole } from "@/components/OpenCeoConsole";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const [courses, settings, user] = await Promise.all([
    listPublishedCourses(),
    getSettings(),
    getSessionUser(),
  ]);

  return (
    <>
      {settings.announcement && (
        <div className="bg-teal px-5 py-2 text-center text-sm font-medium text-white">
          {settings.announcement}
        </div>
      )}

      <section className="hero-plane">
        <div className="relative z-10 w-full px-5 pb-16 pt-28 md:pb-24">
          <div className="mx-auto w-full max-w-[1120px]">
            <p className="rise-in font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight text-white md:text-7xl lg:text-8xl">
              RodzEdu
            </p>
            <h1 className="rise-in-delay mt-5 max-w-2xl font-[family-name:var(--font-display)] text-2xl font-medium leading-snug text-white/95 md:text-3xl">
              Providing quality radiography continuing education you can trust.
            </h1>
            <p className="rise-in-delay-2 mt-4 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
              Homestudy CE for radiologic technologists and imaging
              professionals — radiology first, expanding across healthcare from
              here.
            </p>
            <div className="rise-in-delay-2 mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="btn btn-primary">
                Choose Your Courses
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Student Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="section-inner grid gap-6 px-5 py-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-navy">Have a question?</p>
            <p className="mt-1 text-sm text-muted">
              Want to order by phone? Staff is here to help.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Office hours</p>
            <p className="mt-1 text-sm text-muted">9am–5pm EST · Monday–Friday</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">{settings.phone}</p>
            <p className="mt-1 text-sm text-muted">{settings.email}</p>
          </div>
        </div>
      </section>

      <section className="section" id="acceptances">
        <div className="section-inner">
          <p className="eyebrow">Accepted for certification & registration</p>
          <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
            Category A CE designed for imaging professionals
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            RodzEdu courses are built for radiologic technologists, limited
            radiographers, and specialists in mammography, CT, MRI, ultrasound,
            and bone densitometry. Start with radiology. Grow from there.
          </p>
        </div>
      </section>

      <section className="section bg-white" id="courses">
        <div className="section-inner">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Course catalog</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
                Radiology CE to get you started
              </h2>
            </div>
            <Link href="/courses" className="btn btn-navy !py-2 text-sm">
              View all courses
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {courses.slice(0, 3).map((course) => (
              <article key={course.id} className="panel p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                  {course.category}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-navy">
                  {course.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {course.description}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-navy">
                    {course.credits} CE credits
                  </span>
                  <span className="font-semibold text-accent">
                    {formatMoney(course.priceCents)}
                  </span>
                </div>
                <Link
                  href={`/courses/${course.slug}`}
                  className="btn btn-ghost mt-5 w-full !py-2 text-sm"
                >
                  View & Enroll
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="section-inner">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy md:text-4xl">
            Order, study, and test online
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Choose & pay for your class",
                body: "Browse radiology CE, checkout securely, and unlock your course materials immediately.",
              },
              {
                title: "Track progress in your portal",
                body: "Students see module completion. Teachers review every assigned learner in one place.",
              },
              {
                title: "Take your exam in a focused window",
                body: "When you’re ready, open a dedicated exam window — no portal clutter, just your test.",
              },
            ].map((item, index) => (
              <div key={item.title} className="panel p-5">
                <p className="font-[family-name:var(--font-display)] text-4xl text-teal/40">
                  0{index + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-navy">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-navy text-white">
        <div className="section-inner grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-bright">
              Built for every role
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl md:text-4xl">
              Students learn. Teachers monitor. Admins publish. The CEO steers.
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              Role-based portals keep continuing education organized — including
              a separate CEO management console for company-wide oversight.
            </p>
          </div>
          <div className="panel bg-white/5 p-5 text-sm text-white/85">
            <p className="font-semibold text-white">Demo portals</p>
            <ul className="mt-3 space-y-2">
              <li>Student: student@rodzedu.com / student123</li>
              <li>Teacher: teacher@rodzedu.com / teacher123</li>
              <li>Admin: admin@rodzedu.com / admin123</li>
              <li>CEO: ceo@rodzedu.com / ceo123</li>
            </ul>
            {user?.role === "ceo" ? (
              <div className="mt-5">
                <OpenCeoConsole />
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary mt-5">
                Log in to a portal
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
