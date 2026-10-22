# Connected social accounts

This integration starts with TikTok account authorization. The browser never receives a TikTok client secret or access/refresh token. Tokens are encrypted in Supabase using AES-GCM and only accessed by the server-side Edge Function.

## Required TikTok developer setup

Before submitting the app, publish and review the MuskySocials policy pages:
- Privacy policy: `https://muskysocial.github.io/MuskyP2V-AI-Studio/privacy.html`
- Terms of service: `https://muskysocial.github.io/MuskyP2V-AI-Studio/terms.html`

The policy pages now list the MuskySocials support contact. Review the wording against the live service before submitting these URLs in TikTok Developer settings. TikTok also requires app URL details and URL ownership verification for relevant features.

1. Create a TikTok for Developers app and add the Content Posting API.
2. Enable Direct Post and request the `user.info.basic` and `video.publish` scopes.
3. Set the Redirect URI to the exact value used for `TIKTOK_REDIRECT_URI`, for example:
   `https://jnsbttwyiwcqhuhveikq.supabase.co/functions/v1/social-connections`
4. TikTok must approve the requested publishing scope. Until the app passes TikTok's required audit, direct-post content is restricted to private visibility.
5. Add these secrets in Supabase Dashboard → Edge Functions → Secrets. Never commit their values:
   - `TIKTOK_CLIENT_KEY`
   - `TIKTOK_CLIENT_SECRET`
   - `TIKTOK_REDIRECT_URI` (must exactly match the TikTok app setting)
   - `SOCIAL_TOKEN_ENCRYPTION_KEY` (base64 encoding of 32 cryptographically random bytes; generate locally with `openssl rand -base64 32`)
   - `MUSKYSOCIALS_APP_URL` (optional; defaults to the GitHub Pages app URL)

Never paste the client secret or encryption key into chat, GitHub, or frontend JavaScript. Add them only through the Supabase Edge Function Secrets dashboard. The exact TikTok redirect URI must match in both the TikTok developer console and the Supabase secret.

The existing Supabase URL and server key are supplied by Supabase's Edge Function environment.

## Important status

This pull request adds secure TikTok account connection and a first direct-publishing path for saved video drafts. Users must choose an audience option returned by TikTok and explicitly confirm before sending a video. The server uploads the video, records a publishing request, and checks TikTok's status; the UI must not claim a post is live until TikTok returns a completed status. This first version supports uploaded video drafts under 40 MB. Direct photo publishing and Instagram/Facebook/YouTube/X integrations are not included yet.

TikTok's official developer review is required for public direct posting. Until the app passes TikTok's audit, its Direct Post API may restrict posts to private visibility. Paid placement inside the MuskySocials feed is separate and remains disabled until that feature is implemented and tested.
