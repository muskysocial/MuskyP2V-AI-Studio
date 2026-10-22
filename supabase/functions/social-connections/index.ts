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
async function getConnection(userId: string, provider: string) {
  const admin = getAdmin();
  const { data, error } = await admin.from("social_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).maybeSingle();
  if (error || !data) throw new Error("Connect your " + provider + " account first.");
  return data;
}
async function freshAccessToken(connection: any) {
  const admin = getAdmin();
  const expires = connection.access_token_expires_at ? new Date(connection.access_token_expires_at).getTime() : 0;
  if (expires > Date.now() + 5 * 60 * 1000) {
    return { connection, token: await decryptToken(connection.access_token_ciphertext, connection.access_token_iv) };
  }
  if (!connection.refresh_token_ciphertext || !connection.refresh_token_iv) {
    throw new Error("Your TikTok connection expired. Disconnect it and connect again.");
  }
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) throw new Error("TikTok app credentials are not configured.");
  const refreshToken = await decryptToken(connection.refresh_token_ciphertext, connection.refresh_token_iv);
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY, client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: "refresh_token", refresh_token: refreshToken
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) {
    console.error("TikTok token refresh failed", response.status, result.error || "unknown error");
    throw new Error("TikTok authorization expired. Please reconnect your account.");
  }
  const access = await encryptToken(result.access_token);
  const refreshed = result.refresh_token ? await encryptToken(result.refresh_token) : null;
  const updated = {
    access_token_ciphertext: access.ciphertext, access_token_iv: access.iv,
    refresh_token_ciphertext: refreshed?.ciphertext || connection.refresh_token_ciphertext,
    refresh_token_iv: refreshed?.iv || connection.refresh_token_iv,
    access_token_expires_at: result.expires_in ? new Date(Date.now() + Number(result.expires_in) * 1000).toISOString() : null,
    refresh_token_expires_at: result.refresh_expires_in ? new Date(Date.now() + Number(result.refresh_expires_in) * 1000).toISOString() : connection.refresh_token_expires_at,
    scopes: String(result.scope || connection.scopes?.join(",") || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    updated_at: new Date().toISOString()
  };
  const { error } = await admin.from("social_connections").update(updated).eq("id", connection.id);
  if (error) throw new Error("Could not update TikTok authorization securely.");
  return { connection: { ...connection, ...updated }, token: result.access_token };
}
async function tiktokCreatorInfo(token: string) {
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json; charset=UTF-8" },
    body: "{}"
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error?.code && result.error.code !== "ok") {
    console.error("TikTok creator info failed", response.status, result.error?.code || "unknown error");
    throw new Error("TikTok could not load your posting settings. Reconnect the account or try again.");
  }
  return result.data || {};
}
async function getTikTokConnection(userId: string) {
  const connection = await getConnection(userId, "tiktok");
  return freshAccessToken(connection);
}
async function refreshPublishStatus(userId: string, publishId: string) {
  const admin = getAdmin();
  const { data: job, error } = await admin.from("social_publish_jobs")
    .select("id,provider_publish_id,status,campaign_id").eq("user_id", userId)
    .eq("provider", "tiktok").eq("provider_publish_id", publishId).maybeSingle();
  if (error || !job) throw new Error("That TikTok publishing request was not found.");
  if (job.status === "published" || job.status === "failed") return { status: job.status, message: "This publishing request is already complete." };
  const { token } = await getTikTokConnection(userId);
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ publish_id: publishId })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error?.code && result.error.code !== "ok") {
    throw new Error("TikTok status is not available yet. Please refresh in a moment.");
  }
  const providerStatus = String(result.data?.status || "PROCESSING");
  const status = providerStatus === "PUBLISH_COMPLETE" ? "published" :
    providerStatus === "FAILED" ? "failed" : "processing";
  const message = providerStatus === "PUBLISH_COMPLETE" ? "TikTok confirms the post was published." :
    providerStatus === "FAILED" ? "TikTok reported that publishing failed." :
    "TikTok is still processing this post.";
  await admin.from("social_publish_jobs").update({ status, message, updated_at: new Date().toISOString() }).eq("id", job.id);
  return { status, message, provider_status: providerStatus };
}
async function publishTikTokVideo(userId: string, body: any) {
  if (body.consent !== true) throw new Error("Confirm that you want to send this content to TikTok.");
  if (!body.campaign_id) throw new Error("Choose a saved video draft to publish.");
  if (missingConfig()) throw new Error("TikTok publishing is not configured yet.");
  const admin = getAdmin();
  const { data: campaign, error: campaignError } = await admin.from("viral_campaigns")
    .select("id,user_id,title,caption,hashtags,asset_path,content_type,file_size,original_file_name")
    .eq("id", body.campaign_id).eq("user_id", userId).maybeSingle();
  if (campaignError || !campaign) throw new Error("That saved draft was not found.");
  if (!campaign.asset_path || !String(campaign.content_type || "").startsWith("video/")) {
    throw new Error("Direct TikTok publishing currently supports uploaded video drafts only. Photo publishing needs a separate supported media flow.");
  }
  if (!String(campaign.asset_path).startsWith(userId + "/")) throw new Error("The saved media path is not owned by your account.");
  const existing = await admin.from("social_publish_jobs").select("id,status,provider_publish_id,message")
    .eq("user_id", userId).eq("campaign_id", campaign.id).eq("provider", "tiktok").maybeSingle();
  if (existing.data && existing.data.status !== "failed") {
    return { status: existing.data.status, publish_id: existing.data.provider_publish_id, message: existing.data.message || "This draft has already been submitted to TikTok. Refresh its status instead of publishing it again." };
  }
  let jobId = "";
  if (existing.data) {
    const claimed = await admin.from("social_publish_jobs")
      .update({ status: "processing", provider_publish_id: null, message: "Preparing video for TikTok.", updated_at: new Date().toISOString() })
      .eq("id", existing.data.id).eq("status", "failed").select("id").maybeSingle();
    if (claimed.error || !claimed.data) {
      const latest = await admin.from("social_publish_jobs").select("status,provider_publish_id,message")
        .eq("id", existing.data.id).maybeSingle();
      return { status: latest.data?.status || "processing", publish_id: latest.data?.provider_publish_id || null, message: latest.data?.message || "This draft is already being processed." };
    }
    jobId = claimed.data.id;
  } else {
    const reserved = await admin.from("social_publish_jobs").insert({
      user_id: userId, campaign_id: campaign.id, provider: "tiktok",
      status: "processing", message: "Preparing video for TikTok."
    }).select("id").single();
    if (reserved.error || !reserved.data) {
      const raced = await admin.from("social_publish_jobs").select("status,provider_publish_id,message")
        .eq("user_id", userId).eq("campaign_id", campaign.id).eq("provider", "tiktok").maybeSingle();
      if (raced.data) return { status: raced.data.status, publish_id: raced.data.provider_publish_id, message: raced.data.message || "This draft is already being processed." };
      throw new Error("Could not reserve a safe publishing request. Please try again.");
    }
    jobId = reserved.data.id;
  }
  const { connection, token } = await getTikTokConnection(userId);
  const creator = await tiktokCreatorInfo(token);
  const privacy = String(body.privacy_level || "");
  const options = Array.isArray(creator.privacy_level_options) ? creator.privacy_level_options : [];
  if (!options.includes(privacy)) throw new Error("Choose one of the privacy settings currently allowed by your TikTok account.");
  const { data: blob, error: mediaError } = await admin.storage.from("viral-uploads").download(campaign.asset_path);
  if (mediaError || !blob) throw new Error("Could not read your saved video from private storage.");
  if (blob.size > 40 * 1024 * 1024) throw new Error("For this first direct-publishing version, choose a video under 40 MB.");
  const videoSize = blob.size;
  const chunkSize = Math.min(10 * 1024 * 1024, videoSize);
  const chunkCount = Math.ceil(videoSize / chunkSize);
  const caption = [campaign.caption, campaign.hashtags].filter(Boolean).join("\n\n").slice(0, 2200);
  const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      post_info: {
        title: caption, privacy_level: privacy,
        disable_duet: false, disable_stitch: false, disable_comment: false
      },
      source_info: { source: "FILE_UPLOAD", video_size: videoSize, chunk_size: chunkSize, total_chunk_count: chunkCount }
    })
  });
  const init = await initResponse.json().catch(() => ({}));
  if (!initResponse.ok || init.error?.code && init.error.code !== "ok" || !init.data?.upload_url || !init.data?.publish_id) {
    const code = String(init.error?.code || "");
    const msg = code === "unaudited_client_can_only_post_to_private_accounts"
      ? "TikTok has not audited this developer app yet. Direct posts are restricted to private visibility until TikTok approves the app."
      : "TikTok could not start this post. Check that the app has the approved video.publish permission.";
    throw new Error(msg);
  }
  const { error: recordInitError } = await admin.from("social_publish_jobs").update({
    provider_publish_id: init.data.publish_id, status: "processing",
    message: "TikTok accepted the publishing request; uploading video.",
    updated_at: new Date().toISOString()
  }).eq("id", jobId);
  if (recordInitError) throw new Error("TikTok started a publishing request, but MuskySocials could not record its ID. Contact support before retrying to avoid a duplicate.");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  for (let start = 0; start < videoSize; start += chunkSize) {
    const part = bytes.slice(start, Math.min(start + chunkSize, videoSize));
    const end = start + part.byteLength - 1;
    const upload = await fetch(init.data.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": campaign.content_type || "video/mp4",
        "Content-Range": "bytes " + start + "-" + end + "/" + videoSize,
        "Content-Length": String(part.byteLength)
      },
      body: part
    });
    if (!upload.ok) {
      console.error("TikTok video chunk upload failed", upload.status);
      throw new Error("TikTok accepted the post request but the video upload failed. Please check the draft and try again.");
    }
  }
  const { error: completeUploadError } = await admin.from("social_publish_jobs").update({
    status: "processing",
    message: "Video uploaded; waiting for TikTok to process it.",
    updated_at: new Date().toISOString()
  }).eq("id", jobId);
  if (completeUploadError) throw new Error("TikTok received the video, but MuskySocials could not update its status. Use Check TikTok status before retrying.");
  return {
    status: "processing", publish_id: init.data.publish_id,
    message: "Video sent to TikTok. It may take a few minutes to process; check status before trying again.",
    creator_name: creator.creator_nickname || connection.display_name || "TikTok account"
  };
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

    if (action === "creator-info") {
      const { token } = await getTikTokConnection(user.id);
      const info = await tiktokCreatorInfo(token);
      return json({
        creator_nickname: info.creator_nickname || "",
        creator_avatar_url: info.creator_avatar_url || "",
        privacy_level_options: Array.isArray(info.privacy_level_options) ? info.privacy_level_options : [],
        max_video_post_duration_sec: info.max_video_post_duration_sec || null,
        can_post_now: info.can_post !== false
      });
    }

    if (action === "publish-video") {
      try {
        const result = await publishTikTokVideo(user.id, body);
        return json(result);
      } catch (error) {
        if (body.campaign_id) {
          await admin.from("social_publish_jobs").update({
            status: "failed",
            message: error instanceof Error ? error.message.slice(0, 400) : "Publishing failed.",
            updated_at: new Date().toISOString()
          }).eq("user_id", user.id).eq("campaign_id", body.campaign_id).eq("provider", "tiktok").is("provider_publish_id", null);
        }
        throw error;
      }
    }

    if (action === "publish-status") {
      const publishId = String(body.publish_id || "");
      if (!publishId) return json({ error: "Missing TikTok publishing ID." }, 400);
      return json(await refreshPublishStatus(user.id, publishId));
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
