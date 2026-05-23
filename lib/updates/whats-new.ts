export const CURRENT_UPDATE_VERSION = '2026-05-v1'

export interface UpdateEntry {
  title: string
  description: string
  type: 'moved' | 'new' | 'improved' | 'removed'
}

export interface UpdateRelease {
  version: string
  title: string
  date: string
  entries: UpdateEntry[]
}

export const currentRelease: UpdateRelease = {
  version: CURRENT_UPDATE_VERSION,
  title: 'Platform Cleanup',
  date: 'May 2026',
  entries: [
    {
      title: 'Reviews → Marketing',
      description: 'Reviews now lives as a tab inside the Marketing section. Same features, cleaner nav.',
      type: 'moved',
    },
    {
      title: 'Reviews + Marketing = One Suite',
      description: 'Review automation is now included in the Marketing Suite. More tools, one plan.',
      type: 'improved',
    },
    {
      title: 'Auto Follow-Up → Leads',
      description: 'Auto Follow-Up is now a tab inside Leads. One place for all your lead management.',
      type: 'moved',
    },
    {
      title: 'Maintenance → Services',
      description: 'Maintenance plans moved into Services. A maintenance plan is just a recurring service.',
      type: 'moved',
    },
    {
      title: 'Checklists → Inventory',
      description: 'Checklist Templates now live inside Inventory as a tab.',
      type: 'moved',
    },
    {
      title: 'Mileage removed',
      description: 'Removed the Mileage tracker to keep things focused on what you use most.',
      type: 'removed',
    },
    {
      title: 'Cleaner navigation',
      description: 'Sidebar went from 19 items to 12. Less clutter, easier to find what you need.',
      type: 'improved',
    },
  ],
}

const ENTRY_DOT_COLOR: Record<UpdateEntry['type'], string> = {
  moved: '#6BA3D6',
  new: '#5DCAA5',
  improved: '#EF9F27',
  removed: '#E24B4A',
}

export function getEntryDotColor(type: UpdateEntry['type']): string {
  return ENTRY_DOT_COLOR[type]
}
