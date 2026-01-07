import LandingNav from '@/components/landing/landing-nav'
import Hero from '@/components/landing/hero'
import Features from '@/components/landing/features'
import Pricing from '@/components/landing/pricing'
import Testimonials from '@/components/landing/testimonials'
import AIAddOnsSection from '@/components/landing/ai-addons-section'
import FAQ from '@/components/landing/faq'
import Footer from '@/components/landing/footer'

// This page always shows the landing page, even for logged-in users
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNav />
      
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <AIAddOnsSection />
        <FAQ />
      </main>
      
      <Footer />
    </div>
  )
}

