import { getDashboardStats } from '@/lib/actions/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, FileText, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  let stats
  try {
    stats = await getDashboardStats()
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Unable to load dashboard
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An error occurred while loading dashboard data.'}
          </p>
          <p className="mt-4 text-sm text-red-600 dark:text-red-300">
            Please check that your Supabase environment variables are configured correctly in Vercel.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Welcome to your dashboard. Here's an overview of your business.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Total Clients
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Active Jobs
            </CardTitle>
            <Briefcase className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeJobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Pending Invoices
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingInvoices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Revenue (MTD)
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.revenueMTD.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5">
                      {activity.type === 'job' && <Briefcase className="h-4 w-4 text-orange-600" />}
                      {activity.type === 'invoice' && <FileText className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'client' && <Users className="h-4 w-4 text-purple-600" />}
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
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/clients">
              <Button className="w-full justify-start" variant="outline">
                + New Client
              </Button>
            </Link>
            <Link href="/dashboard/jobs">
              <Button className="w-full justify-start" variant="outline">
                + New Job
              </Button>
            </Link>
            <Link href="/dashboard/invoices">
              <Button className="w-full justify-start" variant="outline">
                + New Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

