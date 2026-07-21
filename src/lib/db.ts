import { promises as fs } from "fs";
import path from "path";
import { seedData } from "./seed";
import type {
  Course,
  Database,
  Enrollment,
  EnrollmentStatus,
  SiteSettings,
  User,
} from "./types";

// On Vercel the deploy filesystem is read-only; persist runtime data in /tmp.
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "rodzedu-data")
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "store.json");

declare global {
  // Persist runtime DB across hot reloads / warm serverless invocations.
  var __rodzeduDb: Database | undefined;
}

async function ensureDb(): Promise<Database> {
  if (globalThis.__rodzeduDb) {
    return globalThis.__rodzeduDb;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    globalThis.__rodzeduDb = JSON.parse(raw) as Database;
  } catch {
    globalThis.__rodzeduDb = structuredClone(seedData);
    await fs.writeFile(DB_PATH, JSON.stringify(globalThis.__rodzeduDb, null, 2), "utf8");
  }
  return globalThis.__rodzeduDb;
}

async function writeDb(db: Database): Promise<void> {
  globalThis.__rodzeduDb = db;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function getDb(): Promise<Database> {
  return ensureDb();
}

export async function getSettings(): Promise<SiteSettings> {
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
  input: Omit<Course, "id" | "createdAt" | "updatedAt" | "slug"> & {
    slug?: string;
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
    examQuestions: input.examQuestions,
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
): Promise<{ enrollment: Enrollment; score: number; passed: boolean } | null> {
  const db = await ensureDb();
  const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) return null;

  const course = db.courses.find((c) => c.id === enrollment.courseId);
  if (!course) return null;

  const total = course.examQuestions.length;
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
  if (passed) {
    enrollment.status = "completed";
    enrollment.completedAt = now;
    enrollment.progressPercent = 100;
  }

  await writeDb(db);
  return { enrollment, score, passed };
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
    revenueCents: db.enrollments.reduce((sum, e) => {
      const course = db.courses.find((c) => c.id === e.courseId);
      return sum + (course?.priceCents ?? 0);
    }, 0),
  };
}
