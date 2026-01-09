'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, User, CheckSquare } from 'lucide-react'
import { assignJobToMember } from '@/lib/actions/team'
import { autoAssignJob, autoAssignUnassignedJobs } from '@/lib/actions/auto-assign'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFeatureGate } from '@/hooks/use-feature-gate'
import { Sparkles, Loader2 } from 'lucide-react'

type Job = {
  id: string
  title: string
  description: string | null
  service_type: string | null
  scheduled_date: string | null
  estimated_cost: number | null
  status: string
  priority: string
  client: {
    name: string
  }
}

type TeamMember = {
  id: string
  name: string
  role: string
  skills: string[] | null
  total_jobs_completed: number
}

export default function UnassignedJobsList({
  jobs,
  teamMembers
}: {
  jobs: Job[]
  teamMembers: TeamMember[]
}) {
  const router = useRouter()
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [assigning, setAssigning] = useState(false)
  const [autoAssigningAll, setAutoAssigningAll] = useState(false)
  const { can } = useFeatureGate()

  const activeMembers = teamMembers.filter(m => m.role !== 'inactive')

  function toggleJobSelection(jobId: string) {
    const newSelection = new Set(selectedJobs)
    if (newSelection.has(jobId)) {
      newSelection.delete(jobId)
    } else {
      newSelection.add(jobId)
    }
    setSelectedJobs(newSelection)
  }

  function selectAll() {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(jobs.map(j => j.id)))
    }
  }

  async function handleQuickAssign(jobId: string, memberId: string) {
    try {
      await assignJobToMember(jobId, memberId)
      router.refresh()
    } catch (error) {
      console.error('Error assigning job:', error)
      alert('Failed to assign job')
    }
  }

  async function handleBulkAssign(memberId: string) {
    if (selectedJobs.size === 0) {
      alert('Please select jobs to assign')
      return
    }

    setAssigning(true)
    try {
      // Assign all selected jobs
      await Promise.all(
        Array.from(selectedJobs).map(jobId =>
          assignJobToMember(jobId, memberId)
        )
      )
      setSelectedJobs(new Set())
      router.refresh()
    } catch (error) {
      console.error('Error bulk assigning:', error)
      alert('Failed to assign some jobs')
    } finally {
      setAssigning(false)
    }
  }

  async function handleAutoAssign(jobId: string) {
    setAssigning(true)
    try {
      const result = await autoAssignJob(jobId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.message || 'Failed to auto-assign job')
      }
    } catch (error) {
      console.error('Error auto-assigning:', error)
      alert(error instanceof Error ? error.message : 'Failed to auto-assign job')
    } finally {
      setAssigning(false)
    }
  }

  async function handleAutoAssignAll() {
    if (jobs.length === 0) return
    
    setAutoAssigningAll(true)
    try {
      const result = await autoAssignUnassignedJobs()
      alert(`Auto-assigned ${result.assigned} job(s). ${result.failed > 0 ? `${result.failed} failed.` : ''}`)
      router.refresh()
    } catch (error) {
      console.error('Error auto-assigning all:', error)
      alert(error instanceof Error ? error.message : 'Failed to auto-assign jobs')
    } finally {
      setAutoAssigningAll(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
    }
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">All jobs are assigned!</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Great work - every job has a team member assigned.
          </p>
        </div>
      </Card>
    )
  }

  const canAutoAssign = can('basic_auto_assignment')

  return (
    <div className="space-y-4">
      {/* Auto-Assign All Button */}
      {canAutoAssign && jobs.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Auto-Assign All Jobs
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Automatically assign all {jobs.length} unassigned job{jobs.length !== 1 ? 's' : ''} to the best available workers
              </p>
            </div>
            <Button
              onClick={handleAutoAssignAll}
              disabled={autoAssigningAll}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {autoAssigningAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Assign All
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {selectedJobs.size > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="font-semibold">
                {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJobs(new Set())}
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Bulk assign to:
              </span>
              {activeMembers.slice(0, 3).map(member => (
                <Button
                  key={member.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAssign(member.id)}
                  disabled={assigning}
                >
                  {member.name}
                </Button>
              ))}
              {activeMembers.length > 3 && (
                <select
                  className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1 text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkAssign(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  disabled={assigning}
                >
                  <option value="">More...</option>
                  {activeMembers.slice(3).map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Select All */}
      <div className="flex items-center gap-2 px-2">
        <input
          type="checkbox"
          checked={selectedJobs.size === jobs.length}
          onChange={selectAll}
          className="rounded border-zinc-300 dark:border-zinc-600"
        />
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Select All
        </span>
      </div>

      {jobs.map((job) => (
        <Card key={job.id} className="p-6">
          <div className="flex items-start">
            <div className="pt-1 mr-4">
              <input
                type="checkbox"
                checked={selectedJobs.has(job.id)}
                onChange={() => toggleJobSelection(job.id)}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Link href={`/dashboard/jobs/${job.id}`}>
                    <h3 className="font-semibold hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {job.client.name}
                  </p>
                </div>
                <Badge className={getStatusColor(job.status)}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>

              {job.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                  {job.description}
                </p>
              )}

              <div className="space-y-1 mb-4">
                {job.scheduled_date && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    {new Date(job.scheduled_date).toLocaleDateString()}
                  </div>
                )}
                {job.estimated_cost && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <DollarSign className="h-4 w-4" />
                    ${job.estimated_cost.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Quick Assign */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Quick assign:
                  </p>
                  {canAutoAssign && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAutoAssign(job.id)}
                      disabled={assigning}
                      className="text-xs h-6 px-2"
                    >
                      {assigning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Auto
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeMembers.slice(0, 4).map(member => (
                    <Button
                      key={member.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAssign(job.id, member.id)}
                      className="text-xs"
                    >
                      <User className="h-3 w-3 mr-1" />
                      {member.name.split(' ')[0]}
                    </Button>
                  ))}
                  {activeMembers.length > 4 && (
                    <select
                      className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-xs"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleQuickAssign(job.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">More...</option>
                      {activeMembers.slice(4).map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
