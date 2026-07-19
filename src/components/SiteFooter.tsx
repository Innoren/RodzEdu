import Link from "next/link";
import { getSettings } from "@/lib/db";

export async function SiteFooter() {
  const settings = await getSettings();

  return (
    <footer className="mt-auto border-t border-line bg-navy-deep text-white">
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl">RodzEdu</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
            Homestudy continuing education for radiologic technologists and
            imaging professionals — with more healthcare specialties coming soon.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-bright">
            Quick Links
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
            <Link href="/courses">Course Catalog</Link>
            <Link href="/login">Student Login</Link>
            <Link href="/contact">Contact Us</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-bright">
            Contact
          </p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            <p>{settings.phone}</p>
            <p>{settings.email}</p>
            <p>{settings.address}</p>
            <p>Office hours: 9am–5pm EST, Mon–Fri</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/55">
        © {new Date().getFullYear()} RodzEdu. All rights reserved. ARRT® is a
        registered trademark of The American Registry of Radiologic
        Technologists®. RodzEdu is not affiliated with or endorsed by ARRT®.
      </div>
    </footer>
  );
}
