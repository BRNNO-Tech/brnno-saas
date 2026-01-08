import { Card } from '@/components/ui/card'
import { MessageSquare, Clock, Sparkles, Inbox, Bot, Users } from 'lucide-react'

export const revalidate = 60

export default function MessagesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Messages</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Two-way SMS messaging with customers
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-12 text-center bg-gradient-to-br from-blue-600/10 dark:from-blue-600/20 via-blue-500/5 dark:via-blue-500/10 to-purple-500/10 dark:to-purple-500/20 border-blue-500/20 dark:border-blue-500/30">
        <div className="max-w-2xl mx-auto">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-10 w-10 text-white" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Coming Soon: Two-Way Messaging</h2>
          </div>
          
          <p className="text-zinc-700 dark:text-zinc-300 mb-8 text-lg">
            Text customers directly from your dashboard. Never miss a question or booking change.
          </p>

          {/* Feature Preview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-50/50 dark:bg-white/5 backdrop-blur-md rounded-lg p-4 border border-zinc-200 dark:border-white/10">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1 text-zinc-900 dark:text-white">SMS Inbox</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                All customer texts in one place
              </p>
            </div>
            
            <div className="bg-zinc-50/50 dark:bg-white/5 backdrop-blur-md rounded-lg p-4 border border-zinc-200 dark:border-white/10">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1 text-zinc-900 dark:text-white">Auto-Replies</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Booking confirmations & reminders
              </p>
            </div>
            
            <div className="bg-zinc-50/50 dark:bg-white/5 backdrop-blur-md rounded-lg p-4 border border-zinc-200 dark:border-white/10">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1 text-zinc-900 dark:text-white">Team Access</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your whole team can reply
              </p>
            </div>
          </div>

          {/* Mockup Preview */}
          <div className="bg-zinc-50/50 dark:bg-white/5 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-white/10 overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-white">Messages Preview</span>
              <Clock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            
            <div className="p-4 space-y-3 text-left">
              {/* Fake message 1 */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-semibold text-white">
                  JS
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-white">John Smith</span>
                    <span className="text-xs text-zinc-500">2 min ago</span>
                  </div>
                  <div className="bg-zinc-200 dark:bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-700 dark:text-zinc-300">
                    Can you come at 10am instead of 2pm tomorrow?
                  </div>
                </div>
              </div>

              {/* Fake message 2 (your reply) */}
              <div className="flex items-start gap-3 justify-end">
                <div className="flex-1 text-right">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg p-3 text-sm inline-block">
                    Yes! Changed to 10am. See you tomorrow!
                  </div>
                </div>
              </div>

              {/* Fake message 3 */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-sm font-semibold text-white">
                  SC
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-white">Sarah Chen</span>
                    <span className="text-xs text-zinc-500">1 hour ago</span>
                  </div>
                  <div className="bg-zinc-200 dark:bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-700 dark:text-zinc-300">
                    Do you offer ceramic coating?
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Interested in early access? Contact support to be notified when this launches.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

