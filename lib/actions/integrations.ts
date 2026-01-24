'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'
import crypto from 'crypto'

/**
 * Generates a secure API key
 */
function generateAPIKey(): string {
  // Generate a secure random API key
  // Format: brnno_sk_live_<64 random hex characters>
  const randomBytes = crypto.randomBytes(32)
  const key = randomBytes.toString('hex')
  return `brnno_sk_live_${key}`
}

/**
 * Generates or regenerates an API key for the business
 */
export async function generateAPIKeyForBusiness() {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const apiKey = generateAPIKey()

  const { error } = await supabase
    .from('businesses')
    .update({ api_key: apiKey })
    .eq('id', businessId)

  if (error) {
    console.error('Error generating API key:', error)
    throw new Error(`Failed to generate API key: ${error.message}`)
  }

  revalidatePath('/dashboard/settings')
  return { success: true, apiKey }
}

/**
 * Adds a webhook endpoint
 */
export async function addWebhookEndpoint(data: {
  url: string
  events?: string[]
  active?: boolean
}) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get current webhook endpoints
  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('webhook_endpoints')
    .eq('id', businessId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch business: ${fetchError.message}`)
  }

  // Parse existing webhooks or initialize empty array
  const existingWebhooks = (business?.webhook_endpoints as any[]) || []

  // Add new webhook
  const newWebhook = {
    id: crypto.randomUUID(),
    url: data.url,
    events: data.events || [],
    active: data.active !== false,
    created_at: new Date().toISOString(),
    last_triggered: null,
  }

  const updatedWebhooks = [...existingWebhooks, newWebhook]

  const { error } = await supabase
    .from('businesses')
    .update({ webhook_endpoints: updatedWebhooks })
    .eq('id', businessId)

  if (error) {
    console.error('Error adding webhook endpoint:', error)
    throw new Error(`Failed to add webhook endpoint: ${error.message}`)
  }

  revalidatePath('/dashboard/settings')
  return { success: true, webhook: newWebhook }
}

/**
 * Removes a webhook endpoint
 */
export async function removeWebhookEndpoint(webhookId: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get current webhook endpoints
  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('webhook_endpoints')
    .eq('id', businessId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch business: ${fetchError.message}`)
  }

  const existingWebhooks = (business?.webhook_endpoints as any[]) || []
  const updatedWebhooks = existingWebhooks.filter((w: any) => w.id !== webhookId)

  const { error } = await supabase
    .from('businesses')
    .update({ webhook_endpoints: updatedWebhooks })
    .eq('id', businessId)

  if (error) {
    console.error('Error removing webhook endpoint:', error)
    throw new Error(`Failed to remove webhook endpoint: ${error.message}`)
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Tests a webhook endpoint by sending a test event
 */
export async function testWebhookEndpoint(webhookId: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get current webhook endpoints
  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('webhook_endpoints')
    .eq('id', businessId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch business: ${fetchError.message}`)
  }

  const webhooks = (business?.webhook_endpoints as any[]) || []
  const webhook = webhooks.find((w: any) => w.id === webhookId)

  if (!webhook) {
    throw new Error('Webhook endpoint not found')
  }

  if (!webhook.active) {
    throw new Error('Webhook endpoint is not active')
  }

  // Send test webhook
  try {
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from BRNNO',
        business_id: businessId,
      },
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BRNNO-Webhook-Event': 'webhook.test',
      },
      body: JSON.stringify(testPayload),
    })

    // Update last_triggered timestamp
    const updatedWebhooks = webhooks.map((w: any) =>
      w.id === webhookId
        ? { ...w, last_triggered: new Date().toISOString() }
        : w
    )

    await supabase
      .from('businesses')
      .update({ webhook_endpoints: updatedWebhooks })
      .eq('id', businessId)

    if (response.ok) {
      return { success: true, status: response.status, message: 'Webhook test successful' }
    } else {
      return {
        success: false,
        status: response.status,
        message: `Webhook returned status ${response.status}`,
      }
    }
  } catch (error) {
    console.error('Error testing webhook:', error)
    throw new Error(
      error instanceof Error
        ? `Failed to test webhook: ${error.message}`
        : 'Failed to test webhook'
    )
  }
}
