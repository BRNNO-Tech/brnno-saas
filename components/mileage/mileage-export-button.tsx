'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportMileageToCSV } from '@/lib/actions/mileage'
import { toast } from 'sonner'

export function MileageExportButton() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await exportMileageToCSV()
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mileage-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Mileage export downloaded')
    } catch (error) {
      toast.error('Failed to export mileage')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3 py-1.5 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors disabled:opacity-40"
    >
      <Download className="h-3.5 w-3.5" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}
