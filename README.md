# BRNNO - Business Management Web App

A comprehensive business management application for detailers and service-based businesses, built with Next.js, Supabase, and TypeScript.

## Features

- 👥 **Client Management** - Track and manage your clients
- 🎯 **Lead Tracking** - Convert leads to clients
- 🛠️ **Service Catalog** - Manage your service offerings
- 📅 **Job Scheduling** - Schedule and track jobs
- 📄 **Quotes** - Create and manage quotes
- 🧾 **Invoices** - Invoice management with payment tracking
- ⭐ **Review Automation** - Automated review requests after job completion
- 📈 **Reports & Analytics** - Business insights and performance metrics

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account and project

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd brnno-webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Get these values from your Supabase project settings: https://app.supabase.com/project/_/settings/api

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Quick Deploy

1. **Push your code to GitHub**

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   
   In your Vercel project settings, add:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

4. **Deploy**
   
   Click "Deploy" and Vercel will build and deploy your app!

### Manual Deployment

If you prefer using the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Environment Variables

Make sure to set these in your Vercel project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

### Database Setup

Before deploying, ensure your Supabase database has all required tables:

- `businesses`
- `clients`
- `leads`
- `services`
- `jobs`
- `quotes`
- `quote_items`
- `invoices`
- `invoice_items`
- `payments`
- `review_requests`

See your Supabase project for the complete schema.

## Project Structure

```
brnno-webapp/
├── app/
│   ├── (auth)/          # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/       # Dashboard routes
│   │   ├── clients/
│   │   ├── services/
│   │   ├── jobs/
│   │   ├── quotes/
│   │   ├── invoices/
│   │   ├── leads/
│   │   ├── reviews/
│   │   ├── reports/
│   │   └── settings/
│   └── layout.tsx
├── components/          # React components
│   ├── clients/
│   ├── services/
│   ├── jobs/
│   ├── quotes/
│   ├── invoices/
│   ├── leads/
│   ├── reviews/
│   └── ui/             # Shadcn UI components
├── lib/
│   ├── actions/        # Server actions
│   └── supabase/       # Supabase clients
└── middleware.ts       # Auth middleware
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## License

Private - All rights reserved
