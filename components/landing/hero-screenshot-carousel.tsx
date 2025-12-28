'use client'
import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const images = [
  '/images/dashboard1.png',
  '/images/dashboard2.png',
  '/images/dashboard3.png',
  '/images/dashboard4.png',
  '/images/dashboard5.png'
]

export default function HeroScreenshotCarousel() {
  const [current, setCurrent] = useState(0)
  const goPrev = () => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  const goNext = () => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1))

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-lg flex items-center justify-center overflow-hidden">
        <Image
          src={images[current]}
          alt={`App screenshot ${current + 1}`}
          fill
          className="object-cover rounded-lg"
          priority
          sizes="(max-width: 768px) 90vw, 800px"
        />
      </div>
      <button
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 dark:bg-zinc-900/70 p-2 hover:bg-white dark:hover:bg-zinc-800 shadow"
        onClick={goPrev}
        aria-label="Previous"
        type="button"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 dark:bg-zinc-900/70 p-2 hover:bg-white dark:hover:bg-zinc-800 shadow"
        onClick={goNext}
        aria-label="Next"
        type="button"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="flex justify-center gap-2 mt-4">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to screenshot ${i + 1}`}
            className={`h-2 w-2 rounded-full ${i === current ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}

