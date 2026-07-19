import { NextResponse } from "next/server";
import { dashboardPathForRole, loginWithCredentials } from "@/lib/auth";

function safeNextPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const next = safeNextPath(form.get("next"));

  const user = await loginWithCredentials(email, password);
  if (!user) {
    const url = new URL("/login?error=1", request.url);
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.redirect(
    new URL(next || dashboardPathForRole(user.role), request.url),
    303,
  );
}
