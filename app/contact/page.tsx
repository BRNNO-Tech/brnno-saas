import ContactForm from '@/components/contact-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="text-xl font-bold">Brnno</span>
          </Link>
          <Link href="/login">
            <button className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
              Sign In
            </button>
          </Link>
        </div>
      </header>

      {/* Contact Form */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Back Button */}
        <Link
          href="/landing"
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Have questions? Need help choosing a plan? We're here to help.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border p-8 md:p-12">
          <ContactForm />
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl mb-2">📧</div>
            <h3 className="font-semibold mb-1">Email Us</h3>
            <a href="mailto:support@brnno.com" className="text-blue-600 hover:underline">
              support@brnno.com
            </a>
          </div>
          <div>
            <div className="text-4xl mb-2">💬</div>
            <h3 className="font-semibold mb-1">Response Time</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Within 24 hours</p>
          </div>
          <div>
            <div className="text-4xl mb-2">🕐</div>
            <h3 className="font-semibold mb-1">Business Hours</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Mon-Fri, 9am-5pm MST</p>
          </div>
        </div>
      </div>
    </div>
  )
}

