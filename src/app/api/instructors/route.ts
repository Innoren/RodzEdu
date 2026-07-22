import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createInstructor, listInstructors } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const instructors = await listInstructors();
  return NextResponse.json({
    instructors: instructors.map(({ password: _p, ...safe }) => safe),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = await createInstructor({
    name: String(body.name || ""),
    email: String(body.email || ""),
    password: String(body.password || ""),
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { password: _p, ...safe } = result.user;
  return NextResponse.json({ instructor: safe });
}
