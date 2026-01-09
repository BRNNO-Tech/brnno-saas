'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus } from 'lucide-react'
import { assignJobToMember, unassignJob } from '@/lib/actions/team'
import { getTeamMembers } from '@/lib/actions/team'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function AssignJobDialog({ jobId, currentAssignment }: {
  jobId: string
  currentAssignment?: { id: string; name: string } | null
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    async function loadMembers() {
      const data = await getTeamMembers()
      setMembers(data.filter(m => m.status === 'active'))
    }
    if (open) {
      loadMembers()
    }
  }, [open])

  async function handleAssign(memberId: string) {
    setLoading(true)
    try {
      await assignJobToMember(jobId, memberId)
      setOpen(false)
      router.refresh()
      toast.success('Job assigned successfully')
    } catch (error) {
      toast.error('Failed to assign job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnassign() {
    setLoading(true)
    try {
      await unassignJob(jobId)
      setOpen(false)
      router.refresh()
      toast.success('Job unassigned successfully')
    } catch (error) {
      toast.error('Failed to unassign job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <UserPlus className="mr-2 h-3.5 w-3.5" />
          {currentAssignment ? 'Reassign' : 'Assign'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentAssignment ? 'Reassign or Unassign Job' : 'Assign Job to Team Member'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Unassign button if already assigned */}
          {currentAssignment && (
            <button
              onClick={handleUnassign}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-left disabled:opacity-50 mb-4"
            >
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <UserMinus className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-900 dark:text-red-100">Remove Assignment</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Unassign this job from {currentAssignment.name}
                </p>
              </div>
            </button>
          )}

          {members.length === 0 ? (
            <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">
              No team members available. Add team members first.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {currentAssignment ? 'Assign to different team member:' : 'Select a team member:'}
              </p>
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleAssign(member.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left disabled:opacity-50"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {member.role} • {member.total_jobs_completed || 0} jobs completed
                    </p>
                    {member.skills && member.skills.length > 0 && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {member.skills.join(', ')}
                      </p>
                    )}
                  </div>
                  {currentAssignment?.id === member.id && (
                    <div className="text-xs font-semibold text-blue-600">
                      Currently Assigned
                    </div>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
