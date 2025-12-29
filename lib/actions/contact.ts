'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function submitContactForm(formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    interested_plan: formData.get('interested_plan') as string || null,
    message: formData.get('message') as string,
  }

  // Save to database
  const { error } = await supabase
    .from('contact_submissions')
    .insert(data)

  if (error) throw error

  // Send email notification
  try {
    await resend.emails.send({
      from: 'BRNNO Contact <noreply@brnno.com>',
      to: process.env.CONTACT_EMAIL || 'support@brnno.com',
      replyTo: data.email,
      subject: `New Contact Form - ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
        ${data.interested_plan ? `<p><strong>Interested in:</strong> ${data.interested_plan}</p>` : ''}
        <hr />
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `
    })
  } catch (emailError) {
    console.error('Failed to send email notification:', emailError)
    // Don't throw - form submission still succeeded
  }

  return { success: true }
}

