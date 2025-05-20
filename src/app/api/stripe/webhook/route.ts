import { NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/utils/supabase/admin"; // Service role Supabase client

// 📦 Required by Stripe to read the raw request body
export const config = {
  api: {
    bodyParser: false,
  },
};

// 🗝️ Load Stripe secret key from .env and initialize client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-04-30.basil",
});

// 🔐 Stripe webhook signing secret from your dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
if (!endpointSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment variables.");
}

// 🚀 Handles Stripe POST requests
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text(); // Required for signature validation

  let event: Stripe.Event;

  // 🛡️ Verify webhook signature
  try {
    if (!sig) throw new Error("Missing Stripe signature");
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Webhook error", { status: 400 });
  }

  // 🎯 Only handle completed checkout sessions
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // 🆔 Pull relevant data from the session
    const customerId = session.customer as string | undefined;
    const subscriptionId = session.subscription as string | undefined;

    // 📧 Attempt to use email directly from session
    let customerEmail = session.customer_email;

    // 🔁 Fallback: if email is missing, fetch customer from Stripe
    if (!customerEmail && customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) {
        customerEmail = customer.email ?? null;
      }
    }

    // 🚫 If we still don't have an email, abort
    if (!customerEmail) {
      console.warn("❌ No email found — skipping insert.");
      return new Response("Missing email", { status: 400 });
    }

    // 💾 Insert or update user in Supabase
    const { error } = await supabaseAdmin.from("pro_users").upsert(
      {
        user_email: customerEmail ?? null,
        stripe_customer_id: customerId ?? null,
        stripe_subscription_id: subscriptionId ?? null,
        pro_since: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: "user_email" } // Upsert by email
    );

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return new Response("Database error", { status: 500 });
    }

    console.log("✅ Pro user saved:", customerEmail);
  }

  // ✅ Tell Stripe the webhook was handled successfully
  return new Response("OK", { status: 200 });
}
