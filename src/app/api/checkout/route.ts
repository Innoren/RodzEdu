import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSessionUser } from "@/lib/auth";
import { enrollUser, getCourseById } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "student") {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const form = await request.formData();
  const courseId = String(form.get("courseId") || "");
  const course = await getCourseById(courseId);

  if (!course || !course.published) {
    return NextResponse.redirect(new URL("/courses?error=missing", request.url), 303);
  }

  const origin = new URL(request.url).origin;
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    await enrollUser(user.id, course.id);
    return NextResponse.redirect(
      new URL(`/student?purchased=${course.slug}`, request.url),
      303,
    );
  }

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/student?purchased=${course.slug}`,
    cancel_url: `${origin}/courses/${course.slug}`,
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: course.priceCents,
          product_data: {
            name: course.title,
            description: `${course.credits} CE credits · ${course.category}`,
          },
        },
      },
    ],
    metadata: {
      userId: user.id,
      courseId: course.id,
    },
  });

  if (!session.url) {
    return NextResponse.redirect(
      new URL(`/courses/${course.slug}?error=checkout`, request.url),
      303,
    );
  }

  // Enroll immediately for demo continuity; webhook can harden this later.
  await enrollUser(user.id, course.id);
  return NextResponse.redirect(session.url, 303);
}
