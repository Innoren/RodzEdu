import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createReview, listEnrollmentsForUser } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Sign in as a student to review." }, { status: 401 });
  }

  const body = await request.json();
  const courseId = String(body.courseId || "");
  const enrollments = await listEnrollmentsForUser(user.id);
  if (!enrollments.some((e) => e.courseId === courseId)) {
    return NextResponse.json(
      { error: "Enroll in this course before leaving a review." },
      { status: 403 },
    );
  }

  const result = await createReview({
    courseId,
    userId: user.id,
    userName: user.name,
    rating: Number(body.rating || 5),
    comment: String(body.comment || ""),
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ review: result });
}
