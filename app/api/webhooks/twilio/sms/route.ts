import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizePhoneNumber } from '@/lib/utils/phone'

const TWIML_EMPTY = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`

function twimlResponse() {
  return new NextResponse(TWIML_EMPTY, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Twilio sends form-encoded body
    const raw = await request.text()
    const params = new URLSearchParams(raw)
    const fromNumber = params.get('From') ?? ''
    const toNumber = params.get('To') ?? ''
    const body = params.get('Body') ?? ''
    const accountSid = params.get('AccountSid') ?? ''

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[twilio/sms] Missing Supabase env')
      return twimlResponse()
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Find business that owns the "To" Twilio number
    const toNormalized = normalizePhoneNumber(toNumber)
    if (!toNormalized) {
      console.warn('[twilio/sms] Could not normalize To number:', toNumber)
      return twimlResponse()
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('twilio_phone_number', toNormalized)
      .maybeSingle()

    if (businessError) {
      console.error('[twilio/sms] Business lookup error:', businessError)
      return twimlResponse()
    }
    if (!business) {
      console.warn('[twilio/sms] No business for To number:', toNormalized)
      return twimlResponse()
    }

    // Find lead for "From" phone for this business
    const fromNormalized = normalizePhoneNumber(fromNumber)
    if (!fromNormalized) {
      console.warn('[twilio/sms] Could not normalize From number:', fromNumber)
      return twimlResponse()
    }

    const { data: leads } = await supabase
      .from('leads')
      .select('id, phone')
      .eq('business_id', business.id)

    const lead = (leads ?? []).find((l) => normalizePhoneNumber(l.phone) === fromNormalized)
    if (!lead) {
      console.warn('[twilio/sms] No lead for From number:', fromNormalized, 'business:', business.id)
      return twimlResponse()
    }

    await supabase.from('sms_messages').insert({
      direction: 'inbound',
      from_number: fromNumber,
      to_number: toNumber,
      body,
      business_id: business.id,
      lead_id: lead.id,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[twilio/sms] Error:', e)
  }
  return twimlResponse()
}
