'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Why is there a price range for each tier?',
    answer: 'Our pricing adjusts based on team size, booking volume, and the AI automation tools you choose to enable. Smaller teams with lighter usage land at the lower end, while larger teams or those using advanced AI features fall toward the higher end. This keeps pricing fair and scalable as your business grows.',
  },
  {
    question: 'What determines where my business falls in the range?',
    answer: 'A few factors influence your exact price: Number of technicians on your team, Monthly booking volume, AI add-ons (chatbot, lead recovery agent, SMS assistant, etc.), and Support level (standard vs priority). We\'ll help you find the best fit during onboarding.',
  },
  {
    question: 'Do I have to use AI add-ons?',
    answer: 'No — all AI tools are optional. You can start with the core plan and add AI features only if and when they make sense for your business.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Absolutely. You can upgrade or downgrade at any time, and your billing will adjust automatically.',
  },
  {
    question: 'Do annual plans really save money?',
    answer: 'Yes — annual plans include two free months plus additional perks like extra AI/SMS credits and priority onboarding. Most businesses choose annual because it offers the best long-term value.',
  },
  {
    question: 'What happens if my team grows?',
    answer: 'Your plan scales with you. If you add more technicians or increase your booking volume, we\'ll help you move to the tier that fits your new workflow.',
  },
  {
    question: 'Is there a contract or cancellation fee?',
    answer: 'No contracts. Monthly plans can be canceled anytime. Annual plans come with a 30-day satisfaction guarantee.',
  },
  {
    question: 'Do you offer onboarding help?',
    answer: 'Yes — all plans include setup assistance, and annual customers receive priority onboarding to get up and running fast.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 px-4">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-lg bg-white dark:bg-zinc-900 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 sm:px-6 py-4 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors min-h-[60px]"
              >
                <span className="font-semibold text-sm sm:text-base pr-4">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIndex === index && (
                <div className="px-4 sm:px-6 pb-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

