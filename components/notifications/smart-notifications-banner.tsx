'use client'

import { useState } from 'react'
import { Bell, X, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { dismissNotification, snoozeNotification, markNotificationActed } from '@/lib/actions/notifications'
import { toast } from 'sonner'

type Notification = {
    id: string
    type: string
    title: string
    message: string
    priority: 'low' | 'medium' | 'high'
    metadata: any
    created_at: string
}

export default function SmartNotificationsBanner({
    initialNotifications
}: {
    initialNotifications: Notification[]
}) {
    const [notifications, setNotifications] = useState(initialNotifications)
    const [collapsed, setCollapsed] = useState(false)

    if (notifications.length === 0) return null

    const getIcon = (type: string) => {
        switch (type) {
            case 'empty_priority_slot':
                return <Clock className="h-5 w-5" />
            case 'customer_overdue':
                return <Bell className="h-5 w-5" />
            case 'gap_opportunity':
                return <TrendingUp className="h-5 w-5" />
            default:
                return <AlertCircle className="h-5 w-5" />
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'border-l-[var(--dash-red)] bg-[var(--dash-graphite)]'
            case 'medium':
                return 'border-l-[var(--dash-amber)] bg-[var(--dash-graphite)]'
            default:
                return 'border-l-[var(--dash-blue)] bg-[var(--dash-graphite)]'
        }
    }

    async function handleDismiss(notificationId: string) {
        try {
            await dismissNotification(notificationId)
            setNotifications(notifications.filter(n => n.id !== notificationId))
            toast.success('Notification dismissed')
        } catch (error) {
            toast.error('Failed to dismiss notification')
        }
    }

    async function handleSnooze(notificationId: string) {
        try {
            await snoozeNotification(notificationId, 24)
            setNotifications(notifications.filter(n => n.id !== notificationId))
            toast.success('Snoozed for 24 hours')
        } catch (error) {
            toast.error('Failed to snooze notification')
        }
    }

    async function handleAction(notification: Notification) {
        try {
            await markNotificationActed(notification.id)

            // Handle specific actions based on type
            if (notification.type === 'empty_priority_slot') {
                toast.success('Opening lead notification tool...')
                // TODO: Open modal to send SMS to leads about this slot
            } else if (notification.type === 'customer_overdue') {
                toast.success('Opening customer contact...')
                // TODO: Open SMS/email compose to customer
            } else if (notification.type === 'gap_opportunity') {
                toast.success('Opening booking form...')
                // TODO: Open quick booking form for this time slot
            }

            setNotifications(notifications.filter(n => n.id !== notification.id))
        } catch (error) {
            toast.error('Failed to complete action')
        }
    }

    if (collapsed) {
        return (
            <button
                onClick={() => setCollapsed(false)}
                className="fixed bottom-4 right-4 z-50 bg-[var(--dash-amber)] p-3 shadow-lg hover:opacity-90 transition-opacity"
            >
                <Bell className="h-6 w-6 text-[var(--dash-black)]" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[var(--dash-red)] text-xs text-white flex items-center justify-center font-semibold">
                    {notifications.length}
                </span>
            </button>
        )
    }

    return (
        <div className="space-y-3 mb-4">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`border-l-2 border border-[var(--dash-border)] p-4 ${getPriorityColor(notification.priority)}`}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-dash-condensed font-bold text-[13px] uppercase tracking-wide text-[var(--dash-text)] mb-1">{notification.title}</h3>
                            <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">{notification.message}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <button
                                    onClick={() => handleAction(notification)}
                                    className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-amber)] hover:opacity-80"
                                >
                                    Take Action
                                </button>
                                <button
                                    onClick={() => handleSnooze(notification.id)}
                                    className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]"
                                >
                                    Snooze 24h
                                </button>
                                <span className="font-dash-mono text-[9px] text-[var(--dash-text-muted)] ml-auto">
                                    {new Date(notification.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDismiss(notification.id)}
                            className="opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            ))}

            {notifications.length > 1 && (
                <button
                    onClick={() => setCollapsed(true)}
                    className="w-full text-center font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] py-1"
                >
                    Collapse notifications
                </button>
            )}
        </div>
    )
}
