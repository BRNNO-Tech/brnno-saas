# Stripe checkout – fix for “Price ID not found”

## What was going wrong
- **Local:** `.env.local` in `brnno-io` has `STRIPE_STARTER_MONTHLY_PRICE_ID=price_1T2fXBEFwhk3BrMmB98cZ2jm` (correct). Next.js sometimes didn’t expose it to API routes (load order / cwd).
- **Production (app.brnno.io):** `.env.local` is not used. Vercel uses **Environment Variables** in the dashboard. If `STRIPE_STARTER_MONTHLY_PRICE_ID` (and other Stripe price IDs) aren’t set there, checkout fails.

## What we changed
1. **Starter monthly fallback:** Both `/api/admin/create-test-checkout` and `/api/create-subscription-checkout` use a hardcoded fallback for **Starter monthly** when the env var is missing: `price_1T2fXBEFwhk3BrMmB98cZ2jm`. So **Starter monthly** checkout works locally and on production even if the var isn’t set.
2. **next.config:** Stripe price env vars are passed via `env: { ... }` so they’re available to API routes when set.
3. **Error message:** When a price ID is missing, the API now tells you to set the var in **Vercel → Settings → Environment Variables** when on production.

## Get someone to pay today
- **Starter monthly:** Should work after deploy; no extra config if you’re okay using the fallback price ID.
- **Starter yearly / Pro / Fleet:** Set the corresponding env vars in Vercel (e.g. `STRIPE_STARTER_YEARLY_PRICE_ID`, `STRIPE_PRICE_PRO_1_2_MONTHLY`, etc.), then redeploy.
- **Local:** From repo root or `brnno-io`, run `npm run dev`; restart after changing `.env.local`. Optional: open `/api/admin/env-check` (as admin) to see which Stripe vars the server sees.

## Env var names (same as in `.env.local` and docs)
- Starter: `STRIPE_STARTER_MONTHLY_PRICE_ID`, `STRIPE_STARTER_YEARLY_PRICE_ID`
- Pro: `STRIPE_PRICE_PRO_1_2_MONTHLY`, `STRIPE_PRICE_PRO_1_2_ANNUAL`, `STRIPE_PRICE_PRO_3_*`
- Fleet: `STRIPE_PRICE_FLEET_1_3_*`, `STRIPE_PRICE_FLEET_4_5_*`
