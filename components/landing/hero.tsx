import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import HeroScreenshotCarousel from './hero-screenshot-carousel'

export default function Hero() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
          Manage Your Business
          <br />
          All in One Place
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Streamline operations, manage your team, track jobs, and grow your business with BRNNO's all-in-one platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 min-h-[48px]">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 min-h-[48px]">
            Watch Demo
          </Button>
        </div>

        {/* Hero Screenshot Carousel */}
        <div className="mt-12 sm:mt-16 px-4">
          <HeroScreenshotCarousel />
        </div>
      </div>
    </section>
  )
}

