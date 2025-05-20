import { NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/utils/supabase/admin"; // Service role Supabase client

// 🧱 Ensure raw body is available for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// 🗝️ Stripe setup
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-04-30.basil",
});

// 🔐 Webhook secret for validating Stripe signatures
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
if (!endpointSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment variables.");
}

// ✅ Typed structure for Supabase insert
type ProUserInsert = {
  user_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  pro_since: string;
  is_active: boolean;
};

// 🚀 Webhook handler
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (!sig) throw new Error("Missing Stripe signature");
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Webhook error", { status: 400 });
  }

  // 🎯 Only handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // 🔍 Extract identifiers
    const customerId = session.customer as string | undefined;
    const subscriptionId = session.subscription as string | undefined;
    let customerEmail: string | null = session.customer_email ?? null;

    // 🔁 Fallback if email not present in session
    if (!customerEmail && customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) {
        customerEmail = customer.email ?? null;
      }
    }

    // 🚫 Still no email — abort
    if (!customerEmail) {
      console.warn("❌ No email found — skipping insert.");
      return new Response("Missing email", { status: 400 });
    }

    // ✅ Create a type-safe payload for Supabase
    const userData: ProUserInsert = {
      user_email: customerEmail,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      pro_since: new Date().toISOString(),
      is_active: true,
    };

    const { error } = await supabaseAdmin.from("pro_users").upsert(userData, {
      onConflict: "user_email",
    });

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return new Response("Database error", { status: 500 });
    }

    console.log("✅ Pro user saved:", customerEmail);
  }

  // ✅ Acknowledge webhook to Stripe
  return new Response("OK", { status: 200 });
}
