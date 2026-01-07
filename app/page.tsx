import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingNav from '@/components/landing/landing-nav'
import Hero from '@/components/landing/hero'
import Features from '@/components/landing/features'
import Pricing from '@/components/landing/pricing'
import Testimonials from '@/components/landing/testimonials'
import AIAddOnsSection from '@/components/landing/ai-addons-section'
import FAQ from '@/components/landing/faq'
import Footer from '@/components/landing/footer'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is already logged in, redirect to their dashboard
  if (user) {
    const { data: workerData } = await supabase
      .rpc('check_team_member_by_email', { check_email: user.email || '' })
    
    const worker = workerData && workerData.length > 0 ? workerData[0] : null
    
    if (worker && worker.user_id) {
      redirect('/worker')
    } else {
      redirect('/dashboard')
    }
  }

  // Show landing page to non-authenticated users
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

