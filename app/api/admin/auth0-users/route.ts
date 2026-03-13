import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/permissions'

/**
 * GET /api/admin/auth0-users — recent Auth0 sign-ups (admin only).
 * If AUTH0_DOMAIN or AUTH0_MGMT_TOKEN are not set, returns { users: [], total: 0 }.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  const isAdmin = !!adminRow || isAdminEmail(user.email)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const domain = process.env.AUTH0_DOMAIN
  const token = process.env.AUTH0_MGMT_TOKEN
  if (!domain || !token) {
    return NextResponse.json({ users: [], total: 0 })
  }

  try {
    const response = await fetch(
      `https://${domain}/api/v2/users?sort=created_at:-1&per_page=50&include_totals=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('Auth0 error:', err)
      return NextResponse.json({ users: [], total: 0 })
    }

    const data = (await response.json()) as {
      users: Array<{
        user_id: string
        name?: string
        nickname?: string
        email?: string
        picture?: string
        created_at?: string
        identities?: Array<{ provider?: string }>
      }>
      total?: number
    }

    const users = data.users.map((u) => ({
      id: u.user_id,
      name: u.name || u.nickname || '—',
      email: u.email,
      picture: u.picture,
      createdAt: u.created_at,
      provider: u.identities?.[0]?.provider ?? 'email',
    }))

    return NextResponse.json({ users, total: data.total ?? users.length })
  } catch (err) {
    console.error('Auth0 route error:', err)
    return NextResponse.json({ users: [], total: 0 })
  }
}
