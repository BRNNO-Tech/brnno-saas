import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

type BookingEmailData = {
  business: {
    name: string
    email: string
    phone?: string | null
  }
  service: {
    name: string
  }
  customer: {
    name: string
    email: string
    phone?: string | null
  }
  scheduledDate: string
  scheduledTime: string
}

export async function sendBookingConfirmation(booking: BookingEmailData) {
  // If no API key, log and return (for dev/mock mode)
  if (!resend) {
    console.log('RESEND_API_KEY not set. Skipping email sending.')
    console.log('Would send to customer:', booking.customer.email)
    console.log('Would send to business:', booking.business.email)
    return
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'bookings@resend.dev'

  try {
    // Email to customer
    await resend.emails.send({
      from: `BRNNO <${fromEmail}>`,
      to: booking.customer.email,
      subject: `Booking Confirmed - ${booking.business.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Booking Confirmed!</h1>
          <p>Your appointment has been successfully scheduled.</p>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Appointment Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Service:</strong> ${booking.service.name}</li>
              <li style="margin-bottom: 10px;"><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</li>
              <li style="margin-bottom: 10px;"><strong>Time:</strong> ${booking.scheduledTime}</li>
            </ul>
          </div>

          <p><strong>Business Contact:</strong><br>
          ${booking.business.name}<br>
          ${booking.business.phone || booking.business.email}</p>
        </div>
      `
    })

    // Email to business (detailer)
    await resend.emails.send({
      from: `BRNNO <${fromEmail}>`,
      to: booking.business.email,
      subject: `New Booking - ${booking.customer.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>New Booking Received!</h1>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Name:</strong> ${booking.customer.name}</li>
              <li style="margin-bottom: 10px;"><strong>Email:</strong> ${booking.customer.email}</li>
              <li style="margin-bottom: 10px;"><strong>Phone:</strong> ${booking.customer.phone || 'N/A'}</li>
            </ul>

            <h3 style="margin-top: 20px;">Service Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Service:</strong> ${booking.service.name}</li>
              <li style="margin-bottom: 10px;"><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</li>
              <li style="margin-bottom: 10px;"><strong>Time:</strong> ${booking.scheduledTime}</li>
            </ul>
          </div>
        </div>
      `
    })

    console.log('Booking emails sent successfully')
  } catch (error) {
    console.error('Error sending booking emails:', error)
    // Don't throw error to avoid failing the booking process
  }
}

export async function sendSignupRecoveryEmail(
  email: string,
  name?: string,
  step?: number
) {
  // If no API key, log and return (for dev/mock mode)
  if (!resend) {
    console.log('RESEND_API_KEY not set. Skipping email sending.')
    console.log('Would send recovery email to:', email)
    return
  }

  const stepMessages: Record<number, string> = {
    1: 'You started signing up for BRNNO but didn\'t finish. Complete your account setup in just 2 minutes!',
    2: 'You\'re almost there! Just a few more details to get your business set up and start booking customers.',
    3: 'Don\'t miss out! Complete your business setup and start booking customers today.',
    4: 'You\'re one step away! Select your plan and start your free trial.',
    5: 'You\'re so close! Complete your subscription and start using BRNNO today.',
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@brnno.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'https://app.brnno.com'

  try {
    await resend.emails.send({
      from: `BRNNO <${fromEmail}>`,
      to: email,
      subject: 'Complete your BRNNO signup',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #18181b; margin-bottom: 20px;">Hey${name ? ` ${name}` : ''}!</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            ${stepMessages[step || 1] || 'You started signing up for BRNNO but didn\'t finish.'}
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${appUrl}/signup?email=${encodeURIComponent(email)}" 
               style="background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Complete Signup →
            </a>
          </div>

          <p style="color: #71717a; font-size: 14px; margin-top: 40px; line-height: 1.6;">
            Questions? Reply to this email or visit our <a href="${appUrl}/contact" style="color: #18181b; text-decoration: underline;">help center</a>.
          </p>
          
          <p style="color: #a1a1aa; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
            This email was sent because you started signing up for BRNNO. If you didn't start a signup, you can safely ignore this email.
          </p>
        </div>
      `
    })

    console.log('Signup recovery email sent successfully to:', email)
  } catch (error) {
    console.error('Error sending signup recovery email:', error)
    // Don't throw error to avoid failing the recovery process
  }
}
