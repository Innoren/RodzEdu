import Link from "next/link";
import { getSessionUser, dashboardPathForRole } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-[#f8fbfd]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-navy">
          RodzEdu
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/85 md:flex">
          <Link href="/courses" className="hover:text-teal">
            Courses
          </Link>
          <Link href="/#how-it-works" className="hover:text-teal">
            How It Works
          </Link>
          <Link href="/#acceptances" className="hover:text-teal">
            CE Info
          </Link>
          <Link href="/contact" className="hover:text-teal">
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href={dashboardPathForRole(user.role)} className="btn btn-navy !px-3 !py-2 text-sm">
              My Account
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost !px-3 !py-2 text-sm">
                Log In
              </Link>
              <Link href="/courses" className="btn btn-primary !px-3 !py-2 text-sm">
                Browse Courses
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
