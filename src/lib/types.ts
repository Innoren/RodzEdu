export type Role = "student" | "teacher" | "admin" | "ceo";

export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  teacherId?: string;
  /** Public instructor bio fields */
  credentials?: string;
  bio?: string;
  photoUrl?: string;
};

export type ExamQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  /** Shown after exam submit to explain the correct answer. */
  explanation?: string;
};

export type ExamAnswerReview = {
  questionId: string;
  prompt: string;
  selectedIndex: number;
  correctIndex: number;
  selectedChoice: string;
  correctChoice: string;
  isCorrect: boolean;
  /** Why the selected answer is wrong (when incorrect). */
  incorrectReason: string;
  /** Why the correct answer is right. */
  correctReason: string;
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
  featured: boolean;
  /**
   * Max scored final-exam attempts per enrollment.
   * 0 = unlimited, 1 = single attempt, 3 = three attempts (default).
   */
  maxExamAttempts: number;
  /** Legacy overview text; modules are the primary learning path. */
  content: string;
  modules: CourseModule[];
  examQuestions: ExamQuestion[];
  instructorId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CourseReview = {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
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
  /** Number of scored final-exam submissions for this enrollment. */
  examAttemptCount: number;
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

export type SupportTicketStatus = "open" | "in_progress" | "resolved";

export type SupportTicket = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  courseId?: string;
  userId?: string;
  status: SupportTicketStatus;
  createdAt: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type Testimonial = {
  id: string;
  name: string;
  credentials: string;
  quote: string;
  published: boolean;
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
  reviews: CourseReview[];
  tickets: SupportTicket[];
  faqs: FaqItem[];
  testimonials: Testimonial[];
  settings: SiteSettings;
};
