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

