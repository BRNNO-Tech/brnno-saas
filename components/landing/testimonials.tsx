import { Star } from 'lucide-react'

const testimonials = [
  {
    name: "Sarah Johnson",
    business: "Elite Detailing Co.",
    rating: 5,
    text: "BRNNO has completely transformed how we manage our business. The scheduling system alone has saved us hours every week, and our customers love the easy booking process.",
    image: "👩" // Replace with actual image
  },
  {
    name: "Mike Chen",
    business: "Sparkle Clean Services",
    rating: 5,
    text: "As a growing business, we needed something that could scale with us. BRNNO has been perfect. The team management features help us coordinate our crew, and the reporting gives us insights we never had before.",
    image: "👨" // Replace with actual image
  },
  {
    name: "Emily Rodriguez",
    business: "Mobile Wash Pro",
    rating: 5,
    text: "The customer management features are incredible. We can track every interaction, see job history at a glance, and the automated reminders keep our customers coming back. Highly recommend!",
    image: "👩" // Replace with actual image
  }
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Don't just take our word for it—hear from businesses using BRNNO
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-zinc-800 rounded-xl border p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 mb-6 italic">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
                  {testimonial.image}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {testimonial.business}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

