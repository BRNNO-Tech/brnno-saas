import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Calendar, DollarSign } from 'lucide-react'
import { getQuoteByCode } from '@/lib/actions/quotes'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function QuoteViewPage({
  params
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const quoteCode = code.toUpperCase()
  
  let quote
  try {
    quote = await getQuoteByCode(quoteCode)
  } catch (error) {
    notFound()
  }
  
  if (!quote) {
    notFound()
  }
  
  const vehicleLabels = {
    sedan: '🚗 Sedan',
    suv: '🚙 SUV',
    truck: '🚚 Truck'
  }
  
  const conditionLabels = {
    normal: 'Normal Condition',
    dirty: 'Dirty',
    very_dirty: 'Very Dirty'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Business Name */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">{quote.business.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Your Custom Quote</p>
        </div>
        
        <Card>
          <CardHeader className="text-center border-b">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-100">
                Quote Code:
              </span>
              <span className="text-lg font-mono font-bold text-blue-600">
                {quote.quote_code}
              </span>
            </div>
            <CardTitle className="text-5xl font-bold text-green-600">
              ${quote.total_price.toFixed(2)}
            </CardTitle>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Valid for 7 days
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Quote Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Quote Details
                </h3>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Vehicle Type:</span>
                    <span className="font-semibold">
                      {vehicleLabels[quote.vehicle_type as keyof typeof vehicleLabels]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Condition:</span>
                    <span className="font-semibold">
                      {conditionLabels[quote.vehicle_condition as keyof typeof conditionLabels]}
                    </span>
                  </div>
                  {quote.customer_name && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">For:</span>
                      <span className="font-semibold">{quote.customer_name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Services Included */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Services Included
                </h3>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {quote.services?.length || 0} service(s) selected
                  </p>
                </div>
              </div>
            </div>
            
            {/* Book Now Button */}
            <div className="pt-4">
              {quote.booked ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-lg">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">This quote has been booked!</span>
                  </div>
                </div>
              ) : (
                <Link href={`/${quote.business.subdomain}/book?quote=${quote.quote_code}${quote.services && quote.services.length > 0 ? `&service=${quote.services[0]}` : ''}`}>
                  <Button className="w-full h-14 text-lg">
                    <DollarSign className="h-6 w-6 mr-2" />
                    Book Now for ${quote.total_price.toFixed(2)}
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Footer */}
            <div className="text-center text-sm text-zinc-600 dark:text-zinc-400 pt-4 border-t">
              <p>Questions? Contact {quote.business.name}</p>
              <p className="text-xs mt-2">
                Quote generated on {new Date(quote.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
