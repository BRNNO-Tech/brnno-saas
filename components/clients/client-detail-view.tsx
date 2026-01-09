'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Phone,
  Mail,
  Trash2,
  Edit,
  Plus,
  Calendar,
  DollarSign,
  Briefcase,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Car,
  Truck,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteClient } from '@/lib/actions/clients'
import EditClientDialog from './edit-client-dialog'

type Job = {
  id: string
  title: string
  status: string
  scheduled_date: string | null
  estimated_cost: number | null
  estimated_duration: number | null
  created_at: string
  asset_details?: Record<string, any> | null
}

type Invoice = {
  id: string
  invoice_number: string | null
  total: number
  status: string
  created_at: string
  due_date: string | null
}

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
  jobs: Job[]
  invoices: Invoice[]
  vehicles?: Array<{
    make: string
    model: string
    year: string | null
    color: string | null
    licensePlate: string | null
    vin: string | null
    jobCount: number
    lastServiceDate: string | null
  }>
  stats: {
    totalJobs: number
    completedJobs: number
    totalRevenue: number
    outstandingBalance: number
    averageJobValue: number
    lastJobDate: string | null
    isRepeatClient: boolean
  }
}

export default function ClientDetailView({ client }: { client: Client }) {
  const router = useRouter()
  const [editingClient, setEditingClient] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this client permanently? This will not delete their jobs or invoices.')) return

    try {
      await deleteClient(client.id)
      router.push('/dashboard/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client')
    }
  }

  const timeSinceCreated = Math.floor(
    (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{client.name}</h1>
              {client.stats.isRepeatClient && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Repeat Client
                </Badge>
              )}
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Client since {new Date(client.created_at).toLocaleDateString()}
              {timeSinceCreated > 0 && ` (${timeSinceCreated} day${timeSinceCreated !== 1 ? 's' : ''} ago)`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditingClient(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Client Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-zinc-600" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Phone
                    </p>
                    <a
                      href={`tel:${client.phone}`}
                      className="font-medium hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}

              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-zinc-600" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Email
                    </p>
                    <a
                      href={`mailto:${client.email}`}
                      className="font-medium hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Client Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Total Jobs
                </span>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="font-semibold">{client.stats.totalJobs}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Completed Jobs
                </span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{client.stats.completedJobs}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Total Revenue
                </span>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    ${client.stats.totalRevenue.toFixed(2)}
                  </span>
                </div>
              </div>

              {client.stats.outstandingBalance > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Outstanding Balance
                  </span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-600">
                      ${client.stats.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {client.stats.averageJobValue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Average Job Value
                  </span>
                  <span className="font-semibold">
                    ${client.stats.averageJobValue.toFixed(2)}
                  </span>
                </div>
              )}

              {client.stats.lastJobDate && (
                <div>
                  <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Last Job
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(client.stats.lastJobDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Jobs & Invoices */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {client.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${client.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
              {client.phone && (
                <Button variant="outline" asChild>
                  <a href={`sms:${client.phone}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Text
                  </a>
                </Button>
              )}
              {client.email && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${client.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href={`/dashboard/jobs?client=${client.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Job
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/invoices?client=${client.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  New Invoice
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Vehicles */}
          {client.vehicles && client.vehicles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicles ({client.vehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {client.vehicles.map((vehicle, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                              {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
                            </h4>
                            {vehicle.color && (
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {vehicle.color}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {vehicle.jobCount} {vehicle.jobCount === 1 ? 'job' : 'jobs'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        {vehicle.licensePlate && (
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">License:</span>{' '}
                            <span className="font-medium">{vehicle.licensePlate}</span>
                          </div>
                        )}
                        {vehicle.vin && (
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">VIN:</span>{' '}
                            <span className="font-medium font-mono text-xs">{vehicle.vin}</span>
                          </div>
                        )}
                        {vehicle.lastServiceDate && (
                          <div className="col-span-2">
                            <span className="text-zinc-600 dark:text-zinc-400">Last Service:</span>{' '}
                            <span className="font-medium">
                              {new Date(vehicle.lastServiceDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job History */}
          <Card>
            <CardHeader>
              <CardTitle>Job History ({client.jobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {client.jobs.length > 0 ? (
                <div className="space-y-4">
                  {client.jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="block rounded-lg border p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{job.title}</h4>
                            <Badge
                              variant={
                                job.status === 'completed'
                                  ? 'default'
                                  : job.status === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="capitalize"
                            >
                              {job.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {job.scheduled_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(job.scheduled_date).toLocaleDateString()}
                              </div>
                            )}
                            {job.estimated_cost && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${job.estimated_cost.toFixed(2)}
                              </div>
                            )}
                            {job.estimated_duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {job.estimated_duration % 60 === 0
                                  ? `${job.estimated_duration / 60} ${job.estimated_duration / 60 === 1 ? 'hr' : 'hrs'}`
                                  : `${(job.estimated_duration / 60).toFixed(1)} hrs`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  No jobs yet. Create the first job for this client!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice History ({client.invoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {client.invoices.length > 0 ? (
                <div className="space-y-4">
                  {client.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="block rounded-lg border p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}
                            </h4>
                            <Badge
                              variant={
                                invoice.status === 'paid'
                                  ? 'default'
                                  : invoice.status === 'overdue'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="capitalize"
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${invoice.total.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(invoice.created_at).toLocaleDateString()}
                            </div>
                            {invoice.due_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due: {new Date(invoice.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        {invoice.status === 'paid' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  No invoices yet. Create the first invoice for this client!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Client Dialog */}
      {editingClient && (
        <EditClientDialog
          client={client}
          open={editingClient}
          onOpenChange={(open) => {
            if (!open) {
              setEditingClient(false)
              router.refresh()
            }
          }}
        />
      )}
    </div>
  )
}

