'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, Bot, Zap, MessageSquare, Camera, FileText, Phone } from 'lucide-react'
import Link from 'next/link'

const aiAddons = [
  {
    id: 'chatbot',
    name: 'AI Chatbot Assistant',
    icon: Bot,
    price: '$29–$79/mo',
    shortDescription: 'Turn your website into a 24/7 booking machine.',
    longDescription: 'Answers questions, recommends services, and books appointments automatically.',
    availableOn: 'Pro & Fleet',
    description: 'Turn your website into a 24/7 booking machine.',
    features: [
      'Answers customer questions instantly',
      'Helps customers pick the right service',
      'Books appointments automatically',
      'Handles pricing questions',
      'Reduces phone calls + missed leads',
    ],
    howItHelps: 'Every detailer wants fewer calls and more bookings. The AI Chatbot works 24/7 to capture leads even when you\'re busy.',
    requirements: 'Pro or Fleet plan required',
  },
  {
    id: 'lead-recovery',
    name: 'AI Lead Recovery Agent',
    icon: Zap,
    price: '$19–$49/mo',
    shortDescription: 'Automatically follows up with leads, recovers abandoned quotes, and boosts conversion without lifting a finger.',
    longDescription: 'Automatically follows up with leads, recovers abandoned quotes, and boosts conversion without lifting a finger.',
    availableOn: 'Pro & Fleet',
    description: 'Your smartest revenue generator.',
    features: [
      'Writes personalized follow-up messages',
      'Predicts which leads are "hot"',
      'Sends perfectly timed reminders',
      'Converts abandoned quotes into bookings',
    ],
    howItHelps: 'Direct revenue impact. Easy to justify. Automatically turns abandoned quotes into paying customers without manual follow-up.',
    requirements: 'Pro or Fleet plan required',
  },
  {
    id: 'sms',
    name: 'AI SMS Assistant',
    icon: MessageSquare,
    price: '$19–$49/mo + usage',
    shortDescription: 'Handles customer texting for you — replies, reminders, updates, and FAQs.',
    longDescription: 'Handles customer texting for you — replies, reminders, updates, and FAQs.',
    availableOn: 'All tiers',
    description: 'Your business texts customers back automatically.',
    features: [
      'Answers FAQs',
      'Sends reminders',
      'Handles rescheduling',
      'Collects reviews',
      'Books appointments via SMS',
    ],
    howItHelps: 'Texting is the #1 communication channel for detailers. Never miss a message or booking opportunity.',
    requirements: 'Available on all plans',
  },
  {
    id: 'photo-analyzer',
    name: 'AI Photo Analyzer',
    icon: Camera,
    price: '$9–$29/mo',
    shortDescription: 'Customers upload photos → AI recommends services and pricing instantly.',
    longDescription: 'Perfect for detailing, maids, landscaping, pest control, and more.',
    availableOn: 'Pro & Fleet',
    description: 'Customers upload photos → AI recommends services.',
    features: [
      'Detects vehicle size',
      'Estimates condition',
      'Suggests service packages',
      'Flags upsell opportunities',
      'Reduces back-and-forth messaging',
    ],
    howItHelps: 'This is a detailing-specific differentiator. No one else has it. Customers love the instant recommendations.',
    requirements: 'Pro or Fleet plan required',
  },
  {
    id: 'quote-builder',
    name: 'AI Quote Builder',
    icon: FileText,
    price: '$19/mo',
    shortDescription: 'Instant, professional quotes generated automatically from customer inputs.',
    longDescription: 'Instant, professional quotes generated automatically from customer inputs.',
    availableOn: 'Pro & Fleet',
    description: 'Instant, professional quotes — no typing required.',
    features: [
      'Generates quotes automatically',
      'Adjusts pricing based on condition',
      'Suggests upsells',
      'Writes clean, professional descriptions',
    ],
    howItHelps: 'Saves hours every week. Generate professional quotes in seconds instead of minutes.',
    requirements: 'Pro or Fleet plan required',
  },
  {
    id: 'voice-agent',
    name: 'AI Voice Agent',
    icon: Phone,
    price: '$49–$149/mo',
    shortDescription: 'Your AI receptionist. Answers calls, books appointments, handles FAQs, and routes customers.',
    longDescription: 'Your AI receptionist. Answers calls, books appointments, handles FAQs, and routes customers.',
    availableOn: 'Fleet only',
    description: 'Your business phone line, fully automated.',
    features: [
      'Answers calls',
      'Books appointments',
      'Handles FAQs',
      'Sends follow-up texts',
      'Reduces missed calls',
    ],
    howItHelps: 'High-ticket automation for bigger teams. Never miss a call, even when your team is busy.',
    requirements: 'Fleet plan required',
  },
]

export default function AIAddOnsSection() {
  const [selectedAddon, setSelectedAddon] = useState<typeof aiAddons[0] | null>(null)

  return (
    <>
      <section id="ai-addons" className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              AI Automation Suite
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-2">
              Supercharge your business with optional AI tools.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Enable any AI feature after signup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiAddons.map((addon) => {
              const Icon = addon.icon
              return (
                <div
                  key={addon.id}
                  className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 flex flex-col hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2">{addon.name}</h3>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">
                      {addon.price}
                    </p>
                  </div>

                  <p className="text-zinc-600 dark:text-zinc-400 mb-3 flex-grow">
                    {addon.shortDescription}
                  </p>

                  {addon.longDescription && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                      {addon.longDescription}
                    </p>
                  )}

                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
                    Available on {addon.availableOn}
                  </p>

                  <Button
                    onClick={() => setSelectedAddon(addon)}
                    variant="outline"
                    className="w-full"
                  >
                    Learn More
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedAddon && (
        <Dialog open={!!selectedAddon} onOpenChange={(open) => !open && setSelectedAddon(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <selectedAddon.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">{selectedAddon.name}</DialogTitle>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    {selectedAddon.price}
                  </p>
                </div>
              </div>
              <DialogDescription className="text-base">
                {selectedAddon.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* What it does */}
              <div>
                <h4 className="font-semibold mb-3">What it does:</h4>
                <ul className="space-y-2">
                  {selectedAddon.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How it helps */}
              <div>
                <h4 className="font-semibold mb-2">How it helps your business:</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedAddon.howItHelps}
                </p>
              </div>

              {/* Requirements */}
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Requirements:</strong> {selectedAddon.requirements}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Link href="/signup" className="flex-1">
                <Button className="w-full" size="lg">
                  Get Started
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setSelectedAddon(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

