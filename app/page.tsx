import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingNav from '@/components/landing/landing-nav'
import Hero from '@/components/landing/hero'
import Features from '@/components/landing/features'
import Pricing from '@/components/landing/pricing'
import AIAddOnsSection from '@/components/landing/ai-addons-section'
import FAQ from '@/components/landing/faq'

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

