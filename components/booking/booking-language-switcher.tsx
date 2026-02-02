'use client'

type Lang = 'en' | 'es'

type Props = {
  subdomain: string
  path?: string
  query?: Record<string, string>
  lang: Lang
}

export function BookingLanguageSwitcher({ subdomain, path = '', query = {}, lang }: Props) {
  const nextLang: Lang = lang === 'en' ? 'es' : 'en'
  const q = { ...query }
  if (nextLang === 'es') q.lang = 'es'
  else delete q.lang
  const params = new URLSearchParams(q)
  const href = `/${subdomain}${path}${params.toString() ? `?${params.toString()}` : ''}`

  return (
    <a
      href={href}
      className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-md transition-colors inline-block"
    >
      {lang === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
    </a>
  )
}
