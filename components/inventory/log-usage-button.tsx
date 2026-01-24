'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { logUsage } from '@/lib/actions/inventory'

export default function LogUsageButton({ item }: { item: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('item_id', item.id)

    try {
      await logUsage(formData)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error logging usage:', error)
      alert('Failed to log usage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Package className="h-4 w-4 mr-2" />
          Log Usage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Usage - {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity_used">Quantity Used *</Label>
            <Input
              id="quantity_used"
              name="quantity_used"
              type="number"
              step="0.01"
              min="0.01"
              max={item.current_quantity}
              required
              placeholder={`e.g., 3 ${item.unit_of_measure}`}
              autoFocus
            />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Available: {item.current_quantity.toFixed(2)} {item.unit_of_measure}
            </p>
          </div>

          <div>
            <Label htmlFor="job_id">Job (Optional)</Label>
            <div className="relative">
              <Input
                id="job_id"
                name="job_id"
                placeholder="Select a job..."
                disabled
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Badge variant="outline" className="text-xs">
                  Coming Soon
                </Badge>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Auto-link to jobs will be available in Pro tier
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="What was this used for?"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Logging...' : 'Log Usage'}
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
