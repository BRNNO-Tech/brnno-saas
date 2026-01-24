import { getSequence } from '@/lib/actions/sequences'
import { SequenceEditor } from '@/components/sequences/sequence-editor'
import { GlowBG } from '@/components/ui/glow-bg'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'

interface EditSequencePageProps {
  params: Promise<{ id: string }>
}

export default async function EditSequencePage({ params }: EditSequencePageProps) {
  const { id } = await params
  const sequence = await getSequence(id)

  if (!sequence) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>
        <div className="relative mx-auto max-w-[1600px] px-6 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/dashboard/leads/sequences">
              <Button variant="ghost" size="icon" className="hover:bg-zinc-100 dark:hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Edit Auto Follow-Up
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                {sequence.name}
              </p>
            </div>
          </div>

          <SequenceEditor mode="edit" sequence={sequence} />
        </div>
      </div>
    </div>
  )
}
