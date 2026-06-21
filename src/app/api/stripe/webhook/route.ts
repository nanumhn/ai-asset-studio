import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { env, isStripeWebhookConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook handler.
 *
 * Verifies the signature with STRIPE_WEBHOOK_SECRET, then reconciles our
 * Subscription rows on checkout / subscription / invoice events.
 *
 * Reads the raw body (required for signature verification).
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !isStripeWebhookConfigured()) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    const message = e instanceof Error ? e.message : "invalid signature";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          await syncSubscription(
            stripe,
            session.subscription as string,
            session.metadata?.userId,
          );
        }
        if (session.mode === "payment" && session.metadata?.imageId) {
          await recordPurchase(
            session.metadata.userId,
            session.metadata.imageId,
            session.payment_intent as string | null,
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(stripe, sub.id, sub.metadata?.userId, sub);
        break;
      }
      default:
        // Unhandled event types are fine — acknowledge.
        break;
    }
  } catch (e) {
    console.error("webhook handling error", e);
    // 200 so Stripe does not retry forever on our DB hiccups in dev; in prod
    // you may prefer a 500 to trigger retries. Keep 200 for MVP resilience.
    return NextResponse.json({ received: true, warning: "handler error logged" });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(
  stripe: Stripe,
  subscriptionId: string,
  userIdHint?: string | null,
  subObj?: Stripe.Subscription,
) {
  const sub = subObj ?? (await stripe.subscriptions.retrieve(subscriptionId));
  const priceId = sub.items.data[0]?.price.id ?? null;
  const plan = planFromPriceId(priceId);
  const userId = userIdHint || (sub.metadata?.userId ?? "");
  if (!userId) return; // cannot map to a user

  const status =
    sub.status === "active" || sub.status === "trialing"
      ? "ACTIVE"
      : sub.status === "past_due"
        ? "PAST_DUE"
        : sub.status === "canceled"
          ? "CANCELED"
          : "INACTIVE";

  const data = {
    plan: plan === "FREE" ? ("FREE" as const) : plan,
    status: status as "ACTIVE" | "PAST_DUE" | "CANCELED" | "INACTIVE",
    stripeCustomerId: (sub.customer as string) ?? undefined,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId ?? undefined,
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
  };

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

async function recordPurchase(
  userId: string | undefined,
  imageId: string,
  paymentIntentId: string | null,
) {
  if (!userId) return;
  await prisma.download.create({
    data: {
      userId,
      imageId,
      stripePaymentId: paymentIntentId ?? undefined,
    },
  });
}
