'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { INDUSTRY_CONFIGS, DEFAULT_INDUSTRY } from '@/lib/config/industry-assets'

export default function AssetDetailsForm({
  industry = DEFAULT_INDUSTRY,
  onChange
}: {
  industry?: string
  onChange: (data: any) => void
}) {
  const config = INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS[DEFAULT_INDUSTRY]
  
  const handleChange = (name: string, value: string | number | boolean) => {
    // We'll use a hidden input or just state lifting.
    // Since we are inside a <form> in the parent, we can just use input names.
    // However, to make it structured, we prefix them or rely on parent capturing form data.
    // The parent BookingForm uses FormData, so simple inputs with names will work!
    // But to namespace them into "assetDetails" JSON object in the parent's handleSubmit,
    // we might need to handle them specially or just let them be top-level and parse them out.
    
    // Actually, the parent uses FormData(e.currentTarget).
    // So if we name inputs like "asset_make", "asset_model", we can easily filter them.
  }

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
        {config.assetName} Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.fields.map((field) => (
          <div key={field.name} className={field.type === 'textarea' ? 'col-span-2' : ''}>
            <Label htmlFor={`asset_${field.name}`}>
              {field.label} {field.required && '*'}
            </Label>
            
            {field.type === 'select' ? (
              <select
                id={`asset_${field.name}`}
                name={`asset_${field.name}`}
                required={field.required}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <Input
                id={`asset_${field.name}`}
                name={`asset_${field.name}`}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

