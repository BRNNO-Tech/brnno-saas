export type CampaignChannel = 'email' | 'sms'
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'failed'
export type RecipientStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'unsubscribed'

export type AudienceFilter = {
  all?: boolean
  lastSeenDays?: 30 | 60 | 90
  serviceType?: string
  minSpend?: number
}

export interface CampaignRow {
  id: string
  business_id: string
  name: string
  channel: CampaignChannel
  status: CampaignStatus
  subject: string | null
  body: string
  audience_filter: AudienceFilter
  recipient_count: number | null
  sent_at: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
}
