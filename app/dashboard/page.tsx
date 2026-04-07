export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getDashboardStats, getMonthlyRevenue, getUpcomingJobs, getWeeklyRevenue } from '@/lib/actions/dashboard'
import { getBusiness } from '@/lib/actions/business'
import { getMileageSummary } from '@/lib/actions/mileage'
import { getRecentPhotos, type CustomerDashboardPhoto, type WorkerDashboardPhoto } from '@/lib/actions/dashboard-photos'
import { getUnreadLeadsCount, getLeads } from '@/lib/actions/leads'
import ModernDashboard from '@/components/dashboard/modern-dashboard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardPageError } from '@/components/dashboard/page-error'
import { isFreeBillingTier } from '@/lib/billing/is-free-tier'
import { canAccessInvoices } from '@/lib/actions/permissions'

export default async function DashboardPage() {
  let stats
  let monthlyRevenue: Array<{ name: string; total: number }> = []
  let weeklyRevenue: Array<{ name: string; total: number }> = []
  let upcomingJobs: any[] = []
  let businessName = 'Your Business'
  const businessAddress: string | null = null
  let mileageSummary = null
  let photos: {
    customerPhotos: CustomerDashboardPhoto[]
    workerPhotos: WorkerDashboardPhoto[]
    totalCount: number
  } | null = null
  let unreadLeadsCount = 0
  let hotLeads: Awaited<ReturnType<typeof getLeads>> = []
  let hasInvoiceModule = false

  try {
    stats = await getDashboardStats()
    try {
      monthlyRevenue = await getMonthlyRevenue()
    } catch {
      // Continue without revenue chart if it fails
    }
    try {
      weeklyRevenue = await getWeeklyRevenue()
    } catch {
      // Continue without weekly chart if it fails
    }
    try {
      upcomingJobs = await getUpcomingJobs()
    } catch {
      // Continue without upcoming jobs if it fails
    }
    try {
      unreadLeadsCount = await getUnreadLeadsCount()
    } catch {
      // Leads module may be disabled
    }
    try {
      hotLeads = await getLeads('hot')
      if (!Array.isArray(hotLeads)) hotLeads = []
    } catch {
      hotLeads = []
    }
    try {
      // Only fetch mileage summary if user has the mileage module
      const { canAccessMileage } = await import('@/lib/actions/permissions')
      const hasMileageAccess = await canAccessMileage()

      if (hasMileageAccess) {
        mileageSummary = await getMileageSummary()
      }
    } catch (mileageError) {
      // Continue without mileage if it fails
    }
    try {
      // Fetch recent photos for dashboard
      photos = await getRecentPhotos(20)
    } catch (photosError) {
      // Continue without photos if it fails
      console.error('Error fetching photos:', photosError)
    }
    try {
      const business = await getBusiness()
      if (business?.name) {
        businessName = business.name
      }
    } catch (businessError) {
      // Continue with default name if it fails
    }
    try {
      hasInvoiceModule = await canAccessInvoices()
    } catch {
      hasInvoiceModule = false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while loading dashboard data.'
    try {
      const b = await getBusiness()
      if (
        b &&
        !isFreeBillingTier((b as { billing_plan?: string | null }).billing_plan) &&
        b.subscription_status !== 'active' &&
        b.subscription_status !== 'trialing'
      ) {
        return (
          <DashboardPageError isTrialEnded />
        )
      }
    } catch { /* ignore */ }
    const isNoBusinessError = errorMessage.includes('No business found')

    return (
      <div className="p-6">
        <div className={`rounded-lg border p-6 ${isNoBusinessError
          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          }`}>
          <h2 className={`text-lg font-semibold ${isNoBusinessError
            ? 'text-blue-800 dark:text-blue-400'
            : 'text-red-800 dark:text-red-400'
            }`}>
            {isNoBusinessError ? 'Business Setup Required' : 'Unable to load dashboard'}
          </h2>
          <p className={`mt-2 text-sm ${isNoBusinessError
            ? 'text-blue-600 dark:text-blue-300'
            : 'text-red-600 dark:text-red-300'
            }`}>
            {errorMessage}
          </p>
          {isNoBusinessError ? (
            <div className="mt-4">
              <Link href="/dashboard/settings">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Go to Settings
                </Button>
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-red-600 dark:text-red-300">
              Please check that your Supabase environment variables are configured correctly in Vercel.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <ModernDashboard
      stats={stats}
      monthlyRevenue={monthlyRevenue}
      weeklyRevenue={weeklyRevenue}
      upcomingJobs={upcomingJobs}
      businessName={businessName}
      businessAddress={businessAddress}
      mileageSummary={mileageSummary}
      photos={photos}
      unreadLeadsCount={unreadLeadsCount}
      hotLeads={hotLeads}
      hasInvoiceModule={hasInvoiceModule}
    />
  )
}

