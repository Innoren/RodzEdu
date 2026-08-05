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
            explanation?: string;
          },
          index: number,
        ) => ({
          id: `q${index + 1}`,
          prompt: String(q.prompt || ""),
          choices: Array.isArray(q.choices)
            ? q.choices.map((c) => String(c))
            : [],
          correctIndex: Number(q.correctIndex ?? 0),
          explanation: q.explanation ? String(q.explanation) : undefined,
        }),
      )
    : [];

  const content = String(body.content || "");
  const modules = Array.isArray(body.modules)
    ? body.modules.map(
        (
          m: {
            title?: string;
            content?: string;
            quizQuestions?: ExamQuestion[];
          },
          index: number,
        ) => ({
          id: `mod-${Date.now()}-${index + 1}`,
          title: String(m.title || `Module ${index + 1}`),
          content: String(m.content || content),
          quizQuestions: Array.isArray(m.quizQuestions)
            ? m.quizQuestions.map((q, qIndex) => ({
                id: `mq-${index + 1}-${qIndex + 1}`,
                prompt: String(q.prompt || ""),
                choices: Array.isArray(q.choices)
                  ? q.choices.map((c) => String(c))
                  : [],
                correctIndex: Number(q.correctIndex ?? 0),
                explanation: q.explanation
                  ? String(q.explanation)
                  : undefined,
              }))
            : [],
        }),
      )
    : undefined;

  const course = await createCourse({
    title: String(body.title || "Untitled Course"),
    category: String(body.category || "Radiography"),
    credits: Number(body.credits || 1),
    priceCents: Math.round(Number(body.price || 0) * 100),
    description: String(body.description || ""),
    content,
    modules,
    published: Boolean(body.published),
    featured: Boolean(body.featured),
    examQuestions,
  });

  return NextResponse.json({ course });
}
