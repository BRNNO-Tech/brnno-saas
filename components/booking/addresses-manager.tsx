'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export interface AddressRow {
  id: string
  user_id: string
  business_id: string
  address_line1: string | null
  city: string | null
  state: string | null
  zip: string | null
  created_at: string
}

type Props = {
  businessId: string
  subdomain: string
}

export default function AddressesManager({ businessId, subdomain }: Props) {
  const router = useRouter()
  const [addresses, setAddresses] = useState<AddressRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    address_line1: '',
    city: '',
    state: '',
    zip: '',
  })

  const supabase = createClient()

  useEffect(() => {
    checkAuthAndFetch()
  }, [businessId])

  async function checkAuthAndFetch() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/sign-in?subdomain=${encodeURIComponent(subdomain)}&next=${encodeURIComponent(`/${subdomain}/dashboard/addresses`)}`)
      return
    }
    await fetchAddresses(user.id)
    setLoading(false)
  }

  async function fetchAddresses(userId: string) {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching addresses:', error)
    } else {
      setAddresses((data as AddressRow[]) || [])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSubmitting(true)
    try {
      if (editingAddress) {
        const { error } = await supabase
          .from('customer_addresses')
          .update({
            address_line1: formData.address_line1 || null,
            city: formData.city || null,
            state: formData.state || null,
            zip: formData.zip || null,
          })
          .eq('id', editingAddress.id)

        if (error) throw error
        await fetchAddresses(user.id)
        resetForm()
      } else {
        const { error } = await supabase
          .from('customer_addresses')
          .insert({
            user_id: user.id,
            business_id: businessId,
            address_line1: formData.address_line1 || null,
            city: formData.city || null,
            state: formData.state || null,
            zip: formData.zip || null,
          })

        if (error) throw error
        await fetchAddresses(user.id)
        resetForm()
      }
    } catch (err) {
      console.error(err)
      alert(editingAddress ? 'Failed to update address' : 'Failed to add address')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(addr: AddressRow) {
    setEditingAddress(addr)
    setFormData({
      address_line1: addr.address_line1 ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      zip: addr.zip ?? '',
    })
    setShowAddForm(true)
  }

  async function handleDelete(addressId: string) {
    if (!confirm('Are you sure you want to delete this address?')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)

    if (error) {
      console.error('Error deleting address:', error)
      alert('Failed to delete address')
    } else {
      await fetchAddresses(user.id)
    }
  }

  function resetForm() {
    setFormData({
      address_line1: '',
      city: '',
      state: '',
      zip: '',
    })
    setEditingAddress(null)
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Addresses</h1>
        <Button
          variant={showAddForm ? 'outline' : 'default'}
          onClick={() => { resetForm(); setShowAddForm((v) => !v) }}
        >
          {showAddForm ? 'Cancel' : '+ Add Address'}
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Street Address</label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="123 Main St"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  placeholder="ZIP"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {editingAddress ? 'Update Address' : 'Add Address'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow p-12 text-center">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">No addresses saved yet</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">Add an address to speed up future bookings.</p>
          <Link href={`/${subdomain}/book`}>
            <Button variant="outline">Book a service</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{addr.address_line1 ?? '—'}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(addr)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(addr.id)}>
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
