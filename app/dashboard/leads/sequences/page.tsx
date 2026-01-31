'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Mail,
  Clock,
  Zap,
  Plus,
  ArrowLeft,
  Lock,
  Star,
  DollarSign,
  CheckCircle,
  Shield,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  Loader2,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useFeatureGate } from '@/hooks/use-feature-gate'
import { hasSubscriptionAddon } from '@/lib/actions/subscription-addons'
import UpgradePrompt from '@/components/upgrade-prompt'
import { GlowBG } from '@/components/ui/glow-bg'
import { getSequences, toggleSequence, duplicateSequence, deleteSequence, type Sequence } from '@/lib/actions/sequences'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function SequencesPage() {
  const { can, loading } = useFeatureGate()
  const canUseDashboard = can('lead_recovery_dashboard')
  const [hasAIAutoLeadAddon, setHasAIAutoLeadAddon] = useState<boolean | null>(null)
  const router = useRouter()
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loadingSequences, setLoadingSequences] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sequenceToDelete, setSequenceToDelete] = useState<Sequence | null>(null)

  useEffect(() => {
    if (!canUseDashboard) return
    let isMounted = true
    hasSubscriptionAddon('ai_auto_lead')
      .then((has) => { if (isMounted) setHasAIAutoLeadAddon(has) })
      .catch(() => { if (isMounted) setHasAIAutoLeadAddon(false) })
    return () => { isMounted = false }
  }, [canUseDashboard])

  useEffect(() => {
    if (canUseDashboard && hasAIAutoLeadAddon === true) {
      loadSequences()
    }
  }, [canUseDashboard, hasAIAutoLeadAddon])

  async function loadSequences() {
    setLoadingSequences(true)
    try {
      const data = await getSequences()
      setSequences(data)
    } catch (error) {
      console.error('Error loading sequences:', error)
      toast.error('Failed to load auto follow-ups')
    } finally {
      setLoadingSequences(false)
    }
  }

  async function handleToggle(sequence: Sequence) {
    const newEnabled = !sequence.enabled
    const success = await toggleSequence(sequence.id, newEnabled)
    if (success) {
      setSequences(seqs => seqs.map(s => s.id === sequence.id ? { ...s, enabled: newEnabled } : s))
      toast.success(newEnabled ? 'Auto follow-up enabled' : 'Auto follow-up disabled')
    } else {
      toast.error('Failed to update auto follow-up')
    }
  }

  async function handleDuplicate(sequence: Sequence) {
    const result = await duplicateSequence(sequence.id)
    if (result) {
      toast.success('Auto follow-up duplicated')
      loadSequences()
    } else {
      toast.error('Failed to duplicate auto follow-up')
    }
  }

  async function handleDelete(sequence: Sequence) {
    setSequenceToDelete(sequence)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!sequenceToDelete) return
    setDeletingId(sequenceToDelete.id)
    const success = await deleteSequence(sequenceToDelete.id)
    if (success) {
      toast.success('Auto follow-up deleted')
      setSequences(seqs => seqs.filter(s => s.id !== sequenceToDelete.id))
    } else {
      toast.error('Failed to delete auto follow-up')
    }
    setDeleteDialogOpen(false)
    setSequenceToDelete(null)
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <p className="text-sm text-zinc-600 dark:text-white/50">Loading...</p>
        </div>
      </div>
    )
  }

  if (!canUseDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative">
          <div className="hidden dark:block">
            <GlowBG />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-6 py-8">
            <UpgradePrompt requiredTier="pro" feature="Auto Follow-Up Builder" />
          </div>
        </div>
      </div>
    )
  }

  // AI Auto Follow-Up requires the ai_auto_lead add-on (paying for the add-on)
  if (hasAIAutoLeadAddon === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative">
          <div className="hidden dark:block">
            <GlowBG />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-6 py-8">
            <UpgradePrompt addonMode feature="AI Auto Follow-Up" />
          </div>
        </div>
      </div>
    )
  }

  // Still loading add-on status
  if (hasAIAutoLeadAddon === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <p className="text-sm text-zinc-600 dark:text-white/50">Loading...</p>
        </div>
      </div>
    )
  }

  // Mock sequences for preview (when no real sequences exist)
  const mockSequences = [
    {
      id: '1',
      name: 'Booking Abandoned',
      trigger: 'When customer abandons booking',
      enabled: false,
      stats: { avgConversionRate: '23%', avgRecoveredRevenue: '$450/month' },
      steps: [
        {
          delay: 0.5,
          type: 'sms',
          message:
            'Hi {name}! Saw you checking out {service}—need help finishing your booking? Quick link: {booking_link}',
          note: 'Strike while hot - 98% open rate on SMS',
        },
        {
          delay: 24,
          type: 'sms',
          message:
            'Still interested in {service}? Spots filling up this week! Book here: {booking_link}',
          note: 'Create urgency without being pushy',
        },
        {
          delay: 72,
          type: 'email',
          subject: 'Last chance: Special offer on {service}',
          message:
            '⚡ EXCLUSIVE OFFER: Get 15% off {service} if you book by Friday!\n\nWhat our customers say:\n"Best detail I\'ve ever had!" - Sarah M.\n"Worth every penny" - Mike R.\n\nBook now: {booking_link}',
          note: 'Rich content - images, testimonials, incentive',
        },
      ],
    },
    {
      id: '2',
      name: 'Quote Sent',
      trigger: 'When quote is sent to lead',
      enabled: false,
      stats: { avgConversionRate: '35%', avgRecoveredRevenue: '$320/month' },
      steps: [
        {
          delay: 48,
          type: 'sms',
          message:
            'Hi {name}, just following up on the quote. Have any questions? Happy to help!',
          note: 'Give them time to review (24-72 hrs), then check in',
        },
        {
          delay: 120,
          type: 'email',
          subject: 'What others are saying about {service}',
          message:
            'Hi {name},\n\nJust wanted to share what customers are saying about our {service}:\n\n⭐⭐⭐⭐⭐ "Amazing results!"\n⭐⭐⭐⭐⭐ "Super professional"\n\nCommon questions we get:\nQ: How long does it take? A: Usually 2-3 hours\nQ: Do you come to me? A: Yes, mobile service available!\n\nReady to book? Reply to this email or: {booking_link}',
          note: 'Social proof + objection handling',
        },
        {
          delay: 168,
          type: 'sms',
          message:
            'The quote I sent is still good! Want to lock in your spot? {booking_link}',
          note: 'Final nudge at 7 days',
        },
      ],
    },
    {
      id: '3',
      name: 'No Response (7-Day Re-engagement)',
      trigger: "When lead hasn't responded in 7 days",
      enabled: false,
      stats: { avgConversionRate: '12%', avgRecoveredRevenue: '$180/month' },
      steps: [
        {
          delay: 0,
          type: 'sms',
          message:
            'Hi {name} 👋 Just checking in—still thinking about {service}? No pressure, happy to answer any questions!',
          note: 'Friendly, non-pushy tone',
        },
        {
          delay: 48,
          type: 'email',
          subject: 'Detailing tip: How to maintain that fresh look',
          message:
            'Hi {name},\n\nThought you might find this helpful!\n\n🚗 Pro Tip: Regular detailing every 3-6 months keeps your car looking showroom-new and protects resale value.\n\nHere\'s a quick guide: [blog link]\n\nWhen you\'re ready, we\'d love to help: {booking_link}\n\nNo rush—just wanted to share!',
          note: 'Provide value, not just sales pitch',
        },
        {
          delay: 120,
          type: 'email',
          subject: 'Special offer just for you',
          message:
            'Hi {name},\n\nSince you showed interest before, here\'s an exclusive offer:\n\n💰 10% off any service when you book this week\n\nUse code: COMEBACK10\n\nBook here: {booking_link}\n\nOffer expires in 7 days!',
          note: 'Final incentive - escalate discount',
        },
      ],
    },
    {
      id: '4',
      name: 'Post-Service Review Request',
      trigger: 'After job is marked complete',
      enabled: false,
      stats: { avgConversionRate: '45%', reviews: '8/month' },
      steps: [
        {
          delay: 24,
          type: 'sms',
          message:
            'Hi {name}! How did your {service} turn out? 😊 We\'d love your feedback: {review_link}',
          note: 'High response rate - ask within 24hrs while fresh',
        },
        {
          delay: 120,
          type: 'email',
          subject: 'Quick favor: Share your experience?',
          message:
            'Hi {name},\n\nHope you\'re loving your freshly detailed car! 🚗✨\n\nWould you mind taking 30 seconds to leave a review? It really helps our small business:\n\n⭐ Google Review: {google_link}\n⭐ Yelp Review: {yelp_link}\n\nThanks so much!\n\nPS: Refer a friend and you both get 15% off next service!',
          note: 'If no response to SMS, send email with multiple options',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/leads">
                <Button variant="ghost" size="icon" className="hover:bg-zinc-100 dark:hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  Auto Follow-Up
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                  Set-and-forget lead nurturing that works 24/7
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard/leads/sequences/new')}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Auto Follow-Up
            </Button>
          </div>

          {/* Sequences List */}
          {loadingSequences ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-600 dark:text-white/50">Loading sequences...</p>
            </div>
          ) : sequences.length === 0 ? (
            <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No sequences yet</h3>
                <p className="text-sm text-zinc-600 dark:text-white/55 mb-6">
                  Create your first automated sequence to start nurturing leads automatically
                </p>
                <Button
                  onClick={() => router.push('/dashboard/leads/sequences/new')}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Sequence
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sequences.map((sequence) => (
                <Card key={sequence.id} className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <CardTitle>{sequence.name}</CardTitle>
                          {sequence.enabled ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              <Play className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {sequence.description && (
                          <CardDescription className="mb-3">
                            {sequence.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-violet-500" />
                            <span className="text-zinc-600 dark:text-white/55">
                              Trigger: <span className="font-medium capitalize">{sequence.trigger_type.replace('_', ' ')}</span>
                            </span>
                          </div>
                          {sequence.active_enrollments !== undefined && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-zinc-400" />
                              <span className="text-zinc-600 dark:text-white/55">
                                {sequence.active_enrollments} active
                              </span>
                            </div>
                          )}
                          {sequence.conversion_rate !== undefined && sequence.conversion_rate > 0 && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span className="text-zinc-600 dark:text-white/55">
                                {sequence.conversion_rate.toFixed(1)}% conversion
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/leads/sequences/${sequence.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(sequence)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(sequence)}
                          className={sequence.enabled ? 'text-orange-600 hover:text-orange-700' : 'text-emerald-600 hover:text-emerald-700'}
                        >
                          {sequence.enabled ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sequence)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Preview Section (only show if no sequences exist) */}
          {sequences.length === 0 && (
            <div className="mt-12 space-y-4">
              <h2 className="text-xl font-semibold">Example Auto Follow-Ups</h2>
              <p className="text-sm text-zinc-600 dark:text-white/55">
                Here are some example auto follow-ups you can create:
              </p>

              <div className="grid gap-4 lg:grid-cols-1">
                {mockSequences.map((sequence) => (
                  <Card key={sequence.id} className="relative overflow-hidden border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 opacity-60">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <CardTitle>{sequence.name}</CardTitle>
                            <Badge variant="secondary">Coming Soon</Badge>
                          </div>
                          <CardDescription className="mb-3">
                            <span className="font-medium">Trigger:</span>{' '}
                            {sequence.trigger}
                          </CardDescription>

                          {/* Stats */}
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="text-zinc-600 dark:text-zinc-400">
                                Avg conversion:{' '}
                                <span className="font-semibold text-green-600">
                                  {sequence.stats.avgConversionRate}
                                </span>
                              </span>
                            </div>
                            {sequence.stats.avgRecoveredRevenue && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  Recovered:{' '}
                                  <span className="font-semibold text-emerald-600">
                                    {sequence.stats.avgRecoveredRevenue}
                                  </span>
                                </span>
                              </div>
                            )}
                            {sequence.stats.reviews && (
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-600" />
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  <span className="font-semibold">
                                    {sequence.stats.reviews}
                                  </span>{' '}
                                  reviews/month
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" disabled>
                            Edit
                          </Button>
                          <label className="relative inline-flex cursor-not-allowed items-center">
                            <input
                              type="checkbox"
                              checked={sequence.enabled}
                              disabled
                              className="sr-only peer"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-zinc-700 dark:border-zinc-600 dark:peer-focus:ring-blue-800 rtl:peer-checked:after:-translate-x-full"></div>
                          </label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sequence.steps.map((step, index) => (
                          <div key={index} className="flex gap-4">
                            {/* Timeline */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${step.type === 'sms'
                                  ? 'bg-green-100 dark:bg-green-900'
                                  : 'bg-blue-100 dark:bg-blue-900'
                                  }`}
                              >
                                {step.type === 'sms' ? (
                                  <MessageSquare className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Mail className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              {index < sequence.steps.length - 1 && (
                                <div className="mt-2 h-full w-px bg-zinc-200 dark:bg-zinc-700" />
                              )}
                            </div>

                            {/* Step Details */}
                            <div className="flex-1 pb-4">
                              <div className="mb-2 flex items-center gap-2">
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  {step.delay === 0
                                    ? 'Immediately'
                                    : step.delay < 1
                                      ? `${step.delay * 60} min later`
                                      : step.delay === 1
                                        ? '1 hour later'
                                        : step.delay < 24
                                          ? `${step.delay} hours later`
                                          : `${step.delay / 24} days later`}
                                </Badge>
                                <Badge variant="secondary" className="capitalize">
                                  {step.type}
                                </Badge>
                              </div>

                              {step.subject && (
                                <div className="mb-2">
                                  <p className="mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                                    Subject:
                                  </p>
                                  <p className="text-sm font-medium">{step.subject}</p>
                                </div>
                              )}

                              <div className="mb-2 rounded-lg border bg-zinc-50 p-3 dark:bg-zinc-900">
                                <p className="whitespace-pre-wrap text-sm">
                                  {step.message}
                                </p>
                              </div>

                              {step.note && (
                                <div className="flex items-start gap-2">
                                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                    <span className="text-xs text-blue-600">💡</span>
                                  </div>
                                  <p className="text-xs italic text-blue-600 dark:text-blue-400">
                                    {step.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* How It Works Section */}
          <div className="mt-12">
            <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
              <CardHeader>
                <CardTitle>How Automated Sequences Will Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <span className="text-xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="font-semibold">Set Trigger</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Choose what event starts the sequence (booking abandoned, quote
                      sent, no response, etc.)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                      <span className="text-xl font-bold text-green-600">2</span>
                    </div>
                    <h3 className="font-semibold">AI Builds Your Sequence</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Our AI automatically creates the perfect follow-up sequence with optimized timing and messaging
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                      <span className="text-xl font-bold text-purple-600">3</span>
                    </div>
                    <h3 className="font-semibold">Activate & Forget</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Turn it on and the system automatically nurtures leads for you
                      24/7
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Why You'll Love This Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <span className="text-sm text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="font-medium">Never Forget a Follow-up</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Automatic reminders mean you never lose a hot lead
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <span className="text-sm text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="font-medium">Save Hours Every Week</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Set it once, runs forever without manual work
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <span className="text-sm text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="font-medium">Increase Conversion Rates</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Consistent follow-up converts 2-3x more leads
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <span className="text-sm text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="font-medium">Personalized Messages</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Use variables like name, service, price in every message
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle>Best Practices Built In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Multi-Channel Strategy
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        SMS for urgency (98% open rate, {'<'}160 chars), Email for rich
                        content (images, testimonials, easy links)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Smart Timing
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Strike fast (30-60 min) for hot leads, give breathing room
                        (48-72 hrs) after quotes
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100">
                        Escalating Incentives
                      </p>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        Start friendly, build urgency, close with offers (10-15% off)
                        - recovers 15-30% more leads
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">
                        Auto-Stop on Response
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Auto follow-ups pause automatically if customer replies or books -
                        keeps it human, not robotic
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-lg border bg-zinc-50 p-3 dark:bg-zinc-900">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-600" />
                    <div>
                      <p className="font-medium">
                        Personalization + One-Click Links
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Every message uses {'{'}name{'}'}, {'{'}service{'}'},{' '}
                        {'{'}price{'}'} - plus pre-filled booking links reduce
                        friction massively
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                    <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">
                        Compliance Built-In
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Opt-in tracking, easy STOP commands, TCPA compliant - we
                        handle the legal stuff
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Auto Follow-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sequenceToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
