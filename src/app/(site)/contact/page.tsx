import { getSettings } from "@/lib/db";

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <section className="section">
      <div className="section-inner max-w-3xl">
        <p className="eyebrow">We&apos;re here to help</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-navy md:text-5xl">
          Talk with RodzEdu before — or after — you enroll
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
          Unsure which course fits your renewal? Need help with an order or
          certificate? Reach a real person during office hours.
        </p>
        <div className="mt-10 grid gap-6 border-y border-line py-8 text-sm md:grid-cols-2 md:text-base">
          {settings.phone ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                Phone
              </p>
              <p className="mt-2 text-lg font-semibold text-navy">{settings.phone}</p>
            </div>
          ) : null}
          {settings.email ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                Email
              </p>
              <p className="mt-2 text-lg font-semibold text-navy">{settings.email}</p>
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
          We do not store financial information on this website. If payment
          verification is needed, we contact you using the phone number on your order.
        </p>
      </div>
    </section>
  );
}
