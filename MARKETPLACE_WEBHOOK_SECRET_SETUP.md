# Marketplace Webhook Secret Setup

## What is this?

The `MARKETPLACE_WEBHOOK_SECRET` is a security token that verifies webhook requests are coming from your Firebase marketplace. It prevents unauthorized requests to your Supabase webhook endpoint.

## Step 1: Generate a Secret

You need to create a random, secure string. You can:

**Option A: Use a password generator**
- Generate a random 32+ character string
- Example: `mkp_whsec_7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Option B: Use Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C: Use an online generator**
- Go to https://www.random.org/strings/
- Generate a 32+ character alphanumeric string

## Step 2: Set in Local Environment

Add to your `.env.local` file:

```env
MARKETPLACE_WEBHOOK_SECRET=your-generated-secret-here
```

**Important:** Replace `your-generated-secret-here` with the actual secret you generated.

## Step 3: Set in Vercel (Production)

1. Go to your Vercel project: https://vercel.com
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `MARKETPLACE_WEBHOOK_SECRET`
   - **Value**: Your generated secret (same as in `.env.local`)
   - **Environments**: Production, Preview, Development (all three)
4. Click **Save**

## Step 4: Configure Firebase Marketplace

Your Firebase marketplace needs to send this secret in the webhook header.

When your Firebase marketplace sends webhooks to:
```
https://yourdomain.com/api/webhooks/marketplace
```

It should include this header:
```
x-marketplace-signature: your-generated-secret-here
```

**Where to configure this:**
- In your Firebase marketplace code/configuration
- When setting up webhooks that call your Next.js API route
- The exact location depends on how your Firebase marketplace is set up

## Step 5: Test

1. Make sure the secret is set in both `.env.local` and Vercel
2. Restart your local dev server if running
3. When your Firebase marketplace sends a webhook, it should include the `x-marketplace-signature` header
4. Check your webhook logs to verify it's working

## Security Notes

- **Never commit the secret to Git** - It's already in `.gitignore` via `.env.local`
- **Use different secrets for dev/staging/production** if you have separate environments
- **Keep it long and random** - At least 32 characters
- **Don't share it publicly** - Treat it like a password

## Troubleshooting

**"Invalid signature" error:**
- ✅ Check that the secret in `.env.local` matches the one in Vercel
- ✅ Check that Firebase is sending the correct header name: `x-marketplace-signature`
- ✅ Check that the header value matches your secret exactly (no extra spaces)
- ✅ Restart your dev server after adding the secret

**Webhook not being called:**
- ✅ Check that the webhook URL is correct: `https://yourdomain.com/api/webhooks/marketplace`
- ✅ Check that Firebase marketplace is configured to send webhooks
- ✅ Check Vercel deployment logs for errors

## Quick Reference

- **Environment Variable Name**: `MARKETPLACE_WEBHOOK_SECRET`
- **Header Name**: `x-marketplace-signature`
- **Webhook Endpoint**: `/api/webhooks/marketplace`
- **Location in Code**: `app/api/webhooks/marketplace/route.ts` (line 16, 30)
