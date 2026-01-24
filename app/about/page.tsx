import LandingNav from '@/components/landing/landing-nav'
import Footer from '@/components/landing/footer'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNav />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-5xl font-bold mb-6">About BRNNO</h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Empowering service businesses with the tools they need to succeed
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-zinc-700 dark:text-zinc-300 mb-4 text-lg leading-relaxed">
                At BRNNO, we believe that service-based businesses deserve powerful, intuitive tools to manage their operations. We're on a mission to simplify business management so you can focus on what you do best—serving your customers.
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 text-lg leading-relaxed">
                Whether you're a mobile detailing service, a cleaning company, or any other service business, BRNNO provides everything you need to streamline scheduling, manage customers, track jobs, and grow your business.
              </p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg aspect-square flex items-center justify-center">
              {/* Replace with actual image */}
              <span className="text-zinc-400">Team Photo Placeholder</span>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-zinc-50 dark:bg-zinc-900 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Simplicity</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  We believe powerful tools should be easy to use. No complicated setups, no steep learning curves.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-2">Reliability</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Your business depends on us, so we're committed to providing a stable, secure platform you can count on.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg">
                <div className="text-4xl mb-4">💡</div>
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  We're constantly improving and adding new features based on feedback from businesses like yours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <span className="text-zinc-400">Photo</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Adrian Smithee</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">co-founder & CEO</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Adrian has nearly 20 years of sales leadership with a deep focus on helping service businesses win more work.
              </p>
            </div>
            {/* Team Member 2 */}
            <div className="text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <span className="text-zinc-400">Photo</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Johnathan Jake</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">co-founder & CTO</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Johnathan leads our technical team, ensuring BRNNO stays ahead of the curve with cutting-edge technology.
              </p>
            </div>
            {/* Team Member 3 */}
            <div className="text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <span className="text-zinc-400">Photo</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sam Christmas</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">co-founder & CFO</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Sam ensures every customer gets the support they need to succeed with BRNNO.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-blue-500 to-purple-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join hundreds of service businesses using BRNNO to streamline their operations.
            </p>
            <a
              href="/signup"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors"
            >
              Get Started
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

