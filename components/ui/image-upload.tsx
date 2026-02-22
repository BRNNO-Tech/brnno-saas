'use client'

import { useState, useId, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, ImageOff } from 'lucide-react'
import { toast } from 'sonner'

/** Extract storage path from a Supabase public URL for the given bucket */
function getStoragePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`
  const i = publicUrl.indexOf(marker)
  if (i === -1) return null
  const path = publicUrl.slice(i + marker.length)
  return path ? decodeURIComponent(path) : null
}

interface ImageUploadProps {
  bucket: 'business-logos' | 'business-banners' | 'business-portfolios'
  businessId: string
  currentUrl?: string
  onUploadComplete: (url: string) => void
  onRemove?: () => void
  maxSizeMB?: number
  label?: string
  aspectRatio?: string
}

export function ImageUpload({
  bucket,
  businessId,
  currentUrl,
  onUploadComplete,
  onRemove,
  maxSizeMB = 5,
  label,
  aspectRatio,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '')
  const [loadError, setLoadError] = useState(false)
  const inputId = useId()
  const supabase = createClient()

  const displayUrl = previewUrl || currentUrl

  useEffect(() => {
    setPreviewUrl(currentUrl || '')
    setLoadError(false)
  }, [currentUrl])

  // Use direct Supabase public URL for preview (buckets are public with RLS allowing read)
  const imgSrc = displayUrl

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('=== UPLOAD DEBUG ===')
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type)
    console.log('Bucket:', bucket)
    console.log('Business ID:', businessId)

    if (file.size > maxSizeMB * 1024 * 1024) {
      console.log('❌ File too large')
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    if (!file.type.startsWith('image/')) {
      console.log('❌ Not an image')
      toast.error('Please upload an image file (JPG, PNG, or WebP)')
      return
    }

    setUploading(true)
    e.target.value = ''

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${businessId}/${Date.now()}.${fileExt}`

      // Ensure we send an allowed image MIME type (bucket rejects e.g. application/json)
      const mimeByExt: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      }
      const contentType =
        file.type && file.type.startsWith('image/')
          ? file.type
          : (mimeByExt[fileExt] || 'image/jpeg')

      console.log('Uploading to:', fileName)

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType,
        })

      console.log('Upload result:', { data, error })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      console.log('✅ Setting preview URL:', publicUrl)
      setPreviewUrl(publicUrl)
      setLoadError(false)
      if (publicUrl) onUploadComplete(publicUrl)
      toast.success('Image uploaded successfully!')
    } catch (err: unknown) {
      console.error('❌ Upload error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentUrl && !previewUrl) return
    const urlToRemove = previewUrl || currentUrl

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const pathMatch = supabaseUrl && urlToRemove.includes(`/object/public/${bucket}/`)
        ? urlToRemove.split(`/object/public/${bucket}/`)[1]
        : null
      if (pathMatch) {
        await supabase.storage.from(bucket).remove([decodeURIComponent(pathMatch)])
      }
      setPreviewUrl('')
      // Only call onRemove (clear parent state). Never call onUploadComplete('') here —
      // that could be misinterpreted and must not trigger any upload path.
      if (onRemove) onRemove()
      else onUploadComplete('')
      toast.success('Image removed')
    } catch (err: unknown) {
      console.error('Delete error:', err)
      toast.error('Failed to remove image')
    }
  }

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {displayUrl && (() => {
        console.log('🖼️ Rendering preview, previewUrl:', previewUrl, 'displayUrl:', displayUrl)
        return (
        <div className="relative inline-block">
          <div
            className={`flex items-center justify-center overflow-hidden rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 ${aspectRatio ? 'aspect-video w-full max-w-md min-h-32' : 'w-48 h-48 min-w-48 min-h-48'}`}
          >
            {loadError ? (
              <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                <ImageOff className="w-10 h-10" />
                <span>Image could not be loaded</span>
                <span className="text-xs">Try removing and re-uploading</span>
              </div>
            ) : imgSrc ? (
              <img
                key={displayUrl}
                src={imgSrc}
                alt="Preview"
                className={`h-full w-full object-cover ${aspectRatio || ''}`}
                onLoad={() => setLoadError(false)}
                onError={() => setLoadError(true)}
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        )
      })()}

      {!displayUrl && (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={inputId}
            aria-describedby={label ? undefined : `${inputId}-hint`}
          />
          <label
            htmlFor={inputId}
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload />
                Upload Image
              </>
            )}
          </label>
          <p id={`${inputId}-hint`} className="text-xs text-zinc-500 mt-2">
            Max size: {maxSizeMB}MB. JPG, PNG, or WebP.
          </p>
        </div>
      )}
    </div>
  )
}
