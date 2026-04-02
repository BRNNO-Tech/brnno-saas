# Porting the sandbox landing into Next.js

When you paste a fresh **raw** `brnno-v2` (or similar) file from a Vite/sandbox project into this repo, keep the following so production behavior stays correct. Entry file: `brnno-v2.jsx` → `marketing-landing.tsx` (or merge into one module).

## Do not lose

1. **`"use client"` on line 1**  
   The landing uses `useState`, `useEffect`, `useRef`, etc. Without this, Next.js treats the file as a Server Component and will error on hooks.

2. **`next/link` for internal routes**  
   Use `<Link href="/…">` for in-app URLs (e.g. `/privacy`, `/terms`, `/contact`, `/book-demo`). Keep `<a href="https://…">` only for external sites (and `target="_blank"` + `rel="noopener noreferrer"` where appropriate).

3. **Book-a-call URL from env (not hardcoded `CALENDAR_URL`)**  
   Read the booking link from the public env var so `brnno.io` and `app.brnno.io` stay in sync without code edits.

   - **Implemented today:** `NEXT_PUBLIC_BOOK_CALL_URL` (falls back to `/book-demo` when unset).  
   - If you standardize on **`NEXT_PUBLIC_BOOK_URL`**, add support for that name in code or set the var name the code expects in `.env.local`.

4. **Waitlist `fetch` to `/api/waitlist`**  
   Same-origin in Next.js — no CORS, no full `https://brnno.io` URL. `POST` JSON body with at least `email` (matches the existing API).

5. **Scoped `.p-name` CSS**  
   The sandbox reuses class names like `.p-name` that collide with pricing cards vs. phone mockups (and can bleed into other app surfaces). Keep pricing titles scoped (e.g. `.pricing-sect .p-card .p-name`) and profile/phone names scoped (e.g. `.p-phone .p-name`) so dashboard and other layouts are unaffected.

6. **Main CTAs (Join + Book a call)**  
   In this repo, **Join BRNNO** uses `.btn-mag` / `.nav-pill` / `.mobile-menu-cta` (gold fill). **Book a call** uses `.btn-cta-book` (+ `--nav`, `--xl`, `--drawer` modifiers) so it stays readable on dark backgrounds—not the old muted `.btn-ghost2` link. If you paste a fresh sandbox file, wire “Book a call” to these classes (or equivalent contrast).

---

## Demo bookings (`POST /api/book-demo`)

- **`RESEND_API_KEY`** + **`RESEND_FROM_EMAIL`** — sends (1) confirmation to the booker and (2) a summary to the team (`lib/email.ts` → `sendDemoBookingNotifications`).
- **`DEMO_BOOKINGS_NOTIFY_EMAIL`** (optional) — internal inbox; if unset, uses **`CONTACT_EMAIL`**, then `support@brnno.com`. Skips the team copy if it would duplicate the booker’s email.

---

**Deployment model:** One Next.js app — marketing at `brnno.io`, app routes on `app.brnno.io`, single build and deploy. The separate Vite folder `landing-page/` is optional/legacy if you no longer deploy it.
