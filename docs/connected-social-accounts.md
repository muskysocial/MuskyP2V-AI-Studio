# Connected social accounts

This integration starts with TikTok account authorization. The browser never receives a TikTok client secret or access/refresh token. Tokens are encrypted in Supabase using AES-GCM and only accessed by the server-side Edge Function.

## Required TikTok developer setup

1. Create a TikTok for Developers app and add the Content Posting API.
2. Enable Direct Post and request the `user.info.basic` and `video.publish` scopes.
3. Set the Redirect URI to the exact value used for `TIKTOK_REDIRECT_URI`, for example:
   `https://jnsbttwyiwcqhuhveikq.supabase.co/functions/v1/social-connections`
4. TikTok must approve the requested publishing scope. Until the app passes TikTok's required audit, direct-post content is restricted to private visibility.
5. Add these secrets in Supabase Dashboard → Edge Functions → Secrets. Never commit their values:
   - `TIKTOK_CLIENT_KEY`
   - `TIKTOK_CLIENT_SECRET`
   - `TIKTOK_REDIRECT_URI` (must exactly match the TikTok app setting)
   - `SOCIAL_TOKEN_ENCRYPTION_KEY` (base64 encoding of 32 cryptographically random bytes)
   - `MUSKYSOCIALS_APP_URL` (optional; defaults to the GitHub Pages app URL)

The existing Supabase URL and server key are supplied by Supabase's Edge Function environment.

## Important status

This pull request adds secure TikTok account connection and account listing/disconnection. It does not yet publish content or enable paid feed placement. Publishing is a separate next step because the UI must retrieve creator privacy options, require explicit consent, upload supported media, and poll TikTok's publish status. Do not tell users that a post was published until TikTok confirms it.
