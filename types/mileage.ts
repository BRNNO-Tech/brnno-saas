/**
 * Mileage tracking types
 */

export interface JobMileage {
  id: string
  business_id: string
  job_id: string
  previous_job_id: string | null
  from_address: string | null
  from_city: string | null
  from_state: string | null
  from_zip: string | null
  from_latitude: number | null
  from_longitude: number | null
  to_address: string | null
  to_city: string | null
  to_state: string | null
  to_zip: string | null
  to_latitude: number | null
  to_longitude: number | null
  miles_driven: number
  is_manual_override: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MileageSummary {
  today: {
    miles: number
    deduction: number
  }
  thisWeek: {
    miles: number
    deduction: number
  }
  thisMonth: {
    miles: number
    deduction: number
  }
  thisYear: {
    miles: number
    deduction: number
  }
}

export interface MileageExportRow {
  date: string
  fromAddress: string
  toAddress: string
  miles: number
  notes: string
  deduction: number
}

export interface MileageRecordWithJob extends JobMileage {
  job: {
    id: string
    title: string
    scheduled_date: string | null
    completed_at: string | null
  } | null
  previous_job: {
    id: string
    title: string
  } | null
}
