export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getMaintenanceClients } from '@/lib/actions/clients'
import MaintenanceClientList from '@/components/customers/maintenance-client-list'

export default async function MaintenanceClientsPage() {
  let rows
  try {
    rows = await getMaintenanceClients()
  } catch (error) {
    return (
      <div className="w-full pb-20 md:pb-0">
        <div className="border border-[var(--dash-red)]/30 bg-[var(--dash-red)]/10 px-6 py-4">
          <div className="font-dash-condensed font-bold text-[var(--dash-red)]">Unable to load maintenance clients</div>
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-1">
            {error instanceof Error ? error.message : 'An error occurred.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20 md:pb-0">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            Maintenance Clients
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
            {rows.length} client{rows.length !== 1 ? 's' : ''} on a schedule
          </p>
        </div>
        <Link
          href="/dashboard/customers"
          className="font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:text-[var(--dash-amber)]"
        >
          All customers
        </Link>
      </div>

      <MaintenanceClientList rows={rows} />
    </div>
  )
}
