import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEnrollmentById, updateEnrollmentProgress } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const enrollmentId = String(body.enrollmentId || "");
  const progressPercent = Number(body.progressPercent);

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await updateEnrollmentProgress(enrollmentId, progressPercent);
  return NextResponse.json({ enrollment: updated });
}
