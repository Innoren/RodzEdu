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

export type Course = {
  id: string;
  title: string;
  slug: string;
  category: string;
  credits: number;
  priceCents: number;
  description: string;
  published: boolean;
  content: string;
  examQuestions: ExamQuestion[];
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
  score?: number;
  purchasedAt: string;
  completedAt?: string;
  lastActivityAt: string;
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
  settings: SiteSettings;
};
