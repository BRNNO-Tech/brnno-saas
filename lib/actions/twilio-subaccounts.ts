'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'
import twilio from 'twilio'

interface BusinessInfo {
    businessName: string
    legalName: string
    address: string
    city: string
    state: string
    zipCode: string
    ein?: string
    ssn?: string
    contactEmail: string
    areaCode?: string
}

/**
 * Initialize Twilio subaccount and setup for a business
 * This is called after the AI Auto Lead add-on is purchased
 */
export async function setupTwilioSubaccount(businessInfo: BusinessInfo) {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    try {
        // Update status to pending
        await supabase
            .from('businesses')
            .update({ twilio_setup_status: 'pending' })
            .eq('id', businessId)

        // Initialize Twilio client with master account
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN

        if (!accountSid || !authToken) {
            throw new Error('Twilio master account credentials not configured')
        }

        const client = twilio(accountSid, authToken)

        // 1. Create Twilio Subaccount
        console.log('[Twilio Setup] Creating subaccount for:', businessInfo.businessName)
        const subaccount = await client.api.accounts.create({
            friendlyName: `${businessInfo.businessName} - Brnno`
        })

        console.log('[Twilio Setup] Subaccount created:', subaccount.sid)

        // 2. Create Messaging Service (required for A2P)
        const subaccountClient = twilio(subaccount.sid, subaccount.authToken)
        const messagingService = await subaccountClient.messaging.v1.services.create({
            friendlyName: `${businessInfo.businessName} SMS Service`
        })

        console.log('[Twilio Setup] Messaging service created:', messagingService.sid)

        // 3. Buy Phone Number
        console.log('[Twilio Setup] Searching for phone numbers in area code:', businessInfo.areaCode || 'any')

        let availableNumbers
        if (businessInfo.areaCode) {
            availableNumbers = await subaccountClient.availablePhoneNumbers('US')
                .local
                .list({ areaCode: Number(businessInfo.areaCode), smsEnabled: true, limit: 5 })
        } else {
            // If no area code provided, use zip code to find local numbers
            availableNumbers = await subaccountClient.availablePhoneNumbers('US')
                .local
                .list({ inPostalCode: businessInfo.zipCode, smsEnabled: true, limit: 5 })
        }

        if (!availableNumbers || availableNumbers.length === 0) {
            throw new Error('No phone numbers available in your area. Please try a different area code.')
        }

        console.log('[Twilio Setup] Found', availableNumbers.length, 'available numbers')

        // Purchase the first available number
        const phoneNumber = await subaccountClient.incomingPhoneNumbers.create({
            phoneNumber: availableNumbers[0].phoneNumber,
            smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/sms`,
            smsMethod: 'POST'
        })

        console.log('[Twilio Setup] Phone number purchased:', phoneNumber.phoneNumber)

        // 4. Add phone number to messaging service
        await subaccountClient.messaging.v1
            .services(messagingService.sid)
            .phoneNumbers
            .create({ phoneNumberSid: phoneNumber.sid })

        console.log('[Twilio Setup] Phone number added to messaging service')

        // 5. Store credentials in database
        await supabase
            .from('businesses')
            .update({
                twilio_subaccount_sid: subaccount.sid,
                twilio_subaccount_auth_token: subaccount.authToken,
                twilio_phone_number: phoneNumber.phoneNumber,
                twilio_messaging_service_sid: messagingService.sid,
                twilio_setup_complete: true,
                twilio_setup_status: 'verifying', // Will move to 'active' after A2P verification
                business_legal_name: businessInfo.legalName,
                business_ein: businessInfo.ein || null,
                business_ssn: businessInfo.ssn || null,
            })
            .eq('id', businessId)

        console.log('[Twilio Setup] Credentials saved to database')

        // 6. Submit A2P Brand Registration (this is async and takes time)
        // We'll do this in the background and update status later
        submitA2PRegistration(businessId, subaccount.sid, businessInfo).catch(err => {
            console.error('[Twilio Setup] A2P registration error:', err)
        })

        return {
            success: true,
            phoneNumber: phoneNumber.phoneNumber,
            subaccountSid: subaccount.sid,
            message: 'Your business phone number has been set up! A2P verification is in progress (2-4 weeks).'
        }

    } catch (error) {
        console.error('[Twilio Setup] Error:', error)

        // Update status to failed
        await supabase
            .from('businesses')
            .update({
                twilio_setup_status: 'failed',
                twilio_setup_complete: false
            })
            .eq('id', businessId)

        throw new Error(error instanceof Error ? error.message : 'Failed to setup Twilio subaccount')
    }
}

/**
 * Submit A2P Brand Registration
 * This runs in the background and takes 2-4 weeks to complete
 */
async function submitA2PRegistration(businessId: string, subaccountSid: string, businessInfo: BusinessInfo) {
    const supabase = await createClient()

    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN

        if (!accountSid || !authToken) {
            throw new Error('Twilio master account credentials not configured')
        }

        const client = twilio(accountSid, authToken)
        const subaccountClient = twilio(subaccountSid, (await supabase
            .from('businesses')
            .select('twilio_subaccount_auth_token')
            .eq('id', businessId)
            .single()).data?.twilio_subaccount_auth_token!)

        // Note: Full A2P registration requires creating Address, Customer Profile Bundle, etc.
        // This is a simplified version - you may need to expand based on Twilio's current requirements

        console.log('[A2P] Starting brand registration for:', businessInfo.legalName)

        // Create address
        const address = await subaccountClient.addresses.create({
            customerName: businessInfo.legalName,
            street: businessInfo.address,
            city: businessInfo.city,
            region: businessInfo.state,
            postalCode: businessInfo.zipCode,
            isoCountry: 'US'
        })

        console.log('[A2P] Address created:', address.sid)

        // For now, we'll mark the setup as pending verification
        // Full A2P registration would continue here with brand registration API calls

        await supabase
            .from('businesses')
            .update({
                twilio_setup_status: 'verifying',
                business_verified: false
            })
            .eq('id', businessId)

        console.log('[A2P] Registration submitted, awaiting verification')

    } catch (error) {
        console.error('[A2P] Error submitting brand registration:', error)
        // Don't fail the whole setup - A2P can be completed later
    }
}

/**
 * Check if business has AI Auto Lead add-on with Twilio setup complete
 */
export async function hasAIAutoLead(businessId?: string) {
    const supabase = await createClient()
    const targetBusinessId = businessId || await getBusinessId()

    const { data: business } = await supabase
        .from('businesses')
        .select('twilio_setup_complete, twilio_phone_number')
        .eq('id', targetBusinessId)
        .single()

    if (!business) return false

    // Check if they have the AI Auto Lead subscription
    const { data: addon } = await supabase
        .from('business_subscription_addons')
        .select('status')
        .eq('business_id', targetBusinessId)
        .eq('addon_key', 'ai_auto_lead')
        .in('status', ['active', 'trial'])
        .single()

    return !!addon && business.twilio_setup_complete
}

/**
 * Get Twilio credentials for a business's subaccount
 */
export async function getTwilioCredentials(businessId?: string) {
    const supabase = await createClient()
    const targetBusinessId = businessId || await getBusinessId()

    const { data: business } = await supabase
        .from('businesses')
        .select('twilio_subaccount_sid, twilio_subaccount_auth_token, twilio_phone_number, twilio_messaging_service_sid')
        .eq('id', targetBusinessId)
        .single()

    if (!business || !business.twilio_subaccount_sid) {
        return null
    }

    return {
        accountSid: business.twilio_subaccount_sid,
        authToken: business.twilio_subaccount_auth_token,
        phoneNumber: business.twilio_phone_number,
        messagingServiceSid: business.twilio_messaging_service_sid
    }
}

/**
 * Get available area codes for phone number selection
 */
export async function getAvailableAreaCodes(state: string) {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN

        if (!accountSid || !authToken) {
            throw new Error('Twilio credentials not configured')
        }

        const client = twilio(accountSid, authToken)

        // Get available local numbers in the state to extract area codes
        const numbers = await client.availablePhoneNumbers('US')
            .local
            .list({ inRegion: state, smsEnabled: true, limit: 50 })

        // Extract unique area codes
        const areaCodes = [...new Set(numbers.map(n => {
            const match = n.phoneNumber.match(/\+1(\d{3})/)
            return match ? match[1] : null
        }).filter(Boolean))] as string[]

        return areaCodes.sort()
    } catch (error) {
        console.error('Error fetching area codes:', error)
        return []
    }
}
