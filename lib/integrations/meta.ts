import { createHmac, timingSafeEqual } from 'crypto'
import type { MetaLeadFieldData } from '@/types/marketing'

const GRAPH_BASE = 'https://graph.facebook.com/v19.0'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not configured`)
  return v
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), { method: 'GET' })
  const json = (await res.json()) as { error?: { message?: string }; data?: unknown }
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API error: ${res.status}`)
  }
  return json as T
}

async function graphPostForm(path: string, body: URLSearchParams): Promise<void> {
  const url = `${GRAPH_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const json = (await res.json()) as { error?: { message?: string }; success?: boolean }
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API error: ${res.status}`)
  }
}

async function graphDeleteWithToken(path: string, accessToken: string): Promise<void> {
  const url = new URL(`${GRAPH_BASE}${path.startsWith('/') ? path : `/${path}`}`)
  url.searchParams.set('access_token', accessToken)
  const res = await fetch(url.toString(), { method: 'DELETE' })
  const json = (await res.json()) as { error?: { message?: string }; success?: boolean }
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API error: ${res.status}`)
  }
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const clientId = requireEnv('META_APP_ID')
  const clientSecret = requireEnv('META_APP_SECRET')
  const data = await graphGet<{ access_token: string }>('/oauth/access_token', {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  })
  if (!data.access_token) throw new Error('No access_token in OAuth response')
  return data.access_token
}

export async function getLongLivedToken(
  shortLivedToken: string
): Promise<{ token: string; expiresAt: Date }> {
  const clientId = requireEnv('META_APP_ID')
  const clientSecret = requireEnv('META_APP_SECRET')
  const data = await graphGet<{ access_token: string; expires_in?: number }>('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLivedToken,
  })
  if (!data.access_token) throw new Error('No access_token in long-lived response')
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 60 * 24 * 60 * 60
  const expiresAt = new Date(Date.now() + expiresIn * 1000)
  return { token: data.access_token, expiresAt }
}

export async function getPages(
  userAccessToken: string
): Promise<Array<{ id: string; name: string; access_token: string }>> {
  const data = await graphGet<{
    data?: Array<{ id: string; name: string; access_token: string }>
  }>('/me/accounts', {
    access_token: userAccessToken,
    fields: 'id,name,access_token',
  })
  return data.data ?? []
}

export async function subscribePageToLeadgen(pageId: string, pageAccessToken: string): Promise<void> {
  const body = new URLSearchParams({
    subscribed_fields: 'leadgen',
    access_token: pageAccessToken,
  })
  await graphPostForm(`/${pageId}/subscribed_apps`, body)
}

export async function unsubscribePageFromLeadgen(pageId: string, pageAccessToken: string): Promise<void> {
  await graphDeleteWithToken(`/${pageId}/subscribed_apps`, pageAccessToken)
}

export async function fetchLeadData(
  leadId: string,
  pageAccessToken: string
): Promise<{
  fieldData: MetaLeadFieldData[]
  createdTime: string
  adId: string
  adName: string
  formId: string
}> {
  const data = await graphGet<{
    field_data?: Array<{ name: string; values: string[] }>
    created_time?: string
    ad_id?: string
    ad_name?: string
    form_id?: string
  }>(`/${leadId}`, {
    access_token: pageAccessToken,
    fields: 'field_data,created_time,ad_id,ad_name,form_id',
  })
  const fieldData: MetaLeadFieldData[] = (data.field_data ?? []).map((f) => ({
    name: f.name,
    values: f.values ?? [],
  }))
  return {
    fieldData,
    createdTime: data.created_time ?? '',
    adId: data.ad_id ?? '',
    adName: data.ad_name ?? '',
    formId: data.form_id ?? '',
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !signature.startsWith('sha256=')) return false
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) return false
  const expectedHex = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  const receivedHex = signature.slice('sha256='.length)
  if (expectedHex.length !== receivedHex.length) return false
  try {
    return timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(receivedHex, 'hex'))
  } catch {
    return false
  }
}
