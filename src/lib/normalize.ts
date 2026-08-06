import { normalizeMaxExamAttempts } from "./examAttempts";
import type {
  Certificate,
  Course,
  CourseModule,
  CourseReview,
  Database,
  DiscountCode,
  Enrollment,
  Bundle,
  FaqItem,
  SupportTicket,
  Testimonial,
} from "./types";

function defaultModulesFromContent(course: Course): CourseModule[] {
  const overview = course.content?.trim() || course.description || "Course content";
  return [
    {
      id: `${course.id}-mod-1`,
      title: "Module 1 — Foundations",
      content: overview,
      quizQuestions: [
        {
          id: `${course.id}-mq1`,
          prompt: "What is the primary goal of this continuing education course?",
          choices: [
            "Earn CE credit through structured study and assessment",
            "Replace clinical licensure exams",
            "Provide equipment service manuals",
            "Schedule patient appointments",
          ],
          correctIndex: 0,
        },
      ],
    },
    {
      id: `${course.id}-mod-2`,
      title: "Module 2 — Clinical application",
      content: `${overview}\n\nApply these concepts to everyday imaging practice, document your learning, and prepare for the final exam.`,
      quizQuestions: [
        {
          id: `${course.id}-mq2`,
          prompt: "When should you take the final exam?",
          choices: [
            "Before opening any module",
            "After completing all course modules",
            "Only if your employer requires it",
            "Never — quizzes replace the exam",
          ],
          correctIndex: 1,
        },
      ],
    },
  ];
}

export function normalizeDatabase(raw: unknown): Database {
  const db = raw as Partial<Database> & {
    courses?: Course[];
    enrollments?: Enrollment[];
  };

  const courses = (db.courses || []).map((course) => {
    const modules =
      Array.isArray(course.modules) && course.modules.length > 0
        ? course.modules
        : defaultModulesFromContent(course);
    return {
      ...course,
      featured: Boolean(course.featured),
      maxExamAttempts: normalizeMaxExamAttempts(course.maxExamAttempts),
      modules,
      examQuestions: Array.isArray(course.examQuestions)
        ? course.examQuestions
        : [],
    };
  });

  const enrollments = (db.enrollments || []).map((enrollment) => {
    const completedModuleIds = Array.isArray(enrollment.completedModuleIds)
      ? enrollment.completedModuleIds
      : [];
    return {
      ...enrollment,
      completedModuleIds,
      examAttemptCount: Math.max(0, Number(enrollment.examAttemptCount || 0)),
    };
  });

  return {
    users: db.users || [],
    courses,
    enrollments,
    certificates: (db.certificates || []) as Certificate[],
    bundles: (db.bundles || []) as Bundle[],
    discountCodes: (db.discountCodes || []) as DiscountCode[],
    reviews: (db.reviews || []) as CourseReview[],
    tickets: (db.tickets || []) as SupportTicket[],
    faqs: (db.faqs || []) as FaqItem[],
    testimonials: (db.testimonials || []) as Testimonial[],
    settings: db.settings!,
  };
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function applyDiscount(
  priceCents: number,
  code: DiscountCode | undefined,
): { finalCents: number; discountCents: number } {
  if (!code || !code.active) {
    return { finalCents: priceCents, discountCents: 0 };
  }
  if (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now()) {
    return { finalCents: priceCents, discountCents: 0 };
  }
  if (
    typeof code.maxRedemptions === "number" &&
    code.redemptionCount >= code.maxRedemptions
  ) {
    return { finalCents: priceCents, discountCents: 0 };
  }

  let discountCents = 0;
  if (typeof code.percentOff === "number" && code.percentOff > 0) {
    discountCents = Math.round((priceCents * code.percentOff) / 100);
  } else if (typeof code.amountOffCents === "number" && code.amountOffCents > 0) {
    discountCents = code.amountOffCents;
  }

  discountCents = Math.min(discountCents, priceCents);
  return {
    finalCents: Math.max(0, priceCents - discountCents),
    discountCents,
  };
}
