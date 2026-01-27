'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Check, X, Calendar, DollarSign, Clock } from 'lucide-react'
import { generateAISchedule, applyAISchedule, getUnscheduledJobs } from '@/lib/actions/ai-schedule'
import { toast } from 'sonner'

export default function AIScheduleDialog({
    open,
    onOpenChange,
    unscheduledJobs,
    currentSchedule,
    priorityBlocks,
    weatherData,
    teamMembers,
    businessHours
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    unscheduledJobs: any[]
    currentSchedule: any[]
    priorityBlocks: any[]
    weatherData: any
    teamMembers: any[]
    businessHours: any
}) {
    const [loading, setLoading] = useState(false)
    const [aiSchedule, setAiSchedule] = useState<any>(null)
    const [applying, setApplying] = useState(false)

    async function handleGenerate() {
        setLoading(true)
        try {
            const result = await generateAISchedule(
                unscheduledJobs,
                currentSchedule,
                priorityBlocks,
                weatherData,
                teamMembers,
                businessHours
            )
            setAiSchedule(result)
            toast.success('AI schedule generated!')
        } catch (error) {
            console.error('Error generating schedule:', error)
            toast.error('Failed to generate schedule. Try again.')
        } finally {
            setLoading(false)
        }
    }

    async function handleApply() {
        if (!aiSchedule) return

        setApplying(true)
        try {
            await applyAISchedule(aiSchedule.schedule)
            toast.success(`${aiSchedule.schedule.length} jobs scheduled!`)
            onOpenChange(false)
            window.location.reload() // Refresh to show new schedule
        } catch (error) {
            console.error('Error applying schedule:', error)
            toast.error('Failed to apply schedule')
        } finally {
            setApplying(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        AI Auto-Schedule
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {!aiSchedule ? (
                        <>
                            <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4">
                                <p className="text-sm text-purple-900 dark:text-purple-100">
                                    AI will analyze your {unscheduledJobs.length} unscheduled jobs and create an optimal schedule considering:
                                </p>
                                <ul className="mt-2 space-y-1 text-xs text-purple-800 dark:text-purple-200">
                                    <li>• Priority time blocks</li>
                                    <li>• Weather forecast</li>
                                    <li>• Team availability</li>
                                    <li>• Revenue optimization</li>
                                    <li>• Business hours</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Unscheduled Jobs:</h4>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {unscheduledJobs.slice(0, 10).map(job => (
                                        <div key={job.id} className="flex items-center justify-between text-sm p-2 bg-zinc-50 dark:bg-zinc-900 rounded">
                                            <span className="truncate">{job.title}</span>
                                            <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {job.estimated_duration || 60}min
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    ${job.estimated_cost || 0}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {unscheduledJobs.length > 10 && (
                                        <p className="text-xs text-zinc-500 text-center py-2">
                                            + {unscheduledJobs.length - 10} more jobs
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={loading || unscheduledJobs.length === 0}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                        Generating Schedule...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate AI Schedule
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* AI Schedule Preview */}
                            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                    Schedule Ready!
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-xs text-green-700 dark:text-green-300">Jobs Scheduled</div>
                                        <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                            {aiSchedule.summary.jobs_scheduled}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-700 dark:text-green-300">Total Revenue</div>
                                        <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                            ${aiSchedule.summary.total_revenue}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-700 dark:text-green-300">Priority Slots</div>
                                        <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                            {aiSchedule.summary.priority_slots_filled}
                                        </div>
                                    </div>
                                </div>
                                {aiSchedule.summary.notes && (
                                    <p className="text-xs text-green-800 dark:text-green-200 mt-2">
                                        {aiSchedule.summary.notes}
                                    </p>
                                )}
                            </div>

                            {/* Schedule Preview */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                <h4 className="font-semibold text-sm sticky top-0 bg-white dark:bg-zinc-950 py-2">
                                    Proposed Schedule:
                                </h4>
                                {aiSchedule.schedule.map((slot: any, idx: number) => {
                                    const job = unscheduledJobs.find(j => j.id === slot.job_id)
                                    if (!job) return null

                                    return (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                            <Calendar className="h-4 w-4 mt-0.5 text-purple-500" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{job.title}</div>
                                                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                                                    {new Date(slot.scheduled_date).toLocaleString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                                    {slot.reason}
                                                </div>
                                            </div>
                                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                ${job.estimated_cost || 0}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setAiSchedule(null)}
                                    className="flex-1"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Regenerate
                                </Button>
                                <Button
                                    onClick={handleApply}
                                    disabled={applying}
                                    className="flex-1"
                                >
                                    {applying ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Applying...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Apply Schedule
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
