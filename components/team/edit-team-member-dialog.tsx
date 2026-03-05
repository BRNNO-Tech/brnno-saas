'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit } from 'lucide-react'
import { updateTeamMember } from '@/lib/actions/team'
import { useToast } from '@/components/ui/use-toast'

type TeamMember = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  skills: string[] | null
  hourly_rate: number | null
  commission_rate: number | null
}

export default function EditTeamMemberDialog({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      await updateTeamMember(member.id, formData)
      toast({
        title: 'Success',
        description: 'Team member updated successfully',
      })
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team member',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-[var(--dash-text-muted)] hover:text-[var(--dash-amber)] hover:bg-[var(--dash-surface)]">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="dashboard-theme bg-[var(--dash-graphite)] border-[var(--dash-border)] text-[var(--dash-text)]">
        <DialogHeader>
          <DialogTitle className="font-dash-condensed font-bold text-[var(--dash-text)]">Edit Team Member</DialogTitle>
          <DialogDescription className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            Update team member details.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={member.name}
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={member.email}
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={member.phone || ''}
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Role</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={member.role}
                  className="flex h-10 w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
                >
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Skills (comma separated)</Label>
              <Input
                id="skills"
                name="skills"
                defaultValue={member.skills?.join(', ') || ''}
                className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={member.hourly_rate || ''}
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission_rate" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Commission (%)</Label>
                <Input
                  id="commission_rate"
                  name="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={member.commission_rate || ''}
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
