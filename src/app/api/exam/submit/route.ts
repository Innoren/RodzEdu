import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEnrollmentById, submitExam } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const enrollmentId = String(body.enrollmentId || "");
  const answers = Array.isArray(body.answers)
    ? body.answers.map((n: unknown) => Number(n))
    : [];

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (enrollment.progressPercent < 100) {
    return NextResponse.json(
      { error: "Complete course modules before taking the exam." },
      { status: 400 },
    );
  }

  const result = await submitExam(enrollmentId, answers);
  if (!result) {
    return NextResponse.json({ error: "Unable to score exam" }, { status: 400 });
  }

  return NextResponse.json(result);
}
