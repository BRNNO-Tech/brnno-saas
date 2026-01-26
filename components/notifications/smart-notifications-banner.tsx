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
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
            case 'medium':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
            default:
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
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
                className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 dark:bg-blue-500 p-3 shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
                <Bell className="h-6 w-6 text-white" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-semibold">
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
                    className={`rounded-2xl border p-4 ${getPriorityColor(notification.priority)}`}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{notification.title}</h3>
                            <p className="text-sm opacity-90">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={() => handleAction(notification)}
                                    className="text-sm font-medium underline hover:no-underline"
                                >
                                    Take Action
                                </button>
                                <button
                                    onClick={() => handleSnooze(notification.id)}
                                    className="text-sm opacity-70 hover:opacity-100"
                                >
                                    Snooze 24h
                                </button>
                                <span className="text-xs opacity-50 ml-auto">
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
                    className="w-full text-center text-sm opacity-60 hover:opacity-100"
                >
                    Collapse notifications
                </button>
            )}
        </div>
    )
}
