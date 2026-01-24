import QuickQuoteForm from '@/components/quotes/quick-quote-form'
import RecentQuotes from '@/components/quotes/recent-quotes'
import { getQuickQuotes } from '@/lib/actions/quotes'
import { getBusiness } from '@/lib/actions/business'
import { CardShell } from '@/components/ui/card-shell'
import { GlowBG } from '@/components/ui/glow-bg'

export const dynamic = 'force-dynamic'

export default async function QuickQuotePage() {
  const quotes = await getQuickQuotes()
  const business = await getBusiness()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Quick Quote</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Generate instant quotes and share with customers
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Quote Generator */}
            <CardShell title="Generate Quote" subtitle="Create and share quotes instantly">
              <QuickQuoteForm business={business} />
            </CardShell>
            
            {/* Recent Quotes */}
            <CardShell title="Recent Quotes" subtitle="Your latest quote activity">
              <RecentQuotes quotes={quotes} />
            </CardShell>
          </div>
        </div>
      </div>
    </div>
  )
}
