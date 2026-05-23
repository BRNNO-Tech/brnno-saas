import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service-client'
import { calculateTotals, mapVehicleTypeToPricingKey } from '@/lib/utils/booking-utils'
import type { Service } from '@/types'

const VEHICLE_TYPES = ['sedan', 'suv', 'truck', 'van', 'coupe', 'crossover'] as const
type VehicleType = (typeof VEHICLE_TYPES)[number]

type ConditionConfig = {
  enabled: boolean
  tiers: Array<{
    id: string
    label: string
    description: string
    markup_percent: number
  }>
} | null

function canUsePublicQuickQuote(business: {
  billing_plan?: string | null
  modules?: Record<string, unknown> | null
}): boolean {
  if (business.billing_plan === 'pro') return true
  return business.modules?.quickQuote === true
}

async function generateQuoteCode(supabase: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data: codeResult, error: rpcError } = await supabase.rpc('generate_quote_code')
    if (!rpcError && codeResult) {
      return String(codeResult)
    }
  } catch {
    // fallback below
  }

  let quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data: existing } = await supabase
      .from('quotes')
      .select('id')
      .eq('quote_code', quoteCode)
      .maybeSingle()
    if (!existing) return quoteCode
    quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  }
  return quoteCode
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const businessId = typeof body.businessId === 'string' ? body.businessId.trim() : ''
    const serviceId = typeof body.serviceId === 'string' ? body.serviceId.trim() : ''
    const vehicleType = typeof body.vehicleType === 'string' ? body.vehicleType.trim().toLowerCase() : ''
    const vehicleCondition =
      typeof body.vehicleCondition === 'string' ? body.vehicleCondition.trim() : ''

    if (!businessId || !serviceId || !vehicleType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!VEHICLE_TYPES.includes(vehicleType as VehicleType)) {
      return NextResponse.json({ error: 'Invalid vehicle type' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, billing_plan, modules, condition_config')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!canUsePublicQuickQuote(business)) {
      return NextResponse.json({ error: 'Quick quote not available' }, { status: 403 })
    }

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const conditionConfig = (business.condition_config as ConditionConfig) || null
    const conditionEnabled =
      conditionConfig?.enabled && (conditionConfig.tiers?.length ?? 0) > 0

    let resolvedCondition = vehicleCondition
    if (conditionEnabled) {
      const tierIds = conditionConfig!.tiers.map((t) => t.id)
      if (!resolvedCondition || !tierIds.includes(resolvedCondition)) {
        return NextResponse.json({ error: 'Invalid vehicle condition' }, { status: 400 })
      }
    } else {
      resolvedCondition = resolvedCondition || 'clean'
    }

    const svc = service as Service
    const totals = calculateTotals(
      {
        ...svc,
        base_price: svc.base_price ?? svc.price ?? 0,
        is_active: svc.is_active ?? true,
        created_at: svc.created_at ?? new Date().toISOString(),
        updated_at: svc.updated_at ?? new Date().toISOString(),
        is_popular: svc.is_popular ?? false,
      },
      mapVehicleTypeToPricingKey(vehicleType),
      [],
      resolvedCondition,
      conditionConfig
    )

    const quoteCode = await generateQuoteCode(supabase)
    const totalPrice = Math.round(totals.price * 100) / 100

    const { data: quote, error: insertError } = await supabase
      .from('quotes')
      .insert({
        business_id: businessId,
        vehicle_type: vehicleType,
        vehicle_condition: resolvedCondition,
        services: [serviceId],
        total_price: totalPrice,
        quote_code: quoteCode,
        status: 'draft',
      })
      .select('id, quote_code, total_price')
      .single()

    if (insertError || !quote) {
      console.error('[public/quick-quote] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
    }

    return NextResponse.json({
      quoteCode: quote.quote_code,
      totalPrice: Number(quote.total_price),
      totalDuration: totals.duration,
      serviceId,
      serviceName: service.name,
    })
  } catch (err) {
    console.error('[public/quick-quote]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
