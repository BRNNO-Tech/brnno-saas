'use client'

export function InvoicePrintToolbar() {
  return (
    <div className="print:hidden sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="mx-auto flex max-w-2xl justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  )
}
