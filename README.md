# MuskyP2V AI Studio — Free Prototype v0.3

## What changed in v0.3
- Added a choice between **Face Only** and **Full Appearance**.
- Added reference-photo and source-video previews.
- Added an original-versus-transformed comparison layout.
- Added a setup check and an honest placeholder explaining that the AI engine is not connected.
- Kept camera preview, original-video download, and browser text-to-speech demo.
- Mobile-friendly layout.

## Important: what this version does NOT do
This is still a front-end prototype. It does **not** transform faces or skin tone, change hairstyles, generate an AI video, or create a transformed preview. It does not have secure accounts, real coins, or payment processing. The transformed preview area is intentionally a placeholder rather than a fake result.

GitHub Pages hosts static files; it does not run a server-side AI model. A separate AI-processing engine/API or suitable computer is needed to generate transformed videos. Real-time camera transformation is more demanding and may require specialized local or server hardware.

## Update the live GitHub Pages site
1. Download and extract this ZIP on your phone or computer.
2. Open your repository: https://github.com/muskysocial/MuskyP2V-AI-Studio
3. Open the repository's file list.
4. For each of these three files — `index.html`, `style.css`, and `script.js` — open the file, choose the pencil/Edit option, replace all its contents with the matching file from this ZIP, and commit the changes. (You can also upload all three using Add file → Upload files and commit the changes.)
5. Do not delete the repository or change its Pages settings.
6. Wait a few minutes, then reload the live site. On phone, if the old version remains, try refreshing or opening the link in a private/incognito tab.

## Test checklist
- Choose Face Only, then Full Appearance; confirm the selected card changes.
- Upload a reference image and check its preview.
- Upload a video and check playback in Original.
- Try the camera permission prompt.
- Check that the AI preview says the engine is not connected yet.
- Test browser text-to-speech.

## Privacy and safety
- Use only photos and videos you have permission to use.
- Do not upload private customer media to public repositories.
- Never put payment-provider secrets, AI API keys, passwords, or other private credentials in public files.
- Do not use demo interface coins or a “paid” button as proof of payment. Coin balances and payment verification must be handled securely on a backend.
