import { NextResponse } from "next/server";
import { createSession, dashboardPathForRole } from "@/lib/auth";
import { createStudentUser } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") || "");
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");

  if (password !== confirm) {
    return NextResponse.redirect(
      new URL("/login?signup_error=mismatch#signup", request.url),
      303,
    );
  }

  const result = await createStudentUser({ name, email, password });
  if ("error" in result) {
    const code =
      result.error.includes("already exists") ? "exists" : "invalid";
    return NextResponse.redirect(
      new URL(`/login?signup_error=${code}#signup`, request.url),
      303,
    );
  }

  await createSession(result.user.id);
  return NextResponse.redirect(
    new URL(dashboardPathForRole(result.user.role), request.url),
    303,
  );
}
