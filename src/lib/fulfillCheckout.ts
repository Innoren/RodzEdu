import type Stripe from "stripe";
import {
  enrollUserInCourses,
  getBundleById,
  getCourseById,
  markCheckoutSessionFulfilled,
  redeemDiscountCode,
} from "@/lib/db";

export type FulfillResult =
  | {
      ok: true;
      alreadyFulfilled: boolean;
      successSlug: string;
      courseIds: string[];
    }
  | { ok: false; reason: "unpaid" | "incomplete" | "missing_metadata" };

function parseCourseIds(session: Stripe.Checkout.Session): string[] {
  const fromList = String(session.metadata?.courseIds || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (fromList.length) return fromList;
  const single = String(session.metadata?.courseId || "").trim();
  return single ? [single] : [];
}

async function resolveSuccessSlug(
  session: Stripe.Checkout.Session,
  courseIds: string[],
): Promise<string> {
  const fromMeta = String(session.metadata?.successSlug || "").trim();
  if (fromMeta) return fromMeta;

  const bundleId = String(session.metadata?.bundleId || "").trim();
  if (bundleId) {
    const bundle = await getBundleById(bundleId);
    if (bundle?.slug) return bundle.slug;
  }

  const course = courseIds[0] ? await getCourseById(courseIds[0]) : undefined;
  return course?.slug || "course";
}

/**
 * Enroll only after Stripe reports a completed, paid Checkout Session.
 * Safe to call from the webhook and the success redirect (idempotent).
 */
export async function fulfillPaidCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillResult> {
  if (session.status !== "complete") {
    return { ok: false, reason: "incomplete" };
  }

  const amountTotal = session.amount_total ?? 0;
  const paid =
    session.payment_status === "paid" ||
    (amountTotal === 0 && session.payment_status === "no_payment_required");

  if (!paid) {
    return { ok: false, reason: "unpaid" };
  }

  const userId = String(session.metadata?.userId || "").trim();
  const courseIds = parseCourseIds(session);
  if (!userId || courseIds.length === 0) {
    return { ok: false, reason: "missing_metadata" };
  }

  const claimed = await markCheckoutSessionFulfilled(session.id);
  const successSlug = await resolveSuccessSlug(session, courseIds);

  if (!claimed) {
    return {
      ok: true,
      alreadyFulfilled: true,
      successSlug,
      courseIds,
    };
  }

  await enrollUserInCourses(userId, courseIds);

  const discountCode = String(session.metadata?.discountCode || "").trim();
  if (discountCode) {
    await redeemDiscountCode(discountCode);
  }

  return {
    ok: true,
    alreadyFulfilled: false,
    successSlug,
    courseIds,
  };
}
