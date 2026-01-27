'use server'

type LeadData = {
    name?: string
    phone?: string
    email?: string
    message?: string
    interested_in_service_name?: string
    vehicle_year?: string
    vehicle_make?: string
    vehicle_model?: string
    estimated_cost?: number
    source?: string
}

type BusinessData = {
    name: string
    sender_name?: string
    phone?: string
    default_tone?: 'friendly' | 'premium' | 'direct'
}

type MessageContext = {
    stepType: 'initial_response' | 'follow_up' | 'reminder' | 'booking_nudge'
    stepNumber: number
    previousMessages?: string[]
    daysSinceLastContact?: number
}

export async function generateAIMessage(
    lead: LeadData,
    business: BusinessData,
    context: MessageContext,
    channel: 'sms' | 'email'
): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Build context for AI
    const tone = business.default_tone || 'friendly'
    const senderName = business.sender_name || business.name

    const prompt = `You are ${senderName}, an auto detailing business. Generate a ${channel} message for this lead.

LEAD INFO:
- Name: ${lead.name || 'Unknown'}
- Service Interest: ${lead.interested_in_service_name || 'auto detailing'}
${lead.vehicle_year || lead.vehicle_make || lead.vehicle_model
            ? `- Vehicle: ${lead.vehicle_year || ''} ${lead.vehicle_make || ''} ${lead.vehicle_model || ''}`.trim()
            : ''}
${lead.estimated_cost ? `- Estimated Cost: $${lead.estimated_cost}` : ''}
${lead.message ? `- Their Message: "${lead.message}"` : ''}

CONTEXT:
- Message Type: ${context.stepType}
- Step Number: ${context.stepNumber}
${context.daysSinceLastContact ? `- Days Since Last Contact: ${context.daysSinceLastContact}` : ''}
${context.previousMessages && context.previousMessages.length > 0
            ? `- Previous Messages:\n${context.previousMessages.map((m, i) => `  ${i + 1}. "${m}"`).join('\n')}`
            : ''}

BUSINESS INFO:
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}

TONE: ${tone}
${tone === 'friendly' ? '- Warm, casual, personable' : ''}
${tone === 'premium' ? '- Professional, high-end, sophisticated' : ''}
${tone === 'direct' ? '- Concise, no-nonsense, efficient' : ''}

CHANNEL: ${channel}
${channel === 'sms' ? '- Keep it SHORT (under 160 characters ideal, max 300)' : ''}
${channel === 'sms' ? '- Use casual language' : ''}
${channel === 'email' ? '- Can be longer and more detailed' : ''}
${channel === 'email' ? '- Include proper greeting/closing' : ''}

GUIDELINES:
1. Sound human and natural (like you're texting a friend)
2. Reference their specific vehicle/service if known
3. ${context.stepType === 'initial_response'
            ? 'Respond to their inquiry with helpful info'
            : context.stepType === 'follow_up'
                ? 'Follow up without being pushy'
                : context.stepType === 'reminder'
                    ? 'Gentle reminder about booking'
                    : 'Encourage them to schedule'}
4. Include a clear call-to-action
5. ${channel === 'sms' ? 'NO emojis unless the tone is friendly' : 'Professional but warm'}
6. ${context.stepNumber > 1 ? 'Acknowledge this is a follow-up' : 'Make it feel like first contact'}
7. If they mentioned a specific concern/question, address it
8. Price only if you have estimated_cost, otherwise say "let me give you a quote"
9. ${business.phone ? `Include your phone number: ${business.phone}` : 'Offer to call them'}
10. End with a question or clear next step

IMPORTANT: 
- Return ONLY the message text, no subject line, no greeting like "Here's the message:"
- For SMS: MUST be under 300 characters
- Sound like a real person, not a bot

Generate the ${channel} message now:`

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        })

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`)
        }

        const data = await response.json()
        const message = data.content[0].text.trim()

        // Clean up any markdown or formatting
        const cleanMessage = message
            .replace(/```/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .trim()

        // Enforce SMS length limit
        if (channel === 'sms' && cleanMessage.length > 300) {
            // Truncate and add ellipsis
            return cleanMessage.substring(0, 297) + '...'
        }

        return cleanMessage

    } catch (error) {
        console.error('AI message generation error:', error)
        // Fallback to template-based message
        throw error
    }
}

// Helper to determine message context from step data
export function getMessageContext(
    stepOrder: number,
    stepType: string,
    messageTemplate: string,
    daysSinceEnrolled: number
): MessageContext {
    // Infer context from step metadata
    let contextType: MessageContext['stepType'] = 'follow_up'

    if (stepOrder === 0 || stepOrder === 1) {
        contextType = 'initial_response'
    } else if (messageTemplate.toLowerCase().includes('reminder') || daysSinceEnrolled > 5) {
        contextType = 'reminder'
    } else if (messageTemplate.toLowerCase().includes('book') || messageTemplate.toLowerCase().includes('schedule')) {
        contextType = 'booking_nudge'
    }

    return {
        stepType: contextType,
        stepNumber: stepOrder + 1,
        daysSinceLastContact: daysSinceEnrolled
    }
}

