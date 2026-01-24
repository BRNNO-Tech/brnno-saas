# Vercel Environment Variables Setup

If you're seeing errors about missing Supabase environment variables, follow these steps:

## Step 1: Verify Environment Variables in Vercel

1. Go to your Vercel project: <https://vercel.com>
2. Navigate to your project → **Settings** → **Environment Variables**
3. Verify these two variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: Get Your Supabase Credentials

1. Go to your Supabase project: <https://app.supabase.com>
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Add/Update in Vercel

1. In Vercel Environment Variables:
   - Click **Add New** or **Edit** existing variable
   - Set **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - Set **Value**: Your Supabase Project URL
   - Select **Environments**: Production, Preview, Development (all three)
   - Click **Save**

2. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 4: Redeploy

After adding/updating environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for the deployment to complete

## Step 5: Verify

After redeployment, check:

- [ ] App loads without errors
- [ ] You can log in
- [ ] Settings page loads
- [ ] You can create/update business profile

## Troubleshooting

### Still seeing errors?

1. **Check the browser console** (F12 → Console tab) for detailed error messages
2. **Verify the values** - Make sure there are no extra spaces or quotes in the Vercel environment variables
3. **Check deployment logs** - In Vercel, go to the deployment and check the build logs for any errors
4. **Verify Supabase project** - Make sure your Supabase project is active and accessible

### Common Issues

- **"Missing Supabase environment variables"** → Variables not set in Vercel or not redeployed after adding them
- **"Authentication error"** → Supabase URL or key might be incorrect
- **"No business found"** → Business record doesn't exist (this is normal for new users - use Settings to create one)
