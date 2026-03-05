import { getTeamMembers } from '@/lib/actions/team'
import AddTeamMemberButton from '@/components/team/add-team-member-button'
import TeamMemberList from '@/components/team/team-member-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Award, TrendingUp } from 'lucide-react'
import { canAccessTeamManagement } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'

export const revalidate = 60

export default async function TeamPage() {
    const canAccess = await canAccessTeamManagement()
    
    if (!canAccess) {
        return <UpgradePrompt requiredTier="pro" feature="Team Management" />
    }

    const members = await getTeamMembers()

    const activeMembers = members.filter(m => m.status === 'active')
    // Note: These fields (total_jobs_completed, total_earnings, average_rating) 
    // need to be calculated or added to the database schema/query later.
    // For now, we'll default them to 0 if they don't exist on the type.
    const totalJobsCompleted = members.reduce((sum, m) => sum + ((m as any).total_jobs_completed || 0), 0)
    const totalEarnings = members.reduce((sum, m) => sum + ((m as any).total_earnings || 0), 0)
    const avgRating = members.length > 0
        ? members.reduce((sum, m) => sum + ((m as any).average_rating || 0), 0) / members.length
        : 0

    return (
        <div className="w-full pb-20 md:pb-0 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
                        Team Management
                    </h1>
                    <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
                        Manage your team members and assignments
                    </p>
                </div>
                <AddTeamMemberButton />
            </div>

            {/* Stats Overview */}
            <div className="grid gap-px bg-[var(--dash-border)] border border-[var(--dash-border)] md:grid-cols-4">
                <Card className="rounded-none border-0 bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-blue)]">
                    <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                        <CardTitle className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)]">
                            Team Members
                        </CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-[var(--dash-blue)]/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-[var(--dash-blue)]" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="font-dash-condensed font-extrabold text-3xl text-[var(--dash-text)]">{activeMembers.length}</div>
                        <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-1">
                            {members.length - activeMembers.length} inactive
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-none border-0 bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-green)]">
                    <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                        <CardTitle className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)]">
                            Jobs Completed
                        </CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-[var(--dash-green)]/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-[var(--dash-green)]" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="font-dash-condensed font-extrabold text-3xl text-[var(--dash-text)]">{totalJobsCompleted}</div>
                        <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-1">
                            All time
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-none border-0 bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-amber)]">
                    <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                        <CardTitle className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)]">
                            Total Earnings
                        </CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-[var(--dash-amber)]/20 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-[var(--dash-amber)]" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="font-dash-condensed font-extrabold text-3xl text-[var(--dash-text)]">
                            ${totalEarnings.toFixed(2)}
                        </div>
                        <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-1">
                            Team total
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-none border-0 bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-text-muted)]">
                    <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                        <CardTitle className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)]">
                            Avg Rating
                        </CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-[var(--dash-surface)] flex items-center justify-center">
                            <Award className="h-5 w-5 text-[var(--dash-amber)]" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="font-dash-condensed font-extrabold text-3xl text-[var(--dash-text)]">{avgRating.toFixed(1)}</div>
                        <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-1">
                            ⭐ Team average
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Team List */}
            <TeamMemberList members={members.map(m => ({
                ...m,
                user_id: m.user_id || null,
                hourly_rate: (m as any).hourly_rate || null,
                commission_rate: (m as any).commission_rate || null,
                total_jobs_completed: (m as any).total_jobs_completed || 0,
                average_rating: (m as any).average_rating || 0,
                total_earnings: (m as any).total_earnings || 0,
            }))} />
        </div>
    )
}
