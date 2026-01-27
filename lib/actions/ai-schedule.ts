'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type UnscheduledJob = {
    id: string
    title: string
    estimated_duration: number
    estimated_cost: number
    client: { name: string; address?: string }
    priority?: string
}

type ScheduledSlot = {
    job_id: string
    scheduled_date: string
    assigned_to?: string
    reason: string
}

// Get unscheduled jobs
export async function getUnscheduledJobs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!business) throw new Error('No business found')

    // Get jobs without scheduled_date or with status 'pending'
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
      id,
      title,
      estimated_duration,
      estimated_cost,
      status,
      scheduled_date,
      client:clients(name, address, city, state)
    `)
        .eq('business_id', business.id)
        .in('status', ['pending', 'confirmed'])
        .or('scheduled_date.is.null,scheduled_date.gte.' + new Date().toISOString())
        .order('estimated_cost', { ascending: false }) // High value first

    if (error) throw error

    // Filter to only truly unscheduled jobs
    const unscheduled = (jobs || []).filter(job => !job.scheduled_date)

    return unscheduled
}

// Generate AI schedule using Gemini API
export async function generateAISchedule(
    unscheduledJobs: any[],
    currentSchedule: any[],
    priorityBlocks: any[],
    weatherData: any,
    teamMembers: any[],
    businessHours: any
) {
    // Build the prompt for Claude
    const prompt = `You are a scheduling AI for an auto detailing business. Generate an optimal weekly schedule.

UNSCHEDULED JOBS (${unscheduledJobs.length} total):
${unscheduledJobs.map((job, i) => `
${i + 1}. ${job.title}
   - Duration: ${job.estimated_duration || 60} minutes
   - Value: $${job.estimated_cost || 0}
   - Customer: ${job.client?.name || 'Unknown'}
   ${job.client?.city ? `- Location: ${job.client.city}, ${job.client.state}` : ''}
`).join('')}

CURRENT SCHEDULE:
${currentSchedule.length === 0 ? 'No jobs currently scheduled this week' : currentSchedule.map(job => `
- ${new Date(job.scheduled_date).toLocaleString()}: ${job.title} (${job.estimated_duration || 60}min)
`).join('')}

PRIORITY TIME BLOCKS:
${priorityBlocks.length === 0 ? 'None configured' : priorityBlocks.map(block => `
- ${block.days.join(', ')}: ${block.start_time}-${block.end_time} reserved for ${block.priority_for}
`).join('')}

WEATHER FORECAST (next 7 days):
${Object.entries(weatherData).map(([date, forecast]: [string, any]) => `
- ${date}: ${forecast.condition}, ${forecast.rain_probability}% rain
`).join('')}

TEAM MEMBERS:
${teamMembers.length === 0 ? 'Solo operator' : teamMembers.map(member => `
- ${member.name}: ${member.role}
`).join('')}

BUSINESS HOURS:
${Object.entries(businessHours).map(([day, hours]: [string, any]) =>
        hours.closed ? `${day}: Closed` : `${day}: ${hours.open}-${hours.close}`
    ).join('\n')}

CONSTRAINTS:
1. Only schedule during business hours
2. Respect priority time blocks (or note if impossible)
3. Avoid outdoor jobs on high-rain days (>60%)
4. Leave 30min buffer between jobs
5. Balance high-value and quick jobs throughout week
6. If solo, max 8 hours of work per day
7. Schedule starting from tomorrow

GOALS:
1. Maximize revenue (prioritize high-value jobs)
2. Minimize gaps (tight but realistic schedule)
3. Balance workload across week
4. Fill priority slots when possible

Return ONLY valid JSON (no markdown, no explanation):
{
  "schedule": [
    {
      "job_id": "uuid",
      "scheduled_date": "2024-01-15T09:00:00Z",
      "assigned_to": "team_member_id or null",
      "reason": "High value job, fits morning slot"
    }
  ],
  "summary": {
    "jobs_scheduled": 10,
    "total_revenue": 1250,
    "priority_slots_filled": 2,
    "notes": "Avoided outdoor jobs on rainy Tuesday"
  }
}

Only schedule jobs from the UNSCHEDULED JOBS list. Use real job IDs.`

    try {
        // Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4000,
                }
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Gemini API error:', errorData)
            throw new Error('Gemini API request failed')
        }

        const data = await response.json()
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!responseText) {
            throw new Error('No response from Gemini API')
        }

        // Parse JSON response (strip any markdown if present)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse AI response')
        }

        const result = JSON.parse(jsonMatch[0])
        return result

    } catch (error) {
        console.error('AI scheduling error:', error)
        throw error
    }
}

// Apply AI schedule to database
export async function applyAISchedule(schedule: ScheduledSlot[]) {
    const supabase = await createClient()

    const updates = schedule.map(slot => ({
        id: slot.job_id,
        scheduled_date: slot.scheduled_date,
        status: 'confirmed'
    }))

    // Update all jobs
    for (const update of updates) {
        const { error } = await supabase
            .from('jobs')
            .update({
                scheduled_date: update.scheduled_date,
                status: update.status
            })
            .eq('id', update.id)

        if (error) {
            console.error('Error updating job:', error)
            throw error
        }

        // Assign to team member if specified
        if (schedule.find(s => s.job_id === update.id)?.assigned_to) {
            const assignedTo = schedule.find(s => s.job_id === update.id)?.assigned_to

            await supabase
                .from('job_assignments')
                .upsert({
                    job_id: update.id,
                    team_member_id: assignedTo,
                    assigned_at: new Date().toISOString()
                })
        }
    }

    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard/jobs')

    return { success: true }
}
