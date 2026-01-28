'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Video, Check, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const AVAILABLE_TIMES = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'
]

// Simple custom calendar that actually works
function SimpleCalendar({
    selected,
    onSelect
}: {
    selected?: Date
    onSelect: (date: Date) => void
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    ).getDate()

    const firstDay = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    ).getDay()

    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const blanks = Array.from({ length: firstDay }, (_, i) => i)

    const isWeekday = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        const dayOfWeek = date.getDay()
        return dayOfWeek !== 0 && dayOfWeek !== 6 // Not Sunday or Saturday
    }

    const isPast = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date < today
    }

    const isSelected = (day: number) => {
        if (!selected) return false
        return (
            selected.getDate() === day &&
            selected.getMonth() === currentMonth.getMonth() &&
            selected.getFullYear() === currentMonth.getFullYear()
        )
    }

    return (
        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="font-semibold text-zinc-900 dark:text-white">{monthName}</h3>
                <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {blanks.map(i => (
                    <div key={`blank-${i}`} className="h-10" />
                ))}

                {/* Actual days */}
                {days.map(day => {
                    const disabled = !isWeekday(day) || isPast(day)
                    const selected = isSelected(day)

                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => {
                                if (!disabled) {
                                    onSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
                                }
                            }}
                            disabled={disabled}
                            className={cn(
                                'h-10 w-full rounded-lg text-sm font-medium transition-all',
                                disabled && 'opacity-30 cursor-not-allowed text-zinc-400',
                                !disabled && !selected && 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white',
                                selected && 'bg-blue-600 text-white hover:bg-blue-700'
                            )}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export function BookingCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [step, setStep] = useState<'calendar' | 'form' | 'confirmed'>('calendar')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        notes: ''
    })
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime) return

        setSubmitting(true)
        try {
            const response = await fetch('/api/book-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate.toISOString(),
                    time: selectedTime,
                    ...formData
                })
            })

            if (!response.ok) throw new Error('Booking failed')

            setStep('confirmed')
        } catch (error) {
            console.error('Booking error:', error)
            alert('Failed to book. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (step === 'confirmed') {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">You're All Set! 🎉</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        We've sent a confirmation email to <strong>{formData.email}</strong> with your meeting details.
                    </p>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-6 text-left">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Your Demo Call</p>
                        <p className="font-semibold">
                            {selectedDate?.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </p>
                        <p className="font-semibold">{selectedTime}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                            <Video className="h-4 w-4 inline mr-1" />
                            Video conference details provided via email
                        </p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/'}
                        className="w-full"
                    >
                        Back to Home
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-6xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
                <div className="grid md:grid-cols-[400px,1fr]">
                    {/* Left Panel */}
                    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 p-8 border-r border-zinc-200 dark:border-zinc-700">
                        {/* Logo */}
                        <div className="mb-8">
                            <div className="w-25 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">BRNNO</span>
                            </div>
                        </div>

                        {/* Host Photo */}
                        <div className="mb-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">AS</span>
                            </div>
                        </div>

                        <h3 className="text-zinc-600 dark:text-zinc-400 mb-2">Adrian Smithee</h3>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
                            30 Minute Demo
                        </h2>

                        <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                <span>30 min</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Video className="h-5 w-5 mt-0.5" />
                                <span className="text-sm">
                                    Web conferencing details provided upon confirmation.
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-2xl">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                                See how BRNNO's AI-powered platform can transform your auto detailing business with:
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                                    <span>AI Auto-Scheduling</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                                    <span>Automated Lead Follow-Up</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                                    <span>Smart Calendar Management</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="p-8">
                        {step === 'calendar' && (
                            <>
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                        Select a Date & Time
                                    </h3>
                                    <p className="text-zinc-600 dark:text-zinc-400">
                                        Choose a time that works best for you
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    {/* Custom Calendar */}
                                    <SimpleCalendar
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                    />

                                    {/* Time Slots */}
                                    {selectedDate && (
                                        <div>
                                            <h4 className="font-semibold mb-3 text-zinc-900 dark:text-white">Available Times</h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {AVAILABLE_TIMES.map((time) => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => setSelectedTime(time)}
                                                        className={cn(
                                                            'p-3 rounded-lg border text-sm font-medium transition-all',
                                                            selectedTime === time
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 text-zinc-900 dark:text-white'
                                                        )}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timezone */}
                                    <div>
                                        <Label className="text-sm text-zinc-600 dark:text-zinc-400">Time zone</Label>
                                        <select className="mt-2 w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                                            <option>Mountain Time - US & Canada</option>
                                            <option>Pacific Time - US & Canada</option>
                                            <option>Central Time - US & Canada</option>
                                            <option>Eastern Time - US & Canada</option>
                                        </select>
                                    </div>

                                    {/* Continue Button */}
                                    {selectedDate && selectedTime && (
                                        <Button
                                            type="button"
                                            onClick={() => setStep('form')}
                                            className="w-full"
                                            size="lg"
                                        >
                                            Continue
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}

                        {step === 'form' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setStep('calendar')}
                                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </button>

                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                        Enter Details
                                    </h3>
                                    <p className="text-zinc-600 dark:text-zinc-400">
                                        {selectedDate?.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric'
                                        })} at {selectedTime}
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                    <div>
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="businessName">Business Name</Label>
                                        <Input
                                            id="businessName"
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder="Elite Detailing"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="notes">Additional Notes</Label>
                                        <textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Tell us about your business..."
                                            className="w-full min-h-[100px] p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {submitting ? 'Booking...' : 'Schedule Meeting'}
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
