# Subscription / trial troubleshooting

When a customer’s trial was extended in the DB but the app still shows “no trial” or restricted access, use this checklist.

## 1. Confirm the database (Supabase)

1. Open **Supabase → SQL Editor** and use **extend_trial.sql**.
2. Run **Step 1** with the customer’s **exact login email** (the one they use to sign in).
   - You must see **exactly one row**. If 0 rows, the email is wrong or they have no business.
   - Note: `auth.users` is the source of truth for “login email”; it’s case-sensitive in some setups.
3. Run **Step 2** (the UPDATE) with that same email and your desired days (e.g. 14).
   - Check the message: “UPDATE 1” means one row was updated. “UPDATE 0” means no row matched (wrong email or no business).
4. Run **Step 3** (the verification SELECT) with the same email.
   - Confirm:
     - `subscription_plan` is set (`starter`, `pro`, or `fleet`).
     - `subscription_status` = `trialing`.
     - `subscription_ends_at` is a future timestamp.
     - `trial_now_valid` = `true`.

If any of these are wrong, fix the row (e.g. run Step 2 again with the correct email, or fix `subscription_plan` / `subscription_ends_at` manually) and then continue.

## 2. Confirm the app is using the right DB and code

- The app must point at the **same Supabase project** you just updated (e.g. production).
- The **latest code** must be deployed: `lib/permissions.ts` should include:
  - `subscription_ends_at` in the business type and “trial still valid” check.
  - For trialing, default plan when `subscription_plan` is null (e.g. `'starter'`).
- Redeploy after pulling the latest commit if needed.

## 3. See what the app actually sees (diagnostic)

1. Have the customer log in and go to **Dashboard → Settings → Subscription**.
2. If they have no access, a gray **“For support”** box appears with:
   - `subscription_plan`
   - `subscription_status`
   - `subscription_ends_at`
   - `trial_valid (ends_at in future?)`
   - `computed tier`
3. Compare this to **Step 3** in Supabase:
   - If the app shows `subscription_plan` empty, `subscription_status` not `trialing`, or `trial_valid: no`, the app is either reading different data (e.g. wrong env) or the row wasn’t updated correctly.
   - If the app shows correct values but `computed tier: null`, the logic in `getTierFromBusiness` may not be deployed or there’s a bug.

## 4. Have the customer refresh session

- Ask them to **refresh the page** (or hard refresh / pull-to-refresh).
- Or **log out and log back in** so the dashboard loads tier again from the server.

## 5. Common gotchas

| Issue | What to check |
|-------|----------------|
| Wrong email | Step 1 returns 0 rows. Use the **exact** sign-in email from auth (Supabase Auth users table or the user’s account screen). |
| UPDATE 0 rows | Email typo, or user has no business row (Step 1 would show `business_id` / business columns as null). |
| Different environment | App might be pointing at staging Supabase; update the row in the DB that the app actually uses. |
| RLS / policies | If the app uses a non–service-role key, ensure RLS allows the signed-in user to SELECT their business row (e.g. `owner_id = auth.uid()`). |
| Demo mode | If the app is in “demo mode” (e.g. cookie), it may return mock data; tier logic still runs on that mock data. |

## 6. Extend by business ID (if you have it)

If you know the business UUID (e.g. from Table Editor or Step 1), you can extend without the user’s email:

```sql
UPDATE businesses
SET
  subscription_status = 'trialing',
  subscription_plan = COALESCE(subscription_plan, 'pro'),
  subscription_ends_at = NOW() + INTERVAL '14 days'
WHERE id = 'paste-business-uuid-here';
```

Then run Step 3–style checks on that `id` to confirm.
