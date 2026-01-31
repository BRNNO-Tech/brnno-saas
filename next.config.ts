import type { NextConfig } from "next";
import path from "path";
import { readFileSync, existsSync } from "fs";

// Load .env.local - try multiple locations so it works from any run context.
const envLocalCandidates = [
  path.resolve(process.cwd(), ".env.local"),
  path.join(__dirname, ".env.local"),
  path.resolve(process.cwd(), "brnno-web-v2", ".env.local"),
  path.join(__dirname, "..", ".env.local"), // if __dirname is .next, project root is parent
];
let envLocalPath = "";
for (const p of envLocalCandidates) {
  if (existsSync(p)) {
    envLocalPath = p;
    break;
  }
}
const loadedKeys: string[] = [];
if (envLocalPath) {
  let content = readFileSync(envLocalPath, "utf-8");
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // strip BOM
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    if (key.charCodeAt(0) === 0xfeff) key = key.slice(1);
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
      if (key.includes("SUPABASE")) loadedKeys.push(key);
    }
  }
}
// Fallbacks for common alternate names in .env.local
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}

const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const hasKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
if (!hasUrl || !hasKey) {
  console.warn(
    "[next.config] Supabase client env:",
    "NEXT_PUBLIC_SUPABASE_URL=" + (hasUrl ? "set" : "MISSING"),
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=" + (hasKey ? "set" : "MISSING"),
    "| .env.local:",
    envLocalPath || "not found (tried cwd, __dirname, cwd/brnno-web-v2)",
    "| Supabase keys loaded from file:",
    loadedKeys.length ? loadedKeys.join(", ") : "(none)",
    "| cwd:",
    process.cwd(),
    "| __dirname:",
    __dirname
  );
}

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for Vercel deployment
  output: undefined, // Let Vercel handle the output

  // Allow larger uploads in Server Actions (e.g. service images up to 10 MB)
  serverActions: {
    bodySizeLimit: '10mb',
  },

  // Explicitly pass Supabase env so they are inlined for the client (fixes "missing" when .env.local exists)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Configure image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kvlsqzmvuaehqhjkskch.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow any Supabase storage URL
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow Unsplash images for demo mode
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Allow local Supabase storage (dev)
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Add headers to allow Stripe Connect
  /*
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://connect.stripe.com https://*.stripe.com https://*.stripecdn.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://js.stripe.com https://*.stripe.com",
              "img-src 'self' data: https: blob: https://*.stripe.com https://*.stripecdn.com",
              "font-src 'self' data: https://fonts.gstatic.com https://js.stripe.com https://*.stripe.com",
              "connect-src 'self' https://kvlsqzmvuaehqhjkskch.supabase.co https://*.supabase.co https://api.stripe.com https://connect.stripe.com https://connect-js.stripe.com https://*.stripe.com https://*.stripecdn.com wss://*.stripe.com https://q.stripe.com https://m.stripe.com https://m.stripecdn.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://connect.stripe.com https://*.stripe.com https://*.stripecdn.com",
              "worker-src 'self' blob: https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  */
};

export default nextConfig;
