import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateSettings } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ceo") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const settings = await updateSettings({
    companyName: String(body.companyName ?? ""),
    tagline: String(body.tagline ?? ""),
    phone: String(body.phone ?? "").trim(),
    email: String(body.email ?? "").trim(),
    address: String(body.address ?? "").trim(),
    announcement: String(body.announcement ?? ""),
  });

  revalidatePath("/", "layout");

  return NextResponse.json({ settings });
}
