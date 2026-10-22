import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const APP_URL = Deno.env.get("MUSKYSOCIALS_APP_URL") || "https://muskysocial.github.io/MuskyP2V-AI-Studio/";
const TIKTOK_CLIENT_KEY = Deno.env.get("TIKTOK_CLIENT_KEY") || "";
const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET") || "";
const TIKTOK_REDIRECT_URI = Deno.env.get("TIKTOK_REDIRECT_URI") || "";
const TOKEN_KEY_B64 = Deno.env.get("SOCIAL_TOKEN_ENCRYPTION_KEY") || "";
const cors = {
  "Access-Control-Allow-Origin": "https://muskysocial.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Vary": "Origin"
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { ...cors, "Content-Type": "application/json" }
});
const html = (title: string, message: string, status = 200) => new Response(
  `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font:16px system-ui;max-width:560px;margin:12vh auto;padding:24px;line-height:1.5"><h2>${title}</h2><p>${message}</p><a href="${APP_URL}">Return to MuskySocials</a></body></html>`,
  { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
);
function getAdmin() {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
  if (!key) throw new Error("Supabase server key is not configured.");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function getPublicKey() {
  return Deno.env.get("SUPABASE_ANON_KEY") ||
    JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default;
}
async function authenticatedUser(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Please sign in first.");
  const key = getPublicKey();
  if (!key) throw new Error("Supabase public key is not configured.");
  const client = createClient(SUPABASE_URL, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Your session has expired. Please sign in again.");
  return data.user;
}
function b64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function unb64(value: string) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
async function digest(value: string) {
  return b64(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}
async function encryptionKey() {
  if (!TOKEN_KEY_B64) throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY is not configured in Supabase Edge Function secrets.");
  const raw = unb64(TOKEN_KEY_B64);
  if (raw.length !== 32) throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encryptToken(value: string) {
  const key = await encryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return { ciphertext: b64(new Uint8Array(encrypted)), iv: b64(iv) };
}
async function decryptToken(ciphertext: string, iv: string) {
  const key = await encryptionKey();
  const raw = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ciphertext));
  return new TextDecoder().decode(raw);
}
function missingConfig() {
  return !TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET || !TIKTOK_REDIRECT_URI || !TOKEN_KEY_B64;
}
async function handleCallback(req: Request) {
  const url = new URL(req.url);
  const errorCode = url.searchParams.get("error");
  if (errorCode) return html("TikTok connection cancelled", "TikTok did not authorize MuskySocials. You can return and try again.");
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !state) return html("Connection failed", "TikTok did not return the required authorization details.", 400);
  if (missingConfig()) return html("Connection not configured", "The MuskySocials administrator must finish configuring the TikTok developer app and encryption secret before accounts can connect.", 503);
  const admin = getAdmin();
  const stateHash = await digest(state);
  const { data: stateRow, error: stateError } = await admin.from("social_oauth_states")
    .select("id,user_id,provider,expires_at,used_at")
    .eq("state_hash", stateHash).eq("provider", "tiktok").maybeSingle();
  if (stateError || !stateRow || stateRow.used_at || new Date(stateRow.expires_at).getTime() < Date.now()) {
    return html("Connection expired", "This connection request expired or has already been used. Return to MuskySocials and try again.", 400);
  }
  const { error: consumeError } = await admin.from("social_oauth_states")
    .update({ used_at: new Date().toISOString() }).eq("id", stateRow.id).is("used_at", null);
  if (consumeError) return html("Connection failed", "The authorization request could not be verified. Please try again.", 400);

  const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: TIKTOK_REDIRECT_URI
    })
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.access_token || !tokenData.open_id) {
    console.error("TikTok token exchange failed", tokenResponse.status, tokenData.error || tokenData.error_description || "unknown error");
    return html("TikTok connection failed", "TikTok could not authorize this account. Check the developer app settings and try again.", 400);
  }
  const profileResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
    headers: { Authorization: "Bearer " + tokenData.access_token }
  });
  const profileData = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || profileData.error?.code && profileData.error.code !== "ok") {
    console.error("TikTok profile lookup failed", profileResponse.status, profileData.error?.code);
    return html("TikTok connection failed", "TikTok authorized the request, but MuskySocials could not verify the profile. Please try again.", 400);
  }
  const user = profileData.data?.user || {};
  const access = await encryptToken(tokenData.access_token);
  const refresh = tokenData.refresh_token ? await encryptToken(tokenData.refresh_token) : null;
  const expiresAt = tokenData.expires_in ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString() : null;
  const refreshExpiresAt = tokenData.refresh_expires_in ? new Date(Date.now() + Number(tokenData.refresh_expires_in) * 1000).toISOString() : null;
  const scopes = String(tokenData.scope || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const { error: saveError } = await admin.from("social_connections").upsert({
    user_id: stateRow.user_id,
    provider: "tiktok",
    provider_user_id: tokenData.open_id,
    display_name: user.display_name || "TikTok account",
    avatar_url: user.avatar_url || null,
    access_token_ciphertext: access.ciphertext,
    access_token_iv: access.iv,
    refresh_token_ciphertext: refresh?.ciphertext || null,
    refresh_token_iv: refresh?.iv || null,
    scopes,
    access_token_expires_at: expiresAt,
    refresh_token_expires_at: refreshExpiresAt,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id,provider,provider_user_id" });
  if (saveError) {
    console.error("Could not save social connection", saveError.message);
    return html("TikTok connection failed", "The account was authorized, but MuskySocials could not save the connection. Please contact support.", 500);
  }
  const target = new URL(APP_URL);
  target.searchParams.set("social_connect", "tiktok_success");
  return Response.redirect(target.toString(), 302);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method === "GET" && (new URL(req.url).searchParams.has("code") || new URL(req.url).searchParams.has("error"))) {
    try { return await handleCallback(req); }
    catch (error) {
      console.error("TikTok callback error", error instanceof Error ? error.message : "unknown");
      return html("Connection failed", "MuskySocials could not complete the connection. Please try again.", 500);
    }
  }
  if (req.method !== "POST") return json({ error: "Use POST for account actions." }, 405);
  try {
    const user = await authenticatedUser(req);
    const body = await req.json();
    const action = String(body.action || "");
    const admin = getAdmin();

    if (action === "start") {
      if (body.provider !== "tiktok") return json({ error: "That provider is not enabled yet." }, 400);
      if (missingConfig()) return json({ error: "TikTok connection is not configured yet. The developer app and secure token key must be added first." }, 503);
      const state = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      const { error } = await admin.from("social_oauth_states").insert({
        user_id: user.id, provider: "tiktok", state_hash: await digest(state),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });
      if (error) throw new Error("Could not start the secure connection. Please try again.");
      const authorize = new URL("https://www.tiktok.com/v2/auth/authorize/");
      authorize.search = new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        response_type: "code",
        scope: "user.info.basic,video.publish",
        redirect_uri: TIKTOK_REDIRECT_URI,
        state
      }).toString();
      return json({ authorize_url: authorize.toString() });
    }

    if (action === "list") {
      const { data, error } = await admin.from("social_connections")
        .select("provider,provider_user_id,display_name,avatar_url,scopes,access_token_expires_at,connected_at")
        .eq("user_id", user.id).order("connected_at", { ascending: false });
      if (error) throw new Error("Could not load connected accounts.");
      return json({ connections: data || [] });
    }

    if (action === "disconnect") {
      const provider = String(body.provider || "");
      if (!["tiktok", "instagram", "facebook", "youtube", "x"].includes(provider)) return json({ error: "Unknown provider." }, 400);
      const { error } = await admin.from("social_connections").delete().eq("user_id", user.id).eq("provider", provider);
      if (error) throw new Error("Could not disconnect this account.");
      return json({ ok: true });
    }
    return json({ error: "Unknown account action." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account action failed.";
    return json({ error: message }, message.includes("sign in") || message.includes("session") ? 401 : 500);
  }
});
