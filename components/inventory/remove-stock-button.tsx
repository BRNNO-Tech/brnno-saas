'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { removeStock } from '@/lib/actions/inventory'

export default function RemoveStockButton({ item }: { item: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('item_id', item.id)

    try {
      await removeStock(formData)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error removing stock:', error)
      alert('Failed to remove stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Minus className="h-4 w-4 mr-2" />
          Remove Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Stock - {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantity to Remove *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              min="0.01"
              max={item.current_quantity}
              required
              placeholder={`e.g., 5 ${item.unit_of_measure}`}
              autoFocus
            />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Current stock: {item.current_quantity.toFixed(2)} {item.unit_of_measure}
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <select
              id="reason"
              name="reason"
              required
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2"
            >
              <option value="spill">Spill / Waste</option>
              <option value="damage">Damage</option>
              <option value="theft">Theft / Loss</option>
              <option value="expired">Expired</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Optional details..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} variant="destructive">
              {loading ? 'Removing...' : 'Remove Stock'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
