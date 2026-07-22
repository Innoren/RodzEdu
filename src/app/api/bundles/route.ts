import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createBundle, listBundles } from "@/lib/db";

export async function GET() {
  const bundles = await listBundles();
  return NextResponse.json({ bundles });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const courseIds = Array.isArray(body.courseIds)
    ? body.courseIds.map((id: unknown) => String(id))
    : [];

  const result = await createBundle({
    title: String(body.title || ""),
    description: String(body.description || ""),
    courseIds,
    priceCents: Math.round(Number(body.price || 0) * 100),
    published: Boolean(body.published),
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ bundle: result });
}
