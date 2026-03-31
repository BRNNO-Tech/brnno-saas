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

export interface MetaIntegration {
  id: string
  business_id: string
  provider: 'meta'
  page_id: string
  page_name: string
  page_access_token: string
  ad_account_id?: string
  connected_at: string
  token_expires_at?: string
  is_active: boolean
  automations: IntegrationAutomations
}

export interface IntegrationAutomations {
  createCrmRecord: boolean
  fireSmsAgent: boolean
  sendWelcomeEmail: boolean
  addToNurtureCampaign: boolean
  nurtureCampaignId?: string | null
}

export interface IntegrationLead {
  id: string
  business_id: string
  integration_id: string
  meta_lead_id: string
  ad_id?: string
  ad_name?: string
  form_id?: string
  raw_data: Record<string, unknown>
  client_id?: string
  processed_at?: string
  status: 'pending' | 'processed' | 'failed'
  error?: string
  created_at: string
}

export interface MetaLeadFieldData {
  name: string
  values: string[]
}
