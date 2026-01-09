import Link from 'next/link'
import { getWorkerProfile } from '@/lib/actions/worker-auth'
import { redirect } from 'next/navigation'
import { Home, Calendar, User, Navigation, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const worker = await getWorkerProfile()
  
  if (!worker) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t sm:hidden">
        <div className="flex items-center justify-around h-16">
          <Link href="/worker" className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            <Home className="h-4 w-4" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link href="/worker/schedule" className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            <Calendar className="h-4 w-4" />
            <span className="text-[10px]">Schedule</span>
          </Link>
          <Link href="/worker/routes" className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            <Navigation className="h-4 w-4" />
            <span className="text-[10px]">Routes</span>
          </Link>
          <Link href="/worker/messages" className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            <MessageSquare className="h-4 w-4" />
            <span className="text-[10px]">Messages</span>
          </Link>
          <div className="flex flex-col items-center justify-center gap-1 px-2 py-2">
            <ThemeToggle />
          </div>
          <Link href="/worker/profile" className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            <User className="h-4 w-4" />
            <span className="text-[10px]">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-zinc-900 border-r flex-col">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{worker.name}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{worker.business?.name}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/worker"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/worker/schedule"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>Schedule</span>
          </Link>
          <Link
            href="/worker/routes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Navigation className="h-5 w-5" />
            <span>Routes</span>
          </Link>
          <Link
            href="/worker/messages"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Messages</span>
          </Link>
          <Link
            href="/worker/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <form action="/api/auth/signout" method="post">
            <Button variant="outline" className="w-full" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="sm:ml-64 pb-16 sm:pb-0">
        {children}
      </main>
    </div>
  )
}
