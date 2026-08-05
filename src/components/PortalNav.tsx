"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const linksByRole: Record<Role, { href: string; label: string }[]> = {
  student: [
    { href: "/student", label: "My Progress" },
    { href: "/courses", label: "Browse & Enroll" },
  ],
  teacher: [
    { href: "/teacher", label: "Student Progress" },
    { href: "/courses", label: "Course Catalog" },
  ],
  admin: [
    { href: "/admin", label: "Course Manager" },
    { href: "/admin/new", label: "Upload Course" },
    { href: "/teacher", label: "Students" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/support", label: "Support Tickets" },
    { href: "/admin/instructors", label: "Instructors" },
    { href: "/admin/bundles", label: "Bundles" },
    { href: "/admin/discounts", label: "Discount Codes" },
    { href: "/courses", label: "Public Catalog" },
  ],
  ceo: [
    { href: "/ceo", label: "Company Overview" },
    { href: "/ceo/reports", label: "Reports" },
    { href: "/ceo/settings", label: "Site Settings" },
    { href: "/teacher", label: "Students" },
    { href: "/admin", label: "Courses" },
    { href: "/admin/support", label: "Support Tickets" },
    { href: "/admin/instructors", label: "Instructors" },
    { href: "/admin/bundles", label: "Bundles" },
    { href: "/admin/discounts", label: "Discounts" },
  ],
};

export function PortalNav({
  role,
  name,
}: {
  role: Role;
  name: string;
}) {
  const pathname = usePathname();
  const links = linksByRole[role];

  return (
    <aside className="panel h-fit p-5 md:sticky md:top-24">
      <p className="eyebrow">Signed in</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-navy">
        {name}
      </p>
      <p className="mt-1 text-sm capitalize text-muted">{role} portal</p>
      <nav className="mt-6 flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-sm px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-sand font-semibold text-navy ring-1 ring-line"
                  : "text-ink/80 hover:bg-sand/70"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action="/api/auth/logout" method="post" className="mt-6">
        <button type="submit" className="btn btn-ghost w-full !py-2 text-sm">
          Log out
        </button>
      </form>
    </aside>
  );
}
