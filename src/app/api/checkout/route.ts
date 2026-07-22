import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSessionUser } from "@/lib/auth";
import {
  enrollUserInCourses,
  findDiscountCode,
  getBundleById,
  getCourseById,
  priceWithDiscount,
  redeemDiscountCode,
} from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "student") {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const form = await request.formData();
  const courseId = String(form.get("courseId") || "");
  const bundleId = String(form.get("bundleId") || "");
  const discountRaw = String(form.get("discountCode") || "").trim();

  const origin = new URL(request.url).origin;
  const secret = process.env.STRIPE_SECRET_KEY;

  let title = "";
  let description = "";
  let priceCents = 0;
  let successSlug = "";
  let courseIds: string[] = [];

  if (bundleId) {
    const bundle = await getBundleById(bundleId);
    if (!bundle || !bundle.published) {
      return NextResponse.redirect(
        new URL("/courses?error=missing", request.url),
        303,
      );
    }
    title = bundle.title;
    description = bundle.description;
    priceCents = bundle.priceCents;
    successSlug = bundle.slug;
    courseIds = bundle.courseIds;
  } else {
    const course = await getCourseById(courseId);
    if (!course || !course.published) {
      return NextResponse.redirect(
        new URL("/courses?error=missing", request.url),
        303,
      );
    }
    title = course.title;
    description = `${course.credits} CE credits · ${course.category}`;
    priceCents = course.priceCents;
    successSlug = course.slug;
    courseIds = [course.id];
  }

  let discountCode = discountRaw;
  if (discountCode) {
    const discount = await findDiscountCode(discountCode);
    const priced = priceWithDiscount(priceCents, discount);
    if (!discount || priced.discountCents <= 0) {
      return NextResponse.redirect(
        new URL(
          bundleId
            ? `/bundles/${successSlug}?error=discount`
            : `/courses/${successSlug}?error=discount`,
          request.url,
        ),
        303,
      );
    }
    priceCents = priced.finalCents;
    discountCode = discount.code;
  }

  async function finalizeEnrollment() {
    await enrollUserInCourses(user!.id, courseIds);
    if (discountCode) await redeemDiscountCode(discountCode);
  }

  if (!secret || priceCents === 0) {
    await finalizeEnrollment();
    return NextResponse.redirect(
      new URL(`/student?purchased=${successSlug}`, request.url),
      303,
    );
  }

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/student?purchased=${successSlug}`,
    cancel_url: bundleId
      ? `${origin}/bundles/${successSlug}`
      : `${origin}/courses/${successSlug}`,
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: priceCents,
          product_data: {
            name: title,
            description,
          },
        },
      },
    ],
    metadata: {
      userId: user.id,
      courseId: courseIds[0] || "",
      courseIds: courseIds.join(","),
      bundleId: bundleId || "",
      discountCode: discountCode || "",
    },
  });

  if (!session.url) {
    return NextResponse.redirect(
      new URL(
        bundleId
          ? `/bundles/${successSlug}?error=checkout`
          : `/courses/${successSlug}?error=checkout`,
        request.url,
      ),
      303,
    );
  }

  await finalizeEnrollment();
  return NextResponse.redirect(session.url, 303);
}
