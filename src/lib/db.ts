import { get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { applyDiscount, normalizeDatabase, slugify } from "./normalize";
import { seedData } from "./seed";
import type {
  Bundle,
  Certificate,
  Course,
  CourseModule,
  Database,
  DiscountCode,
  Enrollment,
  EnrollmentStatus,
  ExamQuestion,
  SiteSettings,
  User,
} from "./types";

// Local/dev file fallback. On Vercel, durable state lives in private Blob storage
// so CEO settings (phone, etc.) survive cold starts.
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "rodzedu-data")
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "store.json");
const BLOB_PATH = "rodzedu/store.json";

declare global {
  // Persist runtime DB across hot reloads / warm serverless invocations.
  var __rodzeduDb: Database | undefined;
}

function hasBlobStore() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readDbFromBlob(): Promise<Database | null> {
  if (!hasBlobStore()) return null;
  try {
    const result = await get(BLOB_PATH, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const raw = await new Response(result.stream).text();
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

async function writeDbToBlob(db: Database): Promise<void> {
  if (!hasBlobStore()) return;
  await put(BLOB_PATH, JSON.stringify(db, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readDbFromFile(): Promise<Database | null> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

async function writeDbToFile(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

async function ensureDb(): Promise<Database> {
  if (globalThis.__rodzeduDb) {
    return globalThis.__rodzeduDb;
  }

  const fromBlob = await readDbFromBlob();
  if (fromBlob) {
    globalThis.__rodzeduDb = normalizeDatabase(fromBlob);
    return globalThis.__rodzeduDb;
  }

  const fromFile = await readDbFromFile();
  if (fromFile) {
    globalThis.__rodzeduDb = normalizeDatabase(fromFile);
    await writeDbToBlob(globalThis.__rodzeduDb);
    return globalThis.__rodzeduDb;
  }

  const seeded = normalizeDatabase(structuredClone(seedData));
  globalThis.__rodzeduDb = seeded;
  await writeDbToFile(seeded);
  await writeDbToBlob(seeded);
  return seeded;
}

async function writeDb(db: Database): Promise<void> {
  globalThis.__rodzeduDb = db;
  await Promise.all([writeDbToFile(db), writeDbToBlob(db)]);
}

export async function getDb(): Promise<Database> {
  return ensureDb();
}

export async function getSettings(): Promise<SiteSettings> {
  // Always read settings from durable Blob when available so the public site
  // reflects CEO changes immediately (not a stale seed /tmp copy).
  if (hasBlobStore()) {
    const fromBlob = await readDbFromBlob();
    if (fromBlob) {
      globalThis.__rodzeduDb = normalizeDatabase(fromBlob);
      return globalThis.__rodzeduDb.settings;
    }
  }
  const db = await ensureDb();
  return db.settings;
}

export async function updateSettings(
  patch: Partial<SiteSettings>,
): Promise<SiteSettings> {
  const db = await ensureDb();
  db.settings = { ...db.settings, ...patch };
  await writeDb(db);
  return db.settings;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = await ensureDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  const db = await ensureDb();
  return db.users.find((u) => u.id === id);
}

export async function listUsers(): Promise<User[]> {
  const db = await ensureDb();
  return db.users;
}

export async function createStudentUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User } | { error: string }> {
  const db = await ensureDb();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!name || !email || password.length < 6) {
    return { error: "Enter your name, email, and a password of at least 6 characters." };
  }

  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { error: "An account with that email already exists. Log in instead." };
  }

  const teacher = db.users.find((u) => u.role === "teacher");
  const user: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    role: "student",
    teacherId: teacher?.id,
  };

  db.users.push(user);
  await writeDb(db);
  return { user };
}

export async function listPublishedCourses(): Promise<Course[]> {
  const db = await ensureDb();
  return db.courses.filter((c) => c.published);
}

export async function listAllCourses(): Promise<Course[]> {
  const db = await ensureDb();
  return db.courses;
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const db = await ensureDb();
  return db.courses.find((c) => c.id === id);
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  const db = await ensureDb();
  return db.courses.find((c) => c.slug === slug);
}

export async function createCourse(
  input: Omit<Course, "id" | "createdAt" | "updatedAt" | "slug" | "modules"> & {
    slug?: string;
    modules?: CourseModule[];
  },
): Promise<Course> {
  const db = await ensureDb();
  const now = new Date().toISOString();
  const slug =
    input.slug ||
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const course: Course = {
    id: `course-${Date.now()}`,
    title: input.title,
    slug,
    category: input.category,
    credits: input.credits,
    priceCents: input.priceCents,
    description: input.description,
    published: input.published,
    content: input.content,
    modules: input.modules?.length
      ? input.modules
      : [
          {
            id: `mod-${Date.now()}-1`,
            title: "Module 1 — Course content",
            content: input.content || input.description,
            quizQuestions: [],
          },
        ],
    examQuestions: input.examQuestions,
    instructorId: input.instructorId,
    createdAt: now,
    updatedAt: now,
  };

  db.courses.unshift(course);
  await writeDb(db);
  return course;
}

export async function updateCourse(
  id: string,
  patch: Partial<Course>,
): Promise<Course | undefined> {
  const db = await ensureDb();
  const idx = db.courses.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  db.courses[idx] = {
    ...db.courses[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(db);
  return db.courses[idx];
}

export async function listEnrollments(): Promise<Enrollment[]> {
  const db = await ensureDb();
  return db.enrollments;
}

export async function getEnrollmentById(
  id: string,
): Promise<Enrollment | undefined> {
  const db = await ensureDb();
  return db.enrollments.find((e) => e.id === id);
}

export async function listEnrollmentsForUser(
  userId: string,
): Promise<Enrollment[]> {
  const db = await ensureDb();
  return db.enrollments.filter((e) => e.userId === userId);
}

export async function listEnrollmentsForTeacher(
  teacherId: string,
): Promise<{ student: User; enrollment: Enrollment; course: Course }[]> {
  const db = await ensureDb();
  const students = db.users.filter(
    (u) => u.role === "student" && u.teacherId === teacherId,
  );
  const studentIds = new Set(students.map((s) => s.id));

  return db.enrollments
    .filter((e) => studentIds.has(e.userId))
    .map((enrollment) => {
      const student = students.find((s) => s.id === enrollment.userId)!;
      const course = db.courses.find((c) => c.id === enrollment.courseId)!;
      return { student, enrollment, course };
    });
}

export async function enrollUser(
  userId: string,
  courseId: string,
): Promise<Enrollment> {
  const db = await ensureDb();
  const existing = db.enrollments.find(
    (e) => e.userId === userId && e.courseId === courseId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const enrollment: Enrollment = {
    id: `enroll-${Date.now()}`,
    userId,
    courseId,
    status: "purchased",
    progressPercent: 0,
    completedModuleIds: [],
    purchasedAt: now,
    lastActivityAt: now,
  };
  db.enrollments.unshift(enrollment);
  await writeDb(db);
  return enrollment;
}

export async function updateEnrollmentProgress(
  enrollmentId: string,
  progressPercent: number,
): Promise<Enrollment | undefined> {
  const db = await ensureDb();
  const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) return undefined;

  const clamped = Math.max(0, Math.min(100, progressPercent));
  enrollment.progressPercent = clamped;
  enrollment.lastActivityAt = new Date().toISOString();

  if (clamped >= 100 && enrollment.status !== "exam_passed") {
    enrollment.status = "exam_ready";
  } else if (clamped > 0 && enrollment.status === "purchased") {
    enrollment.status = "in_progress";
  }

  await writeDb(db);
  return enrollment;
}

export async function submitExam(
  enrollmentId: string,
  answers: number[],
): Promise<{
  enrollment: Enrollment;
  score: number;
  passed: boolean;
  certificate?: Certificate;
} | null> {
  const db = await ensureDb();
  const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) return null;

  const course = db.courses.find((c) => c.id === enrollment.courseId);
  const student = db.users.find((u) => u.id === enrollment.userId);
  if (!course || !student) return null;

  const total = course.examQuestions.length || 1;
  let correct = 0;
  course.examQuestions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct += 1;
  });

  const score = Math.round((correct / total) * 100);
  const passed = score >= 75;
  const now = new Date().toISOString();

  enrollment.score = score;
  enrollment.lastActivityAt = now;
  enrollment.status = (passed ? "exam_passed" : "exam_failed") as EnrollmentStatus;

  let certificate: Certificate | undefined;
  if (passed) {
    enrollment.status = "completed";
    enrollment.completedAt = now;
    enrollment.progressPercent = 100;

    const existing = db.certificates.find(
      (c) => c.enrollmentId === enrollment.id,
    );
    if (existing) {
      certificate = existing;
      enrollment.certificateId = existing.id;
    } else {
      certificate = {
        id: `cert-${Date.now()}`,
        enrollmentId: enrollment.id,
        userId: student.id,
        courseId: course.id,
        studentName: student.name,
        courseTitle: course.title,
        credits: course.credits,
        score,
        issuedAt: now,
        certificateNumber: `RE-${new Date().getFullYear()}-${String(
          db.certificates.length + 1,
        ).padStart(5, "0")}`,
      };
      db.certificates.unshift(certificate);
      enrollment.certificateId = certificate.id;
    }
  }

  await writeDb(db);
  return { enrollment, score, passed, certificate };
}

export async function completeModule(input: {
  enrollmentId: string;
  moduleId: string;
  quizAnswers?: number[];
}): Promise<
  | { enrollment: Enrollment; course: Course }
  | { error: string }
> {
  const db = await ensureDb();
  const enrollment = db.enrollments.find((e) => e.id === input.enrollmentId);
  if (!enrollment) return { error: "Enrollment not found." };

  const course = db.courses.find((c) => c.id === enrollment.courseId);
  if (!course) return { error: "Course not found." };

  const module = course.modules.find((m) => m.id === input.moduleId);
  if (!module) return { error: "Module not found." };

  if (module.quizQuestions.length > 0) {
    const answers = input.quizAnswers || [];
    if (answers.length !== module.quizQuestions.length) {
      return { error: "Answer every quiz question to complete this module." };
    }
    const allCorrect = module.quizQuestions.every(
      (q, i) => answers[i] === q.correctIndex,
    );
    if (!allCorrect) {
      return {
        error: "One or more quiz answers were incorrect. Review the module and try again.",
      };
    }
  }

  if (!enrollment.completedModuleIds.includes(module.id)) {
    enrollment.completedModuleIds.push(module.id);
  }

  const total = Math.max(course.modules.length, 1);
  const progressPercent = Math.round(
    (enrollment.completedModuleIds.length / total) * 100,
  );
  enrollment.progressPercent = Math.min(100, progressPercent);
  enrollment.lastActivityAt = new Date().toISOString();

  if (enrollment.progressPercent >= 100 && enrollment.status !== "completed") {
    enrollment.status = "exam_ready";
  } else if (enrollment.progressPercent > 0 && enrollment.status === "purchased") {
    enrollment.status = "in_progress";
  }

  await writeDb(db);
  return { enrollment, course };
}

export async function getCertificateById(
  id: string,
): Promise<Certificate | undefined> {
  const db = await ensureDb();
  return db.certificates.find((c) => c.id === id);
}

export async function listCertificatesForUser(
  userId: string,
): Promise<Certificate[]> {
  const db = await ensureDb();
  return db.certificates.filter((c) => c.userId === userId);
}

export async function createInstructor(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User } | { error: string }> {
  const db = await ensureDb();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!name || !email || password.length < 6) {
    return {
      error: "Enter name, email, and a password of at least 6 characters.",
    };
  }
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { error: "An account with that email already exists." };
  }

  const user: User = {
    id: `user-teacher-${Date.now()}`,
    name,
    email,
    password,
    role: "teacher",
  };
  db.users.push(user);
  await writeDb(db);
  return { user };
}

export async function listInstructors(): Promise<User[]> {
  const db = await ensureDb();
  return db.users.filter((u) => u.role === "teacher");
}

export async function listBundles(): Promise<Bundle[]> {
  const db = await ensureDb();
  return db.bundles;
}

export async function listPublishedBundles(): Promise<Bundle[]> {
  const db = await ensureDb();
  return db.bundles.filter((b) => b.published);
}

export async function getBundleBySlug(
  slug: string,
): Promise<Bundle | undefined> {
  const db = await ensureDb();
  return db.bundles.find((b) => b.slug === slug);
}

export async function getBundleById(id: string): Promise<Bundle | undefined> {
  const db = await ensureDb();
  return db.bundles.find((b) => b.id === id);
}

export async function createBundle(input: {
  title: string;
  description: string;
  courseIds: string[];
  priceCents: number;
  published: boolean;
}): Promise<Bundle | { error: string }> {
  const db = await ensureDb();
  if (!input.title.trim() || input.courseIds.length < 2) {
    return { error: "Bundles need a title and at least two courses." };
  }

  const bundle: Bundle = {
    id: `bundle-${Date.now()}`,
    title: input.title.trim(),
    slug: slugify(input.title),
    description: input.description.trim(),
    courseIds: input.courseIds,
    priceCents: input.priceCents,
    published: input.published,
    createdAt: new Date().toISOString(),
  };
  db.bundles.unshift(bundle);
  await writeDb(db);
  return bundle;
}

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  const db = await ensureDb();
  return db.discountCodes;
}

export async function findDiscountCode(
  code: string,
): Promise<DiscountCode | undefined> {
  const db = await ensureDb();
  return db.discountCodes.find(
    (c) => c.code.toLowerCase() === code.trim().toLowerCase(),
  );
}

export async function createDiscountCode(input: {
  code: string;
  percentOff?: number;
  amountOffCents?: number;
  maxRedemptions?: number;
  expiresAt?: string;
}): Promise<DiscountCode | { error: string }> {
  const db = await ensureDb();
  const code = input.code.trim().toUpperCase();
  if (!code) return { error: "Enter a discount code." };
  if (db.discountCodes.some((c) => c.code.toLowerCase() === code.toLowerCase())) {
    return { error: "That discount code already exists." };
  }
  if (!input.percentOff && !input.amountOffCents) {
    return { error: "Set a percent or fixed amount off." };
  }

  const discount: DiscountCode = {
    id: `promo-${Date.now()}`,
    code,
    percentOff: input.percentOff,
    amountOffCents: input.amountOffCents,
    active: true,
    maxRedemptions: input.maxRedemptions,
    redemptionCount: 0,
    expiresAt: input.expiresAt,
    createdAt: new Date().toISOString(),
  };
  db.discountCodes.unshift(discount);
  await writeDb(db);
  return discount;
}

export async function redeemDiscountCode(code: string): Promise<void> {
  const db = await ensureDb();
  const discount = db.discountCodes.find(
    (c) => c.code.toLowerCase() === code.trim().toLowerCase(),
  );
  if (!discount) return;
  discount.redemptionCount += 1;
  await writeDb(db);
}

export async function enrollUserInCourses(
  userId: string,
  courseIds: string[],
): Promise<Enrollment[]> {
  const results: Enrollment[] = [];
  for (const courseId of courseIds) {
    results.push(await enrollUser(userId, courseId));
  }
  return results;
}

export function priceWithDiscount(
  priceCents: number,
  code: DiscountCode | undefined,
) {
  return applyDiscount(priceCents, code);
}

export async function getDashboardStats() {
  const db = await ensureDb();
  return {
    students: db.users.filter((u) => u.role === "student").length,
    teachers: db.users.filter((u) => u.role === "teacher").length,
    courses: db.courses.length,
    publishedCourses: db.courses.filter((c) => c.published).length,
    enrollments: db.enrollments.length,
    completed: db.enrollments.filter((e) => e.status === "completed").length,
    certificates: db.certificates.length,
    bundles: db.bundles.length,
    revenueCents: db.enrollments.reduce((sum, e) => {
      const course = db.courses.find((c) => c.id === e.courseId);
      return sum + (course?.priceCents ?? 0);
    }, 0),
  };
}

export type { CourseModule, ExamQuestion };
