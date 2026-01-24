'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Star, TrendingUp, DollarSign, Edit, Trash2 } from 'lucide-react'
import { deleteTeamMember } from '@/lib/actions/team'
import { useRouter } from 'next/navigation'
import EditTeamMemberDialog from './edit-team-member-dialog'

type TeamMember = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  status: string
  skills: string[] | null
  hourly_rate: number | null
  commission_rate: number | null
  user_id: string | null  // Add this field
  total_jobs_completed: number
  average_rating: number
  total_earnings: number
  created_at: string
}

export default function TeamMemberList({ members }: { members: TeamMember[] }) {
  const router = useRouter()

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} from your team?`)) {
      return
    }

    try {
      await deleteTeamMember(id)
      router.refresh()
    } catch (error) {
      console.error('Error deleting team member:', error)
      alert('Failed to delete team member')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'worker': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
    }
  }

  const activeMembers = members.filter(m => m.status === 'active')
  const inactiveMembers = members.filter(m => m.status !== 'active')

  return (
    <div className="space-y-6">
      {/* Active Members */}
      {activeMembers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Team ({activeMembers.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeMembers.map((member) => (
              <Card key={member.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <EditTeamMemberDialog member={member} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id, member.name)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${member.email}`} className="hover:underline">
                      {member.email}
                    </a>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${member.phone}`} className="hover:underline">
                        {member.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {member.skills && member.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Jobs</span>
                    </div>
                    <p className="text-lg font-bold">{member.total_jobs_completed || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Rating</span>
                    </div>
                    <p className="text-lg font-bold">{(member.average_rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Earned</span>
                    </div>
                    <p className="text-lg font-bold">${(member.total_earnings || 0).toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-zinc-500">Inactive Team ({inactiveMembers.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 opacity-75">
            {inactiveMembers.map((member) => (
              <Card key={member.id} className="p-6 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-zinc-600">{member.name}</h3>
                      <Badge variant="secondary">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id, member.name)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t text-zinc-500">
                  <div className="text-center">
                    <p className="text-xs">Jobs</p>
                    <p className="font-bold">{member.total_jobs_completed || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs">Rating</p>
                    <p className="font-bold">{(member.average_rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs">Earned</p>
                    <p className="font-bold">${(member.total_earnings || 0).toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
