import { redirect } from 'next/navigation'
import { getBusiness } from '@/lib/actions/business'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/dashboard')
  }

  if (business.onboarding_completed !== false) {
    redirect('/dashboard')
  }

  const isPro = business.billing_plan === 'pro'

  const supabase = await createClient()
  const { data: profileRow } = await supabase
    .from('business_profiles')
    .select('tagline, bio, primary_color, owner_story, logo_url, banner_url, portfolio_photos')
    .eq('business_id', business.id)
    .maybeSingle()

  const initialPortfolio = Array.isArray(profileRow?.portfolio_photos)
    ? (profileRow!.portfolio_photos as string[])
    : []

  return (
    <OnboardingWizard
      isPro={isPro}
      business={{
        id: business.id as string,
        name: (business.name as string) ?? '',
        phone: (business.phone as string | null) ?? null,
        city: (business.city as string | null) ?? null,
        state: (business.state as string | null) ?? null,
        email: (business.email as string | null) ?? null,
        description: (business.description as string | null) ?? null,
        subdomain: (business.subdomain as string | null) ?? null,
        initialProfile: {
          tagline: (profileRow?.tagline as string | null) ?? null,
          bio: (profileRow?.bio as string | null) ?? null,
          primaryColor: (profileRow?.primary_color as string | null) ?? '#F2C94C',
          ownerStory: (profileRow?.owner_story as string | null) ?? null,
          logoUrl: (profileRow?.logo_url as string | null) ?? null,
          bannerUrl: (profileRow?.banner_url as string | null) ?? null,
          portfolioPhotos: initialPortfolio,
        },
      }}
    />
  )
}
