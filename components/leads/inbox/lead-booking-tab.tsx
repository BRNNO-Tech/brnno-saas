'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Calendar, CheckCircle } from 'lucide-react'
import { createJobFromLead } from '@/lib/actions/jobs'
import { getServices } from '@/lib/actions/services'
import { toast } from 'sonner'

interface LeadBookingTabProps {
  leadId: string
  leadName: string
  leadEmail: string | null
  leadPhone: string | null
  interestedInServiceName: string | null
  estimatedValue: number | null
}

export function LeadBookingTab({
  leadId,
  leadName,
  leadEmail,
  leadPhone,
  interestedInServiceName,
  estimatedValue,
}: LeadBookingTabProps) {
  const [services, setServices] = useState<any[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [estimatedDuration, setEstimatedDuration] = useState<number>(60)
  const [estimatedCost, setEstimatedCost] = useState<number>(estimatedValue || 0)
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadServices() {
      try {
        const servicesData = await getServices()
        setServices(servicesData)
        // Auto-select the interested service if available
        if (interestedInServiceName) {
          const matchingService = servicesData.find(s => s.name === interestedInServiceName)
          if (matchingService) {
            setSelectedServiceId(matchingService.id)
            setEstimatedCost(matchingService.base_price || estimatedValue || 0)
            setEstimatedDuration(matchingService.estimated_duration || 60)
          }
        }
      } catch (error) {
        toast.error('Failed to load services')
      }
    }
    loadServices()
  }, [interestedInServiceName, estimatedValue])

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setEstimatedCost(service.base_price || 0)
      setEstimatedDuration(service.estimated_duration || 60)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedServiceId) {
      toast.error('Please select a service')
      return
    }

    if (!scheduledDate) {
      toast.error('Please select a date')
      return
    }

    setLoading(true)
    try {
      const selectedService = services.find(s => s.id === selectedServiceId)
      await createJobFromLead(leadId, {
        title: selectedService?.name || interestedInServiceName || 'Service',
        service_type: selectedService?.name || interestedInServiceName || undefined,
        scheduled_date: `${scheduledDate}T${scheduledTime}:00`,
        estimated_duration: estimatedDuration,
        estimated_cost: estimatedCost,
        description: description || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zip: zip || undefined,
        client_notes: clientNotes || undefined,
      })
      setSuccess(true)
      toast.success('Booking created successfully!')
      // Refresh after a moment
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Booking Created!</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The lead has been marked as booked and a job has been created.
        </p>
      </div>
    )
  }

  // Set default date to tomorrow
  useEffect(() => {
    if (!scheduledDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setScheduledDate(tomorrow.toISOString().split('T')[0])
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="service">Service *</Label>
        <select
          id="service"
          value={selectedServiceId}
          onChange={(e) => handleServiceChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 text-zinc-900 dark:text-white"
          required
        >
          <option value="">Select service...</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - ${service.base_price?.toFixed(2) || '0.00'}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 60)}
            min="15"
            step="15"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="cost">Estimated Cost ($)</Label>
          <Input
            id="cost"
            type="number"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details about the job..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Address (Optional)</Label>
        <Input
          placeholder="Street address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            maxLength={2}
          />
          <Input
            placeholder="ZIP"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            maxLength={5}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Client Notes</Label>
        <Textarea
          id="notes"
          value={clientNotes}
          onChange={(e) => setClientNotes(e.target.value)}
          placeholder="Notes for the client..."
          className="mt-1"
          rows={2}
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !selectedServiceId || !scheduledDate}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Booking...
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4 mr-2" />
            Create Booking
          </>
        )}
      </Button>
    </form>
  )
}
