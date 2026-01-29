# Supabase Setup

This directory contains the Supabase client configuration for your Next.js application.

## Files

- **client.ts** - Browser/client-side Supabase client (use in Client Components)
- **server.ts** - Server-side Supabase client (use in Server Components, Server Actions, Route Handlers)
- **middleware.ts** - Helper function for Next.js middleware authentication

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings:
https://app.supabase.com/project/_/settings/api

## Usage

### Client Components

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export default function ClientComponent() {
  const supabase = createClient()
  
  // Use supabase client here
}
```

### Server Components

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  
  // Use supabase client here
}
```

### Server Actions

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'

export async function myServerAction() {
  const supabase = await createClient()
  
  // Use supabase client here
}
```

## Authentication

The middleware is configured to protect routes by default. Users will be redirected to `/login` if they're not authenticated.

To exclude certain routes from authentication, modify the `middleware.ts` file in the root directory.

### Dev: "Email not confirmed" (400) on login

For **dev Supabase projects**, sign-in can fail with a 400 and "Email not confirmed" because Supabase requires email confirmation by default. You can:

1. **Disable confirmation (easiest for dev):**  
   Supabase Dashboard → **Authentication** → **Providers** → **Email** → turn off **"Confirm email"**. New signups can then sign in without clicking a link.

2. **Keep it on:** Use the **Resend confirmation email** option on the login page after a failed sign-in, or confirm the user in the Dashboard: **Authentication** → **Users** → select user → **Confirm email**.

### Confirmation link points to localhost (won’t load on production)

If the link in the confirmation email goes to `http://localhost:3000` instead of your real URL (e.g. `https://app.brnno.io`), do this:

1. **Add your real URL in Supabase:**  
   Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs** → add e.g. `https://app.brnno.io/auth/callback` (and any staging URLs). Save.

2. **Use the app on that URL when requesting/resending confirmation:**  
   Open the app at the URL you want (e.g. `https://app.brnno.io/login`), then use **Resend confirmation email**. The new email will contain a link to that origin. Signup and resend now send `emailRedirectTo` from the current page’s origin, so the link in the email matches where you’re using the app.

