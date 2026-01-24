'use client'

import { useState } from 'react'

interface Step2Props {
  formData: {
    businessName: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
  }
  onUpdate: (data: Partial<Step2Props['formData']>) => void
  onNext: () => void
  onBack: () => void
}

export default function Step2Business({ formData, onUpdate, onNext, onBack }: Step2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    // Address fields are optional but nice to have
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Tell us about your business
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Step 2 of 3: Business Information
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="businessName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Business name <span className="text-red-500">*</span>
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            value={formData.businessName}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            className={`mt-1 block w-full rounded-md border ${
              errors.businessName ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-600'
            } bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm`}
            placeholder="Acme Cleaning Services"
          />
          {errors.businessName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.businessName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Phone number <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className={`mt-1 block w-full rounded-md border ${
              errors.phone ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-600'
            } bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm`}
            placeholder="(555) 123-4567"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Street address (optional)
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label
              htmlFor="city"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              City (optional)
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={(e) => onUpdate({ city: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm"
              placeholder="New York"
            />
          </div>

          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              State
            </label>
            <input
              id="state"
              name="state"
              type="text"
              maxLength={2}
              value={formData.state}
              onChange={(e) => onUpdate({ state: e.target.value.toUpperCase() })}
              className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm"
              placeholder="NY"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="zip"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            ZIP code (optional)
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            value={formData.zip}
            onChange={(e) => onUpdate({ zip: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm"
            placeholder="10001"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 flex justify-center rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 flex justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

