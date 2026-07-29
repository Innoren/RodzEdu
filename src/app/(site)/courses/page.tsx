import Link from "next/link";
import {
  getCourseRating,
  getSettings,
  listPublishedBundles,
  listPublishedCourses,
} from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { CatalogFilters } from "@/components/CatalogFilters";

export const metadata = {
  title: "CE Course Catalog | RodzEdu",
  description:
    "Browse radiology continuing education by modality, credits, and price. Homestudy CE with online exams and downloadable certificates.",
};

export default async function CoursesPage() {
  const [courses, bundles, settings] = await Promise.all([
    listPublishedCourses(),
    listPublishedBundles(),
    getSettings(),
  ]);

  const coursesWithRatings = await Promise.all(
    courses.map(async (course) => {
      const rating = await getCourseRating(course.id);
      return {
        ...course,
        averageRating: rating.average,
        reviewCount: rating.count,
      };
    }),
  );

  return (
    <section className="section">
      <div className="section-inner">
        <p className="eyebrow">Course catalog</p>
        <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight text-navy md:text-5xl">
          Homestudy CE with clear credits, clear pricing, and a clear exam path
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Filter by modality, credits, or price. Featured courses and student
          ratings help you choose CE that fits your renewal.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink/75">
          {settings.phone ? <p>Questions? {settings.phone}</p> : null}
          {settings.email ? <p>{settings.email}</p> : null}
          <p>Office hours 9am–5pm EST, Mon–Fri</p>
        </div>

        {bundles.length > 0 && (
          <div className="mt-12">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              Course bundles
            </h2>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {bundles.map((bundle) => (
                <article
                  key={bundle.id}
                  className="grid gap-5 py-7 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                      Bundle · {bundle.courseIds.length} courses
                    </p>
                    <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-navy">
                      {bundle.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
                      {bundle.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 md:flex-col md:items-end">
                    <p className="text-2xl font-semibold text-navy">
                      {formatMoney(bundle.priceCents)}
                    </p>
                    <Link
                      href={`/bundles/${bundle.slug}`}
                      className="btn btn-primary !px-4 !py-2.5 text-sm"
                    >
                      View bundle
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <CatalogFilters courses={coursesWithRatings} />
      </div>
    </section>
  );
}
