import { getMileageRecords, getMileageSummary } from '@/lib/actions/mileage'
import MileageReportClient from '@/components/mileage/mileage-report-client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MileageReportPage() {
  // Get current month by default
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const records = await getMileageRecords(startOfMonth.toISOString(), endOfMonth.toISOString())
  const summary = await getMileageSummary()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mileage Report</h1>
            <p className="text-muted-foreground mt-1">
              Track your miles and export for tax deductions
            </p>
          </div>
        </div>
      </div>

      {/* Client Component with interactive features */}
      <MileageReportClient 
        initialRecords={records} 
        initialSummary={summary}
      />
    </div>
  )
}
