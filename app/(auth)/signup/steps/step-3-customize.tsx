'use client'

import { useState, useEffect } from 'react'

interface Step3Props {
  formData: {
    subdomain: string
    description: string
  }
  businessName: string
  onUpdate: (data: Partial<Step3Props['formData']>) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
}

export default function Step3Customize({
  formData,
  businessName,
  onUpdate,
  onSubmit,
  onBack,
  loading,
}: Step3Props) {
  const [subdomainSuggestion, setSubdomainSuggestion] = useState('')

  useEffect(() => {
    // Generate subdomain suggestion from business name
    if (businessName && !formData.subdomain) {
      const suggestion = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30)
      setSubdomainSuggestion(suggestion)
      onUpdate({ subdomain: suggestion })
    }
  }, [businessName])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Customize your presence
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Step 3 of 4: Optional Settings (you can skip this)
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="subdomain"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Booking page URL
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3 text-zinc-500 dark:text-zinc-400 sm:text-sm">
              https://
            </span>
            <input
              id="subdomain"
              name="subdomain"
              type="text"
              value={formData.subdomain}
              onChange={(e) =>
                onUpdate({
                  subdomain: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '')
                    .substring(0, 30),
                })
              }
              className="block w-full min-w-0 flex-1 rounded-none border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 sm:text-sm"
              placeholder={subdomainSuggestion}
            />
            <span className="inline-flex items-center rounded-r-md border border-l-0 border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3 text-zinc-500 dark:text-zinc-400 sm:text-sm">
              .brnno.com
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            This will be your custom booking page URL that you can share with clients
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Business description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm"
            placeholder="Tell customers about your business..."
          />
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> You can always customize these settings later in your
            dashboard settings.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 flex justify-center rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 flex justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Complete signup'}
        </button>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="w-full text-center text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
      >
        Skip and finish later
      </button>
    </div>
  )
}

