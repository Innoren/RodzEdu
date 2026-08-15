import { Pool } from "pg";
import { neon } from "@neondatabase/serverless";
import { normalizeDatabase } from "@/lib/normalize";
import type {
  Bundle,
  Certificate,
  Course,
  CourseReview,
  Database,
  DiscountCode,
  Enrollment,
  FaqItem,
  SiteSettings,
  SupportTicket,
  Testimonial,
  User,
} from "@/lib/types";

let pool: Pool | null = null;
let schemaReady = false;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function getPool() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

function getSql() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return neon(process.env.DATABASE_URL!);
}

export async function ensureNeonSchema() {
  if (schemaReady) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_meta (
      id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      version integer NOT NULL DEFAULT 1
    );
    INSERT INTO app_meta (id, version) VALUES (1, 1) ON CONFLICT (id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password text NOT NULL,
      name text NOT NULL,
      role text NOT NULL,
      teacher_id text,
      credentials text,
      bio text,
      photo_url text
    );

    CREATE TABLE IF NOT EXISTS courses (
      id text PRIMARY KEY,
      title text NOT NULL,
      slug text NOT NULL UNIQUE,
      category text NOT NULL,
      credits integer NOT NULL,
      price_cents integer NOT NULL,
      description text NOT NULL,
      published boolean NOT NULL DEFAULT false,
      featured boolean NOT NULL DEFAULT false,
      max_exam_attempts integer NOT NULL DEFAULT 3,
      content text NOT NULL DEFAULT '',
      modules jsonb NOT NULL DEFAULT '[]'::jsonb,
      exam_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
      instructor_id text,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      status text NOT NULL,
      progress_percent integer NOT NULL DEFAULT 0,
      completed_module_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      certificate_id text,
      score integer,
      exam_attempt_count integer NOT NULL DEFAULT 0,
      purchased_at timestamptz NOT NULL,
      completed_at timestamptz,
      last_activity_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id text PRIMARY KEY,
      enrollment_id text NOT NULL,
      user_id text NOT NULL,
      course_id text NOT NULL,
      student_name text NOT NULL,
      course_title text NOT NULL,
      credits integer NOT NULL,
      score integer NOT NULL,
      issued_at timestamptz NOT NULL,
      certificate_number text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bundles (
      id text PRIMARY KEY,
      title text NOT NULL,
      slug text NOT NULL UNIQUE,
      description text NOT NULL,
      course_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      price_cents integer NOT NULL,
      published boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discount_codes (
      id text PRIMARY KEY,
      code text NOT NULL UNIQUE,
      percent_off integer,
      amount_off_cents integer,
      active boolean NOT NULL DEFAULT true,
      max_redemptions integer,
      redemption_count integer NOT NULL DEFAULT 0,
      expires_at timestamptz,
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id text PRIMARY KEY,
      course_id text NOT NULL,
      user_id text NOT NULL,
      user_name text NOT NULL,
      rating integer NOT NULL,
      comment text NOT NULL,
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      subject text NOT NULL,
      message text NOT NULL,
      course_id text,
      user_id text,
      status text NOT NULL,
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id text PRIMARY KEY,
      question text NOT NULL,
      answer text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id text PRIMARY KEY,
      name text NOT NULL,
      credentials text NOT NULL,
      quote text NOT NULL,
      published boolean NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS settings (
      id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      company_name text NOT NULL,
      tagline text NOT NULL,
      phone text NOT NULL DEFAULT '',
      email text NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      announcement text NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS fulfilled_checkout_sessions (
      session_id text PRIMARY KEY,
      fulfilled_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  schemaReady = true;
}

function asIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function asJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function loadDatabaseFromNeon(): Promise<Database | null> {
  await ensureNeonSchema();
  const sql = getSql();

  const settingsRows = await sql`SELECT * FROM settings WHERE id = 1`;
  if (settingsRows.length === 0) return null;

  const [
    userRows,
    courseRows,
    enrollmentRows,
    certificateRows,
    bundleRows,
    discountRows,
    reviewRows,
    ticketRows,
    faqRows,
    testimonialRows,
    sessionRows,
  ] = await Promise.all([
    sql`SELECT * FROM users ORDER BY email`,
    sql`SELECT * FROM courses ORDER BY created_at DESC`,
    sql`SELECT * FROM enrollments ORDER BY purchased_at DESC`,
    sql`SELECT * FROM certificates ORDER BY issued_at DESC`,
    sql`SELECT * FROM bundles ORDER BY created_at DESC`,
    sql`SELECT * FROM discount_codes ORDER BY created_at DESC`,
    sql`SELECT * FROM reviews ORDER BY created_at DESC`,
    sql`SELECT * FROM tickets ORDER BY created_at DESC`,
    sql`SELECT * FROM faqs ORDER BY sort_order ASC`,
    sql`SELECT * FROM testimonials`,
    sql`SELECT session_id FROM fulfilled_checkout_sessions ORDER BY fulfilled_at DESC`,
  ]);

  const settingsRow = settingsRows[0];
  const settings: SiteSettings = {
    companyName: String(settingsRow.company_name),
    tagline: String(settingsRow.tagline),
    phone: String(settingsRow.phone || ""),
    email: String(settingsRow.email || ""),
    address: String(settingsRow.address || ""),
    announcement: String(settingsRow.announcement || ""),
  };

  const users: User[] = userRows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    password: String(row.password),
    name: String(row.name),
    role: row.role as User["role"],
    teacherId: row.teacher_id ? String(row.teacher_id) : undefined,
    credentials: row.credentials ? String(row.credentials) : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    photoUrl: row.photo_url ? String(row.photo_url) : undefined,
  }));

  const courses: Course[] = courseRows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    category: String(row.category),
    credits: Number(row.credits),
    priceCents: Number(row.price_cents),
    description: String(row.description),
    published: Boolean(row.published),
    featured: Boolean(row.featured),
    maxExamAttempts: Number(row.max_exam_attempts),
    content: String(row.content || ""),
    modules: asJsonArray(row.modules),
    examQuestions: asJsonArray(row.exam_questions),
    instructorId: row.instructor_id ? String(row.instructor_id) : undefined,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  }));

  const enrollments: Enrollment[] = enrollmentRows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    courseId: String(row.course_id),
    status: row.status as Enrollment["status"],
    progressPercent: Number(row.progress_percent),
    completedModuleIds: asJsonArray<string>(row.completed_module_ids),
    certificateId: row.certificate_id ? String(row.certificate_id) : undefined,
    score:
      row.score === null || row.score === undefined
        ? undefined
        : Number(row.score),
    examAttemptCount: Number(row.exam_attempt_count || 0),
    purchasedAt: asIso(row.purchased_at),
    completedAt: row.completed_at ? asIso(row.completed_at) : undefined,
    lastActivityAt: asIso(row.last_activity_at),
  }));

  const certificates: Certificate[] = certificateRows.map((row) => ({
    id: String(row.id),
    enrollmentId: String(row.enrollment_id),
    userId: String(row.user_id),
    courseId: String(row.course_id),
    studentName: String(row.student_name),
    courseTitle: String(row.course_title),
    credits: Number(row.credits),
    score: Number(row.score),
    issuedAt: asIso(row.issued_at),
    certificateNumber: String(row.certificate_number),
  }));

  const bundles: Bundle[] = bundleRows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    description: String(row.description),
    courseIds: asJsonArray<string>(row.course_ids),
    priceCents: Number(row.price_cents),
    published: Boolean(row.published),
    createdAt: asIso(row.created_at),
  }));

  const discountCodes: DiscountCode[] = discountRows.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    percentOff:
      row.percent_off === null || row.percent_off === undefined
        ? undefined
        : Number(row.percent_off),
    amountOffCents:
      row.amount_off_cents === null || row.amount_off_cents === undefined
        ? undefined
        : Number(row.amount_off_cents),
    active: Boolean(row.active),
    maxRedemptions:
      row.max_redemptions === null || row.max_redemptions === undefined
        ? undefined
        : Number(row.max_redemptions),
    redemptionCount: Number(row.redemption_count || 0),
    expiresAt: row.expires_at ? asIso(row.expires_at) : undefined,
    createdAt: asIso(row.created_at),
  }));

  const reviews: CourseReview[] = reviewRows.map((row) => ({
    id: String(row.id),
    courseId: String(row.course_id),
    userId: String(row.user_id),
    userName: String(row.user_name),
    rating: Number(row.rating),
    comment: String(row.comment),
    createdAt: asIso(row.created_at),
  }));

  const tickets: SupportTicket[] = ticketRows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    subject: String(row.subject),
    message: String(row.message),
    courseId: row.course_id ? String(row.course_id) : undefined,
    userId: row.user_id ? String(row.user_id) : undefined,
    status: row.status as SupportTicket["status"],
    createdAt: asIso(row.created_at),
  }));

  const faqs: FaqItem[] = faqRows.map((row) => ({
    id: String(row.id),
    question: String(row.question),
    answer: String(row.answer),
    sortOrder: Number(row.sort_order),
  }));

  const testimonials: Testimonial[] = testimonialRows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    credentials: String(row.credentials),
    quote: String(row.quote),
    published: Boolean(row.published),
  }));

  return normalizeDatabase({
    users,
    courses,
    enrollments,
    certificates,
    bundles,
    discountCodes,
    reviews,
    tickets,
    faqs,
    testimonials,
    settings,
    fulfilledCheckoutSessions: sessionRows.map((row) => String(row.session_id)),
  });
}

export async function saveDatabaseToNeon(db: Database): Promise<void> {
  await ensureNeonSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(84215045)");

    await client.query("DELETE FROM fulfilled_checkout_sessions");
    await client.query("DELETE FROM reviews");
    await client.query("DELETE FROM tickets");
    await client.query("DELETE FROM certificates");
    await client.query("DELETE FROM enrollments");
    await client.query("DELETE FROM discount_codes");
    await client.query("DELETE FROM bundles");
    await client.query("DELETE FROM faqs");
    await client.query("DELETE FROM testimonials");
    await client.query("DELETE FROM courses");
    await client.query("DELETE FROM users");
    await client.query("DELETE FROM settings");

    await client.query(
      `INSERT INTO settings (
        id, company_name, tagline, phone, email, address, announcement
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        1,
        db.settings.companyName,
        db.settings.tagline,
        db.settings.phone,
        db.settings.email,
        db.settings.address,
        db.settings.announcement,
      ],
    );

    for (const user of db.users) {
      await client.query(
        `INSERT INTO users (
          id, email, password, name, role, teacher_id, credentials, bio, photo_url
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          user.id,
          user.email,
          user.password,
          user.name,
          user.role,
          user.teacherId || null,
          user.credentials || null,
          user.bio || null,
          user.photoUrl || null,
        ],
      );
    }

    for (const course of db.courses) {
      await client.query(
        `INSERT INTO courses (
          id, title, slug, category, credits, price_cents, description,
          published, featured, max_exam_attempts, content, modules, exam_questions,
          instructor_id, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16)`,
        [
          course.id,
          course.title,
          course.slug,
          course.category,
          course.credits,
          course.priceCents,
          course.description,
          course.published,
          course.featured,
          course.maxExamAttempts,
          course.content,
          JSON.stringify(course.modules),
          JSON.stringify(course.examQuestions),
          course.instructorId || null,
          course.createdAt,
          course.updatedAt,
        ],
      );
    }

    for (const enrollment of db.enrollments) {
      await client.query(
        `INSERT INTO enrollments (
          id, user_id, course_id, status, progress_percent, completed_module_ids,
          certificate_id, score, exam_attempt_count, purchased_at, completed_at,
          last_activity_at
        ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12)`,
        [
          enrollment.id,
          enrollment.userId,
          enrollment.courseId,
          enrollment.status,
          enrollment.progressPercent,
          JSON.stringify(enrollment.completedModuleIds || []),
          enrollment.certificateId || null,
          enrollment.score ?? null,
          enrollment.examAttemptCount || 0,
          enrollment.purchasedAt,
          enrollment.completedAt || null,
          enrollment.lastActivityAt,
        ],
      );
    }

    for (const certificate of db.certificates) {
      await client.query(
        `INSERT INTO certificates (
          id, enrollment_id, user_id, course_id, student_name, course_title,
          credits, score, issued_at, certificate_number
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          certificate.id,
          certificate.enrollmentId,
          certificate.userId,
          certificate.courseId,
          certificate.studentName,
          certificate.courseTitle,
          certificate.credits,
          certificate.score,
          certificate.issuedAt,
          certificate.certificateNumber,
        ],
      );
    }

    for (const bundle of db.bundles) {
      await client.query(
        `INSERT INTO bundles (
          id, title, slug, description, course_ids, price_cents, published, created_at
        ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)`,
        [
          bundle.id,
          bundle.title,
          bundle.slug,
          bundle.description,
          JSON.stringify(bundle.courseIds),
          bundle.priceCents,
          bundle.published,
          bundle.createdAt,
        ],
      );
    }

    for (const discount of db.discountCodes) {
      await client.query(
        `INSERT INTO discount_codes (
          id, code, percent_off, amount_off_cents, active, max_redemptions,
          redemption_count, expires_at, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          discount.id,
          discount.code,
          discount.percentOff ?? null,
          discount.amountOffCents ?? null,
          discount.active,
          discount.maxRedemptions ?? null,
          discount.redemptionCount,
          discount.expiresAt || null,
          discount.createdAt,
        ],
      );
    }

    for (const review of db.reviews) {
      await client.query(
        `INSERT INTO reviews (
          id, course_id, user_id, user_name, rating, comment, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          review.id,
          review.courseId,
          review.userId,
          review.userName,
          review.rating,
          review.comment,
          review.createdAt,
        ],
      );
    }

    for (const ticket of db.tickets) {
      await client.query(
        `INSERT INTO tickets (
          id, name, email, subject, message, course_id, user_id, status, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          ticket.id,
          ticket.name,
          ticket.email,
          ticket.subject,
          ticket.message,
          ticket.courseId || null,
          ticket.userId || null,
          ticket.status,
          ticket.createdAt,
        ],
      );
    }

    for (const faq of db.faqs) {
      await client.query(
        `INSERT INTO faqs (id, question, answer, sort_order) VALUES ($1,$2,$3,$4)`,
        [faq.id, faq.question, faq.answer, faq.sortOrder],
      );
    }

    for (const testimonial of db.testimonials) {
      await client.query(
        `INSERT INTO testimonials (id, name, credentials, quote, published)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          testimonial.id,
          testimonial.name,
          testimonial.credentials,
          testimonial.quote,
          testimonial.published,
        ],
      );
    }

    for (const sessionId of db.fulfilledCheckoutSessions || []) {
      await client.query(
        `INSERT INTO fulfilled_checkout_sessions (session_id)
         VALUES ($1) ON CONFLICT (session_id) DO NOTHING`,
        [sessionId],
      );
    }

    await client.query(`UPDATE app_meta SET version = version + 1 WHERE id = 1`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
