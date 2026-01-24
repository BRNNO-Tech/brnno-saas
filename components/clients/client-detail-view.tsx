'use client'

import { useState } from 'react'
import { CardShell } from '@/components/ui/card-shell'
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
  User,
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
  invoice_number?: string | null  // Optional - column doesn't exist in database
  total: number
  status: string
  created_at: string
  due_date?: string | null  // Optional - column doesn't exist in database
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
      router.push('/dashboard/customers')
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
      {/* Header with Back Button */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {client.name}
              </h1>
              {client.stats.isRepeatClient && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Repeat Client
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
              Client since {new Date(client.created_at).toLocaleDateString()}
              {timeSinceCreated > 0 && ` • ${timeSinceCreated} day${timeSinceCreated !== 1 ? 's' : ''} ago`}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setEditingClient(true)}
            className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="rounded-2xl"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Info */}
          <CardShell title="Contact Information" subtitle="Customer contact details">
            <div className="space-y-4">
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">
                      Phone
                    </p>
                    <a
                      href={`tel:${client.phone}`}
                      className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}

              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">
                      Email
                    </p>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardShell>

          {/* Client Statistics */}
          <CardShell title="Client Statistics" subtitle="Performance metrics and revenue">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Total Jobs</p>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {client.stats.totalJobs}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Completed Jobs</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {client.stats.completedJobs}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Total Revenue</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">
                    ${client.stats.totalRevenue.toFixed(2)}
                  </span>
                </div>
              </div>

              {client.stats.outstandingBalance > 0 ? (
                <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                  <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Outstanding Balance</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">
                      ${client.stats.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : client.stats.averageJobValue > 0 ? (
                <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                  <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Average Job Value</p>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    ${client.stats.averageJobValue.toFixed(2)}
                  </span>
                </div>
              ) : null}

              {client.stats.lastJobDate && (
                <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4 col-span-2">
                  <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Last Job</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {new Date(client.stats.lastJobDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardShell>

          {/* Notes */}
          {client.notes && (
            <CardShell title="Notes" subtitle="Internal notes and information">
              <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <p className="text-xs font-medium text-zinc-600 dark:text-white/45">Client Notes</p>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            </CardShell>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <CardShell title="Quick Actions" subtitle="Common actions">
            <div className="flex flex-wrap gap-2">
              {client.phone && (
                <Button 
                  variant="outline" 
                  asChild
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5"
                >
                  <a href={`tel:${client.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
              {client.phone && (
                <Button 
                  variant="outline" 
                  asChild
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5"
                >
                  <a href={`sms:${client.phone}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Text
                  </a>
                </Button>
              )}
              {client.email && (
                <Button 
                  variant="outline" 
                  asChild
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5"
                >
                  <a href={`mailto:${client.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              <Button 
                variant="outline" 
                asChild
                className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5"
              >
                <Link href={`/dashboard/jobs?client=${client.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Job
                </Link>
              </Button>
            </div>
          </CardShell>

          {/* Vehicles */}
          {client.vehicles && client.vehicles.length > 0 && (
            <CardShell 
              title={`Vehicles (${client.vehicles.length})`} 
              subtitle="Customer vehicles and assets"
            >
              <div className="space-y-3">
                {client.vehicles.map((vehicle, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
                          </h4>
                          {vehicle.color && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              {vehicle.color}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {vehicle.jobCount} {vehicle.jobCount === 1 ? 'job' : 'jobs'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      {vehicle.licensePlate && (
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">License:</span>{' '}
                          <span className="font-medium text-zinc-900 dark:text-white">{vehicle.licensePlate}</span>
                        </div>
                      )}
                      {vehicle.vin && (
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">VIN:</span>{' '}
                          <span className="font-medium font-mono text-zinc-900 dark:text-white">{vehicle.vin}</span>
                        </div>
                      )}
                      {vehicle.lastServiceDate && (
                        <div className="col-span-2">
                          <span className="text-zinc-600 dark:text-zinc-400">Last Service:</span>{' '}
                          <span className="font-medium text-zinc-900 dark:text-white">
                            {new Date(vehicle.lastServiceDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardShell>
          )}

          {/* Job History */}
          <CardShell title={`Job History (${client.jobs.length})`} subtitle="All jobs for this customer">
            {client.jobs.length > 0 ? (
              <div className="space-y-3">
                {client.jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="block rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{job.title}</h4>
                          <Badge
                            variant={
                              job.status === 'completed'
                                ? 'default'
                                : job.status === 'cancelled'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="capitalize text-xs"
                          >
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
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
              <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-8 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No jobs yet. Create the first job for this client!
                </p>
              </div>
            )}
          </CardShell>

          {/* Invoice History */}
          <CardShell title={`Invoice History (${client.invoices.length})`} subtitle="All invoices for this customer">
            {client.invoices.length > 0 ? (
              <div className="space-y-3">
                {client.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
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
                            className="capitalize text-xs"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-8 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No invoices yet. Create the first invoice for this client!
                </p>
              </div>
            )}
          </CardShell>
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

