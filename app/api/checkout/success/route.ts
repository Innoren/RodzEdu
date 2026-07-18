import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const sessionId = req.nextUrl.searchParams.get("session_id");
  const stripe = getStripe();

  if (!stripe || !sessionId) {
    return NextResponse.redirect(`${appUrl}/dashboard`);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const { userId, courseId } = session.metadata ?? {};

  if (session.payment_status === "paid" && userId && courseId) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { status: "ACTIVE", stripeSessionId: sessionId },
      create: {
        userId,
        courseId,
        status: "ACTIVE",
        stripeSessionId: sessionId,
      },
    });
    return NextResponse.redirect(`${appUrl}/learn/${courseId}?enrolled=1`);
  }

  return NextResponse.redirect(`${appUrl}/dashboard`);
}
