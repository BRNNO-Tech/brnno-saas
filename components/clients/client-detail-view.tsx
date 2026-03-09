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
  Repeat,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteClient, updateClient } from '@/lib/actions/clients'
import EditClientDialog from './edit-client-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

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
  maintenance_interval?: string | null
  maintenance_interval_days?: number | null
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
  const [maintenanceInterval, setMaintenanceInterval] = useState<string>(client.maintenance_interval ?? '')
  const [maintenanceIntervalDays, setMaintenanceIntervalDays] = useState<string>(
    client.maintenance_interval_days != null ? String(client.maintenance_interval_days) : ''
  )
  const [savingMaintenance, setSavingMaintenance] = useState(false)

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
    <div className="space-y-6 w-full pb-20 md:pb-0">
      {/* Header with Back Button */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <button className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-4 py-2 font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
                {client.name}
              </h1>
              {client.stats.isRepeatClient && (
                <Badge variant="secondary" className="flex items-center gap-1 font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-amber)] border-[var(--dash-amber)]/40 bg-[var(--dash-amber)]/10">
                  <TrendingUp className="h-3 w-3" />
                  Repeat Client
                </Badge>
              )}
            </div>
            <p className="mt-1 font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider">
              Client since {new Date(client.created_at).toLocaleDateString()}
              {timeSinceCreated > 0 && ` • ${timeSinceCreated} day${timeSinceCreated !== 1 ? 's' : ''} ago`}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setEditingClient(true)}
            className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-graphite)] font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text)] hover:bg-[var(--dash-surface)]"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="rounded-2xl font-dash-mono text-[11px] uppercase tracking-wider"
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
                  <Phone className="h-5 w-5 text-[var(--dash-text-muted)]" />
                  <div>
                    <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">
                      Phone
                    </p>
                    <a
                      href={`tel:${client.phone}`}
                      className="font-dash-condensed font-bold text-[var(--dash-amber)] hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}

              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[var(--dash-text-muted)]" />
                  <div>
                    <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">
                      Email
                    </p>
                    <a
                      href={`mailto:${client.email}`}
                      className="font-dash-condensed font-bold text-[var(--dash-amber)] hover:underline"
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
              <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
                <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">Total Jobs</p>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[var(--dash-text-muted)]" />
                  <span className="font-dash-condensed font-bold text-[var(--dash-text)]">
                    {client.stats.totalJobs}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
                <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">Completed Jobs</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--dash-green)]" />
                  <span className="font-dash-condensed font-bold text-[var(--dash-text)]">
                    {client.stats.completedJobs}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
                <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">Total Revenue</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[var(--dash-amber)]" />
                  <span className="font-dash-condensed font-bold text-[var(--dash-amber)]">
                    ${client.stats.totalRevenue.toFixed(2)}
                  </span>
                </div>
              </div>

              {client.stats.outstandingBalance > 0 ? (
                <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
                  <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">Outstanding Balance</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[var(--dash-red)]" />
                    <span className="font-dash-condensed font-bold text-[var(--dash-red)]">
                      ${client.stats.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : client.stats.averageJobValue > 0 ? (
                <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
                  <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">Average Job Value</p>
                  <span className="font-dash-condensed font-bold text-[var(--dash-text)]">
                    ${client.stats.averageJobValue.toFixed(2)}
                  </span>
                </div>
              ) : null}

              {client.stats.lastJobDate && (
                <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4 col-span-2">
                  <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">Last Job</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--dash-text-muted)]" />
                    <span className="font-dash-condensed font-bold text-[var(--dash-text)]">
                      {new Date(client.stats.lastJobDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardShell>

          {/* Maintenance Schedule */}
          <CardShell title="Maintenance Schedule" subtitle="Set when this client is due for their next visit">
            <div className="space-y-4">
              <div>
                <Label htmlFor="maintenance_interval" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">
                  Visit frequency
                </Label>
                <select
                  id="maintenance_interval"
                  value={maintenanceInterval}
                  onChange={(e) => setMaintenanceInterval(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
                >
                  <option value="">None</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {maintenanceInterval === 'custom' && (
                <div>
                  <Label htmlFor="maintenance_interval_days" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">
                    Every (days)
                  </Label>
                  <Input
                    id="maintenance_interval_days"
                    type="number"
                    min={1}
                    max={365}
                    value={maintenanceIntervalDays}
                    onChange={(e) => setMaintenanceIntervalDays(e.target.value)}
                    className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)]"
                  />
                </div>
              )}
              <Button
                type="button"
                disabled={savingMaintenance}
                onClick={async () => {
                  setSavingMaintenance(true)
                  try {
                    const formData = new FormData()
                    formData.set('name', client.name)
                    formData.set('email', client.email ?? '')
                    formData.set('phone', client.phone ?? '')
                    formData.set('notes', client.notes ?? '')
                    formData.set('maintenance_interval', maintenanceInterval)
                    if (maintenanceInterval === 'custom' && maintenanceIntervalDays.trim() !== '') {
                      formData.set('maintenance_interval_days', maintenanceIntervalDays)
                    }
                    await updateClient(client.id, formData)
                    router.refresh()
                  } catch (e) {
                    console.error(e)
                    alert('Failed to save maintenance schedule')
                  } finally {
                    setSavingMaintenance(false)
                  }
                }}
                className="rounded-2xl bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
              >
                {savingMaintenance ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardShell>

          {/* Notes */}
          {client.notes && (
            <CardShell title="Notes" subtitle="Internal notes and information">
              <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-[var(--dash-text-muted)]" />
                  <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider">Client Notes</p>
                </div>
                <p className="font-dash-mono text-[12px] text-[var(--dash-text)] whitespace-pre-wrap">
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
                  className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text)] hover:bg-[var(--dash-graphite)]"
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
                  className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text)] hover:bg-[var(--dash-graphite)]"
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
                  className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text)] hover:bg-[var(--dash-graphite)]"
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
                className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text)] hover:bg-[var(--dash-graphite)]"
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
                    className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--dash-surface)] border border-[var(--dash-border)] flex items-center justify-center">
                          <Car className="h-5 w-5 text-[var(--dash-amber)]" />
                        </div>
                        <div>
                          <h4 className="font-dash-condensed font-bold text-[var(--dash-text)]">
                            {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
                          </h4>
                          {vehicle.color && (
                            <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
                              {vehicle.color}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-text-muted)] border-[var(--dash-border)]">
                        {vehicle.jobCount} {vehicle.jobCount === 1 ? 'job' : 'jobs'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 font-dash-mono text-[11px]">
                      {vehicle.licensePlate && (
                        <div>
                          <span className="text-[var(--dash-text-muted)]">License:</span>{' '}
                          <span className="text-[var(--dash-text)]">{vehicle.licensePlate}</span>
                        </div>
                      )}
                      {vehicle.vin && (
                        <div>
                          <span className="text-[var(--dash-text-muted)]">VIN:</span>{' '}
                          <span className="text-[var(--dash-text)] font-mono">{vehicle.vin}</span>
                        </div>
                      )}
                      {vehicle.lastServiceDate && (
                        <div className="col-span-2">
                          <span className="text-[var(--dash-text-muted)]">Last Service:</span>{' '}
                          <span className="text-[var(--dash-text)]">
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
                    className="block rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4 hover:bg-[var(--dash-graphite)] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-dash-condensed font-bold text-[var(--dash-text)]">{job.title}</h4>
                          <Badge
                            variant={
                              job.status === 'completed'
                                ? 'default'
                                : job.status === 'cancelled'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="capitalize font-dash-mono text-[9px] uppercase tracking-wider"
                          >
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
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
              <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-8 text-center">
                <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
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
                    className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-dash-condensed font-bold text-[var(--dash-text)]">
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
                            className="capitalize font-dash-mono text-[9px] uppercase tracking-wider"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
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
                        <CheckCircle2 className="h-5 w-5 text-[var(--dash-green)]" />
                      ) : (
                        <XCircle className="h-5 w-5 text-[var(--dash-amber)]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-8 text-center">
                <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
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

