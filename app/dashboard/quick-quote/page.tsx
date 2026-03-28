import QuickQuoteForm from '@/components/quotes/quick-quote-form'
import RecentQuotes from '@/components/quotes/recent-quotes'
import { getQuickQuotes } from '@/lib/actions/quotes'
import { getBusiness } from '@/lib/actions/business'
import { canAccessQuickQuote } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'

export const dynamic = 'force-dynamic'

export default async function QuickQuotePage() {
  const canView = await canAccessQuickQuote()
  if (!canView) {
    return <UpgradePrompt moduleMode feature="Quick Quote" />
  }
  const quotes = await getQuickQuotes()
  const business = await getBusiness()

  return (
    <div className="w-full pb-20 md:pb-0 space-y-6">
      {/* Two-column on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Quote Form */}
        <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
          <div className="px-5 py-4 border-b border-[var(--dash-border)]">
            <div className="font-dash-condensed font-bold text-[15px] uppercase tracking-wider text-[var(--dash-text)]">Generate Quote</div>
            <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-0.5">Create and share quotes instantly</div>
          </div>
          <div className="p-5">
            <QuickQuoteForm business={business} />
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
          <div className="px-5 py-4 border-b border-[var(--dash-border)]">
            <div className="font-dash-condensed font-bold text-[15px] uppercase tracking-wider text-[var(--dash-text)]">Recent Quotes</div>
            <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-0.5">{quotes.length} total</div>
          </div>
          <div className="p-5">
            <RecentQuotes quotes={quotes} />
          </div>
        </div>
      </div>
    </div>
  )
}
