'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, MessageSquare, Camera, ArrowRight } from 'lucide-react'

const aiTools = [
  {
    name: 'AI Lead Recovery',
    icon: Zap,
    description: 'Automatically follows up with leads and converts abandoned quotes into bookings.',
  },
  {
    name: 'AI SMS Assistant',
    icon: MessageSquare,
    description: 'Handles customer texting for you — replies, reminders, and bookings.',
  },
  {
    name: 'AI Photo Analyzer',
    icon: Camera,
    description: 'Customers upload photos → AI recommends services and pricing instantly.',
  },
]

export default function AIPreviewSection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight pt-1">
            AI that books more jobs for you — automatically.
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Turn missed leads into booked revenue with zero extra effort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {aiTools.map((tool) => {
            const Icon = tool.icon
            return (
              <div
                key={tool.name}
                className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{tool.name}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  {tool.description}
                </p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/ai-suite">
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-8">
              Explore the Market Suite
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
