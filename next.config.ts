import type { NextConfig } from "next";
import path from "path";
import { readFileSync, existsSync } from "fs";

// Load .env.local - prefer app root (same dir as next.config) so Stripe/API vars in brnno-io/.env.local are always used.
const envLocalCandidates = [
  path.join(__dirname, ".env.local"), // app root first (brnno-io)
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "brnno-web-v2", ".env.local"),
  path.join(__dirname, "..", ".env.local"),
];
// Load app root .env.local first, then cwd's if different (cwd overrides for run-from-repo-root)
const appRootEnv = path.join(__dirname, ".env.local");
const cwdEnv = path.resolve(process.cwd(), ".env.local");

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  let content = readFileSync(filePath, "utf-8");
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    if (key.charCodeAt(0) === 0xfeff) key = key.slice(1);
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key) {
      process.env[key] = value;
      if (key.includes("SUPABASE")) loadedKeys.push(key);
    }
  }
}

let envLocalPath = "";
for (const p of envLocalCandidates) {
  if (existsSync(p)) {
    envLocalPath = p;
    break;
  }
}
const loadedKeys: string[] = [];
// Load cwd first, then app root so brnno-io/.env.local (STRIPE_*, etc.) always wins when running from repo root.
if (cwdEnv !== appRootEnv) loadEnvFile(cwdEnv);
loadEnvFile(appRootEnv);
if (!envLocalPath && existsSync(appRootEnv)) envLocalPath = appRootEnv;
else if (!envLocalPath) envLocalPath = cwdEnv;
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
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Explicitly pass env so they are available in API routes (avoids .env load order / cwd issues)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    STRIPE_STARTER_MONTHLY_PRICE_ID: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    STRIPE_STARTER_YEARLY_PRICE_ID: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    STRIPE_PRICE_PRO_1_2_MONTHLY: process.env.STRIPE_PRICE_PRO_1_2_MONTHLY,
    STRIPE_PRICE_PRO_1_2_ANNUAL: process.env.STRIPE_PRICE_PRO_1_2_ANNUAL,
    STRIPE_PRICE_PRO_3_MONTHLY: process.env.STRIPE_PRICE_PRO_3_MONTHLY,
    STRIPE_PRICE_PRO_3_ANNUAL: process.env.STRIPE_PRICE_PRO_3_ANNUAL,
    STRIPE_PRICE_FLEET_1_3_MONTHLY: process.env.STRIPE_PRICE_FLEET_1_3_MONTHLY,
    STRIPE_PRICE_FLEET_1_3_ANNUAL: process.env.STRIPE_PRICE_FLEET_1_3_ANNUAL,
    STRIPE_PRICE_FLEET_4_5_MONTHLY: process.env.STRIPE_PRICE_FLEET_4_5_MONTHLY,
    STRIPE_PRICE_FLEET_4_5_ANNUAL: process.env.STRIPE_PRICE_FLEET_4_5_ANNUAL,
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
