/** Public app base URL (no trailing slash). Safe for API routes and server code. */
export function getAppBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (raw?.trim()) return raw.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel?.trim()) return `https://${vercel.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}
