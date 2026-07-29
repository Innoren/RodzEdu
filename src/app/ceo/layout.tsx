import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function CeoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser(["ceo"]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7f9_0%,#e8eef2_100%)]">
      <header className="border-b border-line bg-navy text-white">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-teal-bright">
              Separate management window
            </p>
            <p className="font-[family-name:var(--font-display)] text-2xl">
              RodzEdu CEO Console
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-white/70 sm:inline">{user.name}</span>
            <Link href="/ceo" className="rounded-sm bg-white/10 px-3 py-1.5 hover:bg-white/15">
              Overview
            </Link>
            <Link
              href="/ceo/reports"
              className="rounded-sm bg-white/10 px-3 py-1.5 hover:bg-white/15"
            >
              Reports
            </Link>
            <Link
              href="/ceo/settings"
              className="rounded-sm bg-white/10 px-3 py-1.5 hover:bg-white/15"
            >
              Settings
            </Link>
            <Link
              href="/"
              className="rounded-sm bg-accent px-3 py-1.5 font-semibold"
            >
              Public site
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-sm border border-white/25 bg-transparent px-3 py-1.5 hover:bg-white/10"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-5 py-8">{children}</main>
    </div>
  );
}
