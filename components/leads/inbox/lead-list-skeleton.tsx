'use client'

export function LeadListSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-full p-4 rounded-xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="flex items-center gap-3">
                <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
