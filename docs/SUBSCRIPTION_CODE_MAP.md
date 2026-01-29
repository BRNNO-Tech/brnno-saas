# Where subscription is checked in the codebase

## 1. Where business data is fetched

| Location | What it does | Caching? |
|----------|--------------|----------|
| **`lib/actions/business.ts`** → `getBusiness()` | Fetches current user’s business from Supabase. Selects `subscription_plan`, `subscription_status`, `subscription_ends_at`. Returns `MOCK_BUSINESS` in demo mode. | **No** – server action, fresh query each call. |
| **`lib/actions/permissions.ts`** → `getCurrentTier()` | Calls `getBusiness()` then `getTierFromBusiness(business, userEmail)`. | **No** – but see “Who calls it” below. |
| **`hooks/use-feature-gate.ts`** → `useFeatureGate()` | Calls `getCurrentTier()` on mount, **on window focus** (user switches back to tab), and **every 5 minutes** (polling). Exposes `refetchTier()` for manual use (e.g. after Stripe checkout). | Tier is refetched automatically so trial extensions, upgrades, and expirations are picked up without a full refresh. |

So: business data itself is not cached, but the **tier** used for feature gating is “cached” in React state for the lifetime of the dashboard.

---

## 2. Where “pro” (or tier) access is checked – the conditionals that block features

| Location | How access is decided |
|----------|------------------------|
| **`lib/permissions.ts`** | `getTierFromBusiness(business, userEmail)` → returns `'starter' \| 'pro' \| 'fleet' \| null`. Uses `subscription_plan`, `subscription_status`, **and** `subscription_ends_at` (for trialing: only grant tier if `subscription_ends_at` is in the future or null). `hasFeature(tier, feature)` checks against `TIER_PERMISSIONS`. |
| **`lib/actions/permissions.ts`** | `checkFeature(feature)`, `getCurrentTier()`, etc. All call `getBusiness()` then `getTierFromBusiness(business, userEmail)`. |
| **`app/dashboard/layout.tsx`** | Uses `useFeatureGate()` → `can(feature)` and `tier`. Nav items use `requiredFeature` and `requiredTier` (e.g. `requiredTier: 'pro'`). So the condition that blocks is: `hasFeature(tier, feature)` and tier checks like `tier === 'pro'`. |
| **`lib/supabase/middleware.ts`** | **Only for `/dashboard/team`.** Fetches business with `.select('subscription_plan, subscription_status')` **only** – does **not** select `subscription_ends_at`. Then `isActive = status === 'active' \|\| 'trialing'` and `tier = plan`. So middleware does **not** consider trial expiry; it can allow expired trials to `/dashboard/team` or (if DB is wrong) block valid ones. |

So the main place that “blocks” features is **`hasFeature(tier, feature)`** and **`requiredTier`** in the dashboard layout, using the **tier** from **`useFeatureGate()`**.

---

## 3. Data flow (simplified)

```
User opens dashboard
  → Layout mounts
  → useFeatureGate() runs (and refetches on focus + every 5 min)
  → getCurrentTier() (server action)
  → getBusiness() (Supabase: subscription_plan, subscription_status, subscription_ends_at)
  → getTierFromBusiness(business, userEmail)
  → tier stored in React state (e.g. 'pro' or null)
  → can('feature') = hasFeature(tier, feature)
  → Nav and pages use can() / tier to show or hide features
```

Tier is refetched on **window focus** (e.g. user returns from admin panel or Stripe) and **every 5 minutes**, so subscription changes are picked up without a full refresh. Use `refetchTier()` from `useFeatureGate()` to refetch manually (e.g. after successful payment).

---

## 4. Most likely culprits (for “extended trial not recognized”)

1. **Tier refetched on focus + polling**  
   `useFeatureGate()` refetches tier on mount, when the window gains focus, and every 5 minutes. After you extend the trial, the user sees updated access when they switch back to the tab (or within 5 minutes).

2. **Middleware**  
   Only affects `/dashboard/team`. It doesn’t use `subscription_ends_at`, so it’s inconsistent with `getTierFromBusiness`. Aligning it with the same logic (and selecting `subscription_ends_at`) is recommended.

3. **Wrong DB / env**  
   App might be pointing at a different Supabase project than the one where you ran `extend_trial.sql`.

4. **Row not updated**  
   Step 2 in `extend_trial.sql` must affect 1 row (correct email, business exists). Step 3 should show `subscription_plan` set, `subscription_status = 'trialing'`, `subscription_ends_at` in the future.

---

## 5. Files to look at

- **Fetch business:** `lib/actions/business.ts` (getBusiness)
- **Compute tier from business:** `lib/permissions.ts` (getTierFromBusiness, hasFeature)
- **Load tier into UI:** `hooks/use-feature-gate.ts` (useFeatureGate) → `lib/actions/permissions.ts` (getCurrentTier)
- **Use tier to gate features:** `app/dashboard/layout.tsx` (nav), plus any page that uses `useFeatureGate()` or `checkFeature()` / `getCurrentTier()`
- **Middleware (team route only):** `lib/supabase/middleware.ts` (around line 207–225)
