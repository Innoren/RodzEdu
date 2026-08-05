import type { CourseModule, ExamQuestion } from "@/lib/types";

export type ParsedCourseFromDocs = {
  title: string;
  description: string;
  credits: number;
  category: string;
  content: string;
  modules: Omit<CourseModule, "id">[];
  examQuestions: Omit<ExamQuestion, "id">[];
  warnings: string[];
};

type Choice = { text: string; correct: boolean };

/**
 * Parse Rodz-style final exam Word exports:
 * Question N / prompt / A–D / ✅ Correct Answer: B / Explanation:
 */
export function parseFinalExamParagraphs(paragraphs: string[]): {
  title?: string;
  questions: Omit<ExamQuestion, "id">[];
  error?: string;
} {
  const questions: Omit<ExamQuestion, "id">[] = [];
  let title: string | undefined;
  let i = 0;

  if (paragraphs[0] && !/^question\s+\d+/i.test(paragraphs[0])) {
    title = paragraphs[0];
  }

  while (i < paragraphs.length) {
    const qMatch = paragraphs[i].match(/^question\s+(\d+)\s*$/i);
    if (!qMatch) {
      i += 1;
      continue;
    }

    i += 1;
    if (i >= paragraphs.length) break;
    const prompt = paragraphs[i].trim();
    i += 1;

    const choices: Choice[] = [];
    while (i < paragraphs.length) {
      const choiceMatch = paragraphs[i].match(
        /^([A-D])[).:\-]\s*(.+?)(?:\s*✅)?$/i,
      );
      if (!choiceMatch) break;
      choices.push({
        text: choiceMatch[2].replace(/\s*✅\s*$/, "").trim(),
        correct: false,
      });
      i += 1;
    }

    let correctIndex = -1;
    let explanation = "";

    while (i < paragraphs.length) {
      const line = paragraphs[i];
      if (/^question\s+\d+\s*$/i.test(line) || /^module\s+\d+/i.test(line)) {
        break;
      }

      const correctMatch = line.match(
        /^(?:✅\s*)?correct\s*answer\s*[:\-]\s*([A-D])\b/i,
      );
      if (correctMatch) {
        correctIndex = correctMatch[1].toUpperCase().charCodeAt(0) - 65;
        i += 1;
        continue;
      }

      if (/^explanation\s*:?\s*$/i.test(line)) {
        i += 1;
        const parts: string[] = [];
        while (
          i < paragraphs.length &&
          !/^question\s+\d+\s*$/i.test(paragraphs[i]) &&
          !/^(?:✅\s*)?correct\s*answer/i.test(paragraphs[i]) &&
          !/^module\s+\d+/i.test(paragraphs[i])
        ) {
          if (/^explanation\s*:/i.test(paragraphs[i])) {
            parts.push(paragraphs[i].replace(/^explanation\s*:\s*/i, "").trim());
          } else {
            parts.push(paragraphs[i]);
          }
          i += 1;
        }
        explanation = parts.join(" ").trim();
        continue;
      }

      const inlineExplanation = line.match(/^explanation\s*:\s*(.+)$/i);
      if (inlineExplanation) {
        explanation = inlineExplanation[1].trim();
        i += 1;
        continue;
      }

      i += 1;
    }

    if (prompt && choices.length >= 2 && correctIndex >= 0) {
      questions.push({
        prompt,
        choices: choices.map((c) => c.text),
        correctIndex,
        explanation: explanation || undefined,
      });
    }
  }

  if (questions.length === 0) {
    return {
      questions: [],
      error:
        "No final-exam questions found. Expected blocks like “Question 1”, A–D choices, and “Correct Answer: B”.",
    };
  }

  return { title, questions };
}

/**
 * Parse numbered knowledge-check style questions where the correct choice
 * is marked with ✅ (used inside course workbooks).
 */
export function parseInlineQuizParagraphs(paragraphs: string[]): {
  questions: Omit<ExamQuestion, "id">[];
} {
  const questions: Omit<ExamQuestion, "id">[] = [];
  let i = 0;

  while (i < paragraphs.length) {
    const qMatch = paragraphs[i].match(/^\d+\.\s+(.+)$/);
    if (!qMatch) {
      i += 1;
      continue;
    }

    const prompt = qMatch[1].replace(/\s*✅\s*$/, "").trim();
    i += 1;
    const choices: Choice[] = [];
    while (i < paragraphs.length) {
      const choiceMatch = paragraphs[i].match(/^([A-D])[).:\-]\s*(.+)$/i);
      if (!choiceMatch) break;
      const raw = choiceMatch[2].trim();
      const correct = /✅/.test(raw) || /\*\s*$/.test(raw);
      choices.push({
        text: raw.replace(/\s*✅\s*/g, "").replace(/\*+\s*$/, "").trim(),
        correct,
      });
      i += 1;
    }

    let explanation = "";
    if (i < paragraphs.length) {
      const expl = paragraphs[i].match(/^explanation\s*:\s*(.+)$/i);
      if (expl) {
        explanation = expl[1].trim();
        i += 1;
      }
    }

    const correctIndex = choices.findIndex((c) => c.correct);
    if (prompt && choices.length >= 2 && correctIndex >= 0) {
      questions.push({
        prompt,
        choices: choices.map((c) => c.text),
        correctIndex,
        explanation: explanation || undefined,
      });
    }
  }

  return { questions };
}

function extractCredits(paragraphs: string[]): number | undefined {
  for (const line of paragraphs.slice(0, 80)) {
    const match = line.match(/(\d+(?:\.\d+)?)\s*CE\s*(?:hours?|credits?)/i);
    if (match) return Math.max(1, Math.round(Number(match[1])));
  }
  return undefined;
}

function extractMission(paragraphs: string[]): string | undefined {
  const idx = paragraphs.findIndex((p) => /^course mission$/i.test(p));
  if (idx >= 0 && paragraphs[idx + 1]) return paragraphs[idx + 1];
  const objIdx = paragraphs.findIndex((p) => /^learning objectives$/i.test(p));
  if (objIdx >= 0) {
    const bits: string[] = [];
    for (let i = objIdx + 1; i < paragraphs.length && i < objIdx + 8; i++) {
      if (/^course outline$/i.test(paragraphs[i])) break;
      bits.push(paragraphs[i]);
    }
    if (bits.length) return bits.join(" ");
  }
  return undefined;
}

/**
 * Parse Rodz course workbook into modules + module quizzes.
 * Modules start at “Module N: Title”.
 */
export function parseCourseWorkbookParagraphs(paragraphs: string[]): {
  title?: string;
  description?: string;
  credits?: number;
  modules: Omit<CourseModule, "id">[];
  error?: string;
} {
  const title = paragraphs[0]?.trim();
  const description = extractMission(paragraphs);
  const credits = extractCredits(paragraphs);

  const moduleStarts: { index: number; number: number; title: string }[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const match = paragraphs[i].match(/^module\s+(\d+)\s*:\s*(.+)$/i);
    if (match) {
      moduleStarts.push({
        index: i,
        number: Number(match[1]),
        title: `Module ${match[1]}: ${match[2].trim()}`,
      });
    }
  }

  if (moduleStarts.length === 0) {
    return {
      modules: [],
      error:
        "No modules found in the course document. Expected headings like “Module 1: MRI Safety Mindset”.",
    };
  }

  const modules: Omit<CourseModule, "id">[] = [];

  for (let m = 0; m < moduleStarts.length; m++) {
    const start = moduleStarts[m].index;
    const end =
      m + 1 < moduleStarts.length
        ? moduleStarts[m + 1].index
        : paragraphs.findIndex(
            (p, idx) => idx > start && /^final knowledge check$/i.test(p),
          );
    const sliceEnd = end > start ? end : paragraphs.length;
    const block = paragraphs.slice(start, sliceEnd);

    let quizAt = block.findIndex((p) => /^knowledge check$/i.test(p));
    if (quizAt < 0) {
      quizAt = block.findIndex((p) => /^final knowledge check$/i.test(p));
    }
    // Final knowledge check often sits after the last module block — pull it in.
    let quizSource = quizAt >= 0 ? block : paragraphs;
    let quizStart = quizAt;
    if (quizAt < 0 && m === moduleStarts.length - 1) {
      const finalAt = paragraphs.findIndex((p) =>
        /^final knowledge check$/i.test(p),
      );
      if (finalAt >= 0) {
        quizSource = paragraphs;
        quizStart = finalAt;
      }
    }

    const contentLines =
      quizAt >= 0 ? block.slice(0, quizAt) : block.slice(0, block.length);
    const quizLines =
      quizStart >= 0
        ? quizSource.slice(
            quizStart + 1,
            (() => {
              const stop = quizSource.findIndex(
                (p, idx) =>
                  idx > quizStart &&
                  (/^key takeaways$/i.test(p) ||
                    /^closing message$/i.test(p) ||
                    /^references$/i.test(p) ||
                    /^evidence-based practice$/i.test(p) ||
                    /^course summary$/i.test(p) ||
                    /^final message$/i.test(p) ||
                    /^module\s+\d+\s*:/i.test(p)),
              );
              return stop > quizStart ? stop : quizSource.length;
            })(),
          )
        : [];

    // Drop repeated course title lines and slide deck chrome from module body.
    const cleanedContent = contentLines
      .filter((line, idx) => {
        if (idx === 0) return true; // keep Module N: Title
        if (/^slide\s+\d+$/i.test(line)) return false;
        if (/^speaker notes$/i.test(line)) return false;
        if (/^rodz education$/i.test(line)) return false;
        return true;
      })
      .join("\n\n");

    const { questions } = parseInlineQuizParagraphs(quizLines);

    modules.push({
      title: moduleStarts[m].title,
      content: cleanedContent.trim(),
      quizQuestions: questions.map((q, qIndex) => ({
        id: `mq-${moduleStarts[m].number}-${qIndex + 1}`,
        ...q,
      })),
    });
  }

  return { title, description, credits, modules };
}

export function buildCourseFromDocuments(input: {
  courseParagraphs: string[];
  examParagraphs: string[];
  overrides?: {
    title?: string;
    category?: string;
    credits?: number;
    description?: string;
  };
}): ParsedCourseFromDocs | { error: string } {
  const warnings: string[] = [];
  const workbook = parseCourseWorkbookParagraphs(input.courseParagraphs);
  if (workbook.error) return { error: workbook.error };

  const exam = parseFinalExamParagraphs(input.examParagraphs);
  if (exam.error) return { error: exam.error };

  const title =
    input.overrides?.title?.trim() ||
    workbook.title ||
    exam.title ||
    "Untitled Course";

  const description =
    input.overrides?.description?.trim() ||
    workbook.description ||
    `${title} — continuing education course with module quizzes and a final exam.`;

  const credits =
    input.overrides?.credits && input.overrides.credits > 0
      ? input.overrides.credits
      : workbook.credits || Math.max(1, Math.round(exam.questions.length / 12));

  const category = input.overrides?.category?.trim() || guessCategory(title);

  const modulesWithoutIds = workbook.modules.map(({ title: t, content, quizQuestions }) => ({
    title: t,
    content,
    quizQuestions: quizQuestions.map(({ prompt, choices, correctIndex, explanation }) => ({
      prompt,
      choices,
      correctIndex,
      explanation,
    })),
  }));

  for (const mod of workbook.modules) {
    if (mod.quizQuestions.length === 0) {
      warnings.push(`${mod.title} has no knowledge-check questions.`);
    }
  }

  return {
    title,
    description,
    credits,
    category,
    content: workbook.modules.map((m) => m.content).join("\n\n"),
    modules: modulesWithoutIds.map((m, index) => ({
      title: m.title,
      content: m.content,
      quizQuestions: m.quizQuestions.map((q, qIndex) => ({
        id: `mq-${index + 1}-${qIndex + 1}`,
        prompt: q.prompt,
        choices: q.choices,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    })),
    examQuestions: exam.questions,
    warnings,
  };
}

function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("mri")) return "MRI";
  if (t.includes("mammo")) return "Mammography";
  if (/\bct\b/.test(t)) return "Computed Tomography";
  if (t.includes("radio")) return "Radiography";
  return "Imaging";
}
