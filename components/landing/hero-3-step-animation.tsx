'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Send, CheckCircle2, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: AlertCircle,
    title: 'Missed Lead Detected',
    description: 'System identifies a lead that hasn\'t responded',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  {
    icon: Send,
    title: 'AI Sends Follow-Up',
    description: 'Automated personalized message goes out instantly',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    icon: CheckCircle2,
    title: 'Lead Books Service',
    description: 'Lead converts and schedules an appointment',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800'
  }
]

export default function Hero3StepAnimation() {
  const [activeStep, setActiveStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 2500) // Change step every 2.5 seconds

    return () => clearInterval(interval)
  }, [isAnimating])

  return (
    <div 
      className="mt-12 sm:mt-16 px-4"
      onMouseEnter={() => setIsAnimating(false)}
      onMouseLeave={() => setIsAnimating(true)}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = activeStep === index
            const isPast = activeStep > index
            
            return (
              <div key={index} className="flex items-center w-full sm:w-auto">
                {/* Step Card */}
                <div
                  className={`
                    relative flex-1 sm:flex-none sm:w-64 p-6 rounded-xl border-2 transition-all duration-500
                    ${isActive 
                      ? `${step.bgColor} ${step.borderColor} scale-105 shadow-lg` 
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-60 scale-100'
                    }
                    ${isPast ? 'opacity-80' : ''}
                  `}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`
                      p-4 rounded-full transition-all duration-500
                      ${isActive ? `${step.bgColor} ${step.color}` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}
                    `}>
                      <Icon className={`h-8 w-8 ${isActive ? step.color : ''}`} />
                    </div>
                    <h3 className={`
                      font-semibold text-lg transition-colors duration-500
                      ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500'}
                    `}>
                      {step.title}
                    </h3>
                    <p className={`
                      text-sm transition-colors duration-500
                      ${isActive ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-600'}
                    `}>
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Active indicator pulse */}
                  {isActive && (
                    <div className={`
                      absolute -inset-1 rounded-xl opacity-20 animate-pulse
                      ${step.bgColor}
                    `} />
                  )}
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className={`
                    hidden sm:flex items-center mx-2 transition-opacity duration-500
                    ${isActive || isPast ? 'opacity-100' : 'opacity-30'}
                  `}>
                    <ArrowRight className={`
                      h-6 w-6 transition-colors duration-500
                      ${isPast ? 'text-green-500' : isActive ? 'text-blue-500' : 'text-zinc-300 dark:text-zinc-700'}
                    `} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: Show step indicator */}
        <div className="flex justify-center gap-2 mt-6 sm:hidden">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`
                h-2 rounded-full transition-all duration-500
                ${activeStep === index 
                  ? 'w-8 bg-blue-600' 
                  : 'w-2 bg-zinc-300 dark:bg-zinc-700'
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
