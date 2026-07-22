import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAllCourses, listBundles } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";
import { BundleForm } from "@/components/BundleForm";

export default async function BundlesAdminPage() {
  const user = await requireUser(["admin", "ceo"]);
  const [courses, bundles] = await Promise.all([
    listAllCourses(),
    listBundles(),
  ]);

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Course bundles
          </h1>
          <p className="mt-3 mb-6 text-muted">
            Package multiple courses at a bundle price. Students enroll in every
            course in the package at checkout.
          </p>
          <BundleForm courses={courses} />
          <div className="mt-8 space-y-3">
            {bundles.map((bundle) => (
              <article key={bundle.id} className="panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{bundle.title}</p>
                    <p className="text-sm text-muted">
                      {bundle.courseIds.length} courses ·{" "}
                      {formatMoney(bundle.priceCents)}
                      {bundle.published ? " · Live" : " · Draft"}
                    </p>
                  </div>
                  {bundle.published ? (
                    <Link
                      href={`/bundles/${bundle.slug}`}
                      className="btn btn-ghost !px-3 !py-2 text-sm"
                    >
                      View
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
