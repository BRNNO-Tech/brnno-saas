import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for Vercel deployment
  output: undefined, // Let Vercel handle the output
  
  // Note: File uploads are handled via API routes (/api/upload-*) which don't have the 1MB Server Actions limit

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
