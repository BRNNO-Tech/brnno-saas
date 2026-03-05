'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Star, TrendingUp, DollarSign, Edit, Trash2 } from 'lucide-react'
import { deleteTeamMember } from '@/lib/actions/team'
import { useRouter } from 'next/navigation'
import EditTeamMemberDialog from './edit-team-member-dialog'
import { cn } from '@/lib/utils'

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
      case 'owner': return 'bg-[var(--dash-amber)]/20 text-[var(--dash-amber)] border border-[var(--dash-amber)]/40'
      case 'admin': return 'bg-[var(--dash-blue)]/20 text-[var(--dash-blue)] border border-[var(--dash-blue)]/40'
      case 'worker': return 'bg-[var(--dash-green)]/20 text-[var(--dash-green)] border border-[var(--dash-green)]/40'
      default: return 'bg-[var(--dash-surface)] text-[var(--dash-text-muted)] border border-[var(--dash-border)]'
    }
  }

  const activeMembers = members.filter(m => m.status === 'active')
  const inactiveMembers = members.filter(m => m.status !== 'active')

  return (
    <div className="space-y-6">
      {/* Active Members */}
      {activeMembers.length > 0 && (
        <div>
          <h2 className="font-dash-condensed font-bold text-lg uppercase tracking-wide text-[var(--dash-text)] mb-4">
            Active Team ({activeMembers.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeMembers.map((member) => (
              <Card key={member.id} className="p-6 border-[var(--dash-border)] bg-[var(--dash-graphite)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-[var(--dash-blue)]/20 flex items-center justify-center font-dash-condensed font-bold text-lg text-[var(--dash-blue)]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-dash-condensed font-bold text-[var(--dash-text)]">{member.name}</h3>
                      <Badge className={cn('font-dash-mono text-[10px] uppercase', getRoleBadgeColor(member.role))}>
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
                      className="text-[var(--dash-text-muted)] hover:text-[var(--dash-red)] hover:bg-[var(--dash-red)]/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${member.email}`} className="text-[var(--dash-text)] hover:text-[var(--dash-amber)]">
                      {member.email}
                    </a>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${member.phone}`} className="text-[var(--dash-text)] hover:text-[var(--dash-amber)]">
                        {member.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {member.skills && member.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] font-dash-mono border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-muted)]">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--dash-border)]">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-[var(--dash-green)]" />
                      <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">Jobs</span>
                    </div>
                    <p className="font-dash-condensed font-bold text-[var(--dash-text)]">{member.total_jobs_completed || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-3 w-3 text-[var(--dash-amber)]" />
                      <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">Rating</span>
                    </div>
                    <p className="font-dash-condensed font-bold text-[var(--dash-text)]">{(member.average_rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-[var(--dash-green)]" />
                      <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">Earned</span>
                    </div>
                    <p className="font-dash-condensed font-bold text-[var(--dash-text)]">${(member.total_earnings || 0).toFixed(2)}</p>
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
          <h2 className="font-dash-condensed font-bold text-lg uppercase tracking-wide text-[var(--dash-text-muted)] mb-4">
            Inactive Team ({inactiveMembers.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 opacity-80">
            {inactiveMembers.map((member) => (
              <Card key={member.id} className="p-6 border-[var(--dash-border)] bg-[var(--dash-graphite)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-[var(--dash-surface)] flex items-center justify-center font-dash-condensed font-bold text-lg text-[var(--dash-text-muted)]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-dash-condensed font-bold text-[var(--dash-text-muted)]">{member.name}</h3>
                      <Badge variant="secondary" className="font-dash-mono text-[10px] border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-muted)]">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id, member.name)}
                      className="text-[var(--dash-text-muted)] hover:text-[var(--dash-red)] hover:bg-[var(--dash-red)]/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--dash-border)]">
                  <div className="text-center">
                    <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">Jobs</p>
                    <p className="font-dash-condensed font-bold text-[var(--dash-text-muted)]">{member.total_jobs_completed || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">Rating</p>
                    <p className="font-dash-condensed font-bold text-[var(--dash-text-muted)]">{(member.average_rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">Earned</p>
                    <p className="font-dash-condensed font-bold text-[var(--dash-text-muted)]">${(member.total_earnings || 0).toFixed(2)}</p>
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
