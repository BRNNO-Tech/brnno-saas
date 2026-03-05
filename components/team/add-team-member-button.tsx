'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createTeamMember } from '@/lib/actions/team'

export default function AddTeamMemberButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await createTeamMember(formData)
      setOpen(false)
      formRef.current?.reset()
    } catch (error) {
      console.error('Error creating team member:', error)
      alert('Failed to create team member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl dashboard-theme bg-[var(--dash-graphite)] border-[var(--dash-border)] text-[var(--dash-text)]">
        <DialogHeader>
          <DialogTitle className="font-dash-condensed font-bold text-[var(--dash-text)]">Add Team Member</DialogTitle>
          <DialogDescription className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            Add a new member to your team. Fill in their details below.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)]">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="John Doe"
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
              <div>
                <Label htmlFor="email" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
              <div>
                <Label htmlFor="role" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Role *</Label>
                <select
                  id="role"
                  name="role"
                  required
                  className="mt-1 block w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
                >
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills & Pay */}
          <div className="space-y-4 border-t border-[var(--dash-border)] pt-4">
            <h3 className="font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)]">Skills & Compensation</h3>

            <div>
              <Label htmlFor="skills" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Skills</Label>
              <Input
                id="skills"
                name="skills"
                placeholder="ceramic coating, paint correction, interior detail"
                className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)]"
              />
              <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-1">
                Comma-separated list
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourly_rate" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
              <div>
                <Label htmlFor="commission_rate" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  name="commission_rate"
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--dash-border)] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
            >
              {loading ? 'Creating...' : 'Add Team Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
