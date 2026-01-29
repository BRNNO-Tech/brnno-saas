import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import LandingNav from '@/components/landing/landing-nav'
import Hero from '@/components/landing/hero'
import Features from '@/components/landing/features'
import Pricing from '@/components/landing/pricing'
// import Testimonials from '@/components/landing/testimonials' // Hidden until we have real reviews
import AIPreviewSection from '@/components/landing/ai-preview-section'
import FAQ from '@/components/landing/faq'
import Footer from '@/components/landing/footer'

export default async function Home() {
  // Check domain
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isAppDomain = host === 'app.brnno.io' || host.startsWith('app.brnno.io:')
  
  // If on app.brnno.io, redirect to login (middleware should handle this, but as a fallback)
  if (isAppDomain) {
    redirect('/login')
  }
  
  // On marketing domain (e.g. brnno.com): if auth fails (env, Supabase, cookies), still show landing
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
  } catch {
    // Auth/env failed on marketing domain: show landing page instead of failing
  }

  // Show landing page to non-authenticated users on marketing domain
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

