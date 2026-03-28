/**
 * Normalize Content-Type for Supabase Storage uploads. Buckets use
 * allowed_mime_types like image/jpeg — not image/jpg (some browsers send that).
 */
export const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

export function contentTypeForImageStorageUpload(
  fileType: string,
  fileExt: string
): string {
  const t = fileType?.trim().toLowerCase() ?? ''
  if (t === 'image/jpg' || t === 'image/pjpeg') return 'image/jpeg'
  if (t === 'image/jpeg' || t === 'image/png' || t === 'image/gif' || t === 'image/webp')
    return t
  return MIME_BY_EXT[fileExt] || 'image/jpeg'
}

export const HEIC_HEIF_ERROR_MESSAGE =
  'HEIC/HEIF is not supported. On iPhone: Settings → Camera → Formats → Most Compatible, or export the photo as JPG/PNG and upload again.'
