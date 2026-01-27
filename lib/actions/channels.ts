'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusiness } from './business'
import { Resend } from 'resend'
import type { SMSProviderConfig } from '@/lib/sms/providers'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

/**
 * Sends a test email to the business owner
 */
export async function sendTestEmail() {
  const business = await getBusiness()

  if (!business) {
    throw new Error('No business found')
  }

  // Type assertion for properties that may not be in the base type
  const businessWithFields = business as any

  if (!businessWithFields.email) {
    throw new Error('Business email not set. Please add an email in Business Profile settings.')
  }

  if (!resend) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY in environment variables.')
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const senderName = businessWithFields.sender_name || business.name || 'BRNNO'

  try {
    const result = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: businessWithFields.email,
      subject: 'Test Email from BRNNO',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #18181b; margin-bottom: 20px;">Test Email Successful! ✅</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            This is a test email from your BRNNO account. If you received this, your email channel is working correctly!
          </p>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #18181b;">Email Configuration</h3>
            <ul style="list-style: none; padding: 0; color: #52525b;">
              <li style="margin-bottom: 10px;"><strong>From:</strong> ${senderName} &lt;${fromEmail}&gt;</li>
              <li style="margin-bottom: 10px;"><strong>To:</strong> ${businessWithFields.email}</li>
              <li style="margin-bottom: 10px;"><strong>Provider:</strong> Resend</li>
            </ul>
          </div>

          <p style="color: #71717a; font-size: 14px; margin-top: 40px; line-height: 1.6;">
            This test email confirms that automated emails (booking confirmations, lead follow-ups, etc.) will be sent correctly.
          </p>
        </div>
      `
    })

    if (result.error) {
      throw new Error(result.error.message || 'Failed to send test email')
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Error sending test email:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to send test email')
  }
}

/**
 * Sends a test SMS using the configured provider (Surge or Twilio)
 */
export async function sendTestSMS(phoneNumber?: string) {
  const business = await getBusiness()

  if (!business) {
    throw new Error('No business found')
  }

  // Type assertion for properties that may not be in the base type
  const businessWithFields = business as any

  // Track if using AI Auto Lead subaccount for credit tracking
  let isUsingSubaccount = false

  // Determine which provider to use
  // Priority: 1. Explicit sms_provider setting, 2. Check for credentials
  let smsProvider: 'surge' | 'twilio' | null = null

  // Debug logging
  console.log('[sendTestSMS] Provider detection:', {
    sms_provider: businessWithFields.sms_provider,
    has_surge_key: !!businessWithFields.surge_api_key,
    has_surge_account: !!businessWithFields.surge_account_id,
    has_twilio_sid: !!businessWithFields.twilio_account_sid,
  })

  // Check explicit provider setting first
  if (businessWithFields.sms_provider === 'surge' || businessWithFields.sms_provider === 'twilio') {
    smsProvider = businessWithFields.sms_provider as 'surge' | 'twilio'
    console.log('[sendTestSMS] Using explicit provider:', smsProvider)
  } else {
    // Fallback: check which credentials are available
    // Prioritize Surge if both Surge credentials exist
    if (businessWithFields.surge_api_key && businessWithFields.surge_account_id) {
      smsProvider = 'surge'
      console.log('[sendTestSMS] Using Surge (credentials found)')
    } else if (businessWithFields.twilio_account_sid) {
      smsProvider = 'twilio'
      console.log('[sendTestSMS] Using Twilio (credentials found)')
    } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // If Twilio env vars are set, use Twilio as default
      smsProvider = 'twilio'
      console.log('[sendTestSMS] Using Twilio (env vars found)')
    }
  }

  if (!smsProvider) {
    throw new Error('No SMS provider configured. Please connect Surge or Twilio in Channels settings.')
  }

  console.log('[sendTestSMS] Selected provider:', smsProvider)

  // Use business phone or provided phone number
  let toPhone = phoneNumber || businessWithFields.phone

  console.log('[sendTestSMS] Phone number check:', {
    provided: phoneNumber,
    businessPhone: businessWithFields.phone,
    final: toPhone,
  })

  if (!toPhone) {
    throw new Error('No phone number available. Please provide a phone number or add one in Business Profile settings.')
  }

  // Trim whitespace
  toPhone = toPhone.trim()

  // Validate phone number doesn't contain masking characters BEFORE sending
  const hasMaskingChars = /[Xx*]/.test(toPhone)
  if (hasMaskingChars) {
    console.error('[sendTestSMS] Invalid phone number detected (masking chars):', toPhone)
    throw new Error(`Invalid phone number format: ${toPhone}. The phone number appears to be masked or incomplete. Please update your business phone number in Business Profile settings with a complete phone number in E.164 format (e.g., +15551234567).`)
  }

  // Additional validation: ensure phone number has enough digits after normalization
  const digitsOnly = toPhone.replace(/\D/g, '')
  if (digitsOnly.length < 10) {
    console.error('[sendTestSMS] Phone number too short:', toPhone, 'digits:', digitsOnly.length)
    throw new Error(`Invalid phone number format: ${toPhone}. Phone number must have at least 10 digits. Please update your business phone number in Business Profile settings.`)
  }

  console.log('[sendTestSMS] Phone number validated:', toPhone, 'digits:', digitsOnly.length)

  const senderName = businessWithFields.sender_name || business.name || 'BRNNO'
  const message = `Test SMS from ${senderName} via BRNNO. Your SMS channel is working correctly! ✅`

  // Import the SMS provider abstraction
  const { sendSMS } = await import('@/lib/sms/providers')

  // Build provider config based on selected provider
  const config: SMSProviderConfig = {
    provider: smsProvider,
  }

  // Only include credentials for the selected provider
  if (smsProvider === 'surge') {
    config.surgeApiKey = businessWithFields.surge_api_key || undefined
    config.surgeAccountId = businessWithFields.surge_account_id || undefined
    // Note: Surge SDK doesn't require a "from" phone number - it uses the account's default

    // Validate Surge credentials before sending
    if (!config.surgeApiKey || !config.surgeAccountId) {
      throw new Error('Surge API key or Account ID not configured. Please check your SMS settings.')
    }

    console.log('[sendTestSMS] Surge config:', {
      hasApiKey: !!config.surgeApiKey,
      hasAccountId: !!config.surgeAccountId,
      accountId: config.surgeAccountId?.substring(0, 10) + '...',
    })
  } else if (smsProvider === 'twilio') {
    // Check if business has their own Twilio subaccount (AI Auto Lead - auto-setup)
    const { getTwilioCredentials } = await import('./twilio-subaccounts')
    const subaccountCreds = await getTwilioCredentials()

    if (subaccountCreds) {
      // Use business's own Twilio subaccount (from AI Auto Lead)
      config.twilioAccountSid = subaccountCreds.accountSid
      config.twilioAuthToken = subaccountCreds.authToken
      config.twilioPhoneNumber = subaccountCreds.phoneNumber
      isUsingSubaccount = true

      console.log('[sendTestSMS] Using business Twilio subaccount (AI Auto Lead)')

      // Check SMS credits for AI Auto Lead users
      const { hasSMSCredits } = await import('./sms-credits')
      const hasCredits = await hasSMSCredits(business.id)
      if (!hasCredits) {
        throw new Error('SMS credit limit reached (500/month). Your credits will reset on the 1st of next month.')
      }
    } else {
      // Check if they manually entered their own Twilio credentials in Channels settings
      config.twilioAccountSid = businessWithFields.twilio_account_sid || undefined
      config.twilioAuthToken = businessWithFields.twilio_auth_token || undefined
      config.twilioPhoneNumber = businessWithFields.twilio_phone_number || undefined

      console.log('[sendTestSMS] Using manually configured Twilio credentials')
    }

    // Validate Twilio credentials before sending
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured. Please enter your Twilio Account SID, Auth Token, and Phone Number in Channels settings, or subscribe to AI Auto Lead for automatic setup.')
    }

    console.log('[sendTestSMS] Twilio config:', {
      hasAccountSid: !!config.twilioAccountSid,
      hasAuthToken: !!config.twilioAuthToken,
      hasPhoneNumber: !!config.twilioPhoneNumber,
      accountSidSource: businessWithFields.twilio_account_sid ? 'database' : 'env',
    })
  }

  console.log('[sendTestSMS] Final config provider:', config.provider)

  // Send the SMS
  const result = await sendSMS(config, {
    to: toPhone,
    body: message,
    fromName: senderName,
    contactFirstName: business.name?.split(' ')[0] || undefined,
    contactLastName: business.name?.split(' ').slice(1).join(' ') || undefined,
  })

  if (!result.success) {
    throw new Error(result.error || 'Failed to send test SMS')
  }

  // Decrement SMS credits for AI Auto Lead users (subaccount)
  if (smsProvider === 'twilio' && isUsingSubaccount) {
    const { decrementSMSCredits } = await import('./sms-credits')
    await decrementSMSCredits(business.id, 1)
  }

  return { success: true, messageId: result.messageId }
}
