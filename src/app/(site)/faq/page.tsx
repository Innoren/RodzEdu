import Link from "next/link";
import { listFaqs } from "@/lib/db";

export const metadata = {
  title: "FAQ | RodzEdu",
  description:
    "Frequently asked questions about RodzEdu continuing education, certificates, progress, and support.",
};

export default async function FaqPage() {
  const faqs = await listFaqs();

  return (
    <section className="section">
      <div className="section-inner max-w-3xl">
        <p className="eyebrow">Help center</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-navy md:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
          Quick answers about enrollment, progress, exams, and certificates. Still
          stuck?{" "}
          <Link href="/contact" className="font-semibold text-teal hover:underline">
            Contact support
          </Link>
          .
        </p>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {faqs.map((faq) => (
            <details key={faq.id} className="group py-5">
              <summary className="cursor-pointer list-none font-[family-name:var(--font-display)] text-xl text-navy marker:content-none">
                <span className="flex items-start justify-between gap-4">
                  {faq.question}
                  <span className="text-teal group-open:rotate-45 transition">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
