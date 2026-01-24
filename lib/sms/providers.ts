/**
 * SMS Provider Abstraction Layer
 * Supports multiple SMS providers (Surge, Twilio, etc.)
 */

export type SMSProvider = 'surge' | 'twilio'

export interface SMSProviderConfig {
  provider: SMSProvider
  // Surge config
  surgeApiKey?: string
  surgeAccountId?: string
  // Note: Surge SDK uses account's default phone number, no need for surgePhoneNumber
  // Twilio config
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioPhoneNumber?: string
}

export interface SendSMSOptions {
  to: string
  body: string
  fromName?: string
  contactFirstName?: string
  contactLastName?: string
}

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send SMS using the configured provider
 */
export async function sendSMS(
  config: SMSProviderConfig,
  options: SendSMSOptions
): Promise<SMSResult> {
  console.log('[sendSMS] Routing to provider:', config.provider)
  
  switch (config.provider) {
    case 'surge':
      console.log('[sendSMS] Calling sendViaSurge')
      return sendViaSurge(config, options)
    case 'twilio':
      console.log('[sendSMS] Calling sendViaTwilio')
      return sendViaTwilio(config, options)
    default:
      console.error('[sendSMS] Unsupported provider:', config.provider)
      throw new Error(`Unsupported SMS provider: ${config.provider}`)
  }
}

/**
 * Send SMS via Surge using the @surgeapi/node SDK
 */
async function sendViaSurge(
  config: SMSProviderConfig,
  options: SendSMSOptions
): Promise<SMSResult> {
  if (!config.surgeApiKey || !config.surgeAccountId) {
    return {
      success: false,
      error: 'Surge API key or account ID not configured',
    }
  }

  try {
    // Dynamically import Surge SDK to avoid errors if not installed
    let SurgeClass: any
    try {
      const SurgeModule = await import('@surgeapi/node') as any
      // Try different export patterns: SurgeClient (named), Surge (default), or default
      SurgeClass = SurgeModule.SurgeClient || SurgeModule.Surge || SurgeModule.default?.SurgeClient || SurgeModule.default
      
      if (!SurgeClass) {
        console.error('Surge SDK exports:', Object.keys(SurgeModule))
        return {
          success: false,
          error: 'Surge SDK import failed. Please check @surgeapi/node installation.',
        }
      }
    } catch (importError) {
      console.error('Error importing Surge SDK:', importError)
      return {
        success: false,
        error: 'Surge SDK not installed. Please run: npm install @surgeapi/node',
      }
    }

    // Parse phone number (ensure it has + prefix and is E.164 format)
    let phoneNumber = options.to
    if (!phoneNumber.startsWith('+')) {
      const digits = phoneNumber.replace(/\D/g, '')
      phoneNumber = `+${digits}`
    }

    // Create Surge client - try both 'apiKey' and 'token' patterns
    let client
    try {
      // Try with apiKey first (as shown in user's example)
      client = new SurgeClass({
        apiKey: config.surgeApiKey,
      })
    } catch (e1) {
      try {
        // Fallback to token
        client = new SurgeClass({
          token: config.surgeApiKey,
        })
      } catch (e2) {
        return {
          success: false,
          error: `Failed to create Surge client: ${e1 instanceof Error ? e1.message : 'Unknown error'}`,
        }
      }
    }

    console.log('[sendViaSurge] Sending message:', {
      accountId: config.surgeAccountId,
      phoneNumber,
      hasApiKey: !!config.surgeApiKey,
      apiKeyPrefix: config.surgeApiKey?.substring(0, 10) + '...',
    })

    // Send message using Surge SDK
    const message = await client.messages.create(config.surgeAccountId, {
      body: options.body,
      conversation: {
        contact: {
          first_name: options.contactFirstName || '',
          last_name: options.contactLastName || '',
          phone_number: phoneNumber,
        },
      },
    })

    return {
      success: true,
      messageId: message.id || message.message_id || message.sid,
    }
  } catch (error) {
    console.error('Error sending SMS via Surge:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(
  config: SMSProviderConfig,
  options: SendSMSOptions
): Promise<SMSResult> {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    return {
      success: false,
      error: 'Twilio credentials not configured',
    }
  }

  try {
    // Dynamically import Twilio to avoid errors if not installed
    let twilio
    try {
      twilio = await import('twilio')
    } catch (importError) {
      return {
        success: false,
        error: 'Twilio SDK not installed. Please run: npm install twilio',
      }
    }
    
    const client = twilio.default(config.twilioAccountSid, config.twilioAuthToken)

    // Normalize phone numbers to E.164 format
    function normalizePhoneNumber(phone: string): string {
      // Remove all non-numeric characters
      let cleaned = phone.replace(/\D/g, '')
      
      // If it's 10 digits (US number without country code), add country code
      if (cleaned.length === 10) {
        cleaned = '1' + cleaned
      }
      
      // If it's 11 digits and starts with 1, keep as is
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return '+' + cleaned
      }
      
      // For other formats, just add + prefix
      return '+' + cleaned
    }

    // First, check for masking characters BEFORE normalization
    if (config.twilioPhoneNumber && (config.twilioPhoneNumber.includes('X') || config.twilioPhoneNumber.includes('x') || config.twilioPhoneNumber.includes('*'))) {
      return {
        success: false,
        error: `Invalid Twilio phone number in environment variable: ${config.twilioPhoneNumber}. The phone number appears to be masked or incomplete.`,
      }
    }

    if (options.to && (options.to.includes('X') || options.to.includes('x') || options.to.includes('*'))) {
      return {
        success: false,
        error: `Invalid phone number format: ${options.to}. The phone number appears to be masked or incomplete.`,
      }
    }

    // Normalize both numbers
    const fromNumber = normalizePhoneNumber(config.twilioPhoneNumber)
    const toNumber = normalizePhoneNumber(options.to)

    // Add detailed logging
    console.log('[sendViaTwilio] Phone number normalization:', {
      originalFrom: config.twilioPhoneNumber,
      normalizedFrom: fromNumber,
      originalTo: options.to,
      normalizedTo: toNumber,
    })

    // Validate phone numbers are complete (at least 11 digits for US numbers)
    const fromDigits = fromNumber.replace(/\D/g, '')
    const toDigits = toNumber.replace(/\D/g, '')

    if (toDigits.length < 11) {
      return {
        success: false,
        error: `Invalid phone number: ${options.to} → ${toNumber} (only ${toDigits.length} digits). Need at least 11 digits including country code.`,
      }
    }

    if (fromDigits.length < 11) {
      return {
        success: false,
        error: `Invalid Twilio phone number: ${config.twilioPhoneNumber} → ${fromNumber} (only ${fromDigits.length} digits).`,
      }
    }

    console.log('[sendViaTwilio] Sending SMS:', {
      from: fromNumber,
      to: toNumber,
      bodyLength: options.body.length,
    })

    const result = await client.messages.create({
      body: options.body,
      from: fromNumber,
      to: toNumber,
    })

    console.log('[sendViaTwilio] SMS sent successfully:', {
      sid: result.sid,
      status: result.status,
    })

    return {
      success: true,
      messageId: result.sid,
    }
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error)
    
    // Provide user-friendly error messages for common Twilio errors
    if (error instanceof Error) {
      // Trial account - unverified number error
      if (error.message.includes('unverified') || error.message.includes('Trial accounts')) {
        return {
          success: false,
          error: 'Twilio trial account limitation: This phone number needs to be verified in your Twilio account. Please verify the number at twilio.com/user/account/phone-numbers/verified or upgrade your Twilio account to send to unverified numbers.',
        }
      }
      
      // Invalid phone number format
      if (error.message.includes('Invalid') && error.message.includes('phone number')) {
        return {
          success: false,
          error: `Invalid phone number format. Please ensure the number is in E.164 format (e.g., +15551234567).`,
        }
      }
      
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Unknown error occurred while sending SMS',
    }
  }
}
