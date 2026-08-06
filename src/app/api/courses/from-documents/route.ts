import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createCourse } from "@/lib/db";
import { extractDocxHtml, extractDocxParagraphs } from "@/lib/docx";
import { normalizeMaxExamAttempts } from "@/lib/examAttempts";
import { buildCourseFromDocuments } from "@/lib/parseCourseDocuments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const courseFile = form.get("courseDocument");
  const examFile = form.get("examDocument");

  if (!(courseFile instanceof File) || !(examFile instanceof File)) {
    return NextResponse.json(
      {
        error:
          "Upload both a course workbook (.docx) and a final exam (.docx).",
      },
      { status: 400 },
    );
  }

  if (
    !courseFile.name.toLowerCase().endsWith(".docx") ||
    !examFile.name.toLowerCase().endsWith(".docx")
  ) {
    return NextResponse.json(
      { error: "Only Microsoft Word .docx files are supported." },
      { status: 400 },
    );
  }

  try {
    const courseBuffer = await courseFile.arrayBuffer();
    const examBuffer = await examFile.arrayBuffer();
    const [courseParagraphs, examParagraphs, courseHtml] = await Promise.all([
      extractDocxParagraphs(courseBuffer),
      extractDocxParagraphs(examBuffer),
      extractDocxHtml(courseBuffer),
    ]);

    const built = buildCourseFromDocuments({
      courseParagraphs,
      examParagraphs,
      courseHtml,
      overrides: {
        title: String(form.get("title") || ""),
        category: String(form.get("category") || ""),
        description: String(form.get("description") || ""),
        credits: Number(form.get("credits") || 0),
      },
    });

    if ("error" in built) {
      return NextResponse.json({ error: built.error }, { status: 400 });
    }

    if (built.examQuestions.length === 0) {
      return NextResponse.json(
        { error: "Final exam document did not contain any scored questions." },
        { status: 400 },
      );
    }

    const stamp = Date.now();
    const course = await createCourse({
      title: built.title,
      category: built.category,
      credits: built.credits,
      priceCents: Math.round(Number(form.get("price") || 0) * 100),
      description: built.description,
      content: built.content,
      modules: built.modules.map((module, index) => ({
        id: `mod-${stamp}-${index + 1}`,
        title: module.title,
        content: module.content,
        quizQuestions: module.quizQuestions.map((q, qIndex) => ({
          id: `mq-${index + 1}-${qIndex + 1}`,
          prompt: q.prompt,
          choices: q.choices,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      })),
      published: form.get("published") === "on" || form.get("published") === "true",
      featured: form.get("featured") === "on" || form.get("featured") === "true",
      maxExamAttempts: normalizeMaxExamAttempts(form.get("maxExamAttempts")),
      examQuestions: built.examQuestions.map((q, index) => ({
        id: `q${index + 1}`,
        prompt: q.prompt,
        choices: q.choices,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    });

    return NextResponse.json({
      course,
      summary: {
        modules: built.modules.length,
        moduleQuizzes: built.modules.reduce(
          (sum, m) => sum + m.quizQuestions.length,
          0,
        ),
        examQuestions: built.examQuestions.length,
        warnings: built.warnings,
      },
    });
  } catch (error) {
    console.error("from-documents upload failed", error);
    return NextResponse.json(
      {
        error:
          "Could not read those Word documents. Export as .docx and try again.",
      },
      { status: 400 },
    );
  }
}
