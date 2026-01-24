'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Calendar, 
  Navigation,
  MapPin,
  Edit2,
  DollarSign 
} from 'lucide-react'
import { exportMileageToCSV } from '@/lib/actions/mileage'
import { toast } from 'sonner'
import { formatAddress, calculateMileageDeduction, getIRSRate } from '@/lib/utils/mileage-utils'
import type { MileageRecordWithJob, MileageSummary } from '@/types/mileage'

interface MileageReportClientProps {
  initialRecords: MileageRecordWithJob[]
  initialSummary?: MileageSummary
}

export default function MileageReportClient({ 
  initialRecords, 
  initialSummary 
}: MileageReportClientProps) {
  const [records, setRecords] = useState(initialRecords)
  const [summary, setSummary] = useState(initialSummary)
  const [isExporting, setIsExporting] = useState(false)
  const irsRate = getIRSRate()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Get date range (current month by default)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const csv = await exportMileageToCSV(startOfMonth.toISOString(), endOfMonth.toISOString())
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mileage-report-${now.getFullYear()}-${now.getMonth() + 1}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Mileage report exported')
    } catch (error) {
      toast.error('Failed to export report')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate deductions from summary (summary has miles and deduction already)
  const monthlyMiles = summary?.thisMonth?.miles || 0
  const yearlyMiles = summary?.thisYear?.miles || 0
  const monthlyDeduction = summary?.thisMonth?.deduction || calculateMileageDeduction(monthlyMiles, irsRate)
  const yearlyDeduction = summary?.thisYear?.deduction || calculateMileageDeduction(yearlyMiles, irsRate)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Month</span>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{monthlyMiles.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">miles driven</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Year</span>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{yearlyMiles.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">miles driven</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-700 dark:text-green-400">Monthly Deduction</span>
              <DollarSign className="h-4 w-4 text-green-700 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              ${monthlyDeduction.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              @ ${irsRate.toFixed(2)}/mile
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-700 dark:text-green-400">Yearly Deduction</span>
              <DollarSign className="h-4 w-4 text-green-700 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              ${yearlyDeduction.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              @ ${irsRate.toFixed(2)}/mile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mileage Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mileage Records</CardTitle>
              <CardDescription>
                Detailed log of all tracked miles
              </CardDescription>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-12">
              <Navigation className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No mileage tracked yet</h3>
              <p className="text-muted-foreground">
                Complete jobs to automatically track mileage
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const fromAddr = formatAddress(
                  record.from_address,
                  record.from_city,
                  record.from_state,
                  record.from_zip
                )
                const toAddr = formatAddress(
                  record.to_address,
                  record.to_city,
                  record.to_state,
                  record.to_zip
                )
                const deduction = calculateMileageDeduction(record.miles_driven, irsRate)

                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        {/* Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(record.created_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>

                        {/* Route */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center mt-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                            <div className="w-0.5 h-8 bg-muted-foreground/30" />
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-2 flex-1">
                            <div>
                              <p className="text-xs text-muted-foreground">From</p>
                              <p className="text-sm">
                                {fromAddr || 'Start of day'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">To</p>
                              <p className="text-sm font-medium">
                                {toAddr || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {record.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Note: {record.notes}
                          </p>
                        )}
                      </div>

                      {/* Miles & Badge */}
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-2xl font-bold">{record.miles_driven.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">miles</p>
                        </div>
                        {record.is_manual_override && (
                          <Badge variant="secondary" className="gap-1">
                            <Edit2 className="h-3 w-3" />
                            Manual
                          </Badge>
                        )}
                        <p className="text-xs text-green-600">
                          ${deduction.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Info Footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">IRS Mileage Deduction</h3>
              <p className="text-sm text-muted-foreground">
                The IRS standard mileage rate for 2024 is <strong>${irsRate.toFixed(2)} per mile</strong> for 
                business use of your vehicle. Keep these records for tax purposes. Consult with 
                a tax professional for specific advice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
