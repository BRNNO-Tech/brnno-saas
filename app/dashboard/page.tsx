export const dynamic = 'force-dynamic'

import { getDashboardStats, getMonthlyRevenue } from '@/lib/actions/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, FileText, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import FollowUpReminders from '@/components/dashboard/follow-up-reminders'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export default async function DashboardPage() {
  let stats
  let monthlyRevenue: Array<{ name: string; total: number }> = []
  try {
    stats = await getDashboardStats()
    try {
      monthlyRevenue = await getMonthlyRevenue()
    } catch (revenueError) {
      // Continue without revenue chart if it fails
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while loading dashboard data.'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-400">
          Welcome to your dashboard. Here's an overview of your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-pink-500/20 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Total Clients
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-red-500/20 border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Active Jobs
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activeJobs}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-500/20 border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Pending Invoices
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.pendingInvoices}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 via-green-500/10 to-emerald-500/20 border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Revenue (MTD)
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${stats.revenueMTD.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChart data={monthlyRevenue} />
        <div className="col-span-3">
           <FollowUpReminders />
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <div className="mt-0.5">
                      {activity.type === 'job' && <Briefcase className="h-4 w-4 text-orange-400" />}
                      {activity.type === 'invoice' && <FileText className="h-4 w-4 text-blue-400" />}
                      {activity.type === 'client' && <Users className="h-4 w-4 text-purple-400" />}
                    </div>
                    <div className="flex-1">
                      {activity.type === 'job' && (
                        <p><span className="font-medium">Completed job:</span> {activity.title}</p>
                      )}
                      {activity.type === 'invoice' && (
                        <p><span className="font-medium">Payment received:</span> ${activity.total.toFixed(2)} {activity.client && `from ${activity.client.name}`}</p>
                      )}
                      {activity.type === 'client' && (
                        <p><span className="font-medium">New client:</span> {activity.name}</p>
                      )}
                      <p className="text-xs text-zinc-500">
                        {new Date(activity.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/clients">
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20" variant="outline">
                + New Client
              </Button>
            </Link>
            <Link href="/dashboard/jobs">
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20" variant="outline">
                + New Job
              </Button>
            </Link>
            <Link href="/dashboard/invoices">
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20" variant="outline">
                + New Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

