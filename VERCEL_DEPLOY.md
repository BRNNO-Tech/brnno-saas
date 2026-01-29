# Deploy as two separate Vercel projects

Same repo (**BRNNO-Tech/brnno-saas**) has two apps:

1. **Next.js app** (repo root) – dashboard, auth, full app → e.g. `app.brnno.io`
2. **Landing page** (`landing-page/`) – Vite app → e.g. `brnno.io`

You can either use **one repo + Root Directory** (two projects) or **two repos** (no Root Directory).

---

## Where Root Directory lives in Vercel (if you use one repo)

Root Directory is **not** under Git. It’s in **Project Settings**:

1. Open your project → **Settings** tab.
2. Go to **Build and Deployment** (or under **General** look for **“Build and development settings”**).
3. Scroll to **Root Directory** – type a path (e.g. `landing-page`) or leave empty for repo root.

Docs: [Vercel – Configuring a Build → Root Directory](https://vercel.com/docs/deployments/configure-a-build#root-directory)

If you don’t see it, the UI may have changed; check **Settings → General** and **Settings → Build and Deployment** for anything like “Root Directory” or “Code directory”.

---

## Option A: One repo, two Vercel projects (use Root Directory)

### Project A – Next.js app

- Import **BRNNO-Tech/brnno-saas**.
- **Root Directory**: leave **empty** (repo root = Next.js app).
- **Framework Preset**: Next.js.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.

### Project B – Landing page

- Import **BRNNO-Tech/brnno-saas** again (second project).
- **Root Directory**: **`landing-page`**.
- **Framework Preset**: **Vite**.
- **Output Directory**: **`dist`**.
- Env vars: whatever the landing page needs (e.g. `GEMINI_API_KEY`).

---

## Option B: Two repos (no Root Directory)

If you can’t find or use Root Directory, use two repositories. Then each Vercel project has one app at the repo root and you never touch Root Directory.

### 1. New repo for the landing page

- Create a new repo (e.g. **BRNNO-Tech/brnno-landing**).
- Copy the contents of **`landing-page/`** into the **root** of that repo (so the new repo root has `package.json`, `vite.config.ts`, `index.html`, `App.tsx`, etc.).
- Push to the new repo.

### 2. Vercel Project A – Next.js app

- Import **BRNNO-Tech/brnno-saas**.
- Root Directory: leave empty (default).
- Framework: Next.js.
- Add env vars and deploy.

### 3. Vercel Project B – Landing page

- Import **BRNNO-Tech/brnno-landing** (the new repo).
- Root Directory: leave empty (repo root is already the Vite app).
- Framework: Vite.
- Output: `dist`.
- Add env vars and deploy.

After that, you maintain two repos: main app in **brnno-saas**, landing in **brnno-landing**. No Root Directory needed in Vercel.

---

## Quick check

- **Next.js project:** Build log should show **hundreds** of packages (e.g. 500+). If it shows **109 packages** and “No Next.js version detected”, that project is still building from `landing-page` – fix Root Directory or use Option B.
