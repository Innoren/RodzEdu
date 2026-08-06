import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteCourse, getCourseById, updateCourse } from "@/lib/db";
import type { ExamQuestion } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return unauthorized();
  }
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  return NextResponse.json({ course });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return unauthorized();
  }

  const { id } = await params;
  const existing = await getCourseById(id);
  if (!existing) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  const body = await request.json();
  const examQuestions: ExamQuestion[] | undefined = Array.isArray(
    body.examQuestions,
  )
    ? body.examQuestions.map(
        (
          q: {
            id?: string;
            prompt?: string;
            choices?: string[];
            correctIndex?: number;
            explanation?: string;
          },
          index: number,
        ) => ({
          id: String(q.id || `q${index + 1}`),
          prompt: String(q.prompt || ""),
          choices: Array.isArray(q.choices)
            ? q.choices.map((c) => String(c))
            : [],
          correctIndex: Number(q.correctIndex ?? 0),
          explanation: q.explanation ? String(q.explanation) : undefined,
        }),
      )
    : undefined;

  const course = await updateCourse(id, {
    title: body.title !== undefined ? String(body.title) : undefined,
    category: body.category !== undefined ? String(body.category) : undefined,
    credits:
      body.credits !== undefined ? Number(body.credits) : undefined,
    priceCents:
      body.price !== undefined
        ? Math.round(Number(body.price) * 100)
        : body.priceCents !== undefined
          ? Number(body.priceCents)
          : undefined,
    description:
      body.description !== undefined ? String(body.description) : undefined,
    content: body.content !== undefined ? String(body.content) : undefined,
    published:
      body.published !== undefined ? Boolean(body.published) : undefined,
    featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
    examQuestions,
  });

  return NextResponse.json({ course });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return unauthorized();
  }

  const { id } = await params;
  const result = await deleteCourse(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
