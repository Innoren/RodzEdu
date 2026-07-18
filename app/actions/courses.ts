"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "course";
  let slug = root;
  let n = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

/* ---------------------------------- Enrollment --------------------------------- */

export async function enrollAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=/courses`);
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) {
    redirect("/courses");
  }

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (existing && existing.status === "ACTIVE") {
    redirect(`/learn/${courseId}`);
  }

  // Free courses or environments without Stripe use the built-in demo flow.
  if (course.priceCents === 0 || !isStripeEnabled()) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: { status: "ACTIVE" },
      create: { userId: user.id, courseId, status: "ACTIVE" },
    });
    redirect(`/learn/${courseId}?enrolled=1`);
  }

  // Paid course with Stripe configured -> Checkout Session.
  const stripe = getStripe();
  if (!stripe) redirect(`/learn/${courseId}`);

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: { status: "PENDING" },
    create: { userId: user.id, courseId, status: "PENDING" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: course.priceCents,
          product_data: {
            name: course.title,
            description: course.summary,
          },
        },
      },
    ],
    customer_email: user.email,
    metadata: { userId: user.id, courseId },
    success_url: `${appUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/courses/${course.slug}?canceled=1`,
  });

  redirect(session.url!);
}

/* ----------------------------------- Progress ---------------------------------- */

export async function toggleLessonAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const completed = formData.get("completed") === "true";

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment) redirect(`/courses`);

  await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
    },
    update: { completed, completedAt: completed ? new Date() : null },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  revalidatePath(`/learn/${courseId}`);
  revalidatePath(`/dashboard`);
}

/* ------------------------------- Teacher: courses ------------------------------ */

async function requireTeacher() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/teacher");
  if (user.role !== "TEACHER") redirect("/dashboard");
  return user;
}

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  summary: z.string().min(10, "Please add a short summary"),
  description: z.string().min(10, "Please add a course description"),
  category: z.string().min(2, "Please choose a category"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  credits: z.coerce.number().min(0, "Credits cannot be negative"),
  published: z.union([z.literal("on"), z.null(), z.string()]).optional(),
});

export async function createCourseAction(formData: FormData) {
  const teacher = await requireTeacher();
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    category: formData.get("category"),
    imageUrl: formData.get("imageUrl") ?? "",
    price: formData.get("price"),
    credits: formData.get("credits"),
    published: formData.get("published"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/teacher/courses/new?error=${encodeURIComponent(msg)}`);
  }

  const d = parsed.data;
  const course = await prisma.course.create({
    data: {
      title: d.title,
      slug: await uniqueSlug(d.title),
      summary: d.summary,
      description: d.description,
      category: d.category,
      imageUrl: d.imageUrl || null,
      priceCents: Math.round(d.price * 100),
      credits: d.credits,
      published: d.published === "on",
      instructorId: teacher.id,
    },
  });

  revalidatePath("/teacher");
  revalidatePath("/courses");
  redirect(`/teacher/courses/${course.id}`);
}

export async function updateCourseAction(formData: FormData) {
  const teacher = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course || course.instructorId !== teacher.id) redirect("/teacher");

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    category: formData.get("category"),
    imageUrl: formData.get("imageUrl") ?? "",
    price: formData.get("price"),
    credits: formData.get("credits"),
    published: formData.get("published"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/teacher/courses/${id}?error=${encodeURIComponent(msg)}`);
  }

  const d = parsed.data;
  await prisma.course.update({
    where: { id },
    data: {
      title: d.title,
      summary: d.summary,
      description: d.description,
      category: d.category,
      imageUrl: d.imageUrl || null,
      priceCents: Math.round(d.price * 100),
      credits: d.credits,
      published: d.published === "on",
    },
  });

  revalidatePath(`/teacher/courses/${id}`);
  revalidatePath("/teacher");
  revalidatePath("/courses");
  redirect(`/teacher/courses/${id}?saved=1`);
}

export async function deleteCourseAction(formData: FormData) {
  const teacher = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const course = await prisma.course.findUnique({ where: { id } });
  if (course && course.instructorId === teacher.id) {
    await prisma.course.delete({ where: { id } });
  }
  revalidatePath("/teacher");
  redirect("/teacher");
}

/* ------------------------------- Teacher: lessons ------------------------------ */

const lessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3, "Lesson title is too short"),
  content: z.string().min(10, "Lesson content is too short"),
});

export async function addLessonAction(formData: FormData) {
  const teacher = await requireTeacher();
  const parsed = lessonSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    const cid = String(formData.get("courseId") ?? "");
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/teacher/courses/${cid}?error=${encodeURIComponent(msg)}`);
  }

  const { courseId, title, content } = parsed.data;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== teacher.id) redirect("/teacher");

  const count = await prisma.lesson.count({ where: { courseId } });
  await prisma.lesson.create({
    data: { courseId, title, content, order: count },
  });

  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath(`/learn/${courseId}`);
  redirect(`/teacher/courses/${courseId}?lesson=added`);
}

export async function deleteLessonAction(formData: FormData) {
  const teacher = await requireTeacher();
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true },
  });
  if (lesson && lesson.course.instructorId === teacher.id) {
    await prisma.lesson.delete({ where: { id: lessonId } });
  }
  revalidatePath(`/teacher/courses/${courseId}`);
  redirect(`/teacher/courses/${courseId}`);
}
