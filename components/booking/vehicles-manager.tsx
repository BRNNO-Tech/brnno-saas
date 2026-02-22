'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export interface VehicleRow {
  id: string
  user_id: string
  business_id: string
  vehicle_type: string | null
  color: string | null
  make: string | null
  model: string | null
  year: number | null
  created_at: string
}

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'crossover', label: 'Crossover' },
]

const COLORS = [
  'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Gold', 'Purple', 'Other'
]

type Props = {
  businessId: string
  subdomain: string
}

export default function VehiclesManager({ businessId, subdomain }: Props) {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VehicleRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_type: 'sedan',
    color: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
  })

  const supabase = createClient()

  useEffect(() => {
    checkAuthAndFetch()
  }, [businessId])

  async function checkAuthAndFetch() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/sign-in?subdomain=${encodeURIComponent(subdomain)}&next=${encodeURIComponent(`/${subdomain}/dashboard/vehicles`)}`)
      return
    }
    await fetchVehicles(user.id)
    setLoading(false)
  }

  async function fetchVehicles(userId: string) {
    const { data, error } = await supabase
      .from('customer_vehicles')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vehicles:', error)
    } else {
      setVehicles((data as VehicleRow[]) || [])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSubmitting(true)
    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from('customer_vehicles')
          .update({
            vehicle_type: formData.vehicle_type,
            color: formData.color || null,
            make: formData.make || null,
            model: formData.model || null,
            year: formData.year,
          })
          .eq('id', editingVehicle.id)

        if (error) throw error
        await fetchVehicles(user.id)
        resetForm()
      } else {
        const { error } = await supabase
          .from('customer_vehicles')
          .insert({
            user_id: user.id,
            business_id: businessId,
            vehicle_type: formData.vehicle_type,
            color: formData.color || null,
            make: formData.make || null,
            model: formData.model || null,
            year: formData.year,
          })

        if (error) throw error
        await fetchVehicles(user.id)
        resetForm()
      }
    } catch (err) {
      console.error(err)
      alert(editingVehicle ? 'Failed to update vehicle' : 'Failed to add vehicle')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(vehicle: VehicleRow) {
    setEditingVehicle(vehicle)
    setFormData({
      vehicle_type: vehicle.vehicle_type || 'sedan',
      color: vehicle.color || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year ?? new Date().getFullYear(),
    })
    setShowAddForm(true)
  }

  async function handleDelete(vehicleId: string) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('customer_vehicles')
      .delete()
      .eq('id', vehicleId)

    if (error) {
      console.error('Error deleting vehicle:', error)
      alert('Failed to delete vehicle')
    } else {
      await fetchVehicles(user.id)
    }
  }

  function resetForm() {
    setFormData({
      vehicle_type: 'sedan',
      color: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
    })
    setEditingVehicle(null)
    setShowAddForm(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Vehicles</h1>
        <Button
          variant={showAddForm ? 'outline' : 'default'}
          onClick={() => { resetForm(); setShowAddForm((v) => !v) }}
        >
          {showAddForm ? 'Cancel' : '+ Add Vehicle'}
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Vehicle Type</label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Color</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              >
                <option value="">Select color...</option>
                {COLORS.map((c) => (
                  <option key={c} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Make</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Honda"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Civic"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow p-12 text-center">
          <div className="text-5xl mb-4">🚗</div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">No vehicles saved yet</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">Add a vehicle to speed up future bookings.</p>
          <Link href={`/${subdomain}/book`}>
            <Button variant="outline">Book a service</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {vehicle.color ?? '—'} • {vehicle.vehicle_type ?? '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(vehicle)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(vehicle.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
