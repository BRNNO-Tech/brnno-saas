import React from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Instagram, Facebook, Youtube, Twitter, MapPin, Phone, Mail } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/google-icon'
import { ProfileTabs } from '@/components/profile/profile-tabs'
import { PromoBanner } from '@/components/profile/promo-banner'

export const dynamic = 'force-dynamic'

const SOCIAL_BRAND = {
  instagram: { background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)', color: '#fff' },
  facebook: { backgroundColor: '#1877F220', color: '#1877F2' },
  tiktok: { background: 'linear-gradient(135deg, #25F4EE 0%, #FE2C55 100%)', color: '#fff' },
  youtube: { backgroundColor: '#FF000020', color: '#FF0000' },
  twitter: { backgroundColor: '#00000020', color: '#000000' },
  google: { backgroundColor: 'transparent' },
} as const

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for public profile access')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function getBusiness(subdomain: string) {
  const supabase = getSupabaseClient()
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, subdomain, description, logo_url, booking_banner_url, billing_plan, business_hours')
    .eq('subdomain', subdomain)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching business:', error)
    return null
  }
  return business
}

async function getProfile(businessId: string) {
  const supabase = getSupabaseClient()
  const { data: profile, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return profile
}

async function getServices(businessId: string) {
  const supabase = getSupabaseClient()
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }
  return (services || []).filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
}

function normalizeSocialUrl(
  url: string | null | undefined,
  base: string,
  prefix = ''
): string {
  if (!url?.trim()) return ''
  const u = url.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const handle = u.replace(/^@/, '')
  return `${base}${prefix}${handle}`
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>
}): Promise<Metadata> {
  const { subdomain } = await params
  const business = await getBusiness(subdomain)
  if (!business) {
    return { title: 'Not Found', description: 'This page could not be found.' }
  }
  const profile = await getProfile(business.id)
  const title = `${business.name}${profile?.tagline ? ` | ${profile.tagline}` : ''}`
  const description =
    profile?.bio?.slice(0, 160) ||
    business.description ||
    `Book with ${business.name}.`
  const imageUrl =
    profile?.logo_url ||
    profile?.banner_url ||
    business.booking_banner_url ||
    business.logo_url ||
    undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function BusinessProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const { subdomain } = await params
  const sp = await searchParams
  const lang: 'en' | 'es' = sp?.lang === 'es' ? 'es' : 'en'

  if (
    subdomain === 'invite' ||
    subdomain === 'dashboard' ||
    subdomain === 'worker' ||
    subdomain === 'api'
  ) {
    notFound()
  }

  const business = await getBusiness(subdomain)
  if (!business) {
    notFound()
  }

  const profile = await getProfile(business.id)
  const services = await getServices(business.id)

  const hasSocial =
    (profile?.show_social_icons !== false) &&
    (profile?.instagram_url ||
      profile?.facebook_url ||
      profile?.tiktok_url ||
      profile?.youtube_url ||
      profile?.twitter_url ||
      profile?.google_url)

  const showContact = profile?.show_contact_info !== false
  const hasBanner = !!((profile?.banner_video_url || profile?.banner_url) && business.billing_plan === 'pro')

  const isPro = business.billing_plan === 'pro'
  const showPromoBanner =
    !!profile?.promo_enabled &&
    (profile.promo_expires_at == null || new Date(profile.promo_expires_at) > new Date())
  const theme = {
    primaryColor: isPro ? (profile?.primary_color ?? '#3B82F6') : '#3B82F6',
    secondaryColor: isPro ? (profile?.secondary_color ?? '#1E40AF') : '#1E40AF',
    accentColor: isPro ? (profile?.accent_color ?? '#10B981') : '#10B981',
    fontFamily: isPro ? (profile?.font_family ?? 'inter') : 'inter',
    buttonStyle: isPro ? (profile?.button_style ?? 'rounded') : 'rounded',
  }
  const fontClass =
    theme.fontFamily === 'serif'
      ? 'font-serif'
      : theme.fontFamily === 'mono'
        ? 'font-mono'
        : 'font-sans'
  const buttonClass =
    theme.buttonStyle === 'pill'
      ? 'rounded-full'
      : theme.buttonStyle === 'square'
        ? 'rounded-none'
        : 'rounded-lg'

  return (
    <div className={`min-h-screen ${fontClass} public-profile-theme`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .public-profile-theme {
              --primary-color: ${theme.primaryColor};
              --secondary-color: ${theme.secondaryColor};
              --accent-color: ${theme.accentColor};
              background: linear-gradient(to bottom, ${theme.primaryColor}4D 0%, ${theme.secondaryColor}40 35%, ${theme.accentColor}30 65%, #ffffff 100%);
            }
            .dark .public-profile-theme {
              background: linear-gradient(to bottom, ${theme.primaryColor}4D 0%, ${theme.secondaryColor}40 35%, ${theme.accentColor}30 65%, #18181b 100%);
            }
          `,
        }}
      />
      {/* Header / Banner — taller on mobile (4:3), fixed height on desktop */}
      <div
        className={
          hasBanner
            ? 'relative w-full shrink-0 overflow-hidden aspect-[4/3] sm:aspect-auto sm:h-72 sm:max-h-72 bg-zinc-200 dark:bg-zinc-800'
            : 'h-32 sm:h-40 shrink-0'
        }
        style={
          !hasBanner
            ? { background: `linear-gradient(135deg, ${theme.primaryColor}66 0%, ${theme.secondaryColor}55 50%, ${theme.accentColor}44 100%)` }
            : undefined
        }
      >
        {hasBanner && profile?.banner_video_url && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-contain sm:object-cover"
            src={profile.banner_video_url}
          />
        )}
        {hasBanner && profile?.banner_url && !profile?.banner_video_url && (
          <img
            src={profile.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-contain sm:object-cover"
          />
        )}
      </div>

      {/* Main content — white bg on mobile so no gray gap below banner */}
      <div
        className={
          hasBanner
            ? 'max-w-2xl mx-auto px-4 pb-20 pt-0 bg-white dark:bg-zinc-900 sm:bg-transparent'
            : 'max-w-2xl mx-auto px-4 pt-12 pb-20'
        }
      >
        {/* Promotional banner */}
        {showPromoBanner && (profile?.promo_message || profile?.promo_code) && (
          <PromoBanner
            message={profile.promo_message ?? ''}
            code={profile.promo_code ?? null}
            expiresAt={profile.promo_expires_at ?? null}
          />
        )}

        {/* Profile photo - overlaps bottom of banner on all sizes */}
        <div className="flex justify-center -mt-12 mb-4 relative z-20">
          {(profile?.logo_url || business.logo_url) ? (
            <img
              src={profile?.logo_url || business.logo_url}
              alt={business.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-xl"
            />
          ) : (
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-zinc-800 shadow-xl"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {business.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Profile card - overlaps banner so no gap */}
        <div className="rounded-2xl shadow-lg -mt-16 relative z-10 overflow-hidden">
          {/* Colored top border */}
          <div
            className="h-1"
            style={{
              background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})`
            }}
          />
          {/* White card content */}
          <div className="bg-white dark:bg-zinc-900 border border-t-0 border-zinc-200 dark:border-zinc-800 rounded-b-2xl px-6 pb-6 pt-16">
            {/* Name & info */}
            <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {business.name}
            </h1>
            {profile?.tagline && (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base mb-3">
                {profile.tagline}
              </p>
            )}

            {/* Contact pills */}
            {showContact && (profile?.service_area || profile?.phone || profile?.email) && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {profile?.service_area && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                    <MapPin className="w-3 h-3" />
                    {profile.service_area}
                  </span>
                )}
                {profile?.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    {profile.phone}
                  </a>
                )}
                {profile?.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    {profile.email}
                  </a>
                )}
              </div>
            )}

            {/* Social links */}
            {hasSocial && (
              <div className="flex justify-center gap-3 mb-4">
                {profile?.instagram_url && (
                  <a
                    href={normalizeSocialUrl(profile.instagram_url, 'https://instagram.com/', '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: SOCIAL_BRAND.instagram.background, color: SOCIAL_BRAND.instagram.color }}
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {profile?.facebook_url && (
                  <a
                    href={normalizeSocialUrl(profile.facebook_url, 'https://facebook.com/', '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: SOCIAL_BRAND.facebook.backgroundColor, color: SOCIAL_BRAND.facebook.color }}
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {profile?.tiktok_url && (
                  <a
                    href={normalizeSocialUrl(profile.tiktok_url, 'https://tiktok.com/', '@')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all hover:opacity-80 dark:bg-neutral-700 dark:text-white"
                    style={{ background: SOCIAL_BRAND.tiktok.background, color: SOCIAL_BRAND.tiktok.color }}
                    aria-label="TikTok"
                  >
                    TikTok
                  </a>
                )}
                {profile?.youtube_url && (
                  <a
                    href={normalizeSocialUrl(profile.youtube_url, 'https://youtube.com/', '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: SOCIAL_BRAND.youtube.backgroundColor, color: SOCIAL_BRAND.youtube.color }}
                    aria-label="YouTube"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {profile?.twitter_url && (
                  <a
                    href={normalizeSocialUrl(profile.twitter_url, 'https://twitter.com/', '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80 dark:bg-neutral-700 dark:text-white"
                    style={{ backgroundColor: SOCIAL_BRAND.twitter.backgroundColor, color: SOCIAL_BRAND.twitter.color }}
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {profile?.google_url && (
                  <a
                    href={normalizeSocialUrl(profile.google_url, 'https://', '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80 bg-white dark:bg-neutral-800/90 shadow-sm"
                    aria-label="Google"
                  >
                    <GoogleIcon className="w-5 h-5 shrink-0" />
                  </a>
                )}
              </div>
            )}

            {/* Book Now */}
            <Link href={`/${subdomain}/book`} className="block">
              <button
                type="button"
                className={`w-full py-3 sm:py-4 text-white font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all hover:opacity-95 ${buttonClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                Book Now
              </button>
            </Link>

            {/* Customer Login */}
            <Link
              href={`/${subdomain}/dashboard`}
              className="block mt-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Already a customer? Sign in
            </Link>
          </div>
          </div>
        </div>

        {/* Tabs: Portfolio, Services, About, My Story (if set) */}
        <ProfileTabs
          profile={profile}
          services={services}
          subdomain={subdomain}
          theme={theme}
          buttonClass={buttonClass}
          lang={lang}
          businessHours={business?.business_hours ?? null}
        />
      </div>
    </div>
  )
}
