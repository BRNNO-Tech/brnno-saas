'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface ThemeCustomizerTheme {
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  button_style: string
  show_social_icons?: boolean
  show_contact_info?: boolean
}

interface ThemeCustomizerProps {
  theme: ThemeCustomizerTheme
  onChange: (theme: ThemeCustomizerTheme) => void
}

const FONTS = [
  { value: 'inter', label: 'Inter (Modern)', class: 'font-sans' },
  { value: 'serif', label: 'Serif (Classic)', class: 'font-serif' },
  { value: 'mono', label: 'Monospace (Tech)', class: 'font-mono' },
] as const

const BUTTON_STYLES = [
  { value: 'rounded', label: 'Rounded', preview: 'rounded-lg' },
  { value: 'square', label: 'Square', preview: 'rounded-none' },
  { value: 'pill', label: 'Pill', preview: 'rounded-full' },
] as const

export function ThemeCustomizer({ theme, onChange }: ThemeCustomizerProps) {
  return (
    <div className="space-y-6">
      {/* Color Pickers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Primary Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="color"
                value={theme.primary_color}
                onChange={(e) => onChange({ ...theme, primary_color: e.target.value })}
                className="w-20 h-10 cursor-pointer p-1"
              />
              <Input
                type="text"
                value={theme.primary_color}
                onChange={(e) => onChange({ ...theme, primary_color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Main brand color (buttons, links)</p>
          </div>
          <div>
            <Label>Secondary Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="color"
                value={theme.secondary_color}
                onChange={(e) => onChange({ ...theme, secondary_color: e.target.value })}
                className="w-20 h-10 cursor-pointer p-1"
              />
              <Input
                type="text"
                value={theme.secondary_color}
                onChange={(e) => onChange({ ...theme, secondary_color: e.target.value })}
                placeholder="#1E40AF"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Hover states, accents</p>
          </div>
          <div>
            <Label>Accent Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="color"
                value={theme.accent_color}
                onChange={(e) => onChange({ ...theme, accent_color: e.target.value })}
                className="w-20 h-10 cursor-pointer p-1"
              />
              <Input
                type="text"
                value={theme.accent_color}
                onChange={(e) => onChange({ ...theme, accent_color: e.target.value })}
                placeholder="#10B981"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Highlights, badges</p>
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div>
        <Label>Font Style</Label>
        <div
          role="radiogroup"
          aria-label="Font style"
          className="grid grid-cols-3 gap-4 mt-2"
        >
          {FONTS.map((font) => (
            <label
              key={font.value}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors',
                theme.font_family === font.value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
                font.class
              )}
            >
              <input
                type="radio"
                name="font_family"
                value={font.value}
                checked={theme.font_family === font.value}
                onChange={() => onChange({ ...theme, font_family: font.value })}
                className="sr-only"
              />
              <span className="text-2xl mb-2">Aa</span>
              <span className="text-sm">{font.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Button Style */}
      <div>
        <Label>Button Style</Label>
        <div
          role="radiogroup"
          aria-label="Button style"
          className="grid grid-cols-3 gap-4 mt-2"
        >
          {BUTTON_STYLES.map((style) => (
            <label
              key={style.value}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors',
                theme.button_style === style.value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              )}
            >
              <input
                type="radio"
                name="button_style"
                value={style.value}
                checked={theme.button_style === style.value}
                onChange={() => onChange({ ...theme, button_style: style.value })}
                className="sr-only"
              />
              <div className={cn('w-full h-10 bg-zinc-300 dark:bg-zinc-600 mb-2', style.preview)} />
              <span className="text-sm">{style.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Display options */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={theme.show_social_icons !== false}
            onChange={(e) =>
              onChange({ ...theme, show_social_icons: e.target.checked })
            }
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className="text-sm">Show social icons on profile</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={theme.show_contact_info !== false}
            onChange={(e) =>
              onChange({ ...theme, show_contact_info: e.target.checked })
            }
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className="text-sm">Show contact info on profile</span>
        </label>
      </div>

      {/* Preview */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            type="button"
            className={cn(
              'px-6 py-3 text-white font-semibold',
              theme.button_style === 'rounded' && 'rounded-lg',
              theme.button_style === 'pill' && 'rounded-full',
              theme.button_style === 'square' && 'rounded-none'
            )}
            style={{ backgroundColor: theme.primary_color }}
          >
            Book Now
          </button>
          <p
            className={cn(
              'text-lg',
              theme.font_family === 'inter' && 'font-sans',
              theme.font_family === 'serif' && 'font-serif',
              theme.font_family === 'mono' && 'font-mono'
            )}
          >
            This is how your text will look
          </p>
          <div className="flex gap-2">
            <span
              className="w-8 h-8 rounded-full shrink-0"
              style={{ backgroundColor: theme.primary_color }}
            />
            <span
              className="w-8 h-8 rounded-full shrink-0"
              style={{ backgroundColor: theme.secondary_color }}
            />
            <span
              className="w-8 h-8 rounded-full shrink-0"
              style={{ backgroundColor: theme.accent_color }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
