import { NextResponse } from "next/server";
import { getStripe, PLANS, type PlanKey } from "@/lib/stripe";
import { env, isStripeConfigured } from "@/lib/env";
import { auth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutBody {
  plan?: PlanKey;
  /** "subscription" (default) or "payment" for one-shot purchases. */
  mode?: "subscription" | "payment";
  /** For one-shot: an image id to buy. */
  imageId?: string;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mode = body.mode ?? "subscription";
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const session = await auth();
  const userEmail = session?.user?.email ?? undefined;
  const userId = session?.user?.id ?? undefined;

  try {
    if (mode === "subscription") {
      const planKey = body.plan;
      if (!planKey || !PLANS[planKey]) {
        return NextResponse.json(
          { error: "Valid plan (BASIC | PRO) is required" },
          { status: 400 },
        );
      }
      const plan = PLANS[planKey];
      if (!plan.priceId) {
        return NextResponse.json(
          {
            error: `Price ID for ${planKey} is not configured. Set STRIPE_PRICE_${planKey}.`,
          },
          { status: 503 },
        );
      }

      const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: plan.priceId, quantity: 1 }],
        customer_email: userEmail,
        success_url: `${appUrl}/account?checkout=success`,
        cancel_url: `${appUrl}/pricing?checkout=cancelled`,
        metadata: { userId: userId ?? "", plan: planKey },
        subscription_data: {
          metadata: { userId: userId ?? "", plan: planKey },
        },
      });

      return NextResponse.json({ url: checkout.url });
    }

    // One-shot purchase of a single image.
    const imageId = body.imageId;
    if (!imageId) {
      return NextResponse.json(
        { error: "imageId is required for one-shot purchase" },
        { status: 400 },
      );
    }

    let image: { id: string; title: string; priceCents: number } | null = null;
    try {
      image = await prisma.image.findUnique({
        where: { id: imageId },
        select: { id: true, title: true, priceCents: true },
      });
    } catch {
      // DB unavailable — fall back to a generic single-purchase price.
    }

    const amount = image?.priceCents && image.priceCents > 0 ? image.priceCents : 500;

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: image?.title ?? "AI Asset — single license",
            },
          },
        },
      ],
      customer_email: userEmail,
      success_url: `${appUrl}/gallery/${imageId}?purchase=success`,
      cancel_url: `${appUrl}/gallery/${imageId}?purchase=cancelled`,
      metadata: { userId: userId ?? "", imageId },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "checkout failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
