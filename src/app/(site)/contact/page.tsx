import { getSettings } from "@/lib/db";

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <section className="section">
      <div className="section-inner max-w-3xl">
        <p className="eyebrow">We&apos;re here to help</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
          Contact RodzEdu
        </h1>
        <p className="mt-4 text-muted">
          Questions about ordering, certificates, or state CE requirements?
          Reach our team during office hours.
        </p>
        <div className="panel mt-8 grid gap-4 p-6 text-sm md:grid-cols-2">
          <div>
            <p className="font-semibold text-navy">Phone</p>
            <p className="mt-1 text-muted">{settings.phone}</p>
          </div>
          <div>
            <p className="font-semibold text-navy">Email</p>
            <p className="mt-1 text-muted">{settings.email}</p>
          </div>
          <div>
            <p className="font-semibold text-navy">Address</p>
            <p className="mt-1 text-muted">{settings.address}</p>
          </div>
          <div>
            <p className="font-semibold text-navy">Hours</p>
            <p className="mt-1 text-muted">9am–5pm EST, Monday through Friday</p>
          </div>
        </div>
      </div>
    </section>
  );
}
