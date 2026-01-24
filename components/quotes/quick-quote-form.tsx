'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createQuickQuote } from '@/lib/actions/quotes'
import { getServices } from '@/lib/actions/services'
import { calculateTotals, mapVehicleTypeToPricingKey } from '@/lib/utils/booking-utils'
import { Sparkles, Copy, Check } from 'lucide-react'
import type { Service } from '@/types'
import VehicleSelector from '@/components/booking/vehicle-selector'

type Business = {
  id: string
  condition_config?: {
    enabled: boolean
    tiers: Array<{
      id: string
      label: string
      description: string
      markup_percent: number
    }>
  } | null
} | null

export default function QuickQuoteForm({ business }: { business: Business }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [generatedQuote, setGeneratedQuote] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [showVehicleDetails, setShowVehicleDetails] = useState(false)
  
  // Get condition config or use defaults
  const conditionConfig = business?.condition_config
  const conditionTiers = conditionConfig?.enabled && conditionConfig.tiers && conditionConfig.tiers.length > 0
    ? conditionConfig.tiers 
    : [
        { id: 'clean', label: 'Normal', markup_percent: 0 },
        { id: 'moderate', label: 'Dirty', markup_percent: 0.15 },
        { id: 'heavy', label: 'Very Dirty', markup_percent: 0.25 }
      ]
  
  // Default to first tier
  const defaultCondition = conditionTiers[0]?.id || 'clean'
  
  const [formData, setFormData] = useState({
    vehicleType: 'sedan' as 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'crossover',
    vehicleCondition: defaultCondition,
    selectedServices: [] as string[],
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
  })
  
  // Update condition if business config changes
  useEffect(() => {
    if (conditionTiers.length > 0 && !conditionTiers.find(t => t.id === formData.vehicleCondition)) {
      setFormData(prev => ({ ...prev, vehicleCondition: defaultCondition }))
    }
  }, [conditionTiers, defaultCondition, formData.vehicleCondition])
  
  // Load services
  useEffect(() => {
    async function loadServices() {
      try {
        const servicesData = await getServices()
        // Filter active services and sort by base_price (or price as fallback)
        const activeServices = servicesData
          .filter((s: any) => s.is_active !== false) // Include services where is_active is not explicitly false
          .sort((a: any, b: any) => (a.base_price || a.price || 0) - (b.base_price || b.price || 0))
        setServices(activeServices)
      } catch (error) {
        console.error('Error loading services:', error)
        // Show error to user
        alert('Failed to load services. Please refresh the page.')
      }
    }
    loadServices()
  }, [])
  
  // Calculate estimated price using same logic as booking
  const calculatePrice = () => {
    if (formData.selectedServices.length === 0) return 0
    
    // For multiple services, sum their individual totals
    let totalPrice = 0
    let totalDuration = 0
    
    formData.selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId)
      if (!service) return
      
      // Format service object to match booking form (ensures all required fields are set)
      const serviceForCalculation: Service = {
        ...service,
        base_price: service.base_price ?? service.price ?? 0,
        is_active: service.is_active ?? true,
        created_at: service.created_at ?? new Date().toISOString(),
        updated_at: service.updated_at ?? new Date().toISOString(),
        is_popular: service.is_popular ?? false,
      } as Service
      
      // Use calculateTotals for each service (same as booking flow)
      const totals = calculateTotals(
        serviceForCalculation,
        mapVehicleTypeToPricingKey(formData.vehicleType),
        [], // No add-ons for quick quote (keep it simple)
        formData.vehicleCondition,
        conditionConfig || null
      )
      
      totalPrice += totals.price
      totalDuration += totals.duration
    })
    
    return Math.round(totalPrice * 100) / 100
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
        customerName: formData.customerName || undefined,
        customerPhone: formData.customerPhone || undefined,
        customerEmail: formData.customerEmail || undefined,
      })
      
      setGeneratedQuote(quote)
      router.refresh()
    } catch (error: any) {
      console.error('Quote generation error:', error)
      alert(error.message || 'Failed to generate quote. Check console for details.')
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
  
  if (generatedQuote) {
    const quoteLink = `${window.location.origin}/q/${generatedQuote.quote_code}`
    
    return (
      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <Sparkles className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Quote Generated!</h3>
          <p className="text-4xl font-bold text-green-600 mb-4">
            ${generatedQuote.total_price.toFixed(2)}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Code: <span className="font-mono font-bold">{generatedQuote.quote_code}</span>
          </p>
          
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Share this link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={quoteLink}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-zinc-50 dark:bg-zinc-800 text-sm"
              />
              <Button onClick={copyQuoteLink} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={() => setGeneratedQuote(null)}
            variant="outline"
            className="w-full"
          >
            Generate Another Quote
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vehicle Type */}
      <div>
        <Label className="mb-3 block">Vehicle Type *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { value: 'coupe', label: 'Coupe', icon: '🏎️' },
            { value: 'sedan', label: 'Sedan', icon: '🚗' },
            { value: 'crossover', label: 'Crossover', icon: '🚙' },
            { value: 'suv', label: 'SUV', icon: '🚛' },
            { value: 'truck', label: 'Truck/Van', icon: '🚚' },
          ].map((type) => (
            <label key={type.value} className="relative cursor-pointer">
              <input
                type="radio"
                name="vehicleType"
                value={type.value}
                checked={formData.vehicleType === type.value}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                className="peer sr-only"
              />
              <div className="p-4 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg peer-checked:border-blue-600 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-950 transition-all text-center">
                <div className="text-3xl mb-2">{type.icon}</div>
                <p className="font-medium text-sm">{type.label}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Condition */}
      <div>
        <Label className="mb-3 block">Condition *</Label>
        <div className={`grid gap-3 ${conditionTiers.length === 3 ? 'grid-cols-3' : conditionTiers.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
          {conditionTiers.map((tier) => {
            return (
              <label key={tier.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={tier.id}
                  checked={formData.vehicleCondition === tier.id}
                  onChange={(e) => setFormData({ ...formData, vehicleCondition: e.target.value })}
                  className="peer sr-only"
                />
                <div className="p-4 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg peer-checked:border-blue-600 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-950 transition-all text-center">
                  <p className="font-medium text-sm">{tier.label}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>
      
      {/* Optional: Detailed Vehicle Info */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold">Vehicle Details (Optional)</Label>
          <button
            type="button"
            onClick={() => setShowVehicleDetails(!showVehicleDetails)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {showVehicleDetails ? 'Hide' : 'Add vehicle info'}
          </button>
        </div>
        
        {showVehicleDetails && (
          <div className="space-y-4">
            <VehicleSelector
              onSelect={(vehicle) => {
                setFormData({
                  ...formData,
                  vehicleYear: vehicle.year,
                  vehicleMake: vehicle.make,
                  vehicleModel: vehicle.model,
                })
              }}
              initialValue={{
                asset_year: formData.vehicleYear || undefined,
                asset_make: formData.vehicleMake || undefined,
                asset_model: formData.vehicleModel || undefined,
              }}
            />
          </div>
        )}
      </div>
      
      {/* Services */}
      <div>
        <Label className="mb-3 block">Services * (Select at least one)</Label>
        {services.length === 0 ? (
          <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">
              No services available. Please add services in the Services section first.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((service) => (
            <label
              key={service.id}
              className="flex items-start gap-3 p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-blue-400 transition-all"
            >
              <input
                type="checkbox"
                checked={formData.selectedServices.includes(service.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      selectedServices: [...formData.selectedServices, service.id]
                    })
                  } else {
                    setFormData({
                      ...formData,
                      selectedServices: formData.selectedServices.filter(id => id !== service.id)
                    })
                  }
                }}
                className="mt-1 h-5 w-5 rounded border-zinc-300 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold">{service.name}</h4>
                  <span className="font-bold text-green-600">
                    ${(service.base_price || service.price || 0).toFixed(2)}
                    {service.pricing_model === 'variable' && (
                      <span className="text-xs text-zinc-500 ml-1">(varies)</span>
                    )}
                  </span>
                </div>
                {service.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{service.description}</p>
                )}
              </div>
            </label>
          ))}
          </div>
        )}
      </div>
      
      {/* Customer Info (Optional) */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Customer Info (Optional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="customerName">Name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
        </div>
      </div>
      
      {/* Price Preview */}
      {formData.selectedServices.length > 0 && (() => {
        // Calculate breakdown for display
        let baseTotal = 0
        let sizeFeeTotal = 0
        let conditionFeeTotal = 0
        
        formData.selectedServices.forEach(serviceId => {
          const service = services.find(s => s.id === serviceId)
          if (!service) return
          
          // Format service object to match booking form (ensures all required fields are set)
          const serviceForCalculation: Service = {
            ...service,
            base_price: service.base_price ?? service.price ?? 0,
            is_active: service.is_active ?? true,
            created_at: service.created_at ?? new Date().toISOString(),
            updated_at: service.updated_at ?? new Date().toISOString(),
            is_popular: service.is_popular ?? false,
          } as Service
          
          const totals = calculateTotals(
            serviceForCalculation,
            mapVehicleTypeToPricingKey(formData.vehicleType),
            [],
            formData.vehicleCondition,
            conditionConfig || null
          )
          
          baseTotal += totals.breakdown?.base || 0
          sizeFeeTotal += totals.breakdown?.sizeFee || 0
          conditionFeeTotal += totals.breakdown?.conditionFee || 0
        })
        
        const hasAdjustments = sizeFeeTotal > 0 || conditionFeeTotal > 0
        
        return (
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Estimated Price:</span>
              <span className="text-3xl font-bold text-green-600">
                ${estimatedPrice.toFixed(2)}
              </span>
            </div>
            
            {/* Breakdown (only show if there are adjustments) */}
            {hasAdjustments && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1 text-sm">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Base Services</span>
                  <span>${baseTotal.toFixed(2)}</span>
                </div>
                {sizeFeeTotal > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Vehicle Size ({formData.vehicleType})</span>
                    <span>+${sizeFeeTotal.toFixed(2)}</span>
                  </div>
                )}
                {conditionFeeTotal > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Condition Fee</span>
                    <span>+${conditionFeeTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}
      
      {/* Submit */}
      <Button 
        type="submit" 
        disabled={loading || formData.selectedServices.length === 0}
        className="w-full h-12 text-base"
      >
        {loading ? 'Generating...' : 'Generate Quote'}
        <Sparkles className="ml-2 h-5 w-5" />
      </Button>
    </form>
  )
}
