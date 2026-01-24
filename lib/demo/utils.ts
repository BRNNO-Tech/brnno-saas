'use server'

import { cookies } from 'next/headers'

const DEMO_MODE_COOKIE = 'demo-mode'
const DEMO_MODE_VALUE = 'true'

/**
 * Checks if the current request is in demo mode
 */
export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies()
  const demoMode = cookieStore.get(DEMO_MODE_COOKIE)
  return demoMode?.value === DEMO_MODE_VALUE
}

/**
 * Sets demo mode cookie
 */
export async function setDemoMode(enabled: boolean) {
  const cookieStore = await cookies()
  if (enabled) {
    cookieStore.set(DEMO_MODE_COOKIE, DEMO_MODE_VALUE, {
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: false, // Allow client-side access
      sameSite: 'lax',
      path: '/',
    })
  } else {
    cookieStore.delete(DEMO_MODE_COOKIE)
  }
}
