'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Loader2 } from 'lucide-react'

export default function AdminTestCheckout() {
  const [planId, setPlanId] = useState<string>('starter')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [teamSize, setTeamSize] = useState<number>(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-test-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingPeriod,
          teamSize: planId === 'starter' ? 1 : teamSize,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const hint = data.debug?.hint ? ` ${data.debug.hint}` : ''
        setError((data.error || 'Failed to create checkout session') + hint)
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError('No checkout URL returned')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Admin: Test checkout
        </CardTitle>
        <CardDescription>
          Open Stripe Checkout to test the payment flow. Use test card 4242 4242 4242 4242. Redirects back here after payment or cancel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="fleet">Fleet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Billing</Label>
              <Select
                value={billingPeriod}
                onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'yearly')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(planId === 'pro' || planId === 'fleet') && (
            <div className="space-y-2">
              <Label>Team size (for pricing tier)</Label>
              <Select
                value={teamSize.toString()}
                onValueChange={(v) => setTeamSize(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planId === 'pro' && (
                    <>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </>
                  )}
                  {planId === 'fleet' && (
                    <>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Open Stripe test checkout'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
