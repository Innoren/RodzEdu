import { NextResponse } from "next/server";
import { dashboardPathForRole, loginWithCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  const user = await loginWithCredentials(email, password);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }

  return NextResponse.redirect(
    new URL(dashboardPathForRole(user.role), request.url),
    303,
  );
}
