import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createInstructor,
  listInstructors,
  updateInstructorProfile,
} from "@/lib/db";

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
    credentials: body.credentials ? String(body.credentials) : undefined,
    bio: body.bio ? String(body.bio) : undefined,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { password: _p, ...safe } = result.user;
  return NextResponse.json({ instructor: safe });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updated = await updateInstructorProfile(String(body.id || ""), {
    name: body.name ? String(body.name) : undefined,
    credentials:
      body.credentials !== undefined ? String(body.credentials) : undefined,
    bio: body.bio !== undefined ? String(body.bio) : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Instructor not found." }, { status: 404 });
  }

  const { password: _p, ...safe } = updated;
  return NextResponse.json({ instructor: safe });
}
