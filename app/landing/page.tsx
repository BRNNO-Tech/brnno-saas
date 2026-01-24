import LandingNav from '@/components/landing/landing-nav'
import Hero from '@/components/landing/hero'
import Features from '@/components/landing/features'
import Pricing from '@/components/landing/pricing'
// import Testimonials from '@/components/landing/testimonials' // Hidden until we have real reviews
import AIPreviewSection from '@/components/landing/ai-preview-section'
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
        {/* <Testimonials /> */}
        <AIPreviewSection />
        <FAQ />
      </main>
      
      <Footer />
    </div>
  )
}

