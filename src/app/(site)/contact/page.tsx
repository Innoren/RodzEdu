import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { ContactForm } from "@/components/ContactForm";

export const metadata = {
  title: "Contact Support | RodzEdu",
  description:
    "Contact RodzEdu for course questions, enrollment help, or certificate support during office hours.",
};

export default async function ContactPage() {
  const [settings, user] = await Promise.all([getSettings(), getSessionUser()]);

  return (
    <section className="section">
      <div className="section-inner grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <p className="eyebrow">We&apos;re here to help</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-navy md:text-5xl">
            Talk with RodzEdu before — or after — you enroll
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
            Unsure which course fits your renewal? Need help with an order or
            certificate? Send a support request or reach us during office hours.
          </p>
          <div className="mt-10 grid gap-6 border-y border-line py-8 text-sm md:text-base">
            {settings.phone ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                  Phone
                </p>
                <p className="mt-2 text-lg font-semibold text-navy">
                  {settings.phone}
                </p>
              </div>
            ) : null}
            {settings.email ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                  Email
                </p>
                <p className="mt-2 text-lg font-semibold text-navy">
                  {settings.email}
                </p>
              </div>
            ) : null}
            {settings.address ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                  Address
                </p>
                <p className="mt-2 text-navy">{settings.address}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                Hours
              </p>
              <p className="mt-2 text-navy">9am–5pm EST, Monday through Friday</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted">
            We do not store financial information on this website. Prefer
            self-serve answers first? Visit the{" "}
            <Link href="/faq" className="font-semibold text-teal hover:underline">
              FAQ
            </Link>
            .
          </p>
        </div>
        <div className="panel p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
            Send a support request
          </h2>
          <p className="mt-2 mb-5 text-sm text-muted">
            Messages create an internal ticket for our team.
          </p>
          <ContactForm
            defaultName={user?.name}
            defaultEmail={user?.email}
          />
        </div>
      </div>
    </section>
  );
}
