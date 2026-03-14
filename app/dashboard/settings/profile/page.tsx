'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ThemeCustomizer, type ThemeCustomizerTheme } from '@/components/dashboard/theme-customizer'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_THEME: ThemeCustomizerTheme = {
  primary_color: '#3B82F6',
  secondary_color: '#1E40AF',
  accent_color: '#10B981',
  font_family: 'inter',
  button_style: 'rounded',
  show_social_icons: true,
  show_contact_info: true,
}

export default function BusinessProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState<{ id: string; name: string; subdomain: string; billing_plan?: string | null } | null>(null)
  const [profile, setProfile] = useState({
    tagline: '',
    bio: '',
    phone: '',
    email: '',
    service_area: '',
    logo_url: '',
    banner_url: '',
    banner_video_url: '',
    portfolio_photos: [] as string[],
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
    youtube_url: '',
    twitter_url: '',
    google_url: '',
    promo_enabled: false,
    promo_message: '',
    promo_code: '',
    promo_expires_at: null as string | null,
    owner_photo_url: '',
    owner_name: '',
    owner_story: '',
    years_experience: null as number | null,
  })
  const [theme, setTheme] = useState<ThemeCustomizerTheme>(DEFAULT_THEME)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerVideoUploading, setBannerVideoUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [ownerPhotoUploading, setOwnerPhotoUploading] = useState(false)
  const [portfolioUploading, setPortfolioUploading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: businessData } = await supabase
      .from('businesses')
      .select('id, name, subdomain, billing_plan')
      .eq('owner_id', user.id)
      .single()

    if (!businessData) {
      setLoading(false)
      return
    }
    setBusiness(businessData)

    let { data: profileData } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('business_id', businessData.id)
      .single()

    if (!profileData) {
      const { data: newProfile } = await supabase
        .from('business_profiles')
        .insert({ business_id: businessData.id })
        .select()
        .single()

      profileData = newProfile
    }

    if (profileData) {
      setProfile({
        tagline: profileData.tagline ?? '',
        bio: profileData.bio ?? '',
        phone: profileData.phone ?? '',
        email: profileData.email ?? '',
        service_area: profileData.service_area ?? '',
        logo_url: profileData.logo_url ?? '',
        banner_url: profileData.banner_url ?? '',
        banner_video_url: profileData.banner_video_url ?? '',
        portfolio_photos: Array.isArray(profileData.portfolio_photos) ? profileData.portfolio_photos : [],
        instagram_url: profileData.instagram_url ?? '',
        facebook_url: profileData.facebook_url ?? '',
        tiktok_url: profileData.tiktok_url ?? '',
        youtube_url: profileData.youtube_url ?? '',
        twitter_url: profileData.twitter_url ?? '',
        google_url: profileData.google_url ?? '',
        promo_enabled: profileData.promo_enabled ?? false,
        promo_message: profileData.promo_message ?? '',
        promo_code: profileData.promo_code ?? '',
        promo_expires_at: profileData.promo_expires_at
          ? profileData.promo_expires_at.slice(0, 10)
          : null,
        owner_photo_url: profileData.owner_photo_url ?? '',
        owner_name: profileData.owner_name ?? '',
        owner_story: profileData.owner_story ?? '',
        years_experience: profileData.years_experience ?? null,
      })
      setTheme({
        primary_color: profileData.primary_color ?? DEFAULT_THEME.primary_color,
        secondary_color: profileData.secondary_color ?? DEFAULT_THEME.secondary_color,
        accent_color: profileData.accent_color ?? DEFAULT_THEME.accent_color,
        font_family: profileData.font_family ?? DEFAULT_THEME.font_family,
        button_style: profileData.button_style ?? DEFAULT_THEME.button_style,
        show_social_icons: profileData.show_social_icons ?? DEFAULT_THEME.show_social_icons,
        show_contact_info: profileData.show_contact_info ?? DEFAULT_THEME.show_contact_info,
      })
    }

    setLoading(false)
  }

  const handleSave = async () => {
    if (!business) return

    setSaving(true)

    const payload: Record<string, unknown> = {
      business_id: business.id,
      ...profile,
      ...theme,
    }
    if (payload.promo_expires_at === '' || payload.promo_expires_at == null) {
      payload.promo_expires_at = null
    } else if (typeof payload.promo_expires_at === 'string' && payload.promo_expires_at.length === 10) {
      payload.promo_expires_at = `${payload.promo_expires_at}T23:59:59.000Z`
    }
    if (payload.years_experience === '' || payload.years_experience == null) {
      payload.years_experience = null
    } else {
      const n = Number(payload.years_experience)
      payload.years_experience = Number.isInteger(n) && n >= 0 ? n : null
    }
    if (business.billing_plan !== 'pro') {
      payload.banner_url = null
      payload.banner_video_url = null
      payload.primary_color = DEFAULT_THEME.primary_color
      payload.secondary_color = DEFAULT_THEME.secondary_color
      payload.accent_color = DEFAULT_THEME.accent_color
      payload.font_family = DEFAULT_THEME.font_family
      payload.button_style = DEFAULT_THEME.button_style
    }

    const { error } = await supabase
      .from('business_profiles')
      .upsert(payload, { onConflict: 'business_id' })

    if (error) {
      const msg = error.message || (error as unknown as { details?: string }).details || 'Unknown error'
      console.error('Error saving profile:', error.code, msg, error)
      toast.error(`Failed to save profile: ${msg}`)
    } else {
      toast.success('Profile saved successfully')
      await fetchData()
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!business) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 max-w-md">
          <p className="text-sm text-[var(--dash-text-muted)] mb-3">
          Upgrade to Pro to edit your public profile, branding, and theme.
          </p>
          <Link href="/dashboard/settings/subscription">
            <Button variant="outline" size="sm">Upgrade to Pro</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto text-[var(--dash-text)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--dash-text)]">Business Profile</h1>
        <p className="text-[var(--dash-text-muted)]">
          Preview your public profile at{' '}
          <a
            href={`/${business.subdomain}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            /{business.subdomain}
          </a>
        </p>
      </div>

      <div className="space-y-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow p-6 text-zinc-900 dark:text-zinc-100">
        {/* Profile logo (public page; shown next to business name) */}
        {business && (
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <h2 className="text-xl font-semibold mb-4">Profile logo</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              Shown on your public profile (/{business.subdomain}) next to your business name.
            </p>
            {profile.logo_url ? (
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 shrink-0">
                  <img
                    src={profile.logo_url}
                    alt="Profile logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    Replace
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={logoUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setLogoUploading(true)
                        e.target.value = ''
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          const res = await fetch('/api/upload-profile-logo', { method: 'POST', body: formData })
                          if (!res.ok) {
                            const data = await res.json()
                            throw new Error(data.error || 'Upload failed')
                          }
                          const data = await res.json()
                          setProfile((p) => ({ ...p, logo_url: data.url }))
                          toast.success('Logo updated')
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Failed to upload logo')
                        } finally {
                          setLogoUploading(false)
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, logo_url: '' }))}
                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  id="profile-logo-input"
                  className="hidden"
                  disabled={logoUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setLogoUploading(true)
                    e.target.value = ''
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      const res = await fetch('/api/upload-profile-logo', { method: 'POST', body: formData })
                      if (!res.ok) {
                        const data = await res.json()
                        throw new Error(data.error || 'Upload failed')
                      }
                      const data = await res.json()
                      setProfile((p) => ({ ...p, logo_url: data.url }))
                      toast.success('Logo uploaded')
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to upload logo')
                    } finally {
                      setLogoUploading(false)
                    }
                  }}
                />
                <label
                  htmlFor="profile-logo-input"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
                >
                  {logoUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload logo
                    </>
                  )}
                </label>
                <p className="text-xs text-zinc-500 mt-2">Max 10MB. JPG, PNG, WebP, or GIF. Square works best.</p>
              </div>
            )}
          </div>
        )}

        {/* Profile banner (public page hero only; booking page uses Brand → Booking banner) — Pro only */}
        {business && (
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <h2 className="text-xl font-semibold mb-4">Profile banner</h2>
            {business.billing_plan !== 'pro' ? (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Custom profile and booking banners are available on Pro. Your logo is always shown.
                </p>
                <Link href="/dashboard/settings/subscription">
                  <Button variant="outline" size="sm">Upgrade to Pro</Button>
                </Link>
              </div>
            ) : (
              <>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              Shown at the top of your public profile (/{business.subdomain}). Use Settings → Brand for the booking page banner. Choose <strong>image</strong> or <strong>video</strong> (one at a time).
            </p>
            {profile.banner_video_url ? (
              <div className="relative inline-block">
                <div className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-video">
                  <video src={profile.banner_video_url} className="w-full h-full object-cover" muted playsInline />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    Replace video
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      disabled={bannerVideoUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setBannerVideoUploading(true)
                        e.target.value = ''
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          const res = await fetch('/api/upload-profile-banner-video', { method: 'POST', body: formData })
                          if (!res.ok) {
                            const data = await res.json()
                            throw new Error(data.error || 'Upload failed')
                          }
                          const data = await res.json()
                          setProfile((p) => ({ ...p, banner_video_url: data.url, banner_url: '' }))
                          toast.success('Banner video updated')
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Failed to upload video')
                        } finally {
                          setBannerVideoUploading(false)
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, banner_video_url: '' }))}
                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <X className="w-4 h-4" />
                    Remove video
                  </button>
                </div>
              </div>
            ) : profile.banner_url ? (
              <div className="relative inline-block">
                <div className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-video">
                  <img
                    src={profile.banner_url}
                    alt="Profile banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    Replace image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={bannerUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setBannerUploading(true)
                        e.target.value = ''
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          const res = await fetch('/api/upload-profile-banner', { method: 'POST', body: formData })
                          if (!res.ok) {
                            const data = await res.json()
                            throw new Error(data.error || 'Upload failed')
                          }
                          const data = await res.json()
                          setProfile((p) => ({ ...p, banner_url: data.url, banner_video_url: '' }))
                          toast.success('Banner updated')
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Failed to upload banner')
                        } finally {
                          setBannerUploading(false)
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, banner_url: '' }))}
                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <X className="w-4 h-4" />
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 items-start">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  id="profile-banner-input"
                  className="hidden"
                  disabled={bannerUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setBannerUploading(true)
                    e.target.value = ''
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      const res = await fetch('/api/upload-profile-banner', { method: 'POST', body: formData })
                      if (!res.ok) {
                        const data = await res.json()
                        throw new Error(data.error || 'Upload failed')
                      }
                      const data = await res.json()
                      setProfile((p) => ({ ...p, banner_url: data.url, banner_video_url: '' }))
                      toast.success('Banner uploaded')
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to upload banner')
                    } finally {
                      setBannerUploading(false)
                    }
                  }}
                />
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  id="profile-banner-video-input"
                  className="hidden"
                  disabled={bannerVideoUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setBannerVideoUploading(true)
                    e.target.value = ''
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      const res = await fetch('/api/upload-profile-banner-video', { method: 'POST', body: formData })
                      if (!res.ok) {
                        const data = await res.json()
                        throw new Error(data.error || 'Upload failed')
                      }
                      const data = await res.json()
                      setProfile((p) => ({ ...p, banner_video_url: data.url, banner_url: '' }))
                      toast.success('Banner video uploaded')
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to upload video')
                    } finally {
                      setBannerVideoUploading(false)
                    }
                  }}
                />
                <label
                  htmlFor="profile-banner-input"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
                >
                  {bannerUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload banner image
                    </>
                  )}
                </label>
                <label
                  htmlFor="profile-banner-video-input"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
                >
                  {bannerVideoUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload banner video
                    </>
                  )}
                </label>
                <p className="text-xs text-zinc-500 mt-2 w-full">Image: max 10MB. Video: max 25MB, MP4 or WebM (~8s). One at a time.</p>
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* Promotional Banner */}
        {business && (
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <h2 className="text-xl font-semibold mb-4">Promotional Banner</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Show a promotional strip on your public profile (between the hero and your profile card). Great for limited-time offers.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="promo-enabled"
                  checked={profile.promo_enabled}
                  onChange={(e) => setProfile({ ...profile, promo_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="promo-enabled" className="cursor-pointer">Enable promotional banner</Label>
              </div>
              {profile.promo_enabled && (
                <>
                  <div>
                    <Label>Promo message</Label>
                    <Input
                      value={profile.promo_message}
                      onChange={(e) => setProfile({ ...profile, promo_message: e.target.value })}
                      placeholder="e.g. 20% off your first detail!"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Promo code</Label>
                    <Input
                      value={profile.promo_code}
                      onChange={(e) => setProfile({ ...profile, promo_code: e.target.value })}
                      placeholder="e.g. WELCOME20"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Expiry date (optional)</Label>
                    <Input
                      type="date"
                      value={profile.promo_expires_at ?? ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          promo_expires_at: e.target.value ? e.target.value : null,
                        })
                      }
                      className="mt-2"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Leave empty for no expiry. Shown as &quot;Offer ends [date]&quot; when set.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* My Story */}
        {business && (
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <h2 className="text-xl font-semibold mb-4">My Story</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Optional personal section on your public profile — headshot, name, and a short story so customers get to know you.
            </p>
            <div className="space-y-4">
              <div>
                <Label>Owner headshot</Label>
                {profile.owner_photo_url ? (
                  <div className="flex items-start gap-4 mt-2">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 shrink-0">
                      <img
                        src={profile.owner_photo_url}
                        alt="Owner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50">
                        <Upload className="w-4 h-4" />
                        Replace
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={ownerPhotoUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setOwnerPhotoUploading(true)
                            e.target.value = ''
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              const res = await fetch('/api/upload-profile-owner-photo', { method: 'POST', body: formData })
                              if (!res.ok) {
                                const data = await res.json()
                                throw new Error(data.error || 'Upload failed')
                              }
                              const data = await res.json()
                              setProfile((p) => ({ ...p, owner_photo_url: data.url }))
                              toast.success('Photo updated')
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Failed to upload photo')
                            } finally {
                              setOwnerPhotoUploading(false)
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setProfile((p) => ({ ...p, owner_photo_url: '' }))}
                        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      id="owner-photo-input"
                      className="hidden"
                      disabled={ownerPhotoUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setOwnerPhotoUploading(true)
                        e.target.value = ''
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          const res = await fetch('/api/upload-profile-owner-photo', { method: 'POST', body: formData })
                          if (!res.ok) {
                            const data = await res.json()
                            throw new Error(data.error || 'Upload failed')
                          }
                          const data = await res.json()
                          setProfile((p) => ({ ...p, owner_photo_url: data.url }))
                          toast.success('Photo uploaded')
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Failed to upload photo')
                        } finally {
                          setOwnerPhotoUploading(false)
                        }
                      }}
                    />
                    <label
                      htmlFor="owner-photo-input"
                      className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {ownerPhotoUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload headshot
                        </>
                      )}
                    </label>
                    <p className="text-xs text-zinc-500 mt-2">Max 10MB. JPG, PNG, WebP, or GIF. Square works best.</p>
                  </div>
                )}
              </div>
              <div>
                <Label>Owner name</Label>
                <Input
                  value={profile.owner_name}
                  onChange={(e) => setProfile({ ...profile, owner_name: e.target.value })}
                  placeholder="e.g. Hi, I'm Jake"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Your story</Label>
                <Textarea
                  value={profile.owner_story}
                  onChange={(e) => setProfile({ ...profile, owner_story: e.target.value })}
                  placeholder="e.g. I started detailing in 2018..."
                  rows={4}
                  maxLength={800}
                  className="mt-2"
                />
                <p className="text-xs text-zinc-500 mt-1">{profile.owner_story.length}/800 characters</p>
              </div>
              <div>
                <Label>Years of experience (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={profile.years_experience ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setProfile({
                      ...profile,
                      years_experience: v === '' ? null : Math.min(99, Math.max(0, parseInt(v, 10) || 0)),
                    })
                  }}
                  placeholder="e.g. 7"
                  className="mt-2 w-24"
                />
              </div>
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h2 className="text-xl font-semibold mb-4">About Your Business</h2>

          <div className="space-y-4">
            <div>
              <Label>Tagline</Label>
              <Input
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                placeholder="Mobile detailing that comes to you"
                maxLength={100}
                className="mt-2"
              />
              <p className="text-xs text-zinc-500 mt-1">
                A short catchy phrase (shown below your business name)
              </p>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell customers about your business, services, and what makes you special..."
                rows={4}
                maxLength={500}
                className="mt-2"
              />
              <p className="text-xs text-zinc-500 mt-1">
                {profile.bio.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(415) 555-1234"
                type="tel"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="contact@yourbusiness.com"
                type="email"
                className="mt-2"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Service Area</Label>
            <Input
              value={profile.service_area}
              onChange={(e) => setProfile({ ...profile, service_area: e.target.value })}
              placeholder="San Francisco Bay Area"
              className="mt-2"
            />
          </div>
        </div>

        {/* Social Links Section */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h2 className="text-xl font-semibold mb-4">Social Media</h2>

          <div className="space-y-4">
            <div>
              <Label>Instagram</Label>
              <Input
                value={profile.instagram_url}
                onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                placeholder="https://instagram.com/yourbusiness or @yourbusiness"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Facebook</Label>
              <Input
                value={profile.facebook_url}
                onChange={(e) => setProfile({ ...profile, facebook_url: e.target.value })}
                placeholder="https://facebook.com/yourbusiness"
                className="mt-2"
              />
            </div>

            <div>
              <Label>TikTok</Label>
              <Input
                value={profile.tiktok_url}
                onChange={(e) => setProfile({ ...profile, tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@yourbusiness or @yourbusiness"
                className="mt-2"
              />
            </div>

            <div>
              <Label>YouTube</Label>
              <Input
                value={profile.youtube_url}
                onChange={(e) => setProfile({ ...profile, youtube_url: e.target.value })}
                placeholder="https://youtube.com/@yourbusiness"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Twitter/X</Label>
              <Input
                value={profile.twitter_url}
                onChange={(e) => setProfile({ ...profile, twitter_url: e.target.value })}
                placeholder="https://twitter.com/yourbusiness or @yourbusiness"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Google</Label>
              <Input
                value={profile.google_url}
                onChange={(e) => setProfile({ ...profile, google_url: e.target.value })}
                placeholder="Google Business or Maps link (e.g. https://g.page/yourbusiness)"
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Branding & Theme — Pro only */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h2 className="text-xl font-semibold mb-4">Branding & Theme</h2>
          {business && business.billing_plan !== 'pro' ? (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                Color theme and branding are available on Pro. Your logo is always shown.
              </p>
              <Link href="/dashboard/settings/subscription">
                <Button variant="outline" size="sm">Upgrade to Pro</Button>
              </Link>
            </div>
          ) : (
            <ThemeCustomizer theme={theme} onChange={setTheme} />
          )}
        </div>

        {/* Portfolio Section (upload via API to business-portfolios) */}
        {business && (
          <div className="pb-6">
            <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Upload before/after photos, your best work, or examples of services you provide
            </p>
            {Array.isArray(profile.portfolio_photos) && profile.portfolio_photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {profile.portfolio_photos.map((url, index) => (
                  <div key={url} className="relative group">
                    <img
                      src={url}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border-2 border-zinc-200 dark:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProfile((p) => ({
                          ...p,
                          portfolio_photos: p.portfolio_photos.filter((u) => u !== url),
                        }))
                      }
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {profile.portfolio_photos.length < 20 && (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  id="profile-portfolio-input"
                  className="hidden"
                  disabled={portfolioUploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    if (!files.length) return
                    const current = profile.portfolio_photos
                    if (current.length + files.length > 20) {
                      toast.error(`Maximum 20 photos allowed (${current.length} already)`)
                      return
                    }
                    setPortfolioUploading(true)
                    e.target.value = ''
                    const uploaded: string[] = []
                    try {
                      for (const file of files) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error(`${file.name} is too large (max 5MB)`)
                          continue
                        }
                        const formData = new FormData()
                        formData.append('file', file)
                        const res = await fetch('/api/upload-profile-portfolio-photo', {
                          method: 'POST',
                          body: formData,
                        })
                        if (!res.ok) {
                          const data = await res.json()
                          toast.error(data.error || `Failed to upload ${file.name}`)
                          continue
                        }
                        const data = await res.json()
                        uploaded.push(data.url)
                      }
                      if (uploaded.length > 0) {
                        setProfile((p) => ({
                          ...p,
                          portfolio_photos: [...p.portfolio_photos, ...uploaded],
                        }))
                        toast.success(`Uploaded ${uploaded.length} photo(s)`)
                      }
                    } finally {
                      setPortfolioUploading(false)
                    }
                  }}
                />
                <label
                  htmlFor="profile-portfolio-input"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
                >
                  {portfolioUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload />
                      Upload photos ({profile.portfolio_photos.length}/20)
                    </>
                  )}
                </label>
                <p className="text-xs text-zinc-500 mt-2">
                  Max 5MB per image. JPG, PNG, WebP, or GIF. ({20 - profile.portfolio_photos.length} remaining)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-inherit">
          <Link href="/dashboard/settings">
            <Button variant="outline">Back to Settings</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  )
}
