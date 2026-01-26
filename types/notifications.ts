export type NotificationType = 'empty_priority_slot' | 'customer_overdue' | 'gap_opportunity'
export type NotificationPriority = 'low' | 'medium' | 'high'
export type NotificationStatus = 'active' | 'dismissed' | 'snoozed' | 'acted'

export interface SmartNotification {
    id: string
    business_id: string
    type: NotificationType
    title: string
    message: string
    priority: NotificationPriority
    status: NotificationStatus
    metadata: Record<string, any>
    snoozed_until?: string
    created_at: string
    updated_at: string
}

export interface EmptyPrioritySlotMetadata {
    block_id: string
    block_name: string
    date: string
    time: string
    priority_for: string
}

export interface CustomerOverdueMetadata {
    customer_id: string
    customer_name: string
    customer_phone?: string
    last_job_date: string
    days_overdue: number
}

export interface GapOpportunityMetadata {
    gap_start: string
    gap_end: string
    gap_minutes: number
    before_job_id: string
    after_job_id: string
}
