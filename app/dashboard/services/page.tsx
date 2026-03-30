import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from '@/lib/actions/utils'
import { getBusiness } from '@/lib/actions/business'
import { Plus, Package } from 'lucide-react'
import Link from 'next/link'
import ServiceList from '@/components/services/service-list'
import { DashboardPageError } from '@/components/dashboard/page-error'

export default async function ServicesPage() {
  let supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>
  let businessId: string

  try {
    supabase = await createClient()
    businessId = await getBusinessId()
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'An error occurred.'
    try {
      const b = await getBusiness()
      if (b && b.subscription_status !== 'active' && b.subscription_status !== 'trialing') {
        return <DashboardPageError isTrialEnded />
      }
    } catch { /* ignore */ }
    if (msg.includes('Not authenticated') || msg.includes('Authentication error')) redirect('/login')
    const isNoBusiness = msg.includes('No business found')
    return <DashboardPageError message={msg} isNoBusiness={isNoBusiness} title={isNoBusiness ? 'Business Setup Required' : 'Unable to load services'} />
  }

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name')

  const { data: businessRow } = await supabase
    .from('businesses')
    .select('service_feature_categories')
    .eq('id', businessId)
    .single()

  const totalServices = services?.length || 0
  const popularServices = services?.filter(s => s.is_popular).length || 0
  const avgPrice = services?.length
    ? Math.round(services.reduce((sum, s) => sum + (s.base_price || 0), 0) / services.length)
    : 0

  return (
    <div className="w-full pb-20 md:pb-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            Services
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
            Manage your service packages, pricing, and add-ons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/services/add-ons"
            className="flex items-center gap-1.5 px-3 py-2 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors"
          >
            <Package className="h-3.5 w-3.5" />
            Add-ons
          </Link>
          <Link
            href="/dashboard/services/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Service
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
        <div className="bg-[var(--dash-graphite)] p-5">
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Services</div>
          <div className="font-dash-condensed font-extrabold text-4xl leading-none text-[var(--dash-text)]">{totalServices}</div>
        </div>
        <div className="bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-amber)]">
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Popular</div>
          <div className="font-dash-condensed font-extrabold text-4xl leading-none text-[var(--dash-amber)]">{popularServices}</div>
        </div>
        <div className="bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-green)]">
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Avg Price</div>
          <div className="font-dash-condensed font-extrabold text-4xl leading-none text-[var(--dash-green)]">${avgPrice}</div>
        </div>
      </div>

      <ServiceList services={services || []} business={businessRow} />
    </div>
  )
}
