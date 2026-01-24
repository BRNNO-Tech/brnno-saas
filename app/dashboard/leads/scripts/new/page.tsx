'use client'

import { useRouter } from 'next/navigation'
import { ScriptEditor } from '@/components/scripts/script-editor'
import { GlowBG } from '@/components/ui/glow-bg'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NewScriptPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/dashboard/leads/scripts">
              <Button variant="ghost" size="icon" className="hover:bg-zinc-100 dark:hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Create Script
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Build a reusable message template for your leads
              </p>
            </div>
          </div>

          <ScriptEditor mode="create" />
        </div>
      </div>
    </div>
  )
}
