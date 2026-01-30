# Stripe pricing env vars – breakdown

## Grandfathered vs Brnno v2

- **Grandfathered (do not change or delete in Stripe):**
  - **Starter** – used by another user/product.
  - **Pro** (old price IDs) – used by **Bucketmobile**; Stripe won’t let you change or delete those.
- **Rest (Brnno-only):** Fleet, Basic v2, Pro v2 – not used by other products; safe to use for new Brnno signups and to manage in Stripe.

The app uses a **single set** of env var names. We point them at **Brnno v2** prices for Pro (new signups) and keep **Starter** on the grandfathered IDs since that price is shared.

## How the code uses them

Only **one set** of variable names is used (in `app/api/create-subscription-checkout/route.ts`):

| Plan    | Team size | Monthly env var                    | Annual env var                     |
|---------|-----------|------------------------------------|------------------------------------|
| starter | (fixed)   | `STRIPE_STARTER_MONTHLY_PRICE_ID`  | `STRIPE_STARTER_YEARLY_PRICE_ID`   |
| pro     | 1–2       | `STRIPE_PRICE_PRO_1_2_MONTHLY`     | `STRIPE_PRICE_PRO_1_2_ANNUAL`      |
| pro     | 3         | `STRIPE_PRICE_PRO_3_MONTHLY`       | `STRIPE_PRICE_PRO_3_ANNUAL`        |
| fleet   | 1–3       | `STRIPE_PRICE_FLEET_1_3_MONTHLY`   | `STRIPE_PRICE_FLEET_1_3_ANNUAL`    |
| fleet   | 4–5       | `STRIPE_PRICE_FLEET_4_5_MONTHLY`   | `STRIPE_PRICE_FLEET_4_5_ANNUAL`    |

**Not used by checkout (yet):** `STRIPE_PRICE_BASIC_*` – wire these in code if you add a “Basic” tier.

## What’s wrong in `.env.local`

1. **Duplicate names**  
   Same var is set twice (e.g. `STRIPE_PRICE_PRO_1_2_MONTHLY` at lines 36 and 55). In `.env`, the **last** definition wins, so you’re already on the v2 price IDs for PRO. The first (grandfathered) block is redundant and confusing.

2. **Comments in the value**  
   Lines like  
   `STRIPE_STARTER_MONTHLY_PRICE_ID=price_1SlO4R488JE4jvAtx0fOKORw (grandfathered)`  
   make the **value** equal  
   `price_1SlO4R488JE4jvAtx0fOKORw (grandfathered)`  
   unless the value is quoted. Stripe expects only the price ID (e.g. `price_1SlO4R488JE4jvAtx0fOKORw`). The extra ` (grandfathered)` can break checkout.

3. **STARTER vs BASIC**  
   Code uses `STRIPE_STARTER_*`. You have both “Starter” and “Basic” in the file; if “Basic” is the new product, you either keep using Starter IDs in the vars the code reads, or add a “basic” plan in code and use `STRIPE_PRICE_BASIC_*`.

## What to change

- **Use a single set of variables** – one line per price, no duplicates.
- **No comments inside the value** – only the Stripe price ID after `=`. Put notes in a comment line above (with `#`).
- **Decide grandfathered vs v2** – pick which price IDs you want (e.g. all v2), set those in the single set of vars, remove or comment out the duplicate block.

See the “Recommended block” below for a clean snippet you can paste into `.env.local` (then adjust price IDs if needed).
