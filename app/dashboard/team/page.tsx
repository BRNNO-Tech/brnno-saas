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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Team Management</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage your team members and assignments
                    </p>
                </div>
                <AddTeamMemberButton />
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-600/10 dark:from-blue-600/20 via-blue-500/5 dark:via-blue-500/10 to-cyan-500/10 dark:to-cyan-500/20 border-blue-500/20 dark:border-blue-500/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Team Members
                        </CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white">{activeMembers.length}</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            {members.length - activeMembers.length} inactive
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-600/10 dark:from-green-600/20 via-green-500/5 dark:via-green-500/10 to-emerald-500/10 dark:to-emerald-500/20 border-green-500/20 dark:border-green-500/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Jobs Completed
                        </CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white">{totalJobsCompleted}</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            All time
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-600/10 dark:from-emerald-600/20 via-emerald-500/5 dark:via-emerald-500/10 to-teal-500/10 dark:to-teal-500/20 border-emerald-500/20 dark:border-emerald-500/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Total Earnings
                        </CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                            ${totalEarnings.toFixed(2)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            Team total
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-600/10 dark:from-yellow-600/20 via-yellow-500/5 dark:via-yellow-500/10 to-amber-500/10 dark:to-amber-500/20 border-yellow-500/20 dark:border-yellow-500/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Avg Rating
                        </CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                            <Award className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white">{avgRating.toFixed(1)}</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
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
