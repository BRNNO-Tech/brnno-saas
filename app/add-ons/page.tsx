import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, MessageSquare, Zap, Palette, MapPin, Globe, BarChart, Headphones, Code } from 'lucide-react'
import LandingNav from '@/components/landing/landing-nav'

const addons = [
  {
    name: 'SMS/Text Messaging',
    icon: MessageSquare,
    price: '$29/month',
    description: 'Two-way SMS messaging with customers. Never miss a question or booking change.',
    features: [
      'SMS inbox for all customer texts',
      'Auto-replies for booking confirmations',
      'Team access - your whole team can reply',
      'Message history & search',
      'Automated reminders & follow-ups',
    ],
    popular: true,
  },
  {
    name: 'Advanced Integrations',
    icon: Zap,
    price: '$49/month',
    description: 'Connect BRNNO with your favorite tools via API, webhooks, and Zapier.',
    features: [
      'REST API access',
      'Webhook support',
      'Zapier integration',
      'Custom integrations',
      'Developer documentation',
    ],
  },
  {
    name: 'White-Label',
    icon: Palette,
    price: '$99/month',
    description: 'Remove BRNNO branding and use your own brand throughout the platform.',
    features: [
      'Custom branding & logo',
      'Remove BRNNO branding',
      'Custom color schemes',
      'Branded email templates',
      'Custom domain support',
    ],
  },
  {
    name: 'Multi-Location',
    icon: MapPin,
    price: '$39/month per location',
    description: 'Manage multiple business locations from a single dashboard.',
    features: [
      'Unlimited locations',
      'Location-specific schedules',
      'Team assignment by location',
      'Location-based reporting',
      'Centralized management',
    ],
  },
  {
    name: 'Custom Domain & Branding',
    icon: Globe,
    price: '$19/month',
    description: 'Use your own domain for booking pages and customer-facing links.',
    features: [
      'Custom domain setup',
      'SSL certificate included',
      'Branded booking URLs',
      'Custom email addresses',
      'Professional appearance',
    ],
  },
  {
    name: 'Advanced Reporting',
    icon: BarChart,
    price: '$39/month',
    description: 'Get deeper insights with custom reports, exports, and analytics.',
    features: [
      'Custom report builder',
      'Data exports (CSV, Excel)',
      'Advanced analytics dashboard',
      'Scheduled reports',
      'White-label reports',
    ],
  },
  {
    name: 'Priority Support',
    icon: Headphones,
    price: '$49/month',
    description: 'Get faster response times and dedicated support channels.',
    features: [
      '24/7 priority support',
      'Faster response times (< 2 hours)',
      'Dedicated support channel',
      'Phone support option',
      'Account manager access',
    ],
  },
  {
    name: 'API Access',
    icon: Code,
    price: '$79/month',
    description: 'Full API access for custom integrations and automation.',
    features: [
      'Complete REST API',
      'Webhook endpoints',
      'Rate limit increases',
      'API documentation',
      'Developer support',
    ],
  },
]

export default function AddOnsPage() {
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
            Add-ons Suite
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            Enhance your BRNNO plan with powerful add-ons. Mix and match to create the perfect solution for your business.
          </p>
        </div>

        {/* Add-ons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {addons.map((addon) => {
            const Icon = addon.icon
            return (
              <div
                key={addon.name}
                className={`p-6 sm:p-8 rounded-xl border bg-white dark:bg-zinc-900 ${
                  addon.popular ? 'ring-2 ring-blue-600 relative' : ''
                }`}
              >
                {addon.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Popular
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{addon.name}</h3>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {addon.price}
                    </p>
                  </div>
                </div>
                
                <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                  {addon.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {addon.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/contact" className="block">
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Need a Custom Add-on?</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-2xl mx-auto">
            We can build custom add-ons tailored to your specific business needs. Let's discuss what you're looking for.
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

