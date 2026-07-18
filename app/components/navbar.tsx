import Link from "next/link";
import { Activity, LayoutDashboard, GraduationCap } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { CurrentUser } from "@/lib/session";

export function Navbar({ user }: { user: CurrentUser | null }) {
  const isTeacher = user?.role === "TEACHER";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-ink-900">
            Rodz<span className="text-brand-600">Edu</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/courses"
            className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-100"
          >
            Courses
          </Link>

          {user ? (
            <>
              <Link
                href={isTeacher ? "/teacher" : "/dashboard"}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-100"
              >
                {isTeacher ? (
                  <LayoutDashboard className="h-4 w-4" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )}
                {isTeacher ? "Teach" : "My Learning"}
              </Link>
              <span className="hidden text-sm text-ink-500 sm:inline">
                {user.name.split(" ")[0]}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
