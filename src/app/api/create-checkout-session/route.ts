// Create a checkout session for Stripe Pro plan

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url:
        "https://fix-my-ad-thetoolshedrep-thetoolshedreps-projects.vercel.app/success",
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
    });
    // Log the actual redirect URL Stripe will use
    console.log("✅ Stripe session URL:", session.url);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe session error:", err);
    return new NextResponse("Checkout session failed", { status: 500 });
  }
}
