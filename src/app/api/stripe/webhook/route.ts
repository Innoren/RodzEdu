import { NextResponse } from "next/server";
import Stripe from "stripe";
import { fulfillPaidCheckoutSession } from "@/lib/fulfillCheckout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(secret);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await fulfillPaidCheckoutSession(session);
    if (!result.ok && result.reason === "missing_metadata") {
      console.error("Stripe checkout missing enrollment metadata", session.id);
      return NextResponse.json(
        { error: "Missing enrollment metadata." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
