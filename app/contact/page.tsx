import ContactForm from '@/components/contact-form'
import LandingNav from '@/components/landing/landing-nav'
import Footer from '@/components/landing/footer'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <LandingNav />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Have questions? Need help choosing a plan? We're here to help.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border p-8">
            <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <a href="tel:+1234567890" className="text-blue-600 hover:underline">
                    (801) 613-7887
                  </a>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Mon-Fri, 9am-5pm MST
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a href="mailto:support@brnno.com" className="text-blue-600 hover:underline">
                    support@brnno.com
                  </a>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Address</h3>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    7533 S Center View CT # 4801<br />
                    West Jordan, UT 84084
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border p-8">
            <ContactForm />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

