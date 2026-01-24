export const dynamic = 'force-dynamic'

import { getCustomersWithStats } from '@/lib/actions/clients'
import AddCustomerButton from '@/components/customers/add-customer-button'
import CustomerList from '@/components/customers/customer-list'
import { GlowBG } from '@/components/ui/glow-bg'
import { CardShell } from '@/components/ui/card-shell'
import { Users, DollarSign, Briefcase, Calendar } from 'lucide-react'

export default async function CustomersPage() {
  let customers
  try {
    customers = await getCustomersWithStats()
  } catch (error) {
    console.error('Error loading customers:', error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <div className="rounded-2xl border border-red-500/30 dark:border-red-500/30 bg-red-500/10 dark:bg-red-500/15 backdrop-blur-sm p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
              Unable to load customers
            </h2>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              {error instanceof Error ? error.message : 'An error occurred while loading customers.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + (c.stats?.totalRevenue || 0), 0)
  const totalJobs = customers.reduce((sum, c) => sum + (c.stats?.totalJobs || 0), 0)
  const vipCustomers = customers.filter(c => (c.stats?.totalRevenue || 0) > 500).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Customers</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Manage your customer relationships
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <AddCustomerButton />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/18 dark:from-blue-500/18 to-blue-500/5 dark:to-blue-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-blue-500/20 dark:ring-blue-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-100/50 dark:bg-blue-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Total Customers
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{totalCustomers}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Active customers
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/20 dark:ring-emerald-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-100/50 dark:bg-emerald-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Total Revenue
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">${totalRevenue.toFixed(0)}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                All-time revenue
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 dark:border-purple-500/30 bg-gradient-to-br from-purple-500/18 dark:from-purple-500/18 to-purple-500/5 dark:to-purple-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-purple-500/20 dark:ring-purple-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-purple-100/50 dark:bg-purple-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Total Jobs
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{totalJobs}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Completed jobs
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/18 dark:from-amber-500/18 to-amber-500/5 dark:to-amber-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-amber-500/20 dark:ring-amber-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-100/50 dark:bg-amber-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  VIP Customers
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{vipCustomers}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                $500+ revenue
              </p>
            </div>
          </div>

          {/* Customer List */}
          <CardShell title="Customer Management" subtitle="View and manage all your customers">
            <CustomerList customers={customers} />
          </CardShell>
        </div>
      </div>
    </div>
  )
}
