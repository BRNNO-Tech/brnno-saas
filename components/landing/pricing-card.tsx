import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PricingCardProps = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  aiAddons?: string[]
  cta: string
  href: string
  popular?: boolean
  highlight?: boolean
  dark?: boolean
  accent?: boolean
  badge?: string
  color?: 'green' | 'blue' | 'purple' | 'gray'
  yearlySavings?: string
}

export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  aiAddons,
  cta,
  href,
  popular,
  highlight,
  dark,
  accent,
  badge,
  color = 'gray',
  yearlySavings
}: PricingCardProps) {
  const getColorClasses = () => {
    if (highlight) return 'bg-blue-600 text-white border-blue-500 shadow-xl'
    if (dark) return 'bg-zinc-900 text-white border-zinc-800'
    if (accent) return 'bg-gradient-to-br from-purple-600 to-blue-600 text-white border-purple-500'
    return 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
  }

  const getColorBadge = () => {
    switch (color) {
      case 'green':
        return 'bg-green-500'
      case 'blue':
        return 'bg-blue-500'
      case 'purple':
        return 'bg-purple-500'
      default:
        return 'bg-zinc-500'
    }
  }

  return (
    <div className="flex-shrink-0 w-[320px] sm:w-[360px] snap-center pt-4">
      <div 
        className={`
          h-full rounded-xl p-6 sm:p-8 border-2 relative
          transition-all duration-300 hover:scale-105 hover:shadow-2xl
          ${getColorClasses()}
        `}
      >
        {/* Popular Badge */}
        {popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              ⭐ Most Popular
            </div>
          </div>
        )}

        {/* New Badge */}
        {badge && (
          <div className="absolute -top-3 right-4">
            <div className="bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {badge}
            </div>
          </div>
        )}

        {/* Color indicator dot */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-3 w-3 rounded-full ${getColorBadge()}`} />
          <h3 className={`text-2xl font-bold ${highlight || dark || accent ? '' : ''}`}>
            {name}
          </h3>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl sm:text-4xl font-bold">{price}</span>
            {period && (
              <span className={highlight || dark || accent ? 'opacity-75' : 'text-zinc-600 dark:text-zinc-400'}>
                {period}
              </span>
            )}
          </div>
          {yearlySavings && period === '/yr' && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">
              ({yearlySavings})
            </p>
          )}
          {period === '/yr' && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 italic">
              Billed annually
            </p>
          )}
          <p className={`text-sm ${highlight || dark || accent ? 'opacity-90' : 'text-zinc-600 dark:text-zinc-400'}`}>
            {description}
          </p>
        </div>

        {/* CTA Button */}
        <div className="mb-6">
          <Link href={href} className="block">
            <Button 
              className={`
                w-full
                ${highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : ''}
                ${dark ? 'bg-white text-zinc-900 hover:bg-zinc-100' : ''}
                ${accent ? 'bg-white text-purple-600 hover:bg-purple-50' : ''}
                ${!highlight && !dark && !accent ? '' : ''}
              `}
              variant={!highlight && !dark && !accent ? (popular ? 'default' : 'outline') : undefined}
            >
              {cta}
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div>
            <p className={`text-xs font-semibold mb-2 ${highlight || dark || accent ? 'opacity-90' : 'text-zinc-700 dark:text-zinc-300'}`}>
              {accent ? 'Available Add-ons:' : 'Core Features:'}
            </p>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${highlight || dark || accent ? '' : 'text-green-600'}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {aiAddons && aiAddons.length > 0 && (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className={`text-xs font-semibold mb-2 ${highlight || dark || accent ? 'opacity-90' : 'text-zinc-700 dark:text-zinc-300'}`}>
                AI Add-ons Available:
              </p>
              <ul className="space-y-1.5">
                {aiAddons.map((addon, idx) => (
                  <li key={idx} className={`text-xs ${highlight || dark || accent ? 'opacity-90' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    • {addon}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

