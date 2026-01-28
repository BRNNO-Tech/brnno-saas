'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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
  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

  if (!resend) {
    console.error('RESEND_API_KEY not set. Cannot send contact form email.')
    // Still return success since form was saved to database
    return { success: true }
  }

  // Use onboarding@resend.dev as default (always verified) until brnno.io domain is verified in Resend
  // To verify your domain: https://resend.com/domains
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const toEmail = process.env.CONTACT_EMAIL || 'support@brnno.io'

  console.log('Attempting to send contact form email:', {
    from: fromEmail,
    to: toEmail,
    hasApiKey: !!process.env.RESEND_API_KEY
  })

  try {
    const result = await resend.emails.send({
      from: `BRNNO Contact <${fromEmail}>`,
      to: toEmail,
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

    // Check if Resend returned an error in the response
    if (result.error) {
      console.error('Resend API returned an error:', {
        error: result.error,
        message: result.error.message,
        name: result.error.name
      })
      // Still return success since form was saved to database
      return { success: true, emailSent: false, emailError: result.error.message }
    }

    console.log('Contact form email sent successfully:', {
      id: result.data?.id,
      from: fromEmail,
      to: toEmail
    })
    return { success: true, emailSent: true }
  } catch (emailError) {
    console.error('Failed to send email notification:', emailError)
    // Log the full error for debugging
    if (emailError instanceof Error) {
      console.error('Email error details:', {
        message: emailError.message,
        name: emailError.name,
        stack: emailError.stack
      })
    } else {
      console.error('Email error (non-Error object):', JSON.stringify(emailError, null, 2))
    }
    // Don't throw - form submission still succeeded
    return { success: true, emailSent: false, emailError: emailError instanceof Error ? emailError.message : 'Unknown error' }
  }

  return { success: true }
}

