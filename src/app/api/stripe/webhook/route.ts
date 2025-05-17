// 📁 src/app/api/stripe/webhook/route.ts

import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createSupabaseClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

// ⚠️ Required for raw body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// 🔐 Use your real Stripe secret key from env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// 🔑 Your webhook secret from Stripe dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig) throw new Error("Missing Stripe signature");
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // 🎯 We're only interested in completed checkouts
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerEmail = session.customer_email;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!customerEmail) {
      console.warn("No email in session, skipping.");
      return new Response("Missing email", { status: 400 });
    }

    // const supabase = createSupabaseClient();
    const supabase = supabaseAdmin;

    // 🧠 Upsert Pro user info
    const { error } = await supabase.from("pro_users").upsert(
      {
        user_email: customerEmail,
        stripe_custom: customerId,
        stripe_subscr: subscriptionId,
        pro_since: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: "user_email" }
    );

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response("Database error", { status: 500 });
    }

    console.log(`✅ Pro user saved: ${customerEmail}`);
  }

  return new Response("Webhook received", { status: 200 });
}
