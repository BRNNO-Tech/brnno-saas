import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { updateJobStatus } from '@/lib/actions/jobs'
import { MOCK_BUSINESS } from '@/lib/demo/mock-data'

const DEMO_COOKIE = 'demo-mode'

const VALID_STATUSES = new Set(['scheduled', 'in_progress', 'completed', 'cancelled'])

export async function POST(request: NextRequest) {
  let body: {
    type?: string
    jobId?: string
    status?: string
    businessId?: string
    label?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 })
  }

  const businessIdRaw = typeof body.businessId === 'string' ? body.businessId.trim() : ''
  const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : ''
  const statusRaw = typeof body.status === 'string' ? body.status.trim() : ''

  if (body.type !== 'updateJobStatus') {
    return NextResponse.json(
      { success: false, message: 'Unsupported or missing action type (expected updateJobStatus).' },
      { status: 400 }
    )
  }

  if (!businessIdRaw || !jobId || !statusRaw) {
    return NextResponse.json(
      { success: false, message: 'businessId, jobId, and status are required.' },
      { status: 400 }
    )
  }

  if (!VALID_STATUSES.has(statusRaw)) {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid status. Use one of: ${Array.from(VALID_STATUSES).join(', ')}.`,
      },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()
  const isDemo = cookieStore.get(DEMO_COOKIE)?.value === 'true'

  if (isDemo) {
    if (businessIdRaw !== MOCK_BUSINESS.id) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
    }
    return NextResponse.json({
      success: true,
      message: 'Demo mode — job status was not saved (preview only).',
    })
  }

  const supabaseUser = await createClient()
  const {
    data: { user },
  } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
  }

  const { data: owned, error: ownErr } = await supabaseUser
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (ownErr || !owned?.id || owned.id !== businessIdRaw) {
    return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
  }

  const { data: bizForGate } = await supabaseUser
    .from('businesses')
    .select('modules, billing_plan, subscription_plan, subscription_status, subscription_ends_at')
    .eq('id', businessIdRaw)
    .single()

  if (!bizForGate || !canAccess(bizForGate, user.email ?? null, 'aiAssistant')) {
    return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
  }

  try {
    await updateJobStatus(jobId, statusRaw as 'scheduled' | 'in_progress' | 'completed' | 'cancelled')
    return NextResponse.json({ success: true, message: 'Job updated successfully.' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update job.'
    return NextResponse.json({ success: false, message: msg })
  }
}
