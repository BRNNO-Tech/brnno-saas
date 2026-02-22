import React from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Instagram, Facebook, Youtube, Twitter } from 'lucide-react'

export const dynamic = 'force-dynamic'

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
    .select('id, name, subdomain, description, logo_url, booking_banner_url')
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
  params
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

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

  const hasSocial =
    (profile?.show_social_icons !== false) &&
    (profile?.instagram_url ||
      profile?.facebook_url ||
      profile?.tiktok_url ||
      profile?.youtube_url ||
      profile?.twitter_url)

  const showContact = profile?.show_contact_info !== false
  const hasBanner = !!(profile?.banner_url)

  const theme = {
    primaryColor: profile?.primary_color ?? '#3B82F6',
    secondaryColor: profile?.secondary_color ?? '#1E40AF',
    accentColor: profile?.accent_color ?? '#10B981',
    fontFamily: profile?.font_family ?? 'inter',
    buttonStyle: profile?.button_style ?? 'rounded',
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
    <div className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 ${fontClass} public-profile-theme`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .public-profile-theme {
              --primary-color: ${theme.primaryColor};
              --secondary-color: ${theme.secondaryColor};
              --accent-color: ${theme.accentColor};
            }
          `,
        }}
      />
      {/* Banner */}
      {hasBanner && (
        <div
          className="h-64 bg-cover bg-center shrink-0"
          style={{
            backgroundImage: `url(${profile.banner_url})`,
          }}
        />
      )}

      {/* Content - only use overlapping -mt when banner exists so header does not go off-screen */}
      <div
        className={
          hasBanner
            ? 'max-w-4xl mx-auto px-4 pt-0 pb-12'
            : 'max-w-4xl mx-auto px-4 py-12'
        }
      >
        {/* Header card */}
        <div
          className={
            hasBanner
              ? 'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-8 -mt-32 relative z-10'
              : 'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-8 relative z-10'
          }
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo (profile logo from Profile settings, fallback to business logo) */}
            {(profile?.logo_url || business.logo_url) ? (
              <img
                src={profile?.logo_url || business.logo_url}
                alt={business.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-lg shrink-0"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-zinc-800 shadow-lg shrink-0"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {business.name.charAt(0)}
              </div>
            )}

            {/* Business info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {business.name}
              </h1>
              {profile?.tagline && (
                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
                  {profile.tagline}
                </p>
              )}
              {showContact && (
                <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {profile?.service_area && (
                    <span className="flex items-center gap-1">
                      <span aria-hidden>📍</span>
                      {profile.service_area}
                    </span>
                  )}
                  {profile?.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-1 hover:underline transition-colors"
                      style={{ color: theme.primaryColor }}
                    >
                      <span aria-hidden>📞</span>
                      {profile.phone}
                    </a>
                  )}
                  {profile?.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-1 hover:underline transition-colors"
                      style={{ color: theme.primaryColor }}
                    >
                      <span aria-hidden>📧</span>
                      {profile.email}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* CTAs - native buttons so theme applies fully */}
            <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
              <Link href={`/${subdomain}/book`}>
                <button
                  type="button"
                  className={`w-full sm:w-auto px-6 py-3 text-white font-semibold hover:opacity-90 transition-opacity ${buttonClass}`}
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Book Now
                </button>
              </Link>
              <Link href={`/${subdomain}/dashboard`}>
                <button
                  type="button"
                  className={`w-full sm:w-auto px-6 py-3 border-2 font-semibold hover:opacity-90 transition-opacity ${buttonClass}`}
                  style={{
                    borderColor: theme.primaryColor,
                    color: theme.primaryColor,
                  }}
                >
                  Customer Login
                </button>
              </Link>
            </div>
          </div>

          {/* Social links */}
          {hasSocial && (
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4">
              {profile?.instagram_url && (
                <a
                  href={normalizeSocialUrl(
                    profile.instagram_url,
                    'https://instagram.com/',
                    ''
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:opacity-80"
                  style={{ color: theme.primaryColor }}
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {profile?.facebook_url && (
                <a
                  href={normalizeSocialUrl(
                    profile.facebook_url,
                    'https://facebook.com/',
                    ''
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:opacity-80"
                  style={{ color: theme.primaryColor }}
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {profile?.tiktok_url && (
                <a
                  href={normalizeSocialUrl(
                    profile.tiktok_url,
                    'https://tiktok.com/',
                    '@'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:opacity-80 text-sm font-medium"
                  style={{ color: theme.primaryColor }}
                  aria-label="TikTok"
                >
                  TikTok
                </a>
              )}
              {profile?.youtube_url && (
                <a
                  href={normalizeSocialUrl(
                    profile.youtube_url,
                    'https://youtube.com/',
                    ''
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:opacity-80"
                  style={{ color: theme.primaryColor }}
                  aria-label="YouTube"
                >
                  <Youtube className="w-6 h-6" />
                </a>
              )}
              {profile?.twitter_url && (
                <a
                  href={normalizeSocialUrl(
                    profile.twitter_url,
                    'https://twitter.com/',
                    ''
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:opacity-80"
                  style={{ color: theme.primaryColor }}
                  aria-label="Twitter"
                >
                  <Twitter className="w-6 h-6" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-8 mt-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              About Us
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Portfolio Gallery */}
        {Array.isArray(profile?.portfolio_photos) && profile.portfolio_photos.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-8 mt-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Our Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.portfolio_photos.map((photo: string, index: number) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={photo}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
