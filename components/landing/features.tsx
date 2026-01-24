import { Target, Inbox, PlayCircle, BarChart3, Wrench, Users, Calendar, DollarSign, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Target,
    title: 'Lead Recovery Dashboard',
    description: 'Recover lost revenue with our powerful 3-panel command center. Track hot, warm, and cold leads with real-time scoring and automated follow-ups.',
  },
  {
    icon: Inbox,
    title: '3-Panel Leads Inbox',
    description: 'Manage leads efficiently with filters, timeline view, and AI-powered message composer. Never miss a lead again.',
  },
  {
    icon: PlayCircle,
    title: 'Auto Follow-Up',
    description: 'Build multi-step automation sequences with SMS, email, wait times, and conditional logic. Set it and forget it.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Track recovered revenue, conversion funnels, speed-to-lead metrics, and ROI by sequence.',
  },
  {
    icon: Wrench,
    title: 'Services & Add-ons',
    description: 'Create service menus with optional add-ons. Set popular services and manage pricing with ease.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Track customer history, VIP status, job history, and revenue. Build lasting relationships.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Intuitive calendar interface for managing jobs, team assignments, and availability.',
  },
  {
    icon: Sparkles,
    title: 'Quick Quotes',
    description: 'Generate professional quotes and estimates in minutes. Convert leads faster.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Everything You Need to Recover Leads & Grow</h2>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 px-4">
            Powerful lead recovery tools, automation, and business management all in one modern platform
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border bg-white dark:bg-zinc-900 hover:shadow-lg transition-shadow"
            >
              <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

