import Link from "next/link";
import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Activity className="h-4 w-4" />
              </span>
              <span className="text-base font-bold text-ink-900">
                Rodz<span className="text-brand-600">Edu</span>
              </span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Quality radiography &amp; imaging continuing education you can
              trust. ARRT-aligned CE credits, on your schedule.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
            <Link href="/courses" className="hover:text-brand-600">
              Browse courses
            </Link>
            <Link href="/register" className="hover:text-brand-600">
              Create account
            </Link>
            <Link href="/login" className="hover:text-brand-600">
              Student login
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-ink-500">
          © {new Date().getFullYear()} RodzEdu. For demonstration purposes.
          ARRT® is a registered trademark of its respective owner.
        </p>
      </div>
    </footer>
  );
}
