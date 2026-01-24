'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type DiscountCode = {
  id: string
  code: string
  discount_percent: number
  description: string | null
  is_active: boolean
  usage_limit: number | null
  usage_count: number
  valid_from: string
  valid_until: string | null
  created_at: string
}

interface DiscountCodesSettingsProps {
  businessId: string
}

export default function DiscountCodesSettings({ businessId }: DiscountCodesSettingsProps) {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 10,
    description: '',
    usageLimit: '',
    validUntil: '',
    isActive: true,
  })

  useEffect(() => {
    loadCodes()
  }, [businessId])

  async function loadCodes() {
    try {
      setLoading(true)
      const response = await fetch(`/api/discount-codes?businessId=${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setCodes(data.codes || [])
      } else {
        toast.error('Failed to load discount codes')
      }
    } catch (error) {
      console.error('Error loading discount codes:', error)
      toast.error('Failed to load discount codes')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setFormData({
      code: '',
      discountPercent: 10,
      description: '',
      usageLimit: '',
      validUntil: '',
      isActive: true,
    })
    setEditingCode(null)
    setShowCreateDialog(true)
  }

  function openEditDialog(code: DiscountCode) {
    setFormData({
      code: code.code,
      discountPercent: code.discount_percent,
      description: code.description || '',
      usageLimit: code.usage_limit?.toString() || '',
      validUntil: code.valid_until ? new Date(code.valid_until).toISOString().split('T')[0] : '',
      isActive: code.is_active,
    })
    setEditingCode(code)
    setShowCreateDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.code.trim()) {
      toast.error('Discount code is required')
      return
    }

    if (formData.discountPercent <= 0 || formData.discountPercent > 100) {
      toast.error('Discount percentage must be between 1 and 100')
      return
    }

    try {
      if (editingCode) {
        // Update existing code
        const response = await fetch(/api/discount-codes/, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discountPercent: formData.discountPercent,
            description: formData.description || null,
            usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
            validUntil: formData.validUntil || null,
            isActive: formData.isActive,
          }),
        })

        if (response.ok) {
          toast.success('Discount code updated')
          setShowCreateDialog(false)
          loadCodes()
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to update discount code')
        }
      } else {
        // Create new code
        const response = await fetch('/api/discount-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            code: formData.code.trim(),
            discountPercent: formData.discountPercent,
            description: formData.description || null,
            usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
            validUntil: formData.validUntil || null,
          }),
        })

        if (response.ok) {
          toast.success('Discount code created')
          setShowCreateDialog(false)
          loadCodes()
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to create discount code')
        }
      }
    } catch (error) {
      console.error('Error saving discount code:', error)
      toast.error('Failed to save discount code')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this discount code?')) {
      return
    }

    try {
      const response = await fetch(`/api/discount-codes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Discount code deleted')
        loadCodes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete discount code')
      }
    } catch (error) {
      console.error('Error deleting discount code:', error)
      toast.error('Failed to delete discount code')
    }
  }

  function getStatusBadge(code: DiscountCode) {
    const now = new Date()
    const validUntil = code.valid_until ? new Date(code.valid_until) : null
    
    if (!code.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    
    if (validUntil && validUntil < now) {
      return <Badge variant="destructive">Expired</Badge>
    }
    
    if (code.usage_limit && code.usage_count >= code.usage_limit) {
      return <Badge variant="destructive">Limit Reached</Badge>
    }
    
    return <Badge variant="default" className="bg-green-600">Active</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Discount Codes</h3>
          <p className="text-sm text-muted-foreground">
            Create discount codes that customers can use during booking to get a percentage off their total.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Code
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading discount codes...</div>
      ) : codes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No discount codes yet</p>
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Discount Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {codes.map((code) => (
            <Card key={code.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg">{code.code}</span>
                      {getStatusBadge(code)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-green-600">{code.discount_percent}% off</span>
                      {code.description && <span>{code.description}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Used: {code.usage_count}{code.usage_limit ?  /  : ' (unlimited)'}</span>
                      {code.valid_until && (
                        <span>Expires: {new Date(code.valid_until).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(code)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(code.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Discount Code' : 'Create Discount Code'}</DialogTitle>
            <DialogDescription>
              {editingCode 
                ? 'Update your discount code settings. Note: The code itself cannot be changed.'
                : 'Create a new discount code that customers can use during checkout.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Discount Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2024"
                disabled={!!editingCode}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Customers will enter this code at checkout (case-insensitive)
              </p>
            </div>

            <div>
              <Label htmlFor="discountPercent">Discount Percentage *</Label>
              <Input
                id="discountPercent"
                type="number"
                min="1"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage off the total booking price (1-100)
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Summer promotion, New customer discount"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum number of times this code can be used
              </p>
            </div>

            <div>
              <Label htmlFor="validUntil">Expiration Date (Optional)</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Code will automatically expire after this date
              </p>
            </div>

            {editingCode && (
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCode ? 'Update Code' : 'Create Code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}