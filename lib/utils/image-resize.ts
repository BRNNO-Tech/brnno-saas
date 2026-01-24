/**
 * Image Resize Utilities
 * Resizes images to optimize for AI analysis while maintaining quality
 */

/**
 * Resize an image file to a maximum dimension (512px or 768px)
 * Maintains aspect ratio and compresses to reduce file size
 */
export async function resizeImage(
  file: File,
  maxDimension: 512 | 768 = 768,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width
        let height = img.height
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }
            
            // Create new File with resized image
            const resizedFile = new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg', // Always convert to JPEG for better compression
                lastModified: Date.now()
              }
            )
            
            resolve(resizedFile)
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Calculate image quality score for selecting best photos
 * Higher score = better quality for AI analysis
 */
export function calculateImageQualityScore(
  width: number,
  height: number,
  fileSize: number
): number {
  // Prefer images that are:
  // 1. Larger resolution (more detail)
  // 2. Not too large (faster processing)
  // 3. Good aspect ratio (not too wide/tall)
  
  const aspectRatio = width / height
  const idealAspectRatio = 4 / 3 // Common camera aspect ratio
  
  // Aspect ratio score (closer to ideal = better)
  const aspectScore = 1 - Math.abs(aspectRatio - idealAspectRatio) / idealAspectRatio
  
  // Resolution score (larger = better, but with diminishing returns)
  const resolution = width * height
  const resolutionScore = Math.min(1, resolution / (768 * 768))
  
  // File size score (not too small, not too large)
  const sizeScore = fileSize > 50000 && fileSize < 2000000 ? 1 : 0.5
  
  // Weighted combination
  return (aspectScore * 0.3) + (resolutionScore * 0.5) + (sizeScore * 0.2)
}

/**
 * Select best photos from a list for AI analysis
 * Returns 2-3 best photos based on quality score
 */
export function selectBestPhotosForAnalysis(
  photos: Array<{ id: string; width?: number; height?: number; fileSize?: number }>
): string[] {
  if (photos.length <= 3) {
    return photos.map(p => p.id)
  }
  
  // Calculate quality scores
  const scoredPhotos = photos.map(photo => ({
    id: photo.id,
    score: calculateImageQualityScore(
      photo.width || 1000,
      photo.height || 1000,
      photo.fileSize || 500000
    )
  }))
  
  // Sort by score (highest first)
  scoredPhotos.sort((a, b) => b.score - a.score)
  
  // Return top 2-3 photos
  const count = photos.length >= 3 ? 3 : 2
  return scoredPhotos.slice(0, count).map(p => p.id)
}
