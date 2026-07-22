import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCertificateById, getSettings } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["student", "admin", "ceo", "teacher"]);
  const { id } = await params;
  const [certificate, settings] = await Promise.all([
    getCertificateById(id),
    getSettings(),
  ]);

  if (!certificate) notFound();
  if (user.role === "student" && certificate.userId !== user.id) notFound();

  return (
    <section className="section">
      <div className="section-inner max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/student" className="text-sm font-semibold text-teal">
            ← Back to portal
          </Link>
          <PrintButton />
        </div>

        <article className="border-2 border-navy bg-white px-8 py-12 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            {settings.companyName || "RodzEdu"}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-navy md:text-5xl">
            Certificate of Completion
          </h1>
          <p className="mt-6 text-muted">This certifies that</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy">
            {certificate.studentName}
          </p>
          <p className="mt-6 text-muted">
            has successfully completed the continuing education course
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl text-navy">
            {certificate.courseTitle}
          </p>
          <p className="mt-6 text-base text-ink/85">
            {certificate.credits} CE credits · Exam score {certificate.score}%
          </p>
          <p className="mt-8 text-sm text-muted">
            Issued {formatDate(certificate.issuedAt)} · Certificate{" "}
            {certificate.certificateNumber}
          </p>
          <p className="mt-10 text-xs text-muted">
            {settings.companyName || "RodzEdu"} · {settings.address}
            {settings.email ? ` · ${settings.email}` : ""}
          </p>
        </article>
      </div>
    </section>
  );
}
