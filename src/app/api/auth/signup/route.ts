import { NextResponse } from "next/server";
import { createSession, dashboardPathForRole } from "@/lib/auth";
import { createStudentUser } from "@/lib/db";

function safeNextPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") || "");
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  const next = safeNextPath(form.get("next"));

  if (password !== confirm) {
    const url = new URL("/signup?error=mismatch", request.url);
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  }

  const result = await createStudentUser({ name, email, password });
  if ("error" in result) {
    const code =
      result.error.includes("already exists") ? "exists" : "invalid";
    const url = new URL(`/signup?error=${code}`, request.url);
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  }

  await createSession(result.user.id);
  return NextResponse.redirect(
    new URL(next || dashboardPathForRole(result.user.role), request.url),
    303,
  );
}
