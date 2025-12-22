# Vercel Deployment Guide

This guide will help you deploy your BRNNO web app to Vercel.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project** - Your Supabase project should be set up with all required tables

## Step-by-Step Deployment

### 1. Push Code to GitHub

Make sure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js - no configuration needed!

### 3. Configure Environment Variables

In your Vercel project settings, go to **Settings → Environment Variables** and add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |

**Where to find these values:**
- Go to your Supabase project: https://app.supabase.com
- Navigate to **Settings → API**
- Copy the **Project URL** and **anon/public key**

### 4. Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your app
3. Wait for the build to complete (usually 2-3 minutes)
4. Your app will be live at `https://your-project.vercel.app`

## Post-Deployment Checklist

### ✅ Verify Deployment

- [ ] App loads without errors
- [ ] Authentication works (login/signup)
- [ ] Dashboard displays correctly
- [ ] All pages are accessible
- [ ] Database connections work

### ✅ Database Setup

Ensure your Supabase database has all required tables:

- [ ] `businesses`
- [ ] `clients`
- [ ] `leads`
- [ ] `services`
- [ ] `jobs`
- [ ] `quotes`
- [ ] `quote_items`
- [ ] `invoices`
- [ ] `invoice_items`
- [ ] `payments`
- [ ] `review_requests`

### ✅ Test Core Features

- [ ] Create a client
- [ ] Create a service
- [ ] Create a job
- [ ] Create a quote
- [ ] Create an invoice
- [ ] Complete a job (triggers review request)

## Environment Variables Reference

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Optional Variables

These are not required but can be useful:

```env
# Only if you need service role access (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Custom Domain (Optional)

1. Go to **Settings → Domains** in your Vercel project
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. SSL certificates are automatically provisioned

## Troubleshooting

### Build Fails

- Check that all environment variables are set
- Verify your `package.json` has correct build scripts
- Check build logs in Vercel dashboard

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure database tables exist

### Authentication Not Working

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check Supabase Auth settings
- Verify redirect URLs in Supabase dashboard

### Middleware Warning

The warning about middleware is informational - Next.js 16 uses a new convention, but the current setup works fine on Vercel.

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run builds automatically

## Performance Optimization

Vercel automatically optimizes:
- ✅ Edge Network (CDN)
- ✅ Image Optimization
- ✅ Automatic HTTPS
- ✅ Serverless Functions
- ✅ Edge Middleware

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)

