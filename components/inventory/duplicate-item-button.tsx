'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { duplicateInventoryItem } from '@/lib/actions/inventory'

export default function DuplicateItemButton({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    setLoading(true)
    try {
      await duplicateInventoryItem(itemId)
      router.refresh()
    } catch (error) {
      console.error('Error duplicating item:', error)
      alert('Failed to duplicate item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleDuplicate} disabled={loading}>
      <Copy className="h-4 w-4 mr-2" />
      {loading ? 'Duplicating...' : 'Duplicate'}
    </Button>
  )
}
