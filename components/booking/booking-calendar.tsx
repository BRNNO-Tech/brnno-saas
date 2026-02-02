'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Video, Check, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { getTranslations, type Language } from '@/lib/translations/booking'
import { cn } from '@/lib/utils'

const AVAILABLE_TIMES = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'
]

// Simple custom calendar that actually works
function SimpleCalendar({
    selected,
    onSelect,
    locale = 'en-US',
    dayAbbrev = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
}: {
    selected?: Date
    onSelect: (date: Date) => void
    locale?: string
    dayAbbrev?: string[]
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

    const monthName = currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })

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
                {dayAbbrev.map(day => (
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

const localeFromLang = (lang: Language) => (lang === 'es' ? 'es' : 'en-US')

export function BookingCalendar({ lang }: { lang: Language }) {
    const t = getTranslations(lang)
    const locale = localeFromLang(lang)

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
            alert(t.bookingFailed)
        } finally {
            setSubmitting(false)
        }
    }

    if (step === 'confirmed') {
        return (
            <div className="flex flex-col items-center min-h-screen p-4">
                <div className="flex items-center justify-center flex-1 w-full">
                    <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{t.confirmationTitle}</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                            {t.confirmationMessage} <strong>{formData.email}</strong> {t.confirmationMessageSuffix}
                        </p>
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-6 text-left">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{t.yourDemoCall}</p>
                            <p className="font-semibold">
                                {selectedDate?.toLocaleDateString(locale, {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                            <p className="font-semibold">{selectedTime}</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                                <Video className="h-4 w-4 inline mr-1" />
                                {t.videoDetailsEmail}
                            </p>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/'}
                            className="w-full"
                        >
                            {t.backToHome}
                        </Button>
                    </div>
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
                            {t.meetingTitle}
                        </h2>

                        <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                <span>{t.duration}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Video className="h-5 w-5 mt-0.5" />
                                <span className="text-sm">
                                    {t.webConferencingDetails}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-2xl">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                                {t.leftPanelIntro}
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                                    <span>{t.bullet1}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                                    <span>{t.bullet2}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                                    <span>{t.bullet3}</span>
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
                                        {t.selectDateTime}
                                    </h3>
                                    <p className="text-zinc-600 dark:text-zinc-400">
                                        {t.selectTimeSubtitle}
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    {/* Custom Calendar */}
                                    <SimpleCalendar
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        locale={locale}
                                        dayAbbrev={[...t.dayAbbrev]}
                                    />

                                    {/* Time Slots */}
                                    {selectedDate && (
                                        <div>
                                            <h4 className="font-semibold mb-3 text-zinc-900 dark:text-white">{t.availableTimes}</h4>
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
                                        <Label className="text-sm text-zinc-600 dark:text-zinc-400">{t.timezoneLabel}</Label>
                                        <select className="mt-2 w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                                            {t.timezoneOptions.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
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
                                            {t.continueButton}
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
                                    {t.backButton}
                                </button>

                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                        {t.enterDetails}
                                    </h3>
                                    <p className="text-zinc-600 dark:text-zinc-400">
                                        {selectedDate?.toLocaleDateString(locale, {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric'
                                        })} at {selectedTime}
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                    <div>
                                        <Label htmlFor="name">{t.nameLabel}</Label>
                                        <Input
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder={t.namePlaceholder}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="email">{t.emailLabel}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder={t.emailPlaceholder}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">{t.phoneLabel}</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder={t.phonePlaceholder}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="businessName">{t.businessNameLabel}</Label>
                                        <Input
                                            id="businessName"
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder={t.businessNamePlaceholder}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="notes">{t.notesLabel}</Label>
                                        <textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder={t.notesPlaceholder}
                                            className="w-full min-h-[100px] p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {submitting ? t.submittingButton : t.scheduleMeetingButton}
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
