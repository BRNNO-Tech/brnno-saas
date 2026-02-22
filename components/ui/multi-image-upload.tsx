'use client'

import { useState, useId, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MultiImageUploadProps {
  bucket: 'business-portfolios'
  businessId: string
  currentPhotos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
  maxSizeMB?: number
}

export function MultiImageUpload({
  bucket,
  businessId,
  currentPhotos,
  onPhotosChange,
  maxPhotos = 20,
  maxSizeMB = 5,
}: MultiImageUploadProps) {
  const [photos, setPhotos] = useState<string[]>(() => Array.isArray(currentPhotos) ? currentPhotos : [])
  const [uploading, setUploading] = useState(false)
  const inputId = useId()
  const supabase = createClient()

  useEffect(() => {
    setPhotos(Array.isArray(currentPhotos) ? currentPhotos : [])
  }, [currentPhotos])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const current = Array.isArray(photos) ? photos : []
    if (current.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setUploading(true)
    e.target.value = ''
    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${file.name} is too large (max ${maxSizeMB}MB)`)
          continue
        }
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`)
          continue
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${businessId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (error) {
          toast.error(`Failed to upload ${file.name}`)
          console.error(error)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      if (uploadedUrls.length > 0) {
        const newPhotos = [...(Array.isArray(photos) ? photos : []), ...uploadedUrls]
        setPhotos(newPhotos)
        onPhotosChange(newPhotos)
        toast.success(`Uploaded ${uploadedUrls.length} photo(s)`)
      }
    } catch (err: unknown) {
      console.error('Upload error:', err)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (urlToRemove: string) => {
    try {
      const pathMatch = urlToRemove.includes(`/object/public/${bucket}/`)
        ? urlToRemove.split(`/object/public/${bucket}/`)[1]
        : null
      if (pathMatch) {
        await supabase.storage.from(bucket).remove([decodeURIComponent(pathMatch)])
      }
      const current = Array.isArray(photos) ? photos : []
      const newPhotos = current.filter((url) => url !== urlToRemove)
      setPhotos(newPhotos)
      onPhotosChange(newPhotos)
      toast.success('Photo removed')
    } catch (err: unknown) {
      console.error('Delete error:', err)
      toast.error('Failed to remove photo')
    }
  }

  const safePhotos = Array.isArray(photos) ? photos : []

  return (
    <div className="space-y-4">
      {safePhotos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {safePhotos.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`Portfolio ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg border-2 border-zinc-200 dark:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {safePhotos.length < maxPhotos && (
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={inputId}
            aria-describedby={`${inputId}-hint`}
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
                Upload Photos ({safePhotos.length}/{maxPhotos})
              </>
            )}
          </label>
          <p id={`${inputId}-hint`} className="text-xs text-zinc-500 mt-2">
            Select multiple photos. Max {maxSizeMB}MB each. ({maxPhotos - safePhotos.length} remaining)
          </p>
        </div>
      )}
    </div>
  )
}
