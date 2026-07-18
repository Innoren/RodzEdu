import Link from "next/link";
import {
  Award,
  Clock,
  ShieldCheck,
  Laptop,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { CourseCard } from "@/app/components/course-card";

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      instructor: { select: { name: true } },
      _count: { select: { lessons: true } },
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" /> Trusted CE since day one
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Quality radiology continuing education you can trust.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-50/90">
              Home-study courses for radiologic technologists in mammography,
              CT, MRI, ultrasound, bone densitometry, and more. Earn your
              ARRT-aligned CE credits online, on your schedule.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 shadow-sm hover:bg-brand-50"
              >
                Browse courses <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Create free account
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-brand-50/80">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                ))}
              </div>
              Loved by technologists nationwide
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
              <div className="rounded-xl bg-white p-6 text-ink-900 shadow-xl">
                <p className="text-sm font-semibold text-brand-600">
                  Your CE progress
                </p>
                <div className="mt-4 space-y-4">
                  {[
                    { name: "Mammography Positioning", pct: 100 },
                    { name: "CT Cross-Sectional Anatomy", pct: 60 },
                    { name: "MRI Safety Essentials", pct: 25 },
                  ].map((c) => (
                    <div key={c.name}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-ink-500">{c.pct}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-brand-600"
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 lg:grid-cols-4">
          {[
            { icon: Award, title: "ARRT-aligned", desc: "Category A CE credits" },
            { icon: Laptop, title: "100% online", desc: "Instant access, anywhere" },
            { icon: Clock, title: "Self-paced", desc: "Learn on your schedule" },
            {
              icon: CheckCircle2,
              title: "Track progress",
              desc: "Certificates on completion",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink-900">{f.title}</p>
                <p className="text-sm text-ink-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">
              Popular courses
            </h2>
            <p className="mt-1 text-ink-500">
              Continuing education across imaging specialties.
            </p>
          </div>
          <Link
            href="/courses"
            className="hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-ink-500">
            No courses published yet. Check back soon!
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard
                key={c.id}
                slug={c.slug}
                title={c.title}
                summary={c.summary}
                category={c.category}
                priceCents={c.priceCents}
                credits={c.credits}
                imageUrl={c.imageUrl}
                lessonCount={c._count.lessons}
                instructorName={c.instructor.name}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-brand-700">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center text-white">
          <h2 className="text-3xl font-bold">
            Ready to earn your next CE credits?
          </h2>
          <p className="max-w-xl text-brand-50/90">
            Join RodzEdu and get instant access to home-study courses built for
            imaging professionals.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
