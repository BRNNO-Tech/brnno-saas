import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscountCodesSettings from '@/components/settings/discount-codes-settings'

export default async function MarketingPromoCodesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    redirect('/dashboard/settings')
  }

  return (
    <div className="px-4 sm:px-6 pb-8 max-w-4xl">
      <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)] mb-1">
        Promo codes
      </h1>
      <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-6">
        Discount codes for booking and checkout — same codes as before, now under Marketing
      </p>
      <DiscountCodesSettings businessId={business.id} />
    </div>
  )
}
