import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { completeModule, getEnrollmentById } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const enrollmentId = String(body.enrollmentId || "");
  const moduleId = String(body.moduleId || "");
  const quizAnswers = Array.isArray(body.quizAnswers)
    ? body.quizAnswers.map((n: unknown) => Number(n))
    : undefined;

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await completeModule({ enrollmentId, moduleId, quizAnswers });
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, review: result.review || [] },
      { status: 400 },
    );
  }

  return NextResponse.json(result);
}
