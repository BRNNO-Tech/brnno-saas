'use client'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Ensure all image paths are correct
const images = [
  '/images/dashboard1.png',
  '/images/dashboard2.png',
  '/images/dashboard3.png',
  '/images/dashboard4.png',
  '/images/dashboard5.png',
  '/images/dashboard6.png',
  '/images/dashboard7.png',
  '/images/dashboard8.png'
]

export default function HeroScreenshotCarousel() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index))
  }

  const goPrev = () => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  const goNext = () => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1))

  // Auto-play functionality
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1))
      }, 4500) // Change slide every 4.5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused])

  // Reset timer when manually changing slides
  const handleManualChange = (newIndex: number) => {
    setCurrent(newIndex)
    // Reset the timer by briefly pausing and resuming
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 100)
  }

  return (
    <div 
      className="relative max-w-3xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-lg flex items-center justify-center overflow-hidden transition-opacity duration-500 relative">
        {imageErrors.has(current) ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <p>Image {current + 1} not available</p>
          </div>
        ) : (
          <Image
            src={images[current]!}
            alt={`App screenshot ${current + 1}`}
            fill
            className="object-cover rounded-lg"
            priority={current === 0}
            sizes="(max-width: 768px) 90vw, 800px"
            unoptimized
            onError={() => {
              console.error(`Failed to load image: ${images[current]}`)
              handleImageError(current)
            }}
          />
        )}
      </div>
      <button
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 dark:bg-zinc-900/70 p-2 hover:bg-white dark:hover:bg-zinc-800 shadow transition-opacity"
        onClick={() => handleManualChange(current === 0 ? images.length - 1 : current - 1)}
        aria-label="Previous"
        type="button"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 dark:bg-zinc-900/70 p-2 hover:bg-white dark:hover:bg-zinc-800 shadow transition-opacity"
        onClick={() => handleManualChange(current === images.length - 1 ? 0 : current + 1)}
        aria-label="Next"
        type="button"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="flex justify-center gap-2 mt-4">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => handleManualChange(i)}
            aria-label={`Go to screenshot ${i + 1}`}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              i === current 
                ? 'bg-blue-600 w-8' 
                : 'bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
            }`}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}

