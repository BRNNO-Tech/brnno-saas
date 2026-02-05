import Link from 'next/link'
import LandingNav from '@/components/landing/landing-nav'
import Footer from '@/components/landing/footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNav />
      
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              By accessing or using BRNNO's service management platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              Permission is granted to temporarily use BRNNO for your business operations. This license is for use only and does not include:
            </p>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>Modifying or copying the software</li>
              <li>Using the Service for any commercial purpose other than your own business</li>
              <li>Attempting to reverse engineer or extract source code</li>
              <li>Removing copyright or proprietary notations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              To access certain features, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as necessary</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              Our Service is offered on a subscription basis. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>Pay all fees associated with your subscription</li>
              <li>Automatic renewal unless cancelled</li>
              <li>No refunds for partial subscription periods</li>
              <li>Price changes with 30 days notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              You retain ownership of all data and content you upload to the Service. By using the Service, you grant us a license to use, store, and process your content solely to provide the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              You may not use the Service:
            </p>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>For any unlawful purpose</li>
              <li>To violate any laws or regulations</li>
              <li>To transmit harmful code or malware</li>
              <li>To interfere with or disrupt the Service</li>
              <li>To impersonate any person or entity</li>
              <li>To collect or track personal information of others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. SMS and Text Messaging</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              When you book a service or opt in through our platform (including forms powered by BRNNO), you may receive SMS text messages from the business you booked with or from BRNNO regarding scheduling, booking confirmations, customer support, and service updates. By providing your phone number and checking the consent box, you agree to receive such messages.
            </p>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              Message and data rates may apply. Message frequency varies. Reply <strong>STOP</strong> to any message to unsubscribe at any time. Reply <strong>HELP</strong> for help. We will honor opt-out requests promptly.
            </p>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              Your consent to receive SMS is not required to purchase any goods or services. Carriers are not liable for delayed or undelivered messages. For more on how we use your information, see our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              The Service and its original content, features, and functionality are owned by BRNNO and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              In no event shall BRNNO be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption, arising out of or relating to your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              You agree to indemnify and hold harmless BRNNO from any claims, damages, losses, liabilities, and expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              Questions about these Terms? Contact us at:
            </p>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <p className="text-zinc-700 dark:text-zinc-300">
                <strong>Email:</strong> <a href="mailto:legal@brnno.com" className="text-blue-600 hover:underline">legal@brnno.com</a><br />
                <strong>Phone:</strong> <a href="tel:+1234567890" className="text-blue-600 hover:underline">(801) 613-7887</a><br />
                <strong>Address:</strong> 7533 S Center View CT # 4801, West Jordan, UT 84084
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

