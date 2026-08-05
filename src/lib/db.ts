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
  CourseReview,
  Database,
  DiscountCode,
  Enrollment,
  EnrollmentStatus,
  ExamAnswerReview,
  ExamQuestion,
  FaqItem,
  SiteSettings,
  SupportTicket,
  Testimonial,
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

/** Fill growth-feature collections on older stores that predate them. */
function migrateGrowthCollections(db: Database): boolean {
  let dirty = false;

  if (!db.faqs.length) {
    db.faqs = structuredClone(seedData.faqs);
    dirty = true;
  }
  if (!db.testimonials.length) {
    db.testimonials = structuredClone(seedData.testimonials);
    dirty = true;
  }
  if (!db.reviews.length && db.courses.length) {
    const courseIds = new Set(db.courses.map((c) => c.id));
    const seededReviews = structuredClone(seedData.reviews).filter((r) =>
      courseIds.has(r.courseId),
    );
    if (seededReviews.length) {
      db.reviews = seededReviews;
      dirty = true;
    }
  }
  if (db.courses.length && !db.courses.some((c) => c.featured)) {
    for (const course of db.courses.filter((c) => c.published).slice(0, 2)) {
      course.featured = true;
      dirty = true;
    }
  }
  for (const seedUser of seedData.users) {
    if (seedUser.role !== "teacher" || !seedUser.bio) continue;
    const user = db.users.find((u) => u.email === seedUser.email);
    if (user && !user.bio) {
      user.bio = seedUser.bio;
      user.credentials = seedUser.credentials;
      dirty = true;
    }
  }

  const ceo = db.users.find(
    (u) => u.role === "ceo" || u.email === "ceo@rodzedu.com",
  );
  if (ceo && ceo.name !== "Pedro Rodriguez") {
    ceo.name = "Pedro Rodriguez";
    dirty = true;
  }

  // Backfill exam answer explanations onto existing courses when missing.
  for (const seedCourse of seedData.courses) {
    const live = db.courses.find((c) => c.id === seedCourse.id);
    if (!live) continue;
    for (const seedQ of seedCourse.examQuestions) {
      if (!seedQ.explanation) continue;
      const liveQ = live.examQuestions.find((q) => q.id === seedQ.id);
      if (liveQ && !liveQ.explanation) {
        liveQ.explanation = seedQ.explanation;
        dirty = true;
      }
    }
  }

  return dirty;
}

async function persistMigrated(db: Database): Promise<Database> {
  if (migrateGrowthCollections(db)) {
    globalThis.__rodzeduDb = db;
    await writeDb(db);
    return db;
  }
  globalThis.__rodzeduDb = db;
  return db;
}

/**
 * Load the database. When Blob is configured, always read fresh from Blob so
 * progress writes are not lost to a stale in-memory copy (common on serverless).
 */
async function ensureDb(): Promise<Database> {
  const fromBlob = await readDbFromBlob();
  if (fromBlob) {
    return persistMigrated(normalizeDatabase(fromBlob));
  }

  if (globalThis.__rodzeduDb) {
    return globalThis.__rodzeduDb;
  }

  const fromFile = await readDbFromFile();
  if (fromFile) {
    const db = normalizeDatabase(fromFile);
    migrateGrowthCollections(db);
    globalThis.__rodzeduDb = db;
    await writeDbToFile(db);
    await writeDbToBlob(db);
    return db;
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
  // Refresh settings from Blob without replacing enrollments/courses in memory —
  // replacing the whole DB here raced with module-complete writes and wiped progress.
  if (hasBlobStore()) {
    const fromBlob = await readDbFromBlob();
    if (fromBlob) {
      const freshSettings = normalizeDatabase(fromBlob).settings;
      if (globalThis.__rodzeduDb) {
        globalThis.__rodzeduDb.settings = freshSettings;
      } else {
        globalThis.__rodzeduDb = normalizeDatabase(fromBlob);
      }
      return freshSettings;
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
    featured: Boolean(input.featured),
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
    })
    .filter((row) => Boolean(row.course));
}

/** Teacher: assigned students only. Admin/CEO: all student enrollments. */
export async function listEnrollmentsForStaff(
  actor: Pick<User, "id" | "role">,
): Promise<{ student: User; enrollment: Enrollment; course: Course }[]> {
  if (actor.role === "teacher") {
    return listEnrollmentsForTeacher(actor.id);
  }
  if (actor.role !== "admin" && actor.role !== "ceo") {
    return [];
  }

  const db = await ensureDb();
  return db.enrollments
    .map((enrollment) => {
      const student = db.users.find(
        (u) => u.id === enrollment.userId && u.role === "student",
      );
      const course = db.courses.find((c) => c.id === enrollment.courseId);
      if (!student || !course) return null;
      return { student, enrollment, course };
    })
    .filter((row): row is { student: User; enrollment: Enrollment; course: Course } =>
      Boolean(row),
    );
}

export async function listStudentsForStaff(
  actor: Pick<User, "id" | "role">,
): Promise<User[]> {
  const db = await ensureDb();
  if (actor.role === "teacher") {
    return db.users.filter(
      (u) => u.role === "student" && u.teacherId === actor.id,
    );
  }
  if (actor.role === "admin" || actor.role === "ceo") {
    return db.users.filter((u) => u.role === "student");
  }
  return [];
}

export async function staffCanManageStudent(
  actor: Pick<User, "id" | "role">,
  studentId: string,
): Promise<boolean> {
  if (actor.role === "admin" || actor.role === "ceo") return true;
  if (actor.role !== "teacher") return false;
  const db = await ensureDb();
  const student = db.users.find((u) => u.id === studentId && u.role === "student");
  return Boolean(student && student.teacherId === actor.id);
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

function clearEnrollmentProgress(enrollment: Enrollment) {
  enrollment.completedModuleIds = [];
  enrollment.progressPercent = 0;
  enrollment.status = "purchased";
  enrollment.score = undefined;
  enrollment.completedAt = undefined;
  enrollment.certificateId = undefined;
  enrollment.lastActivityAt = new Date().toISOString();
}

/** Reset module completion / exam progress for an enrollment. */
export async function resetEnrollmentModules(
  enrollmentId: string,
): Promise<Enrollment | { error: string }> {
  const db = await ensureDb();
  const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) return { error: "Enrollment not found." };

  clearEnrollmentProgress(enrollment);
  // Remove certificate tied to this enrollment so the student must re-earn it.
  db.certificates = db.certificates.filter(
    (c) => c.enrollmentId !== enrollmentId,
  );
  await writeDb(db);
  return enrollment;
}

/** Reset every student enrollment (modules, exam status, certificates). */
export async function resetAllStudentProgress(): Promise<{
  enrollmentsReset: number;
  certificatesRemoved: number;
}> {
  const db = await ensureDb();
  const studentIds = new Set(
    db.users.filter((u) => u.role === "student").map((u) => u.id),
  );
  let enrollmentsReset = 0;
  for (const enrollment of db.enrollments) {
    if (!studentIds.has(enrollment.userId)) continue;
    clearEnrollmentProgress(enrollment);
    enrollmentsReset += 1;
  }
  const before = db.certificates.length;
  db.certificates = db.certificates.filter((c) => !studentIds.has(c.userId));
  const certificatesRemoved = before - db.certificates.length;
  await writeDb(db);
  return { enrollmentsReset, certificatesRemoved };
}

/** Remove all courses and course-linked enrollments, certificates, bundles, reviews. */
export async function clearAllCourses(): Promise<{
  coursesRemoved: number;
  enrollmentsRemoved: number;
  certificatesRemoved: number;
  bundlesRemoved: number;
  reviewsRemoved: number;
}> {
  const db = await ensureDb();
  const coursesRemoved = db.courses.length;
  const enrollmentsRemoved = db.enrollments.length;
  const certificatesRemoved = db.certificates.length;
  const bundlesRemoved = db.bundles.length;
  const reviewsRemoved = db.reviews.length;

  db.courses = [];
  db.enrollments = [];
  db.certificates = [];
  db.bundles = [];
  db.reviews = [];
  // Drop course references from open support tickets.
  for (const ticket of db.tickets) {
    if (ticket.courseId) delete ticket.courseId;
  }

  await writeDb(db);
  return {
    coursesRemoved,
    enrollmentsRemoved,
    certificatesRemoved,
    bundlesRemoved,
    reviewsRemoved,
  };
}

/** Move an enrollment to a different course and reset progress. */
export async function reassignEnrollmentCourse(
  enrollmentId: string,
  courseId: string,
): Promise<Enrollment | { error: string }> {
  const db = await ensureDb();
  const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) return { error: "Enrollment not found." };

  const course = db.courses.find((c) => c.id === courseId && c.published);
  if (!course) return { error: "Published course not found." };

  const duplicate = db.enrollments.find(
    (e) =>
      e.id !== enrollmentId &&
      e.userId === enrollment.userId &&
      e.courseId === courseId,
  );
  if (duplicate) {
    return { error: "Student is already enrolled in that course." };
  }

  enrollment.courseId = courseId;
  clearEnrollmentProgress(enrollment);
  db.certificates = db.certificates.filter(
    (c) => c.enrollmentId !== enrollmentId,
  );
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
  review: ExamAnswerReview[];
} | null> {
  const db = await ensureDb();
  const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) return null;

  const course = db.courses.find((c) => c.id === enrollment.courseId);
  const student = db.users.find((u) => u.id === enrollment.userId);
  if (!course || !student) return null;

  const total = course.examQuestions.length || 1;
  let correct = 0;
  const review = course.examQuestions.map((q, i) => {
    const selectedIndex = Number(answers[i]);
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) correct += 1;

    const selectedChoice =
      selectedIndex >= 0 && selectedIndex < q.choices.length
        ? q.choices[selectedIndex]
        : "No answer selected";
    const correctChoice = q.choices[q.correctIndex] || "Correct answer";
    const correctReason =
      q.explanation?.trim() ||
      `"${correctChoice}" is correct based on the course material for this topic.`;
    const incorrectReason = isCorrect
      ? ""
      : `"${selectedChoice}" is not correct for this question. It does not match the principle or definition being tested.`;

    return {
      questionId: q.id,
      prompt: q.prompt,
      selectedIndex,
      correctIndex: q.correctIndex,
      selectedChoice,
      correctChoice,
      isCorrect,
      incorrectReason,
      correctReason,
    };
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
  return { enrollment, score, passed, certificate, review };
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
  credentials?: string;
  bio?: string;
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
    credentials: input.credentials?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
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
  const revenueCents = db.enrollments.reduce((sum, e) => {
    const course = db.courses.find((c) => c.id === e.courseId);
    return sum + (course?.priceCents ?? 0);
  }, 0);

  const enrollmentsByCourse = new Map<string, number>();
  const completionsByCourse = new Map<string, number>();
  for (const e of db.enrollments) {
    enrollmentsByCourse.set(
      e.courseId,
      (enrollmentsByCourse.get(e.courseId) || 0) + 1,
    );
    if (e.status === "completed") {
      completionsByCourse.set(
        e.courseId,
        (completionsByCourse.get(e.courseId) || 0) + 1,
      );
    }
  }

  const popularCourses = [...enrollmentsByCourse.entries()]
    .map(([courseId, count]) => {
      const course = db.courses.find((c) => c.id === courseId);
      return {
        courseId,
        title: course?.title || "Unknown course",
        enrollments: count,
        completions: completionsByCourse.get(courseId) || 0,
        revenueCents: count * (course?.priceCents || 0),
      };
    })
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 8);

  const instructors = db.users.filter((u) => u.role === "teacher");
  const instructorPerformance = instructors.map((instructor) => {
    const studentIds = new Set(
      db.users
        .filter((u) => u.role === "student" && u.teacherId === instructor.id)
        .map((u) => u.id),
    );
    const related = db.enrollments.filter((e) => studentIds.has(e.userId));
    return {
      instructorId: instructor.id,
      name: instructor.name,
      students: studentIds.size,
      enrollments: related.length,
      completions: related.filter((e) => e.status === "completed").length,
    };
  });

  const openTickets = db.tickets.filter((t) => t.status === "open").length;

  return {
    students: db.users.filter((u) => u.role === "student").length,
    teachers: instructors.length,
    courses: db.courses.length,
    publishedCourses: db.courses.filter((c) => c.published).length,
    enrollments: db.enrollments.length,
    completed: db.enrollments.filter((e) => e.status === "completed").length,
    certificates: db.certificates.length,
    bundles: db.bundles.length,
    reviews: db.reviews.length,
    openTickets,
    revenueCents,
    popularCourses,
    instructorPerformance,
  };
}

export async function listFeaturedCourses(): Promise<Course[]> {
  const db = await ensureDb();
  const featured = db.courses.filter((c) => c.published && c.featured);
  if (featured.length > 0) return featured;
  return db.courses.filter((c) => c.published).slice(0, 3);
}

export async function listReviewsForCourse(
  courseId: string,
): Promise<CourseReview[]> {
  const db = await ensureDb();
  return db.reviews
    .filter((r) => r.courseId === courseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCourseRating(courseId: string): Promise<{
  average: number;
  count: number;
}> {
  const reviews = await listReviewsForCourse(courseId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export async function createReview(input: {
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<CourseReview | { error: string }> {
  const db = await ensureDb();
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  if (!input.comment.trim()) {
    return { error: "Add a short review comment." };
  }
  const existing = db.reviews.find(
    (r) => r.courseId === input.courseId && r.userId === input.userId,
  );
  if (existing) {
    existing.rating = rating;
    existing.comment = input.comment.trim();
    existing.createdAt = new Date().toISOString();
    await writeDb(db);
    return existing;
  }
  const review: CourseReview = {
    id: `review-${Date.now()}`,
    courseId: input.courseId,
    userId: input.userId,
    userName: input.userName,
    rating,
    comment: input.comment.trim(),
    createdAt: new Date().toISOString(),
  };
  db.reviews.unshift(review);
  await writeDb(db);
  return review;
}

export async function createSupportTicket(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  courseId?: string;
  userId?: string;
}): Promise<SupportTicket | { error: string }> {
  const db = await ensureDb();
  if (
    !input.name.trim() ||
    !input.email.trim() ||
    !input.subject.trim() ||
    !input.message.trim()
  ) {
    return { error: "Please fill in all required fields." };
  }
  const ticket: SupportTicket = {
    id: `ticket-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    courseId: input.courseId,
    userId: input.userId,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  db.tickets.unshift(ticket);
  await writeDb(db);
  return ticket;
}

export async function listSupportTickets(): Promise<SupportTicket[]> {
  const db = await ensureDb();
  return [...db.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateSupportTicketStatus(
  id: string,
  status: SupportTicket["status"],
): Promise<SupportTicket | undefined> {
  const db = await ensureDb();
  const ticket = db.tickets.find((t) => t.id === id);
  if (!ticket) return undefined;
  ticket.status = status;
  await writeDb(db);
  return ticket;
}

export async function listFaqs(): Promise<FaqItem[]> {
  const db = await ensureDb();
  return [...db.faqs].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listPublishedTestimonials(): Promise<Testimonial[]> {
  const db = await ensureDb();
  return db.testimonials.filter((t) => t.published);
}

export async function updateInstructorProfile(
  id: string,
  patch: { credentials?: string; bio?: string; photoUrl?: string; name?: string },
): Promise<User | undefined> {
  const db = await ensureDb();
  const user = db.users.find((u) => u.id === id && u.role === "teacher");
  if (!user) return undefined;
  if (patch.name) user.name = patch.name.trim();
  if (patch.credentials !== undefined) user.credentials = patch.credentials.trim();
  if (patch.bio !== undefined) user.bio = patch.bio.trim();
  if (patch.photoUrl !== undefined) user.photoUrl = patch.photoUrl.trim();
  await writeDb(db);
  return user;
}

export type { CourseModule, ExamQuestion, CourseReview, SupportTicket, FaqItem, Testimonial };
