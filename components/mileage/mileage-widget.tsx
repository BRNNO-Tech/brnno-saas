'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation, TrendingUp, DollarSign } from 'lucide-react'
import type { MileageSummary } from '@/types/mileage'
import { getIRSRate } from '@/lib/utils/mileage-utils'

interface MileageWidgetProps {
  summary: MileageSummary
  irsRate?: number // Default $0.67/mile
}

export function MileageWidget({ summary, irsRate }: MileageWidgetProps) {
  // Use provided rate or get from utils
  const rate = irsRate ?? getIRSRate()
  
  // Extract miles from summary (our type has nested structure)
  const todayMiles = summary.today.miles
  const weekMiles = summary.thisWeek.miles
  const monthMiles = summary.thisMonth.miles
  const yearMiles = summary.thisYear.miles

  // Calculate deductions (use provided rate or existing deduction)
  const monthlyDeduction = irsRate 
    ? Math.round(monthMiles * rate * 100) / 100
    : summary.thisMonth.deduction
  const yearlyDeduction = irsRate
    ? Math.round(yearMiles * rate * 100) / 100
    : summary.thisYear.deduction

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <CardTitle>Mileage Tracking</CardTitle>
          </div>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <CardDescription>
          Track miles for tax deductions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-2xl font-bold">{todayMiles.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">miles</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold">{weekMiles.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">miles</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold">{monthMiles.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">miles</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This Year</p>
            <p className="text-2xl font-bold">{yearMiles.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">miles</p>
          </div>
        </div>

        {/* Tax Deduction Estimates */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-semibold">Tax Deductions</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">This Month</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                ${monthlyDeduction.toLocaleString()}
              </p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">This Year</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                ${yearlyDeduction.toLocaleString()}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Based on IRS rate of ${rate}/mile
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
