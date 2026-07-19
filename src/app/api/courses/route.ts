import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createCourse } from "@/lib/db";
import type { ExamQuestion } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const examQuestions: ExamQuestion[] = Array.isArray(body.examQuestions)
    ? body.examQuestions.map(
        (
          q: {
            prompt?: string;
            choices?: string[];
            correctIndex?: number;
          },
          index: number,
        ) => ({
          id: `q${index + 1}`,
          prompt: String(q.prompt || ""),
          choices: Array.isArray(q.choices)
            ? q.choices.map((c) => String(c))
            : [],
          correctIndex: Number(q.correctIndex ?? 0),
        }),
      )
    : [];

  const course = await createCourse({
    title: String(body.title || "Untitled Course"),
    category: String(body.category || "Radiography"),
    credits: Number(body.credits || 1),
    priceCents: Math.round(Number(body.price || 0) * 100),
    description: String(body.description || ""),
    content: String(body.content || ""),
    published: Boolean(body.published),
    examQuestions,
  });

  return NextResponse.json({ course });
}
