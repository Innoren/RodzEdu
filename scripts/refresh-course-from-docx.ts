/**
 * Re-apply Word workbook HTML formatting onto an existing course's modules
 * without recreating the course (keeps enrollments / IDs).
 *
 * Usage:
 *   npx tsx scripts/refresh-course-from-docx.ts \
 *     --course "MRI Safety Essentials" \
 *     --workbook "/path/to/course.docx" \
 *     --exam "/path/to/exam.docx"
 */
import { existsSync, readFileSync } from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  loadEnv();

  const courseQuery = arg("course") || "MRI Safety Essentials";
  const workbookPath =
    arg("workbook") ||
    path.join(
      process.env.HOME || "",
      "Downloads/Rodz Education Courses 1 MRI Safety Essentials .docx",
    );
  const examPath =
    arg("exam") ||
    path.join(
      process.env.HOME || "",
      "Downloads/MRI Safety Essentials Final Exam.docx",
    );

  if (!existsSync(workbookPath)) {
    throw new Error(`Workbook not found: ${workbookPath}`);
  }
  if (!existsSync(examPath)) {
    throw new Error(`Exam not found: ${examPath}`);
  }

  const { extractDocxHtml, extractDocxParagraphs } = await import(
    "../src/lib/docx"
  );
  const { buildCourseFromDocuments } = await import(
    "../src/lib/parseCourseDocuments"
  );
  const { listAllCourses, updateCourse } = await import("../src/lib/db");

  const workbookBuf = readFileSync(workbookPath);
  const examBuf = readFileSync(examPath);

  const [courseParagraphs, examParagraphs, courseHtml] = await Promise.all([
    extractDocxParagraphs(workbookBuf),
    extractDocxParagraphs(examBuf),
    extractDocxHtml(workbookBuf),
  ]);

  const built = buildCourseFromDocuments({
    courseParagraphs,
    examParagraphs,
    courseHtml,
  });
  if ("error" in built) throw new Error(built.error);

  const courses = await listAllCourses();
  const course = courses.find(
    (c) =>
      c.title.toLowerCase() === courseQuery.toLowerCase() ||
      c.slug === courseQuery ||
      c.id === courseQuery,
  );
  if (!course) {
    throw new Error(
      `Course not found: ${courseQuery}. Available: ${courses
        .map((c) => c.title)
        .join(", ")}`,
    );
  }

  if (course.modules.length !== built.modules.length) {
    console.warn(
      `Module count differs (existing ${course.modules.length} vs workbook ${built.modules.length}). Matching by module number/title where possible.`,
    );
  }

  const nextModules = course.modules.map((existing, index) => {
    const fromDoc =
      built.modules.find(
        (m) =>
          m.title.toLowerCase() === existing.title.toLowerCase() ||
          Number(m.title.match(/^module\s+(\d+)/i)?.[1]) ===
            Number(existing.title.match(/^module\s+(\d+)/i)?.[1]),
      ) || built.modules[index];

    if (!fromDoc) return existing;

    return {
      ...existing,
      title: fromDoc.title || existing.title,
      content: fromDoc.content,
      // Keep existing quiz IDs when question counts match; otherwise replace.
      quizQuestions:
        fromDoc.quizQuestions.length === existing.quizQuestions.length
          ? fromDoc.quizQuestions.map((q, qIndex) => ({
              ...q,
              id:
                existing.quizQuestions[qIndex]?.id ||
                `mq-${index + 1}-${qIndex + 1}`,
            }))
          : fromDoc.quizQuestions.map((q, qIndex) => ({
              ...q,
              id: `mq-${index + 1}-${qIndex + 1}`,
            })),
    };
  });

  const updated = await updateCourse(course.id, {
    content: built.content,
    description: course.description || built.description,
    modules: nextModules,
    // Keep existing exam question IDs when counts match.
    examQuestions:
      built.examQuestions.length === course.examQuestions.length
        ? built.examQuestions.map((q, index) => ({
            ...q,
            id: course.examQuestions[index]?.id || q.id,
          }))
        : built.examQuestions.map((q, index) => ({
            ...q,
            id: course.examQuestions[index]?.id || `q${index + 1}`,
          })),
  });

  const sample = updated?.modules[0]?.content || "";
  console.log(`Updated “${updated?.title}” (${updated?.id})`);
  console.log(
    `Module 1 HTML: ul=${/<ul/i.test(sample)} strong=${/<strong/i.test(sample)} tip=${/module-tip/i.test(sample)}`,
  );
  console.log(`Modules refreshed: ${nextModules.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
