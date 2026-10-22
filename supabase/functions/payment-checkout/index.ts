import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ORIGIN = "https://muskysocial.github.io";
const CALLBACK = "https://muskysocial.github.io/MuskyP2V-AI-Studio/?payment=return";
const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

function lagosDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values: Record<string, string> = {};
  for (const part of parts) values[part.type] = part.value;
  return values.year + "-" + values.month + "-" + values.day;
}

const plans: Record<string, { amount: number; coins: number; days: number }> = {
  silver_daily: { amount: 40000, coins: 500, days: 0 },
  gold_weekly: { amount: 230000, coins: 3000, days: 7 },
  diamond_monthly: { amount: 700000, coins: 7500, days: 30 },
  platinum_yearly: { amount: 1800000, coins: 0, days: 365 },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required." }, 405);
  if (req.headers.get("origin") !== ORIGIN) return reply({ error: "Origin not allowed." }, 403);

  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") || "";
  if (!secret.startsWith("sk_test_")) {
    return reply({ error: "Paystack test mode is not configured yet. No payment was started." }, 503);
  }

  const authorization = req.headers.get("Authorization") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!authorization || !supabaseUrl || !anonKey || !serviceKey) {
    return reply({ error: "Secure payment service is not fully configured." }, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user || !userData.user.email) {
    return reply({ error: "Please sign in with an email address before upgrading." }, 401);
  }

  let body: { plan_code?: string };
  try { body = await req.json(); } catch { return reply({ error: "Invalid request body." }, 400); }
  const planCode = String(body.plan_code || "");
  const plan = plans[planCode];
  if (!plan) return reply({ error: "Choose a valid membership plan." }, 400);
  if (lagosDate() >= "2027-01-01" && planCode !== "platinum_yearly") {
    return reply({ error: "The standard price for this offer has not been approved yet. Please check back later." }, 409);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const reference = "MUSKY_" + userData.user.id.slice(0, 8) + "_" + crypto.randomUUID().replaceAll("-", "");
  const { error: insertError } = await admin.from("payment_transactions").insert({
    user_id: userData.user.id,
    reference,
    plan_code: planCode,
    amount_kobo: plan.amount,
    currency: "NGN",
    coins_to_credit: plan.coins,
    membership_days: plan.days,
    status: "pending",
    metadata: {
      email: userData.user.email,
      billing: "fixed_period_manual_renewal",
      mode: "test",
    },
  });
  if (insertError) return reply({ error: "Could not prepare the payment safely. Please try again." }, 500);

  const init = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: userData.user.email,
      amount: plan.amount,
      currency: "NGN",
      reference,
      callback_url: CALLBACK,
      metadata: {
        user_id: userData.user.id,
        plan_code: planCode,
        coins_to_credit: plan.coins,
        membership_days: plan.days,
        custom_fields: [{ display_name: "Membership plan", variable_name: "membership_plan", value: planCode }],
      },
    }),
  });

  let result: any = null;
  try { result = await init.json(); } catch {}
  if (!init.ok || !result?.status || !result?.data?.authorization_url) {
    await admin.from("payment_transactions").update({ status: "failed" }).eq("reference", reference);
    return reply({ error: "Paystack could not start checkout. No coins or membership were granted." }, 502);
  }
  return reply({ authorization_url: result.data.authorization_url, reference, mode: "test" });
});