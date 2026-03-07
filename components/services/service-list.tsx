'use client'

import { useState } from 'react'
import { Service } from '@/types'
import { Pencil, Trash2, Star, Check, DollarSign, Clock, Package, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { deleteService } from '@/lib/actions/services'
import { getFeatureLabel } from '@/lib/utils/feature-labels'
import { toast } from 'sonner'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function ServiceList({ services: initialServices }: { services: Service[] }) {
  const [services, setServices] = useState(initialServices)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteService(deleteId)
      setServices(services.filter(s => s.id !== deleteId))
      toast.success('Service deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete service')
    } finally {
      setIsDeleting(false)
    }
  }

  if (services.length === 0) {
    return (
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-16 text-center">
        <Package className="h-8 w-8 text-[var(--dash-text-muted)] mx-auto mb-3" />
        <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">No Services Yet</div>
        <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mb-4">Create your first service package to get started</div>
        <Link
          href="/dashboard/services/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Service
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-px bg-[var(--dash-border)] md:grid-cols-2 lg:grid-cols-3">
        {services.map(service => {
          const displayPrice = service.base_price ?? service.price ?? 0
          const displayDuration = service.estimated_duration
            ? service.estimated_duration / 60
            : service.duration_minutes ? service.duration_minutes / 60 : null

          return (
            <div key={service.id} className="bg-[var(--dash-graphite)] flex flex-col overflow-hidden">
              {/* Image / Icon */}
              <div className="relative h-40 bg-[var(--dash-surface)]">
                {service.image_url ? (
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    fill
                    className="object-cover opacity-80"
                    unoptimized={service.image_url.startsWith('http://127.0.0.1') || service.image_url.startsWith('http://localhost')}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-5xl opacity-60">{service.icon || '✨'}</span>
                  </div>
                )}
                {service.is_popular && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-mono text-[9px] uppercase tracking-wider">
                    <Star className="h-2.5 w-2.5" />
                    Popular
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col p-4 space-y-3">
                <div>
                  <div className="font-dash-condensed font-extrabold text-[18px] text-[var(--dash-text)] leading-tight">{service.name}</div>
                  {service.description && (
                    <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-1 line-clamp-2">{service.description}</div>
                  )}
                </div>

                {/* Price & Duration */}
                <div className="flex items-center gap-4">
                  {displayPrice > 0 && (service as any)?.show_pricing !== false && (
                    <div className="flex items-center gap-1 font-dash-condensed font-bold text-[15px] text-[var(--dash-amber)]">
                      <DollarSign className="h-3.5 w-3.5" />
                      {displayPrice.toFixed(2)}
                    </div>
                  )}
                  {displayDuration && (
                    <div className="flex items-center gap-1 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                      <Clock className="h-3 w-3" />
                      {displayDuration % 1 === 0 ? displayDuration.toFixed(0) : displayDuration.toFixed(1)}h
                    </div>
                  )}
                </div>

                {/* What's included */}
                {service.whats_included && Array.isArray(service.whats_included) && service.whats_included.length > 0 && (
                  <div>
                    <div className="font-dash-mono text-[9px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] mb-1.5">Included</div>
                    <ul className="space-y-1">
                      {service.whats_included.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-[var(--dash-green)] mt-0.5 flex-shrink-0" />
                          <span className="font-dash-mono text-[11px] text-[var(--dash-text-dim)] line-clamp-1">{getFeatureLabel(item)}</span>
                        </li>
                      ))}
                      {service.whats_included.length > 3 && (
                        <li className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] pl-4.5">
                          +{service.whats_included.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-px pt-3 mt-auto border-t border-[var(--dash-border)] bg-[var(--dash-border)] -mx-4 -mb-4 px-0">
                  <Link
                    href={`/dashboard/services/${service.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--dash-graphite)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:text-[var(--dash-amber)] hover:bg-[var(--dash-surface)] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteId(service.id)}
                    className="w-12 flex items-center justify-center bg-[var(--dash-graphite)] text-[var(--dash-text-muted)] hover:text-[var(--dash-red)] hover:bg-[var(--dash-red)]/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] w-full max-w-sm mx-4">
            <div className="px-5 py-4 border-b border-[var(--dash-border)]">
              <div className="font-dash-condensed font-bold text-[15px] uppercase tracking-wider text-[var(--dash-text)]">Delete Service?</div>
            </div>
            <div className="px-5 py-4">
              <div className="font-dash-mono text-[12px] text-[var(--dash-text-muted)]">
                This will permanently delete this service. This action cannot be undone.
              </div>
            </div>
            <div className="flex gap-px border-t border-[var(--dash-border)] bg-[var(--dash-border)]">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-[var(--dash-graphite)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-[var(--dash-red)]/90 font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-white hover:bg-[var(--dash-red)] transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
