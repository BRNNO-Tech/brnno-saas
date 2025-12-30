import LandingNav from '@/components/landing/landing-nav'
import Hero from '@/components/landing/hero'
import Features from '@/components/landing/features'
import Pricing from '@/components/landing/pricing'
import AIAddOnsSection from '@/components/landing/ai-addons-section'
import FAQ from '@/components/landing/faq'

// This page always shows the landing page, even for logged-in users
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNav />
      
      <main>
        <Hero />
        <Features />
        <Pricing />
        <AIAddOnsSection />
        <FAQ />
      </main>
      
      <footer className="border-t py-12 px-6">
        <div className="max-w-6xl mx-auto text-center text-zinc-600 dark:text-zinc-400">
          <p>&copy; 2024 BRNNO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

