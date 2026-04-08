'use client'

import { useMemo, useState, useTransition } from 'react'
import imageCompression from 'browser-image-compression'
import {
  saveBusiness,
  completeOnboarding,
  setProfileLogoUrl,
  saveOnboardingProfile,
  saveOnboardingPortfolio,
} from '@/lib/actions/business'
import { createService, uploadServiceImage } from '@/lib/actions/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'

export type OnboardingWizardInitialProfile = {
  tagline: string | null
  bio: string | null
  primaryColor: string | null
  ownerStory: string | null
  logoUrl: string | null
  bannerUrl: string | null
  portfolioPhotos: string[]
}

export type OnboardingWizardBusiness = {
  id: string
  name: string
  phone: string | null
  city: string | null
  state: string | null
  email: string | null
  description: string | null
  subdomain: string | null
  initialProfile: OnboardingWizardInitialProfile
}

const STEPS = ['Business Info', 'Services', 'Branding', 'Profile', 'Portfolio', 'Done'] as const

const COMPRESS_OPT = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true } as const
const PORTFOLIO_MAX = 5

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function ProLockCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      {children}
    </div>
  )
}

export function OnboardingWizard({
  isPro,
  business,
}: {
  isPro: boolean
  business: OnboardingWizardBusiness
}) {
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [brandingPending, setBrandingPending] = useState(false)
  const [profilePending, setProfilePending] = useState(false)
  const [portfolioPending, setPortfolioPending] = useState(false)
  const [portfolioUploading, setPortfolioUploading] = useState(false)
  const [copied, setCopied] = useState<'booking' | 'profile' | null>(null)

  const [name, setName] = useState(business.name)
  const [phone, setPhone] = useState(business.phone ?? '')
  const [city, setCity] = useState(business.city ?? '')
  const [state, setState] = useState(business.state ?? '')
  const [email, setEmail] = useState(business.email ?? '')

  const [svcName, setSvcName] = useState('')
  const [svcPrice, setSvcPrice] = useState('')
  const [svcHours, setSvcHours] = useState('1')
  const [svcDescription, setSvcDescription] = useState('')
  const [svcImageUrl, setSvcImageUrl] = useState('')
  const [svcImageUploading, setSvcImageUploading] = useState(false)

  const [brandingLogoFile, setBrandingLogoFile] = useState<File | null>(null)
  const [profilePrimaryColor, setProfilePrimaryColor] = useState(
    business.initialProfile.primaryColor?.trim() || '#F2C94C'
  )

  const [profileTagline, setProfileTagline] = useState(business.initialProfile.tagline ?? '')
  const [profileBio, setProfileBio] = useState(business.initialProfile.bio ?? '')
  const [profileOwnerStory, setProfileOwnerStory] = useState(business.initialProfile.ownerStory ?? '')
  const [profileBannerFile, setProfileBannerFile] = useState<File | null>(null)

  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>(
    () => business.initialProfile.portfolioPhotos ?? []
  )

  const baseUrl = useMemo(() => {
    const sub = (business.subdomain ?? '').trim()
    if (!sub) return { profile: 'https://yoursubdomain.brnno.io', booking: 'https://yoursubdomain.brnno.io/book' }
    return {
      profile: `https://${sub}.brnno.io`,
      booking: `https://${sub}.brnno.io/book`,
    }
  }, [business.subdomain])

  const progressPct = ((step + 1) / STEPS.length) * 100

  function submitBusinessInfo(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveBusiness(
        {
          name: name.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          email: email.trim() || null,
        },
        business.id
      )
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Business info saved')
      setStep(1)
    })
  }

  function skipService() {
    setSvcImageUrl('')
    setStep(2)
  }

  async function handleServiceImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    setSvcImageUploading(true)
    try {
      const url = await uploadServiceImage(file)
      setSvcImageUrl(url)
      toast.success('Service photo uploaded')
    } catch {
      toast.error('Failed to upload service photo')
    } finally {
      setSvcImageUploading(false)
    }
  }

  function submitService(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(svcPrice)
    const hours = Number(svcHours)
    if (!svcName.trim()) {
      toast.error('Service name is required')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid price')
      return
    }
    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error('Enter a valid duration in hours')
      return
    }
    const minutes = Math.round(hours * 60)
    if (minutes < 1) {
      toast.error('Duration must be at least ~1 minute')
      return
    }
    startTransition(async () => {
      try {
        await createService({
          name: svcName.trim(),
          base_price: price,
          base_duration: minutes,
          description: svcDescription.trim() || undefined,
          image_url: svcImageUrl.trim() || undefined,
        })
        toast.success('Service created')
        setStep(2)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not create service')
      }
    })
  }

  async function continueBranding() {
    setBrandingPending(true)
    try {
      if (brandingLogoFile) {
        try {
          const compressed = await imageCompression(brandingLogoFile, COMPRESS_OPT)
          const fd = new FormData()
          fd.append('file', compressed)
          const res = await fetch('/api/upload-profile-logo', { method: 'POST', body: fd })
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}))
            toast.error((errBody as { error?: string }).error ?? 'Logo upload failed')
            return
          }
          const data = await res.json()
          const url = data.url as string
          const saved = await setProfileLogoUrl(url)
          if (!saved.success) {
            toast.error(saved.error)
            return
          }
          setBrandingLogoFile(null)
        } catch {
          toast.error('Could not process logo image')
          return
        }
      }

      if (isPro) {
        const colorResult = await saveOnboardingProfile({
          primaryColor: profilePrimaryColor.trim() || '#F2C94C',
        })
        if (!colorResult.success) {
          toast.error(colorResult.error)
          return
        }
      }

      toast.success('Branding saved')
      setStep(3)
    } finally {
      setBrandingPending(false)
    }
  }

  function skipBranding() {
    setStep(3)
  }

  async function continueProfile() {
    setProfilePending(true)
    try {
      let newBannerUrl: string | undefined

      if (isPro && profileBannerFile) {
        try {
          const compressed = await imageCompression(profileBannerFile, COMPRESS_OPT)
          const fd = new FormData()
          fd.append('file', compressed)
          const res = await fetch('/api/upload-profile-banner', { method: 'POST', body: fd })
          if (!res.ok) {
            if (res.status === 403) {
              toast.message('Profile banner is available on Pro. You can add one later in Settings.')
            } else {
              const errBody = await res.json().catch(() => ({}))
              toast.error((errBody as { error?: string }).error ?? 'Banner upload failed')
              return
            }
          } else {
            const json = await res.json()
            newBannerUrl = json.url as string
          }
        } catch {
          toast.error('Could not process banner image')
          return
        }
      }

      const result = await saveOnboardingProfile({
        tagline: profileTagline.trim() || null,
        bio: profileBio.trim() || null,
        ownerStory: profileOwnerStory.trim() || null,
        bannerUrl: newBannerUrl,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Profile saved')
      setProfileBannerFile(null)
      setStep(4)
    } finally {
      setProfilePending(false)
    }
  }

  function skipProfile() {
    setStep(4)
  }

  async function handlePortfolioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (portfolioPhotos.length >= PORTFOLIO_MAX) {
      toast.error(`You can add up to ${PORTFOLIO_MAX} photos`)
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    setPortfolioUploading(true)
    try {
      const compressed = await imageCompression(file, COMPRESS_OPT)
      const fd = new FormData()
      fd.append('file', compressed)
      const res = await fetch('/api/upload-profile-portfolio-photo', { method: 'POST', body: fd })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        toast.error((errBody as { error?: string }).error ?? 'Upload failed')
        return
      }
      const { url } = (await res.json()) as { url: string }
      setPortfolioPhotos((prev) => [...prev, url].slice(0, PORTFOLIO_MAX))
      toast.success('Photo added')
    } catch {
      toast.error('Could not upload photo')
    } finally {
      setPortfolioUploading(false)
    }
  }

  function removePortfolioPhoto(index: number) {
    setPortfolioPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function continuePortfolio() {
    setPortfolioPending(true)
    try {
      const result = await saveOnboardingPortfolio(portfolioPhotos)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Portfolio saved')
      setStep(5)
    } finally {
      setPortfolioPending(false)
    }
  }

  function skipPortfolio() {
    setStep(5)
  }

  function copyBooking() {
    void navigator.clipboard.writeText(baseUrl.booking).then(() => {
      setCopied('booking')
      toast.success('Booking link copied')
      setTimeout(() => setCopied((c) => (c === 'booking' ? null : c)), 2000)
    })
  }

  function copyProfile() {
    void navigator.clipboard.writeText(baseUrl.profile).then(() => {
      setCopied('profile')
      toast.success('Profile link copied')
      setTimeout(() => setCopied((c) => (c === 'profile' ? null : c)), 2000)
    })
  }

  const fieldClass =
    'border-[var(--dash-border)] bg-[var(--dash-black)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-dim)] focus-visible:ring-[var(--dash-amber)]'

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <p className="font-dash-mono text-[10px] uppercase tracking-widest text-[var(--dash-text-dim)] mb-2">
          Setup
        </p>
        <h1 className="font-dash-condensed text-2xl font-bold uppercase tracking-wide text-[var(--dash-text)]">
          Get your booking page ready
        </h1>
        <div className="mt-4 h-1.5 w-full rounded-full bg-[var(--dash-surface)] overflow-hidden border border-[var(--dash-border)]">
          <div
            className="h-full rounded-full bg-[var(--dash-amber)] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-1 font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-text-dim)]">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={cn(
                i === step && 'text-[var(--dash-amber)] font-semibold',
                i < step && 'text-[var(--dash-text)]'
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-6 shadow-lg shadow-black/20">
        {step === 0 && (
          <form onSubmit={submitBusinessInfo} className="space-y-4">
            <h2 className="font-dash-condensed text-lg font-bold uppercase text-[var(--dash-text)]">
              Business info
            </h2>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Business name
              </Label>
              <Input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Phone
              </Label>
              <Input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                  City
                </Label>
                <Input className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                  State
                </Label>
                <Input className={fieldClass} value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Business email (optional)
              </Label>
              <Input
                type="email"
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-[var(--dash-amber)] text-[var(--dash-graphite)] font-dash-condensed font-bold uppercase tracking-wider hover:opacity-90"
            >
              {pending ? 'Saving…' : 'Continue'}
            </Button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={submitService} className="space-y-4">
            <h2 className="font-dash-condensed text-lg font-bold uppercase text-[var(--dash-text)]">
              First service
            </h2>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Service name
              </Label>
              <Input className={fieldClass} value={svcName} onChange={(e) => setSvcName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                  Price ($)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className={fieldClass}
                  value={svcPrice}
                  onChange={(e) => setSvcPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                  Duration (hours)
                </Label>
                <Input
                  type="number"
                  min={0.25}
                  step={0.25}
                  className={fieldClass}
                  value={svcHours}
                  onChange={(e) => setSvcHours(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Description (optional)
              </Label>
              <Input className={fieldClass} value={svcDescription} onChange={(e) => setSvcDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Service photo (optional)
              </Label>
              <p className="text-xs text-[var(--dash-text-dim)]">
                Shown on your public booking page service card.
              </p>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                disabled={svcImageUploading || pending}
                className={cn(fieldClass, 'cursor-pointer text-sm')}
                onChange={(e) => void handleServiceImageChange(e)}
              />
              {svcImageUploading && (
                <p className="text-xs font-dash-mono text-[var(--dash-text-dim)]">Uploading…</p>
              )}
              {svcImageUrl ? (
                <div className="mt-2 rounded-md border border-[var(--dash-border)] overflow-hidden max-w-[200px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={svcImageUrl} alt="" className="w-full h-28 object-cover" />
                </div>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={pending || svcImageUploading}
              className="w-full bg-[var(--dash-amber)] text-[var(--dash-graphite)] font-dash-condensed font-bold uppercase tracking-wider hover:opacity-90"
            >
              {pending ? 'Saving…' : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={skipService}
              className="block w-full text-center font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)] underline hover:text-[var(--dash-amber)]"
            >
              Skip for now
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-dash-condensed text-lg font-bold uppercase text-[var(--dash-text)]">Branding</h2>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Logo
              </Label>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                disabled={brandingPending}
                className={cn(fieldClass, 'cursor-pointer text-sm')}
                onChange={(e) => setBrandingLogoFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Primary color
              </Label>
              {isPro ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded border border-[var(--dash-border)] bg-transparent"
                    value={profilePrimaryColor}
                    onChange={(e) => setProfilePrimaryColor(e.target.value)}
                    disabled={brandingPending}
                  />
                  <span className="font-dash-mono text-xs text-[var(--dash-text-dim)]">{profilePrimaryColor}</span>
                </div>
              ) : (
                <ProLockCard>
                  🔒 Custom brand colors are available on Pro.{' '}
                  <a href="/dashboard/billing" className="underline">
                    Upgrade →
                  </a>
                </ProLockCard>
              )}
            </div>
            <Button
              type="button"
              onClick={() => void continueBranding()}
              disabled={brandingPending}
              className="w-full bg-[var(--dash-amber)] text-[var(--dash-graphite)] font-dash-condensed font-bold uppercase tracking-wider hover:opacity-90"
            >
              {brandingPending ? 'Saving…' : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={skipBranding}
              disabled={brandingPending}
              className="block w-full text-center font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)] underline hover:text-[var(--dash-amber)]"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-dash-condensed text-lg font-bold uppercase text-[var(--dash-text)]">Profile page</h2>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Banner
              </Label>
              {isPro ? (
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  disabled={profilePending}
                  className={cn(fieldClass, 'cursor-pointer text-sm')}
                  onChange={(e) => setProfileBannerFile(e.target.files?.[0] ?? null)}
                />
              ) : (
                <ProLockCard>
                  🔒 Custom profile banners are available on Pro.{' '}
                  <a href="/dashboard/billing" className="underline">
                    Upgrade →
                  </a>
                </ProLockCard>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Tagline
              </Label>
              <Input
                className={fieldClass}
                placeholder="e.g. Professional mobile detailing brought to your door"
                value={profileTagline}
                onChange={(e) => setProfileTagline(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Bio / About
              </Label>
              <Textarea
                className={cn(fieldClass, 'min-h-[80px] resize-y')}
                placeholder="Tell customers about your business..."
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                My story (optional)
              </Label>
              <Textarea
                className={cn(fieldClass, 'min-h-[100px] resize-y')}
                placeholder="Share your journey…"
                value={profileOwnerStory}
                onChange={(e) => setProfileOwnerStory(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={() => void continueProfile()}
              disabled={profilePending}
              className="w-full bg-[var(--dash-amber)] text-[var(--dash-graphite)] font-dash-condensed font-bold uppercase tracking-wider hover:opacity-90"
            >
              {profilePending ? 'Saving…' : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={skipProfile}
              disabled={profilePending}
              className="block w-full text-center font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)] underline hover:text-[var(--dash-amber)]"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-dash-condensed text-lg font-bold uppercase text-[var(--dash-text)]">Portfolio</h2>
            <p className="text-sm text-[var(--dash-text-dim)]">Add a few photos of your work</p>
            <div className="space-y-1.5">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                Photos ({portfolioPhotos.length}/{PORTFOLIO_MAX})
              </Label>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                disabled={portfolioUploading || portfolioPending || portfolioPhotos.length >= PORTFOLIO_MAX}
                className={cn(fieldClass, 'cursor-pointer text-sm')}
                onChange={(e) => void handlePortfolioFile(e)}
              />
              {portfolioUploading && (
                <p className="text-xs font-dash-mono text-[var(--dash-text-dim)]">Uploading…</p>
              )}
            </div>
            {portfolioPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {portfolioPhotos.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative aspect-square overflow-hidden rounded-md border border-[var(--dash-border)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePortfolioPhoto(idx)}
                      disabled={portfolioPending || portfolioUploading}
                      className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-dash-mono text-[10px] uppercase text-white hover:bg-black"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              onClick={() => void continuePortfolio()}
              disabled={portfolioPending || portfolioUploading}
              className="w-full bg-[var(--dash-amber)] text-[var(--dash-graphite)] font-dash-condensed font-bold uppercase tracking-wider hover:opacity-90"
            >
              {portfolioPending ? 'Saving…' : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={skipPortfolio}
              disabled={portfolioPending || portfolioUploading}
              className="block w-full text-center font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)] underline hover:text-[var(--dash-amber)]"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="font-dash-condensed text-xl font-bold uppercase text-[var(--dash-text)] text-center">
              You&apos;re all set!
            </h2>
            <div className="space-y-3 text-left">
              <div>
                <p className="mb-1 font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                  Booking link
                </p>
                <div className="rounded-md border border-[var(--dash-border)] bg-[var(--dash-black)] px-3 py-2 font-dash-mono text-xs text-[var(--dash-text)] break-all">
                  {baseUrl.booking}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={copyBooking}
                className="w-full border-[var(--dash-border)] bg-transparent font-dash-condensed uppercase tracking-wider text-[var(--dash-text)] hover:bg-[var(--dash-surface)]"
              >
                {copied === 'booking' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === 'booking' ? 'Copied' : 'Copy booking link'}
              </Button>
              <div>
                <p className="mb-1 font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
                  Profile link
                </p>
                <div className="rounded-md border border-[var(--dash-border)] bg-[var(--dash-black)] px-3 py-2 font-dash-mono text-xs text-[var(--dash-text)] break-all">
                  {baseUrl.profile}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={copyProfile}
                className="w-full border-[var(--dash-border)] bg-transparent font-dash-condensed uppercase tracking-wider text-[var(--dash-text)] hover:bg-[var(--dash-surface)]"
              >
                {copied === 'profile' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === 'profile' ? 'Copied' : 'Copy profile link'}
              </Button>
            </div>
            <form action={completeOnboarding} className="w-full">
              <Button
                type="submit"
                className="w-full bg-[var(--dash-amber)] text-[var(--dash-graphite)] font-dash-condensed font-bold uppercase tracking-wider hover:opacity-90"
              >
                Go to Dashboard
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
