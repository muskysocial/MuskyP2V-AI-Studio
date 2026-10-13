# MuskyP2V AI Studio — Free Prototype v0.2

This is a browser-only prototype for the first build stage.

## What's included
- Dark navy/gold mobile-first layout
- Demo display-name sign-in (NOT real authentication)
- Free browser text-to-speech using voices available on the device/browser
- Voice choice, speech speed and pitch controls, pause/resume/stop
- Audio upload/preview and microphone sample recording/download
- Camera preview, reference photo preview and normal video recording/download
- Proposed coin package display
- Local draft saving

## Important limitations
- No real AI face/appearance transformation is connected.
- No AI voice cloning is connected.
- Browser text-to-speech voices differ by phone/browser and may sound robotic.
- Browser speech playback generally does not create a downloadable MP3/WAV file.
- Demo sign-in and demo coins are not secure and must not be used for real customers or money.
- No payment processing, secure coin ledger, backend, or admin dashboard exists yet.

## Test on an Android phone
1. Extract this ZIP.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the root of a GitHub repository.
3. In GitHub, open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/(root)`, then save.
5. Open the HTTPS website in an updated Chrome browser.
6. Enter a display name, open Voice Studio, and try the available voices.
7. If the voice list is empty, check Android text-to-speech settings and install/enable a speech engine such as Speech Services by Google if available.

## Next development stages
1. Connect real user registration and login (e.g. Supabase Auth) and secure database rules.
2. Add a server-side coin ledger and safe 30-coin starter grant.
3. Connect a Nigerian payment provider using server-side payment verification and idempotent webhook handling.
4. Test free/open AI model hosting for image/video transformation.
5. Test a downloadable natural TTS model such as Kokoro in a suitable free environment, after checking its licence and hosting terms.
6. Add production security, consent notices, abuse prevention, usage limits, and privacy/deletion controls.

## Security rules
- Never put payment secret keys or AI service secrets in these public files or a public GitHub repository.
- Do not store customer passwords yourself.
- Do not credit coins based only on a screenshot or a button saying "I paid"; verify payment server-side.
- Only process face images and voice samples with permission. Be transparent when content is AI-generated.
