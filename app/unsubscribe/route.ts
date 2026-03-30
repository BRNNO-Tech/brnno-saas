import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function htmlPage(title: string, body: string) {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(title)}</title><style>body{font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#222}</style></head><body><h1 style="font-size:1.25rem">${esc(title)}</h1><p>${esc(body)}</p></body></html>`
}

export async function GET(request: NextRequest) {
  const client = request.nextUrl.searchParams.get('client')
  const org = request.nextUrl.searchParams.get('org')
  if (!client?.trim() || !org?.trim()) {
    return new NextResponse(htmlPage('Invalid link', 'This unsubscribe link is missing required information.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return new NextResponse(htmlPage('Error', 'Something went wrong. Please try again later.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const supabase = createClient(url, key)
  const { data: row, error: findErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', client.trim())
    .eq('business_id', org.trim())
    .maybeSingle()

  if (findErr || !row) {
    return new NextResponse(htmlPage('Invalid link', 'This unsubscribe link is invalid.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const { error: updErr } = await supabase
    .from('clients')
    .update({
      email_unsubscribed: true,
      email_unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', client.trim())

  if (updErr) {
    return new NextResponse(htmlPage('Error', 'Could not update your preference. Please try again later.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return new NextResponse(
    htmlPage(
      "You've been unsubscribed",
      "You won't receive marketing emails from this business anymore."
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
