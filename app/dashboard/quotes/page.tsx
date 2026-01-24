export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default async function QuotesPage() {
  // Redirect old quotes page to quick-quote
  redirect('/dashboard/quick-quote')
}

