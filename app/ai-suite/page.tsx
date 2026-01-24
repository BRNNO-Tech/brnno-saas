import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, Camera, Navigation, Sparkles, ArrowRight } from 'lucide-react'
import LandingNav from '@/components/landing/landing-nav'
import Footer from '@/components/landing/footer'

const addons = [
  {
    name: 'AI Photo Analysis',
    icon: Camera,
    price: '$19.99/mo',
    features: [
      'Dirtiness detection',
      'Auto‑markup',
      'Worker preview',
      'Photo routing',
      'Dashboard storage',
    ],
  },
  {
    name: 'Mileage Tracker',
    icon: Navigation,
    price: '$9.99/mo',
    features: [
      'Automatic mileage tracking',
      'IRS-ready logs',
    ],
  },
  {
    name: 'AI Power Pack',
    icon: Sparkles,
    price: '$99–$149/mo',
    bundle: true,
    includes: [
      'AI Chatbot',
      'AI Lead Recovery',
      'AI SMS Assistant',
      'AI Photo Analyzer',
    ],
    popular: true,
  },
]

const otherAddons = [
  {
    name: 'SMS/Text Messaging',
    price: '$29/mo',
  },
  {
    name: 'White Label',
    price: '$99/mo',
  },
  {
    name: 'Custom Domain',
    price: '$19/mo',
  },
]

export default function MarketSuitePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Back Button */}
        <Link
          href="/landing"
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Market Suite
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-4">
            ADD‑ONS (Optional, Modular, Scalable)
          </p>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-500 max-w-2xl mx-auto">
            Enhance your BRNNO plan with powerful add-ons. Mix and match to create the perfect solution for your business.
          </p>
        </div>

        {/* Main Add-ons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {addons.map((addon) => {
            const Icon = addon.icon
            return (
              <div
                key={addon.name}
                className={`p-6 sm:p-8 rounded-xl border bg-white dark:bg-zinc-900 ${
                  addon.popular ? 'ring-2 ring-blue-600 relative' : ''
                } ${addon.bundle ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800' : 'border-zinc-200 dark:border-zinc-700'} hover:shadow-lg transition-shadow`}
              >
                {addon.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Bundle
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

                {addon.bundle ? (
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
                ) : (
                  <ul className="space-y-2">
                    {(addon.features || []).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Link href="/signup" className="block mt-6">
                  <Button className="w-full" variant={addon.popular ? 'default' : 'outline'}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Other Add-ons Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Other Add‑Ons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {otherAddons.map((addon) => (
              <div
                key={addon.name}
                className="p-6 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-bold mb-2">{addon.name}</h3>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {addon.price}
                </p>
                <Link href="/signup" className="block mt-4">
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Starter
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Pro
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Fleet
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                  {/* Core Features */}
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                    <td colSpan={4} className="px-4 sm:px-6 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                      Core Features
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Online Booking System</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Upfront Payments</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Customer & Job Management</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Basic Quotes & Invoices</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Today's Schedule View</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>

                  {/* Lead Recovery & Automation */}
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                    <td colSpan={4} className="px-4 sm:px-6 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                      Lead Recovery & Automation
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Lead Recovery (Limited)</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Lead Recovery (Full)</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Automation Suite</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Rebook Reminders</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Review Automation</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Follow-Up Automation</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>

                  {/* Team Management */}
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                    <td colSpan={4} className="px-4 sm:px-6 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                      Team Management
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Team Members</td>
                    <td className="px-4 sm:px-6 py-3 text-center text-sm text-zinc-700 dark:text-zinc-300">1</td>
                    <td className="px-4 sm:px-6 py-3 text-center text-sm text-zinc-700 dark:text-zinc-300">1–3</td>
                    <td className="px-4 sm:px-6 py-3 text-center text-sm text-zinc-700 dark:text-zinc-300">1–5</td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Team Dashboard</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Basic Auto-Assignment</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Advanced Auto-Assignment</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Route Optimization</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Earnings Tracking</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>

                  {/* Reports & Analytics */}
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                    <td colSpan={4} className="px-4 sm:px-6 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                      Reports & Analytics
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Advanced Quotes & Invoices</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Reports & Analytics (Basic)</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Advanced Analytics</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">PDF Export</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>

                  {/* Enterprise Features */}
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                    <td colSpan={4} className="px-4 sm:px-6 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                      Enterprise Features
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">Priority Support</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300">API Access</td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><span className="text-zinc-400">—</span></td>
                    <td className="px-4 sm:px-6 py-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl border border-blue-200 dark:border-blue-800 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Enhance Your Business?</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-2xl mx-auto">
            Optional add-ons that work seamlessly with your existing BRNNO plan. Mix and match to create the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/landing#pricing">
              <Button size="lg" variant="outline">View Plans</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
