'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type NotificationType = 'empty_priority_slot' | 'customer_overdue' | 'gap_opportunity'

// Get active notifications
export async function getSmartNotifications() {
    const { isDemoMode } = await import('@/lib/demo/utils')
    if (await isDemoMode()) return []

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!business) throw new Error('No business found')

    const { data: notifications, error } = await supabase
        .from('smart_notifications')
        .select('*')
        .eq('business_id', business.id)
        .eq('status', 'active')
        .or(`snoozed_until.is.null,snoozed_until.lt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) throw error
    return notifications || []
}

// Generate notifications based on current data
export async function generateSmartNotifications(
    businessId: string,
    jobs: any[],
    priorityBlocks: any[],
    customers: any[]
) {
    const { isDemoMode } = await import('@/lib/demo/utils')
    if (await isDemoMode()) return

    const supabase = await createClient()
    const notifications: Array<{
        type: NotificationType
        title: string
        message: string
        priority: 'low' | 'medium' | 'high'
        metadata: any
    }> = []

    // 1. Check for empty priority slots (next 7 days)
    const today = new Date()
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    for (const block of priorityBlocks) {
        if (!block.enabled) continue

        // Check each day in the next week
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today)
            checkDate.setDate(checkDate.getDate() + i)
            const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][checkDate.getDay()]

            if (!block.days.includes(dayOfWeek)) continue

            // Check if this slot has any jobs
            const [blockStartHour, blockStartMin] = block.start_time.split(':').map(Number)
            const slotStart = new Date(checkDate)
            slotStart.setHours(blockStartHour, blockStartMin, 0, 0)

            const hasJobInSlot = jobs.some(job => {
                if (!job.scheduled_date) return false
                const jobDate = new Date(job.scheduled_date)
                const jobHour = jobDate.getHours()

                // Check if job is in this priority block time range
                const [blockEndHour] = block.end_time.split(':').map(Number)
                return (
                    jobDate.toDateString() === checkDate.toDateString() &&
                    jobHour >= blockStartHour &&
                    jobHour < blockEndHour
                )
            })

            if (!hasJobInSlot && slotStart > today) {
                notifications.push({
                    type: 'empty_priority_slot',
                    title: 'Priority Slot Available',
                    message: `${block.name} on ${checkDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${block.start_time} is still open. Notify leads about this ${block.priority_for.replace('_', ' ')} slot?`,
                    priority: slotStart.getTime() - today.getTime() < 24 * 60 * 60 * 1000 ? 'high' : 'medium',
                    metadata: {
                        block_id: block.id,
                        block_name: block.name,
                        date: checkDate.toISOString(),
                        time: block.start_time,
                        priority_for: block.priority_for
                    }
                })
            }
        }
    }

    // 2. Check for overdue customers (based on last job date)
    const customerJobHistory: Record<string, { lastJob: Date; avgInterval: number; jobCount: number }> = {}

    // Build customer history
    jobs.forEach(job => {
        if (!job.client_id || !job.completed_at) return

        const completedDate = new Date(job.completed_at)
        if (!customerJobHistory[job.client_id]) {
            customerJobHistory[job.client_id] = {
                lastJob: completedDate,
                avgInterval: 0,
                jobCount: 1
            }
        } else {
            const history = customerJobHistory[job.client_id]
            const daysSinceLastJob = (completedDate.getTime() - history.lastJob.getTime()) / (1000 * 60 * 60 * 24)
            history.avgInterval = (history.avgInterval * history.jobCount + daysSinceLastJob) / (history.jobCount + 1)
            history.jobCount++
            if (completedDate > history.lastJob) {
                history.lastJob = completedDate
            }
        }
    })

    // Find overdue customers
    Object.entries(customerJobHistory).forEach(([clientId, history]) => {
        if (history.jobCount < 2) return // Need at least 2 jobs to establish pattern

        const daysSinceLastJob = (today.getTime() - history.lastJob.getTime()) / (1000 * 60 * 60 * 24)
        const expectedInterval = history.avgInterval
        const overdueThreshold = expectedInterval * 1.2 // 20% past expected

        if (daysSinceLastJob > overdueThreshold) {
            const customer = customers.find(c => c.id === clientId)
            if (customer) {
                const monthsSinceLastJob = (daysSinceLastJob / 30).toFixed(1)
                const expectedMonths = (expectedInterval / 30).toFixed(1)

                notifications.push({
                    type: 'customer_overdue',
                    title: 'Customer Overdue for Rebooking',
                    message: `${customer.name} typically books every ${expectedMonths} months, but it's been ${monthsSinceLastJob} months since their last detail. Time to reach out?`,
                    priority: daysSinceLastJob > overdueThreshold * 1.5 ? 'high' : 'medium',
                    metadata: {
                        customer_id: clientId,
                        customer_name: customer.name,
                        customer_phone: customer.phone,
                        last_job_date: history.lastJob.toISOString(),
                        days_overdue: Math.round(daysSinceLastJob - expectedInterval)
                    }
                })
            }
        }
    })

    // 3. Find gap opportunities (2+ hour gaps between jobs)
    const sortedJobs = [...jobs]
        .filter(j => j.scheduled_date && new Date(j.scheduled_date) >= today)
        .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime())

    for (let i = 0; i < sortedJobs.length - 1; i++) {
        const currentJob = sortedJobs[i]
        const nextJob = sortedJobs[i + 1]

        if (!currentJob.scheduled_date || !nextJob.scheduled_date) continue

        const currentEnd = new Date(currentJob.scheduled_date)
        currentEnd.setMinutes(currentEnd.getMinutes() + (currentJob.estimated_duration || 60))

        const nextStart = new Date(nextJob.scheduled_date)

        // Check if same day
        if (currentEnd.toDateString() !== nextStart.toDateString()) continue

        const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60)

        if (gapMinutes >= 120) { // 2+ hour gap
            const gapHours = (gapMinutes / 60).toFixed(1)

            notifications.push({
                type: 'gap_opportunity',
                title: 'Scheduling Gap Detected',
                message: `${gapHours}-hour gap on ${currentEnd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} between ${currentEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} and ${nextStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Perfect for a quick detail!`,
                priority: gapMinutes >= 180 ? 'medium' : 'low', // 3+ hours = medium priority
                metadata: {
                    gap_start: currentEnd.toISOString(),
                    gap_end: nextStart.toISOString(),
                    gap_minutes: Math.round(gapMinutes),
                    before_job_id: currentJob.id,
                    after_job_id: nextJob.id
                }
            })
        }
    }

    // Save notifications to database (only if they don't already exist)
    for (const notif of notifications) {
        // Check if similar notification already exists
        const { data: existing } = await supabase
            .from('smart_notifications')
            .select('id')
            .eq('business_id', businessId)
            .eq('type', notif.type)
            .eq('status', 'active')
            .eq('metadata', notif.metadata)
            .maybeSingle()

        if (!existing) {
            await supabase
                .from('smart_notifications')
                .insert({
                    business_id: businessId,
                    ...notif
                })
        }
    }

    return notifications
}

// Dismiss notification
export async function dismissNotification(notificationId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('smart_notifications')
        .update({ status: 'dismissed' })
        .eq('id', notificationId)

    if (error) throw error
    revalidatePath('/dashboard/schedule')
}

// Snooze notification
export async function snoozeNotification(notificationId: string, hours: number = 24) {
    const supabase = await createClient()

    const snoozeUntil = new Date()
    snoozeUntil.setHours(snoozeUntil.getHours() + hours)

    const { error } = await supabase
        .from('smart_notifications')
        .update({
            status: 'snoozed',
            snoozed_until: snoozeUntil.toISOString()
        })
        .eq('id', notificationId)

    if (error) throw error
    revalidatePath('/dashboard/schedule')
}

// Mark as acted upon
export async function markNotificationActed(notificationId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('smart_notifications')
        .update({ status: 'acted' })
        .eq('id', notificationId)

    if (error) throw error
    revalidatePath('/dashboard/schedule')
}
