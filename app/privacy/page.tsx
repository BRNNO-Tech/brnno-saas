import Link from 'next/link'
import LandingNav from '@/components/landing/landing-nav'
import Footer from '@/components/landing/footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNav />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              BRNNO ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service management platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>Account information (name, email, phone number)</li>
              <li>Business information (business name, address, service area)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Customer and job data you input into the platform</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>Device information and IP address</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative information and updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect, prevent, and address technical issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>With service providers who assist in operating our platform (e.g., payment processors, hosting providers)</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or merger</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-zinc-700 dark:text-zinc-300">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage, and assist in marketing efforts. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <p className="text-zinc-700 dark:text-zinc-300">
                <strong>Email:</strong> <a href="mailto:privacy@brnno.com" className="text-blue-600 hover:underline">privacy@brnno.com</a><br />
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

