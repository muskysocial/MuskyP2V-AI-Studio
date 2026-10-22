import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function signatureFor(raw: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") || "";
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!secret.startsWith("sk_test_") || !url || !serviceKey) {
    return json({ error: "Test payment webhook is not configured" }, 503);
  }

  const raw = await req.text();
  const received = req.headers.get("x-paystack-signature") || "";
  let expected = "";
  try { expected = await signatureFor(raw, secret); } catch { return json({ error: "Signature verification failed" }, 500); }
  if (!received || !constantTimeEqual(received.toLowerCase(), expected)) {
    return json({ error: "Invalid signature" }, 401);
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (event.event !== "charge.success" || !event.data?.reference) return json({ received: true });

  const reference = String(event.data.reference);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: payment, error: lookupError } = await admin.from("payment_transactions")
    .select("reference,amount_kobo,currency,status,metadata")
    .eq("reference", reference).maybeSingle();
  if (lookupError) return json({ error: "Could not read payment record" }, 500);
  if (!payment) return json({ received: true, ignored: true });

  const verifyResponse = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), {
    headers: { Authorization: "Bearer " + secret },
  });
  let verification: any = null;
  try { verification = await verifyResponse.json(); } catch {}
  const verified = verification?.data;
  if (!verifyResponse.ok || !verification?.status || verified?.status !== "success") {
    return json({ error: "Paystack transaction verification is not successful" }, 400);
  }
  if (verified.amount !== payment.amount_kobo || verified.currency !== payment.currency || verified.currency !== "NGN") {
    return json({ error: "Verified amount or currency does not match the pending order" }, 400);
  }
  const expectedEmail = String(payment.metadata?.email || "").toLowerCase();
  const paidEmail = String(verified.customer?.email || "").toLowerCase();
  if (!expectedEmail || !paidEmail || expectedEmail !== paidEmail) {
    return json({ error: "Verified payer does not match the checkout account" }, 400);
  }

  const { data, error } = await admin.rpc("finalize_paystack_payment", {
    p_reference: reference,
    p_paystack_transaction_id: String(verified.id),
    p_amount_kobo: verified.amount,
    p_currency: verified.currency,
  });
  if (error || !data?.ok) return json({ error: "Payment verified but account update needs retry" }, 500);
  return json({ received: true, processed: true, already_processed: !!data.already_processed });
});