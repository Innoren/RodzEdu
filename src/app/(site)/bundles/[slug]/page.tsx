import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  getBundleBySlug,
  getCourseById,
  listEnrollmentsForUser,
} from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bundle = await getBundleBySlug(slug);
  if (!bundle || !bundle.published) notFound();

  const user = await getSessionUser();
  const courses = (
    await Promise.all(bundle.courseIds.map((id) => getCourseById(id)))
  ).filter(Boolean);
  const enrollments =
    user?.role === "student" ? await listEnrollmentsForUser(user.id) : [];
  const alreadyOwnsAll = courses.every((course) =>
    enrollments.some((e) => e.courseId === course!.id),
  );

  return (
    <section className="section">
      <div className="section-inner grid gap-10 md:grid-cols-[1.35fr_0.75fr]">
        <div>
          <Link href="/courses" className="text-sm font-semibold text-teal">
            ← Back to catalog
          </Link>
          <p className="eyebrow mt-5">Course bundle</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-navy md:text-5xl">
            {bundle.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{bundle.description}</p>
          <ul className="mt-8 space-y-3 border-y border-line py-6">
            {courses.map((course) =>
              course ? (
                <li key={course.id} className="flex justify-between gap-4 text-sm md:text-base">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="font-semibold text-navy hover:text-teal"
                  >
                    {course.title}
                  </Link>
                  <span className="text-muted">
                    {course.credits} CE · {formatMoney(course.priceCents)}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        </div>
        <aside className="h-fit border border-line bg-white p-6 md:sticky md:top-24">
          <p className="text-sm font-medium text-muted">Bundle price</p>
          <p className="mt-1 text-4xl font-semibold text-navy">
            {formatMoney(bundle.priceCents)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Includes {courses.length} courses · Discount codes supported
          </p>
          {alreadyOwnsAll ? (
            <Link href="/student" className="btn btn-navy mt-6 w-full">
              Continue in my account
            </Link>
          ) : (
            <div className="mt-6 space-y-3">
              <AddToCartButton
                item={{
                  kind: "bundle",
                  id: bundle.id,
                  title: bundle.title,
                  slug: bundle.slug,
                  priceCents: bundle.priceCents,
                  detail: `${courses.length} courses · Discount codes supported`,
                }}
              />
              {user?.role === "student" ? (
                <CheckoutForm bundleId={bundle.id} />
              ) : (
                <Link
                  href={`/login?next=/bundles/${bundle.slug}`}
                  className="btn btn-primary w-full"
                >
                  Sign in to enroll
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
