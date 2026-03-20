'use server'

import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'
import { getBusiness } from './business'
import { isDemoMode } from '@/lib/demo/utils'
import { getMockInvoices } from '@/lib/demo/mock-data'

function getAppBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (raw?.trim()) return raw.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel?.trim()) return `https://${vercel.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function asSingle<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null
  return Array.isArray(x) ? (x[0] ?? null) : x
}

export type SendInvoiceMethod = 'email' | 'sms'

export async function getInvoices() {
  if (await isDemoMode()) {
    return getMockInvoices()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const business = await getBusiness()
  if (!business?.id) {
    return []
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(name, email, phone),
      invoice_items(*),
      payments(*),
      business:businesses(twilio_account_sid, twilio_subaccount_sid, twilio_phone_number, surge_api_key, surge_account_id)
    `)
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getInvoices] Supabase error:', error.code, error.message, error.details)
    return []
  }
  return invoices || []
}

export async function generateInvoiceShareToken(invoiceId: string) {
  if (await isDemoMode()) {
    throw new Error('Invoice sharing is not available in demo mode')
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { data: existing, error: fetchError } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('business_id', businessId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) throw new Error('Invoice not found')

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      share_token: token,
      share_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', invoiceId)
    .eq('business_id', businessId)

  if (updateError) throw updateError

  revalidatePath('/dashboard/invoices')
  const base = getAppBaseUrl()
  return `${base}/invoice/${token}`
}

/** Returns a public invoice URL, reusing a valid share token when possible. */
export async function getOrCreateInvoicePublicUrl(invoiceId: string) {
  if (await isDemoMode()) {
    throw new Error('Invoice sharing is not available in demo mode')
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: row, error } = await supabase
    .from('invoices')
    .select('id, share_token, share_token_expires_at')
    .eq('id', invoiceId)
    .eq('business_id', businessId)
    .maybeSingle()

  if (error) throw error
  if (!row) throw new Error('Invoice not found')

  const now = Date.now()
  const expiresMs = row.share_token_expires_at
    ? new Date(row.share_token_expires_at).getTime()
    : null
  const tokenUsable =
    !!row.share_token && (!expiresMs || expiresMs > now)

  if (tokenUsable && row.share_token) {
    const base = getAppBaseUrl()
    return `${base}/invoice/${row.share_token}`
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      share_token: token,
      share_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', invoiceId)
    .eq('business_id', businessId)

  if (updateError) throw updateError

  revalidatePath('/dashboard/invoices')
  const base = getAppBaseUrl()
  return `${base}/invoice/${token}`
}

export async function sendInvoice(
  invoiceId: string,
  method: SendInvoiceMethod
): Promise<
  { success: true; method: SendInvoiceMethod } | { success: false; method: SendInvoiceMethod; error: string }
> {
  if (await isDemoMode()) {
    return { success: false, method, error: 'Sending invoices is not available in demo mode.' }
  }

  try {
    const businessId = await getBusinessId()
    const supabase = await createClient()

    const { data: inv, error: invError } = await supabase
      .from('invoices')
      .select(
        `id, total, status, paid_amount,
        client:clients(name, email, phone),
        invoice_items(name, quantity, price)`
      )
      .eq('id', invoiceId)
      .eq('business_id', businessId)
      .maybeSingle()

    if (invError) {
      console.error('[sendInvoice] load invoice:', invError)
      return { success: false, method, error: invError.message || 'Failed to load invoice' }
    }
    if (!inv) {
      return { success: false, method, error: 'Invoice not found' }
    }

    const client = asSingle(
      inv.client as unknown as { name: string | null; email: string | null; phone: string | null } | null
    )
    const items =
      (inv.invoice_items as Array<{ name: string; quantity: number; price: number }> | null) ?? []

    let publicUrl: string
    try {
      publicUrl = await getOrCreateInvoicePublicUrl(invoiceId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create invoice link'
      return { success: false, method, error: msg }
    }

    const business = await getBusiness()
    if (!business) {
      return { success: false, method, error: 'Business not found' }
    }

    const bizName = String((business as { name?: string }).name || 'Your business').replace(/[\r\n]/g, '')

    if (method === 'email') {
      const email = client?.email?.trim()
      if (!email) {
        return { success: false, method, error: 'This client has no email address.' }
      }

      const { Resend } = await import('resend')
      const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
      if (!resend) {
        return { success: false, method, error: 'Email is not configured (missing RESEND_API_KEY).' }
      }

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      const subject = `Invoice from ${bizName}`

      const clientName = client?.name?.trim() || 'there'
      const totalStr = Number(inv.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      const itemsRows = items
        .map(
          (row) =>
            `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(row.name)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${Number(row.quantity)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(row.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(Number(row.price) * Number(row.quantity)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>`
        )
        .join('')

      const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Hi ${escapeHtml(clientName)},</p>
  <p>You have an invoice from <strong>${escapeHtml(bizName)}</strong>.</p>
  <table style="border-collapse: collapse; width: 100%; max-width: 480px; margin: 16px 0;">
    <thead><tr><th align="left" style="padding:8px;border-bottom:2px solid #ccc">Item</th><th style="padding:8px;border-bottom:2px solid #ccc">Qty</th><th align="right" style="padding:8px;border-bottom:2px solid #ccc">Price</th><th align="right" style="padding:8px;border-bottom:2px solid #ccc">Amount</th></tr></thead>
    <tbody>${itemsRows || '<tr><td colspan="4" style="padding:8px">(see invoice for details)</td></tr>'}</tbody>
  </table>
  <p style="font-size: 18px; font-weight: 600;">Total: ${escapeHtml(totalStr)}</p>
  <p style="margin-top: 24px;">
    <a href="${escapeHtml(publicUrl)}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">View &amp; Pay Invoice</a>
  </p>
  <p style="color: #666; font-size: 13px; margin-top: 24px;">If the button doesn’t work, copy this link:<br/><a href="${escapeHtml(publicUrl)}">${escapeHtml(publicUrl)}</a></p>
</body>
</html>`

      const fromHeader = `${bizName.slice(0, 80)} <${fromEmail}>`
      const result = await resend.emails.send({
        from: fromHeader,
        to: email,
        subject,
        html,
      })

      if (result.error) {
        return { success: false, method, error: result.error.message || 'Failed to send email' }
      }

      return { success: true, method }
    }

    if (method === 'sms') {
      const rawPhone = client?.phone?.trim()
      if (!rawPhone) {
        return { success: false, method, error: 'This client has no phone number.' }
      }

      const { normalizePhoneNumber } = await import('@/lib/utils/phone')
      const to = normalizePhoneNumber(rawPhone)
      if (!to) {
        return { success: false, method, error: 'Invalid phone number for this client.' }
      }

      const { hasSMSCredits, decrementSMSCredits } = await import('./sms-credits')
      if (!(await hasSMSCredits(businessId))) {
        return {
          success: false,
          method,
          error: 'No SMS credits remaining. Contact support to add more credits.',
        }
      }

      const { getTwilioCredentials } = await import('./twilio-subaccounts')
      const subaccountCreds = await getTwilioCredentials(businessId)
      const businessWithFields = business as Record<string, unknown>

      let smsProvider: 'surge' | 'twilio' | null = null
      if (businessWithFields.sms_provider === 'surge' || businessWithFields.sms_provider === 'twilio') {
        smsProvider = businessWithFields.sms_provider as 'surge' | 'twilio'
      } else {
        if (businessWithFields.surge_api_key && businessWithFields.surge_account_id) {
          smsProvider = 'surge'
        } else if (
          subaccountCreds?.accountSid ||
          businessWithFields.twilio_account_sid ||
          process.env.TWILIO_ACCOUNT_SID
        ) {
          smsProvider = 'twilio'
        }
      }

      if (!smsProvider) {
        return {
          success: false,
          method,
          error: 'No SMS provider configured. Set up SMS in Settings → Channels.',
        }
      }

      type SMSProviderConfig = import('@/lib/sms/providers').SMSProviderConfig
      const config: SMSProviderConfig = {
        provider: smsProvider,
      }

      if (smsProvider === 'surge') {
        config.surgeApiKey = (businessWithFields.surge_api_key as string) || undefined
        config.surgeAccountId = (businessWithFields.surge_account_id as string) || undefined
        if (!config.surgeApiKey || !config.surgeAccountId) {
          return { success: false, method, error: 'Surge credentials not configured.' }
        }
      } else {
        if (subaccountCreds?.accountSid && subaccountCreds?.authToken && subaccountCreds?.phoneNumber) {
          config.twilioAccountSid = subaccountCreds.accountSid
          config.twilioAuthToken = subaccountCreds.authToken
          config.twilioPhoneNumber = subaccountCreds.phoneNumber
        } else if (businessWithFields.twilio_account_sid) {
          config.twilioAccountSid = businessWithFields.twilio_account_sid as string
          config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || undefined
          config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || undefined
        } else {
          config.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || undefined
          config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || undefined
          config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || undefined
        }
        if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
          return {
            success: false,
            method,
            error: 'Twilio credentials not configured. Check environment variables and SMS settings.',
          }
        }
      }

      const { sendSMS } = await import('@/lib/sms/providers')
      const clientDisplay = client?.name?.trim() || 'there'
      const message = `Hi ${clientDisplay}, your invoice from ${bizName} is ready. View and pay here: ${publicUrl}`

      const result = await sendSMS(config, {
        to,
        body: message,
        fromName: (businessWithFields.sender_name as string) || bizName || 'BRNNO',
        contactFirstName: clientDisplay.split(' ')[0] || undefined,
        contactLastName: clientDisplay.split(' ').slice(1).join(' ') || undefined,
      })

      if (!result.success) {
        return { success: false, method, error: result.error || 'Failed to send SMS' }
      }

      await decrementSMSCredits(businessId, 1)
      return { success: true, method }
    }

    return { success: false, method, error: 'Invalid send method' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error'
    console.error('[sendInvoice]', e)
    return { success: false, method, error: msg }
  }
}

function normalizeInvoiceItemServiceId(serviceId: string | null | undefined) {
  const s = typeof serviceId === 'string' ? serviceId.trim() : ''
  return s.length > 0 ? s : null
}

export async function addInvoice(
  clientId: string,
  items: Array<{ service_id?: string | null; name: string; description?: string; price: number; quantity: number }>,
  options?: { notes?: string; discount_code?: string; discount_amount?: number }
) {
  if (await isDemoMode()) {
    throw new Error(
      'Creating invoices is not available in demo mode. Turn off demo mode to use your real business data.'
    )
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = options?.discount_amount || 0
  const total = Math.max(0, subtotal - discountAmount)
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      business_id: businessId,
      client_id: clientId,
      total,
      status: 'unpaid',
      paid_amount: 0,
      discount_code: options?.discount_code || null,
      discount_amount: discountAmount || null,
      notes: options?.notes || null,
    })
    .select()
    .single()
  
  if (invoiceError) {
    console.error('[addInvoice] invoices insert:', invoiceError)
    throw new Error(invoiceError.message || 'Failed to create invoice')
  }

  const invoiceItems = items.map(item => ({
    invoice_id: invoice.id,
    service_id: normalizeInvoiceItemServiceId(item.service_id),
    name: item.name,
    description: item.description || null,
    price: item.price,
    quantity: item.quantity,
  }))
  
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems)

  if (itemsError) {
    console.error('[addInvoice] invoice_items insert:', itemsError)
    throw new Error(itemsError.message || 'Failed to save invoice line items')
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard')
  return invoice
}

export async function recordPayment(invoiceId: string, amount: number, paymentMethod: string, referenceNumber?: string, notes?: string) {
  if (await isDemoMode()) {
    throw new Error('Recording payments is not available in demo mode.')
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()
  
  if (invoiceError) throw invoiceError
  
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      business_id: businessId,
      invoice_id: invoiceId,
      amount,
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      notes: notes || null,
    })
  
  if (paymentError) throw paymentError
  
  const newPaidAmount = (invoice.paid_amount || 0) + amount
  const newStatus = newPaidAmount >= invoice.total ? 'paid' : 'unpaid'
  
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ paid_amount: newPaidAmount, status: newStatus })
    .eq('id', invoiceId)
  
  if (updateError) throw updateError
  
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
}

export async function markInvoiceAsPaid(invoiceId: string) {
  if (await isDemoMode()) {
    throw new Error('Marking invoices paid is not available in demo mode.')
  }

  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('total, paid_amount')
    .eq('id', invoiceId)
    .single()
  
  if (!invoice) throw new Error('Invoice not found')
  
  const remainingAmount = invoice.total - (invoice.paid_amount || 0)
  await recordPayment(invoiceId, remainingAmount, 'Cash', undefined, 'Quick payment')
  
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
}

export async function updateInvoice(
  id: string,
  data: {
    client_id?: string
    items?: Array<{ service_id?: string | null; name: string; description?: string; price: number; quantity: number }>
    notes?: string
    discount_code?: string
    discount_amount?: number
  }
) {
  if (await isDemoMode()) {
    throw new Error('Editing invoices is not available in demo mode.')
  }

  const supabase = await createClient()

  // Recalculate total if items are provided
  let updatePayload: Record<string, any> = {}

  if (data.client_id !== undefined) updatePayload.client_id = data.client_id
  if (data.notes !== undefined) updatePayload.notes = data.notes
  if (data.discount_code !== undefined) updatePayload.discount_code = data.discount_code || null
  if (data.discount_amount !== undefined) updatePayload.discount_amount = data.discount_amount || null

  if (data.items) {
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discountAmount = data.discount_amount || 0
    updatePayload.total = Math.max(0, subtotal - discountAmount)
  }

  // Update invoice fields
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update(updatePayload)
    .eq('id', id)

  if (invoiceError) throw invoiceError

  // Replace line items if provided
  if (data.items) {
    // Delete existing items
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id)

    if (deleteError) throw deleteError

    // Insert new items
    if (data.items.length > 0) {
      const newItems = data.items.map(item => ({
        invoice_id: id,
        service_id: normalizeInvoiceItemServiceId(item.service_id),
        name: item.name,
        description: item.description || null,
        price: item.price,
        quantity: item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(newItems)

      if (itemsError) throw itemsError
    }
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard')
}

export async function deleteInvoice(id: string) {
  if (await isDemoMode()) {
    throw new Error('Deleting invoices is not available in demo mode.')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
}

export async function createInvoiceFromJob(jobId: string) {
  if (await isDemoMode()) {
    return null
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select(`id, client_id, service_type, estimated_cost, title, description`)
    .eq('id', jobId)
    .single()
  
  if (jobError || !job) {
    console.error('Error fetching job for invoice creation:', jobError)
    return null
  }
  
  if (!job.client_id) {
    console.log('Job has no client_id, skipping invoice creation')
    return null
  }
  
  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('id, created_at')
    .eq('client_id', job.client_id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (recentInvoices && recentInvoices.length > 0) {
    const mostRecent = recentInvoices[0]
    const invoiceTime = new Date(mostRecent.created_at).getTime()
    const now = Date.now()
    if (now - invoiceTime < 120000) {
      console.log('Recent invoice found, may be for this job')
    }
  }
  
  let serviceId: string | null = null
  let servicePrice: number | null = null
  let serviceName: string = job.service_type || job.title || 'Service'
  let serviceDescription: string | null = job.description || null
  
  if (job.service_type) {
    const { data: services } = await supabase
      .from('services')
      .select('id, name, price, description')
      .eq('business_id', businessId)
      .ilike('name', `%${job.service_type}%`)
      .limit(1)
      .single()
    
    if (services) {
      serviceId = services.id
      servicePrice = services.price
      serviceName = services.name
      serviceDescription = services.description || serviceDescription
    }
  }
  
  const invoiceTotal = job.estimated_cost || servicePrice || 0
  
  const invoiceData: Record<string, unknown> = {
    business_id: businessId,
    client_id: job.client_id,
    total: invoiceTotal,
    status: 'unpaid',
    paid_amount: 0,
  }

  // job_id links invoice to job (requires migration 20250312000000_invoices_job_id)
  invoiceData.job_id = jobId

  let invoice: { id: string } | null = null
  const { data: inserted, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()

  if (invoiceError) {
    if (invoiceError.code === 'PGRST204' && invoiceError.message?.includes('job_id')) {
      delete invoiceData.job_id
      const retry = await supabase.from('invoices').insert(invoiceData).select().single()
      if (retry.error) {
        console.error('Error creating invoice from job:', retry.error)
        return null
      }
      invoice = retry.data
    } else {
      console.error('Error creating invoice from job:', invoiceError)
      return null
    }
  } else {
    invoice = inserted
  }

  if (!invoice) return null

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert({
      invoice_id: invoice.id,
      service_id: serviceId,
      name: serviceName,
      description: serviceDescription,
      price: invoiceTotal,
      quantity: 1,
    })
  
  if (itemsError) {
    console.error('Error creating invoice items:', itemsError)
  }
  
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/jobs')
  return invoice
}
