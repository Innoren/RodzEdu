import Link from "next/link";
import { prisma } from "@/lib/db";
import { CourseCard } from "@/app/components/course-card";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { lessons: true } },
    },
  });

  const categories = Array.from(
    new Set(
      (
        await prisma.course.findMany({
          where: { published: true },
          select: { category: true },
        })
      ).map((c) => c.category),
    ),
  ).sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-ink-900">Course catalog</h1>
        <p className="text-ink-500">
          Continuing education courses for imaging professionals.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/courses"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !category
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-ink-700 hover:bg-slate-200"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/courses?category=${encodeURIComponent(c)}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                category === c
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-ink-700 hover:bg-slate-200"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-ink-500">
          No courses found{category ? ` in “${category}”` : ""}.
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
    </div>
  );
}
