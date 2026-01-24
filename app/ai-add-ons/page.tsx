import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, Bot, Zap, MessageSquare, Camera, FileText, Phone, Sparkles } from 'lucide-react'
import LandingNav from '@/components/landing/landing-nav'

const aiAddons = [
  {
    name: 'AI Chatbot Assistant',
    icon: Bot,
    price: '$29–$79/mo',
    priceNote: 'Usage-based tiers',
    description: 'Turn your website into a 24/7 booking machine.',
    features: [
      'Answers customer questions instantly',
      'Helps customers pick the right service',
      'Books appointments automatically',
      'Handles pricing questions',
      'Reduces phone calls + missed leads',
    ],
    bestFor: 'Pro & Fleet',
    whyItSells: 'Every detailer wants fewer calls and more bookings.',
    popular: true,
  },
  {
    name: 'AI Lead Recovery Agent',
    icon: Zap,
    price: '$19–$49/mo',
    description: 'Your smartest revenue generator.',
    features: [
      'Writes personalized follow-up messages',
      'Predicts which leads are "hot"',
      'Sends perfectly timed reminders',
      'Converts abandoned quotes into bookings',
    ],
    bestFor: 'Pro & Fleet',
    whyItSells: 'Direct revenue impact. Easy to justify.',
  },
  {
    name: 'AI SMS Assistant',
    icon: MessageSquare,
    price: '$19–$49/mo + usage',
    priceNote: 'or $0.03–$0.06 per message',
    description: 'Your business texts customers back automatically.',
    features: [
      'Answers FAQs',
      'Sends reminders',
      'Handles rescheduling',
      'Collects reviews',
      'Books appointments via SMS',
    ],
    bestFor: 'All tiers',
    whyItSells: 'Texting is the #1 communication channel for detailers.',
  },
  {
    name: 'AI Photo Analyzer',
    icon: Camera,
    price: '$9–$29/mo',
    description: 'Customers upload photos → AI recommends services.',
    features: [
      'Detects vehicle size',
      'Estimates condition',
      'Suggests service packages',
      'Flags upsell opportunities',
      'Reduces back-and-forth messaging',
    ],
    bestFor: 'Pro & Fleet',
    whyItSells: 'This is a detailing-specific differentiator. No one else has it.',
  },
  {
    name: 'AI Quote Builder',
    icon: FileText,
    price: '$19/mo',
    description: 'Instant, professional quotes — no typing required.',
    features: [
      'Generates quotes automatically',
      'Adjusts pricing based on condition',
      'Suggests upsells',
      'Writes clean, professional descriptions',
    ],
    bestFor: 'Pro',
    whyItSells: 'Saves hours every week.',
  },
  {
    name: 'AI Voice Agent',
    icon: Phone,
    price: '$49–$149/mo',
    description: 'Your business phone line, fully automated.',
    features: [
      'Answers calls',
      'Books appointments',
      'Handles FAQs',
      'Sends follow-up texts',
      'Reduces missed calls',
    ],
    bestFor: 'Fleet',
    whyItSells: 'High-ticket automation for bigger teams.',
  },
  {
    name: 'AI Power Pack',
    icon: Sparkles,
    price: '$99–$149/mo',
    description: 'Your all-in-one automation upgrade.',
    bundle: true,
    includes: [
      'AI Chatbot',
      'AI Lead Recovery Agent',
      'AI SMS Assistant',
      'AI Photo Analyzer',
    ],
    whyBundle: 'Increases ARPU, simplifies the decision, makes your product feel premium.',
    popular: true,
  },
]

export default function AIAddOnsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Back Button */}
        <Link
          href="/landing#pricing"
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pricing
        </Link>

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Add-Ons Suite
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-4">
            Optional upgrades that automate your business and boost revenue.
          </p>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-500 max-w-2xl mx-auto">
            These work across your existing tiers without cluttering them. They also give you predictable, high-margin expansion revenue.
          </p>
        </div>

        {/* AI Add-ons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {aiAddons.map((addon) => {
            const Icon = addon.icon
            return (
              <div
                key={addon.name}
                className={`p-6 sm:p-8 rounded-xl border bg-white dark:bg-zinc-900 ${
                  addon.popular ? 'ring-2 ring-blue-600 relative' : ''
                } ${addon.bundle ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800' : ''}`}
              >
                {addon.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {addon.bundle ? 'Bundle' : 'Popular'}
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    addon.bundle 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-500'
                  }`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{addon.name}</h3>
                    <div>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {addon.price}
                      </p>
                      {addon.priceNote && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {addon.priceNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm font-medium">
                  {addon.description}
                </p>

                {addon.bundle ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Includes:</p>
                      <ul className="space-y-2">
                        {addon.includes?.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white/50 dark:bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        <strong>Why bundle:</strong> {addon.whyBundle}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {addon.features && (
                      <ul className="space-y-2 mb-4">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">What it does:</p>
                        {addon.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      {addon.bestFor && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          <strong>Best for:</strong> {addon.bestFor}
                        </p>
                      )}
                      {addon.whyItSells && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          <strong>Why it sells:</strong> {addon.whyItSells}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <Link href="/contact" className="block mt-6">
                  <Button className="w-full" variant={addon.popular ? 'default' : 'outline'}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl border border-blue-200 dark:border-blue-800 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Automate Your Business?</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-2xl mx-auto">
            AI-powered tools that work seamlessly with your existing BRNNO plan. Mix and match to create the perfect automation stack.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg">Contact Us</Button>
            </Link>
            <Link href="/landing#pricing">
              <Button size="lg" variant="outline">View Plans</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-12 px-6 mt-16">
        <div className="max-w-6xl mx-auto text-center text-zinc-600 dark:text-zinc-400">
          <p>&copy; 2024 BRNNO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

