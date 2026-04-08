<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

**Note:** Production marketing pages for BRNNO live in the **Next.js app at the repository root** (`app/page.tsx` → `BrnnoV2`). This folder is a **legacy Vite** app; a separate Vercel project pointing only here will not serve the current main site—attach marketing domains to the root Next.js Vercel project instead.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Hf0LEhdLNj_Fe10YaiAIwiMhmAuSPc_W

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
