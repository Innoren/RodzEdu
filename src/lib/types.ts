export type Role = "student" | "teacher" | "admin" | "ceo";

export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  teacherId?: string;
};

export type ExamQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
};

export type CourseModule = {
  id: string;
  title: string;
  content: string;
  /** Optional short quiz required to mark the module complete. */
  quizQuestions: ExamQuestion[];
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  category: string;
  credits: number;
  priceCents: number;
  description: string;
  published: boolean;
  /** Legacy overview text; modules are the primary learning path. */
  content: string;
  modules: CourseModule[];
  examQuestions: ExamQuestion[];
  instructorId?: string;
  createdAt: string;
  updatedAt: string;
};

export type EnrollmentStatus =
  | "purchased"
  | "in_progress"
  | "exam_ready"
  | "exam_passed"
  | "exam_failed"
  | "completed";

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progressPercent: number;
  completedModuleIds: string[];
  certificateId?: string;
  score?: number;
  purchasedAt: string;
  completedAt?: string;
  lastActivityAt: string;
};

export type Certificate = {
  id: string;
  enrollmentId: string;
  userId: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  credits: number;
  score: number;
  issuedAt: string;
  certificateNumber: string;
};

export type Bundle = {
  id: string;
  title: string;
  slug: string;
  description: string;
  courseIds: string[];
  priceCents: number;
  published: boolean;
  createdAt: string;
};

export type DiscountCode = {
  id: string;
  code: string;
  /** Percent off 1–100, or omit when using amountOffCents. */
  percentOff?: number;
  /** Fixed cents off, or omit when using percentOff. */
  amountOffCents?: number;
  active: boolean;
  maxRedemptions?: number;
  redemptionCount: number;
  expiresAt?: string;
  createdAt: string;
};

export type SiteSettings = {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  announcement: string;
};

export type Database = {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  bundles: Bundle[];
  discountCodes: DiscountCode[];
  settings: SiteSettings;
};
