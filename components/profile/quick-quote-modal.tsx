'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

type ConditionConfig = {
  enabled: boolean
  tiers: Array<{
    id: string
    label: string
    description?: string
    markup_percent: number
  }>
} | null

type ProfileService = {
  id: string
  name: string
  description?: string | null
  base_price?: number | null
  price?: number | null
  duration_minutes?: number | null
  base_duration?: number | null
  estimated_duration?: number | null
  show_pricing?: boolean | null
}

type Theme = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

type QuoteResult = {
  quoteCode: string
  totalPrice: number
  totalDuration: number
  serviceId: string
  serviceName: string
}

const VEHICLE_OPTIONS = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'van', label: 'Van' },
  { value: 'crossover', label: 'Crossover' },
] as const

type Props = {
  businessId: string
  subdomain: string
  services: ProfileService[]
  conditionConfig: ConditionConfig
  theme: Theme
  buttonClass: string
  lang?: 'en' | 'es'
}

export function QuickQuoteModal({
  businessId,
  subdomain,
  services,
  conditionConfig,
  theme,
  buttonClass,
  lang = 'en',
}: Props) {
  const conditionTiers = useMemo(() => {
    if (conditionConfig?.enabled && conditionConfig.tiers?.length > 0) {
      return conditionConfig.tiers
    }
    return []
  }, [conditionConfig])

  const showCondition = conditionTiers.length > 0
  const defaultCondition = conditionTiers[0]?.id ?? 'clean'

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<QuoteResult | null>(null)

  const [vehicleType, setVehicleType] = useState<string>('sedan')
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? '')
  const [vehicleCondition, setVehicleCondition] = useState(defaultCondition)

  const t =
    lang === 'es'
      ? {
          trigger: 'Obtener cotización',
          title: 'Obtener cotización',
          vehicle: 'Tipo de vehículo',
          service: 'Servicio',
          condition: 'Condición',
          submit: 'Obtener mi cotización',
          loading: 'Calculando…',
          serviceLabel: 'Servicio',
          price: 'Precio estimado',
          duration: 'Duración',
          minutes: 'min',
          bookNow: 'Reservar ahora',
          another: 'Otra cotización',
          noServices: 'No hay servicios disponibles.',
          selectService: 'Selecciona un servicio',
        }
      : {
          trigger: 'Get a Quote',
          title: 'Get a Quote',
          vehicle: 'Vehicle type',
          service: 'Service',
          condition: 'Condition',
          submit: 'Get My Quote',
          loading: 'Calculating…',
          serviceLabel: 'Service',
          price: 'Estimated price',
          duration: 'Duration',
          minutes: 'min',
          bookNow: 'Book Now',
          another: 'Get another quote',
          noServices: 'No services available.',
          selectService: 'Select a service',
        }

  function resetForm() {
    setResult(null)
    setError('')
    setVehicleType('sedan')
    setServiceId(services[0]?.id ?? '')
    setVehicleCondition(defaultCondition)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      resetForm()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!serviceId) {
      setError(t.selectService)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/public/quick-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          serviceId,
          vehicleType,
          vehicleCondition: showCondition ? vehicleCondition : defaultCondition,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quote')
      }

      setResult({
        quoteCode: data.quoteCode,
        totalPrice: data.totalPrice,
        totalDuration: data.totalDuration,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const bookHref = result
    ? `/${subdomain}/book?service=${encodeURIComponent(result.serviceId)}&quote=${encodeURIComponent(result.quoteCode)}${lang === 'es' ? '&lang=es' : ''}`
    : `/${subdomain}/book`

  const outlineStyle = {
    borderColor: theme.primaryColor,
    color: theme.primaryColor,
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`w-full mt-3 py-3.5 sm:py-4 font-semibold text-base sm:text-lg rounded-xl border-2 bg-transparent hover:bg-white/10 transition-opacity ${buttonClass}`}
          style={outlineStyle}
        >
          {t.trigger}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {result ? (
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle style={{ color: theme.primaryColor }}>{t.title}</DialogTitle>
            </DialogHeader>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3 text-zinc-900">
              <div>
                <p className="text-sm text-zinc-500">{t.serviceLabel}</p>
                <p className="font-semibold">{result.serviceName}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">{t.price}</p>
                <p className="text-3xl font-bold" style={{ color: theme.primaryColor }}>
                  ${result.totalPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">{t.duration}</p>
                <p className="font-medium">
                  {result.totalDuration} {t.minutes}
                </p>
              </div>
            </div>
            <Link href={bookHref} className="block" onClick={() => setOpen(false)}>
              <Button
                type="button"
                className={`w-full py-3 font-semibold ${buttonClass}`}
                style={{ backgroundColor: theme.primaryColor, color: 'white' }}
              >
                {t.bookNow}
              </Button>
            </Link>
            <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
              {t.another}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle style={{ color: theme.primaryColor }}>{t.title}</DialogTitle>
            </DialogHeader>
            {services.length === 0 ? (
              <p className="text-sm text-zinc-500">{t.noServices}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-zinc-700">{t.vehicle}</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {VEHICLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setVehicleType(opt.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          vehicleType === opt.value
                            ? 'text-white'
                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                        }`}
                        style={
                          vehicleType === opt.value
                            ? { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }
                            : undefined
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="qq-service" className="text-zinc-700">
                    {t.service}
                  </Label>
                  <select
                    id="qq-service"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                    required
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {showCondition && (
                  <div>
                    <Label htmlFor="qq-condition" className="text-zinc-700">
                      {t.condition}
                    </Label>
                    <select
                      id="qq-condition"
                      value={vehicleCondition}
                      onChange={(e) => setVehicleCondition(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                    >
                      {conditionTiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 font-semibold ${buttonClass}`}
                  style={{ backgroundColor: theme.primaryColor, color: 'white' }}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.loading}
                    </span>
                  ) : (
                    t.submit
                  )}
                </Button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
