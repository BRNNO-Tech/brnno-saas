'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send, Copy, Check } from 'lucide-react'
import { createQuoteForLead } from '@/lib/actions/quotes'
import { getServices } from '@/lib/actions/services'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LeadQuoteTabProps {
  leadId: string
  leadName: string
  leadEmail: string | null
  leadPhone: string | null
  interestedInServiceId: string | null
}

export function LeadQuoteTab({
  leadId,
  leadName,
  leadEmail,
  leadPhone,
  interestedInServiceId,
}: LeadQuoteTabProps) {
  const [services, setServices] = useState<any[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>(interestedInServiceId ? [interestedInServiceId] : [])
  const [vehicleType, setVehicleType] = useState<'sedan' | 'suv' | 'truck'>('sedan')
  const [vehicleCondition, setVehicleCondition] = useState<'normal' | 'dirty' | 'very_dirty'>('normal')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadServices() {
      try {
        const servicesData = await getServices()
        setServices(servicesData)
      } catch (error) {
        toast.error('Failed to load services')
      }
    }
    loadServices()
  }, [])

  const calculateTotal = () => {
    const selectedServiceObjs = services.filter(s => selectedServices.includes(s.id))
    let total = selectedServiceObjs.reduce((sum, s) => sum + (s.base_price || 0), 0)
    
    const vehicleMultiplier = { sedan: 1.0, suv: 1.2, truck: 1.3 }
    total *= vehicleMultiplier[vehicleType]
    
    const conditionMultiplier = { normal: 1.0, dirty: 1.15, very_dirty: 1.3 }
    total *= conditionMultiplier[vehicleCondition]
    
    return Math.round(total * 100) / 100
  }

  const handleCreateQuote = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service')
      return
    }

    setLoading(true)
    try {
      const newQuote = await createQuoteForLead(leadId, {
        vehicleType,
        vehicleCondition,
        services: selectedServices,
        customerName: leadName,
        customerPhone: leadPhone || undefined,
        customerEmail: leadEmail || undefined,
        leadId,
      })
      setQuote(newQuote)
      toast.success('Quote created successfully!')
    } catch (error) {
      console.error('Error creating quote:', error)
      toast.error('Failed to create quote. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyQuoteLink = () => {
    if (quote?.quote_code) {
      const link = `${window.location.origin}/q/${quote.quote_code}`
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Quote link copied to clipboard!')
    }
  }

  if (quote) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Quote Created!</h3>
            <span className="text-sm font-mono bg-white dark:bg-zinc-900 px-2 py-1 rounded">
              {quote.quote_code}
            </span>
          </div>
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-3">
            Total: <span className="font-semibold">${quote.total_price?.toFixed(2) || '0.00'}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={copyQuoteLink}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Quote Link
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                if (quote.quote_code) {
                  window.open(`/q/${quote.quote_code}`, '_blank')
                }
              }}
              variant="outline"
              size="sm"
            >
              View Quote
            </Button>
          </div>
        </div>
        <Button
          onClick={() => {
            setQuote(null)
            setSelectedServices(interestedInServiceId ? [interestedInServiceId] : [])
          }}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Create Another Quote
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Services</Label>
        <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
          {services.map((service) => (
            <label
              key={service.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedServices.includes(service.id)
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                  : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(service.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedServices([...selectedServices, service.id])
                  } else {
                    setSelectedServices(selectedServices.filter(id => id !== service.id))
                  }
                }}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{service.name}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  ${service.base_price?.toFixed(2) || '0.00'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Vehicle Type</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(['sedan', 'suv', 'truck'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setVehicleType(type)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                vehicleType === type
                  ? "bg-violet-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Vehicle Condition</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(['normal', 'dirty', 'very_dirty'] as const).map((condition) => (
            <button
              key={condition}
              onClick={() => setVehicleCondition(condition)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                vehicleCondition === condition
                  ? "bg-violet-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {condition.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estimated Total</span>
          <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            ${calculateTotal().toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        onClick={handleCreateQuote}
        disabled={loading || selectedServices.length === 0}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Quote...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Create & Send Quote
          </>
        )}
      </Button>
    </div>
  )
}
