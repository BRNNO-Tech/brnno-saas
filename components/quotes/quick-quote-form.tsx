'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createQuickQuote } from '@/lib/actions/quotes'
import { getServices, getAllAddons } from '@/lib/actions/services'
import { getClients } from '@/lib/actions/clients'
import { calculateTotals, mapVehicleTypeToPricingKey } from '@/lib/utils/booking-utils'
import { Sparkles, Copy, Check } from 'lucide-react'
import type { Service } from '@/types'
import VehicleSelector from '@/components/booking/vehicle-selector'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type Business = {
  id: string
  condition_config?: {
    enabled: boolean
    tiers: Array<{ id: string; label: string; description: string; markup_percent: number }>
  } | null
} | null

const VEHICLE_TYPES = [
  { value: 'coupe', label: 'Coupe', icon: '🏎️' },
  { value: 'sedan', label: 'Sedan', icon: '🚗' },
  { value: 'crossover', label: 'Crossover', icon: '🚙' },
  { value: 'suv', label: 'SUV', icon: '🚛' },
  { value: 'truck', label: 'Truck/Van', icon: '🚚' },
] as const

export default function QuickQuoteForm({ business }: { business: Business }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [addons, setAddons] = useState<Array<{ id: string; name: string; price?: number; duration_minutes?: number; is_active?: boolean }>>([])
  const [clients, setClients] = useState<Array<{ id: string; name: string; email?: string | null; phone?: string | null }>>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [generatedQuote, setGeneratedQuote] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [showVehicleDetails, setShowVehicleDetails] = useState(false)

  const conditionConfig = business?.condition_config
  const conditionTiers = conditionConfig?.enabled && conditionConfig.tiers?.length > 0
    ? conditionConfig.tiers
    : [
        { id: 'clean', label: 'Normal', markup_percent: 0 },
        { id: 'moderate', label: 'Dirty', markup_percent: 0.15 },
        { id: 'heavy', label: 'Very Dirty', markup_percent: 0.25 },
      ]
  const defaultCondition = conditionTiers[0]?.id || 'clean'

  const [formData, setFormData] = useState({
    vehicleType: 'sedan' as 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'crossover',
    vehicleCondition: defaultCondition,
    selectedServices: [] as string[],
    selectedAddons: [] as Array<{ id: string; name: string; price?: number; duration_minutes?: number }>,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
  })

  useEffect(() => {
    if (conditionTiers.length > 0 && !conditionTiers.find(t => t.id === formData.vehicleCondition)) {
      setFormData(prev => ({ ...prev, vehicleCondition: defaultCondition }))
    }
  }, [conditionTiers, defaultCondition, formData.vehicleCondition])

  useEffect(() => {
    getServices()
      .then(data => setServices(
        data.filter((s: any) => s.is_active !== false)
            .sort((a: any, b: any) => (a.base_price || a.price || 0) - (b.base_price || b.price || 0))
      ))
      .catch(() => alert('Failed to load services. Please refresh.'))
  }, [])

  useEffect(() => {
    getAllAddons()
      .then(data => setAddons((data || []).filter((a: any) => a.is_active !== false)))
      .catch(console.error)
  }, [])

  useEffect(() => {
    getClients()
      .then(data => setClients(data || []))
      .catch(console.error)
  }, [])

  const calculatePrice = () => {
    if (formData.selectedServices.length === 0) return 0
    let total = 0
    formData.selectedServices.forEach(id => {
      const service = services.find(s => s.id === id)
      if (!service) return
      const svc: Service = {
        ...service,
        base_price: service.base_price ?? service.price ?? 0,
        is_active: service.is_active ?? true,
        created_at: service.created_at ?? new Date().toISOString(),
        updated_at: service.updated_at ?? new Date().toISOString(),
        is_popular: service.is_popular ?? false,
      } as Service
      const totals = calculateTotals(svc, mapVehicleTypeToPricingKey(formData.vehicleType), [], formData.vehicleCondition, conditionConfig || null)
      total += totals.price
    })
    formData.selectedAddons.forEach(a => { total += Number(a.price || 0) })
    return Math.round(total * 100) / 100
  }

  const estimatedPrice = calculatePrice()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const quote = await createQuickQuote({
        vehicleType: formData.vehicleType,
        vehicleCondition: formData.vehicleCondition,
        services: formData.selectedServices,
        addons: formData.selectedAddons.length > 0 ? formData.selectedAddons : undefined,
        customerName: formData.customerName || undefined,
        customerPhone: formData.customerPhone || undefined,
        customerEmail: formData.customerEmail || undefined,
      })
      setGeneratedQuote(quote)
      router.refresh()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to generate quote.')
    } finally {
      setLoading(false)
    }
  }

  function copyQuoteLink() {
    const link = `${window.location.origin}/q/${generatedQuote.quote_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // — Success state —
  if (generatedQuote) {
    const quoteLink = `${window.location.origin}/q/${generatedQuote.quote_code}`
    return (
      <div className="space-y-4">
        <div className="border border-[var(--dash-green)]/30 bg-[var(--dash-green)]/8 px-5 py-6 text-center">
          <Sparkles className="h-8 w-8 text-[var(--dash-green)] mx-auto mb-3" />
          <div className="font-dash-condensed font-extrabold text-xl uppercase tracking-wide text-[var(--dash-green)] mb-1">Quote Generated</div>
          <div className="font-dash-condensed font-extrabold text-5xl text-[var(--dash-amber)] mb-3">
            ${generatedQuote.total_price.toFixed(2)}
          </div>
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mb-4">
            Code: <span className="text-[var(--dash-text)]">{generatedQuote.quote_code}</span>
          </div>

          {/* Share link */}
          <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-3 mb-4">
            <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mb-2 uppercase tracking-wider">Share link</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={quoteLink}
                readOnly
                className="flex-1 bg-[var(--dash-surface)] border border-[var(--dash-border)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-text)] outline-none"
              />
              <button
                onClick={copyQuoteLink}
                className="px-3 py-2 border border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-[var(--dash-green)]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setGeneratedQuote(null)}
            className="w-full py-2.5 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[13px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors"
          >
            Generate Another Quote
          </button>
        </div>
      </div>
    )
  }

  // — Form —
  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Vehicle Type */}
      <div>
        <div className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] mb-3">Vehicle Type *</div>
        <div className="grid grid-cols-5 gap-px bg-[var(--dash-border)]">
          {VEHICLE_TYPES.map(type => (
            <label key={type.value} className="cursor-pointer">
              <input
                type="radio"
                name="vehicleType"
                value={type.value}
                checked={formData.vehicleType === type.value}
                onChange={e => setFormData({ ...formData, vehicleType: e.target.value as any })}
                className="sr-only"
              />
              <div className={cn(
                'flex flex-col items-center gap-1.5 px-2 py-3 transition-colors text-center',
                formData.vehicleType === type.value
                  ? 'bg-[var(--dash-graphite)] border-t-2 border-t-[var(--dash-amber)]'
                  : 'bg-[var(--dash-surface)] hover:bg-[var(--dash-graphite)]'
              )}>
                <span className="text-xl">{type.icon}</span>
                <span className={cn(
                  'font-dash-condensed font-bold text-[12px] uppercase tracking-wide',
                  formData.vehicleType === type.value ? 'text-[var(--dash-amber)]' : 'text-[var(--dash-text-muted)]'
                )}>{type.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <div className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] mb-3">Condition *</div>
        <div className={`grid gap-px bg-[var(--dash-border)] ${conditionTiers.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {conditionTiers.map(tier => (
            <label key={tier.id} className="cursor-pointer">
              <input
                type="radio"
                name="condition"
                value={tier.id}
                checked={formData.vehicleCondition === tier.id}
                onChange={e => setFormData({ ...formData, vehicleCondition: e.target.value })}
                className="sr-only"
              />
              <div className={cn(
                'px-3 py-3 text-center transition-colors',
                formData.vehicleCondition === tier.id
                  ? 'bg-[var(--dash-graphite)] border-t-2 border-t-[var(--dash-amber)]'
                  : 'bg-[var(--dash-surface)] hover:bg-[var(--dash-graphite)]'
              )}>
                <span className={cn(
                  'font-dash-condensed font-bold text-[13px] uppercase tracking-wide',
                  formData.vehicleCondition === tier.id ? 'text-[var(--dash-amber)]' : 'text-[var(--dash-text-muted)]'
                )}>{tier.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Vehicle Details (optional) */}
      <div className="border-t border-[var(--dash-border)] pt-5">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <div className="font-dash-condensed font-bold text-[13px] uppercase tracking-wide text-[var(--dash-text)]">Vehicle Details (Optional)</div>
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-0.5">Add year, make & model if you have them</div>
          </div>
          <button
            type="button"
            onClick={() => setShowVehicleDetails(!showVehicleDetails)}
            className="flex-shrink-0 font-dash-condensed font-bold text-[12px] uppercase tracking-wider px-3 py-1.5 border border-[var(--dash-amber)] text-[var(--dash-amber)] hover:bg-[var(--dash-amber)]/10 transition-colors"
          >
            {showVehicleDetails ? 'Hide ↑' : 'Add info ↓'}
          </button>
        </div>
        {showVehicleDetails && (
          <VehicleSelector
            onSelect={(vehicle) =>
              setFormData((prev) => ({
                ...prev,
                ...(vehicle.type ? { vehicleType: vehicle.type as any } : {}),
                vehicleYear: vehicle.year,
                vehicleMake: vehicle.make,
                vehicleModel: vehicle.model,
              }))
            }
            initialValue={{ asset_year: formData.vehicleYear || undefined, asset_make: formData.vehicleMake || undefined, asset_model: formData.vehicleModel || undefined }}
          />
        )}
      </div>

      {/* Services */}
      <div>
        <div className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] mb-3">Services * (select at least one)</div>
        {services.length === 0 ? (
          <div className="border border-[var(--dash-border)] px-4 py-6 text-center font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            No services available. Add services in Settings → Services first.
          </div>
        ) : (
          <div className="space-y-px bg-[var(--dash-border)]">
            {services.map(service => {
              const selected = formData.selectedServices.includes(service.id)
              return (
                <label key={service.id} className="cursor-pointer block">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={e => {
                      setFormData({
                        ...formData,
                        selectedServices: e.target.checked
                          ? [...formData.selectedServices, service.id]
                          : formData.selectedServices.filter(id => id !== service.id)
                      })
                    }}
                    className="sr-only"
                  />
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    selected ? 'bg-[var(--dash-graphite)] border-l-2 border-l-[var(--dash-amber)]' : 'bg-[var(--dash-surface)] hover:bg-[var(--dash-graphite)] border-l-2 border-l-transparent'
                  )}>
                    <div className={cn(
                      'h-4 w-4 flex-shrink-0 border flex items-center justify-center',
                      selected ? 'border-[var(--dash-amber)] bg-[var(--dash-amber)]' : 'border-[var(--dash-border-bright)]'
                    )}>
                      {selected && <div className="h-2 w-2 bg-[var(--dash-black)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-dash-condensed font-bold text-[14px] text-[var(--dash-text)]">{service.name}</div>
                      {service.description && (
                        <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] truncate">{service.description}</div>
                      )}
                    </div>
                    <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-amber)] flex-shrink-0">
                      ${(service.base_price || service.price || 0).toFixed(2)}
                      {service.pricing_model === 'variable' && (
                        <span className="font-dash-mono text-[9px] text-[var(--dash-text-muted)] ml-1">varies</span>
                      )}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Add-ons */}
      {addons.length > 0 && (
        <div>
          <div className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] mb-3">Add-ons (optional)</div>
          <div className="space-y-px bg-[var(--dash-border)]">
            {addons.map(addon => {
              const selected = formData.selectedAddons.some(a => a.id === addon.id)
              return (
                <label key={addon.id} className="cursor-pointer block">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={e => {
                      setFormData({
                        ...formData,
                        selectedAddons: e.target.checked
                          ? [...formData.selectedAddons, { id: addon.id, name: addon.name, price: addon.price, duration_minutes: addon.duration_minutes }]
                          : formData.selectedAddons.filter(a => a.id !== addon.id)
                      })
                    }}
                    className="sr-only"
                  />
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-2.5 transition-colors',
                    selected ? 'bg-[var(--dash-graphite)] border-l-2 border-l-[var(--dash-amber)]' : 'bg-[var(--dash-surface)] hover:bg-[var(--dash-graphite)] border-l-2 border-l-transparent'
                  )}>
                    <div className={cn(
                      'h-4 w-4 flex-shrink-0 border flex items-center justify-center',
                      selected ? 'border-[var(--dash-amber)] bg-[var(--dash-amber)]' : 'border-[var(--dash-border-bright)]'
                    )}>
                      {selected && <div className="h-2 w-2 bg-[var(--dash-black)]" />}
                    </div>
                    <span className="flex-1 font-dash-condensed font-bold text-[13px] text-[var(--dash-text)]">{addon.name}</span>
                    <span className="font-dash-condensed font-bold text-[13px] text-[var(--dash-green)] flex-shrink-0">
                      +${Number(addon.price || 0).toFixed(2)}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="border-t border-[var(--dash-border)] pt-5">
        <div className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] mb-3">Customer (Optional)</div>
        <div className="mb-3">
          <div className="font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-text-muted)] mb-1.5">Quote for existing customer</div>
          <select
            value={selectedClientId}
            onChange={e => {
              const id = e.target.value
              setSelectedClientId(id)
              if (id) {
                const client = clients.find(c => c.id === id)
                if (client) {
                  setFormData(prev => ({
                    ...prev,
                    customerName: client.name || '',
                    customerPhone: (client.phone as string) || '',
                    customerEmail: (client.email as string) || '',
                  }))
                }
              } else {
                setFormData(prev => ({ ...prev, customerName: '', customerPhone: '', customerEmail: '' }))
              }
            }}
            className="w-full bg-[var(--dash-surface)] border border-[var(--dash-border)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] outline-none focus:border-[var(--dash-amber)] transition-colors"
          >
            <option value="">None — new or unknown customer</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        <div className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] mb-3">Customer Info (Optional)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'customerName', label: 'Name', placeholder: 'John Doe', type: 'text' },
            { key: 'customerPhone', label: 'Phone', placeholder: '(555) 123-4567', type: 'tel' },
            { key: 'customerEmail', label: 'Email', placeholder: 'john@example.com', type: 'email' },
          ].map(field => (
            <div key={field.key}>
              <div className="font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-text-muted)] mb-1.5">{field.label}</div>
              <input
                type={field.type}
                value={formData[field.key as keyof typeof formData] as string}
                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full bg-[var(--dash-surface)] border border-[var(--dash-border)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] outline-none focus:border-[var(--dash-amber)] transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Price preview */}
      {formData.selectedServices.length > 0 && (() => {
        let baseTotal = 0, sizeFeeTotal = 0, conditionFeeTotal = 0
        formData.selectedServices.forEach(id => {
          const service = services.find(s => s.id === id)
          if (!service) return
          const svc: Service = { ...service, base_price: service.base_price ?? service.price ?? 0, is_active: service.is_active ?? true, created_at: service.created_at ?? new Date().toISOString(), updated_at: service.updated_at ?? new Date().toISOString(), is_popular: service.is_popular ?? false } as Service
          const totals = calculateTotals(svc, mapVehicleTypeToPricingKey(formData.vehicleType), [], formData.vehicleCondition, conditionConfig || null)
          baseTotal += totals.breakdown?.base || 0
          sizeFeeTotal += totals.breakdown?.sizeFee || 0
          conditionFeeTotal += totals.breakdown?.conditionFee || 0
        })
        const addonsTotal = formData.selectedAddons.reduce((sum, a) => sum + Number(a.price || 0), 0)
        const hasAdjustments = sizeFeeTotal !== 0 || conditionFeeTotal > 0 || addonsTotal > 0

        return (
          <div className="border border-[var(--dash-border)] bg-[var(--dash-surface)] px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)]">Estimated Price</span>
              <span className="font-dash-condensed font-extrabold text-3xl text-[var(--dash-amber)]">${estimatedPrice.toFixed(2)}</span>
            </div>
            {hasAdjustments && (
              <div className="space-y-1 border-t border-[var(--dash-border)] pt-3">
                <div className="flex justify-between font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                  <span>Base services</span><span>${baseTotal.toFixed(2)}</span>
                </div>
                {sizeFeeTotal !== 0 && (() => {
                  const adjustment = sizeFeeTotal
                  const adjustmentDisplay =
                    adjustment >= 0
                      ? `+$${adjustment.toFixed(2)}`
                      : `-$${Math.abs(adjustment).toFixed(2)}`
                  return (
                    <div className="flex justify-between font-dash-mono text-[11px] text-[var(--dash-blue)]">
                      <span>Vehicle size ({formData.vehicleType})</span>
                      <span>{adjustmentDisplay}</span>
                    </div>
                  )
                })()}
                {conditionFeeTotal > 0 && (
                  <div className="flex justify-between font-dash-mono text-[11px] text-[var(--dash-amber)]">
                    <span>Condition fee</span><span>+${conditionFeeTotal.toFixed(2)}</span>
                  </div>
                )}
                {addonsTotal > 0 && (
                  <div className="flex justify-between font-dash-mono text-[11px] text-[var(--dash-green)]">
                    <span>Add-ons</span><span>+${addonsTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || formData.selectedServices.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-extrabold text-[15px] uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating...' : 'Generate Quote'}
        <Sparkles className="h-4 w-4" />
      </button>
    </form>
  )
}
