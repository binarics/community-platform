// lib/email.ts
// Email service using Resend (free tier: 3,000 emails/month)

import { Resend } from 'resend'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@yourdomain.com'
const PLATFORM_NAME = 'Community Platform'
const BASE_URL = process.env.NEXTAUTH_URL || 'https://community-platform-lemon.vercel.app'

/**
 * Send verification email to new users
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${PLATFORM_NAME} - Verify Your Email`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgb(82, 112, 82) 0%, rgb(61, 90, 61) 100%); border-radius: 16px 16px 0 0;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Welcome to ${PLATFORM_NAME}!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                          Hi ${name},
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                          Thank you for creating an account with ${PLATFORM_NAME}. To get started, please verify your email address by clicking the button below:
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background-color: rgb(82, 112, 82); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #666;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #527052; word-break: break-all;">
                          ${verificationUrl}
                        </p>
                        
                        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #666;">
                          This link will expire in 24 hours.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 16px 16px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #999;">
                          If you didn't create an account, you can safely ignore this email.
                        </p>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #999;">
                          © 2026 ${PLATFORM_NAME}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { success: false, error }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reset Your ${PLATFORM_NAME} Password`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgb(197, 90, 56) 0%, rgb(168, 74, 47) 100%); border-radius: 16px 16px 0 0;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Password Reset</h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                          Hi ${name},
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                          We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: rgb(197, 90, 56); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #666;">
                          Or copy and paste this link:
                        </p>
                        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #c55a38; word-break: break-all;">
                          ${resetUrl}
                        </p>
                        
                        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #666;">
                          This link will expire in 1 hour.
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 40px; background-color: #fff5f2; border-radius: 0 0 16px 16px;">
                        <p style="margin: 0; font-size: 14px; color: #c55a38; font-weight: bold;">
                          ⚠️ Security Notice
                        </p>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #999;">
                          If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error }
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  booking: {
    id: string
    counsellorName: string
    startTime: Date
    endTime: Date
    roomName?: string
    sessionType: string
  }
) {
  const bookingUrl = `${BASE_URL}/counsellor/bookings/${booking.id}`
  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)

  const dateStr = startTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const timeStr = `${startTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Counselling Session Confirmed - ${dateStr}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Booking Confirmation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgb(82, 112, 82) 0%, rgb(61, 90, 61) 100%); border-radius: 16px 16px 0 0;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">✓ Booking Confirmed</h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                          Hi ${name},
                        </p>
                        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333;">
                          Your counselling session has been confirmed. Here are the details:
                        </p>
                        
                        <!-- Booking Details Card -->
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 8px; margin-bottom: 30px;">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Counsellor</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${booking.counsellorName}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Date</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${dateStr}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Time</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${timeStr}</td>
                                </tr>
                                ${
                                  booking.roomName
                                    ? `
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Room</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${booking.roomName}</td>
                                </tr>
                                `
                                    : ''
                                }
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Session Type</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${booking.sessionType}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${bookingUrl}" style="display: inline-block; padding: 16px 32px; background-color: rgb(82, 112, 82); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                View Booking Details
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #666;">
                          You'll receive a reminder email 24 hours before your session.
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 16px 16px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #999;">
                          If you need to reschedule or cancel, please contact us at least 24 hours in advance.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending booking confirmation email:', error)
    return { success: false, error }
  }
}

/**
 * Send booking reminder email (24 hours before)
 */
export async function sendBookingReminderEmail(
  email: string,
  name: string,
  booking: {
    id: string
    counsellorName: string
    startTime: Date
    endTime: Date
    roomName?: string
  }
) {
  const bookingUrl = `${BASE_URL}/counsellor/bookings/${booking.id}`
  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)

  const dateStr = startTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const timeStr = `${startTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reminder: Counselling Session Tomorrow - ${dateStr}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Session Reminder</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgb(217, 117, 82) 0%, rgb(197, 90, 56) 100%); border-radius: 16px 16px 0 0;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">📅 Session Reminder</h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                          Hi ${name},
                        </p>
                        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333;">
                          This is a friendly reminder that you have a counselling session tomorrow:
                        </p>
                        
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff5f2; border-radius: 8px; margin-bottom: 30px; border: 2px solid #f9e6df;">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Counsellor</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${booking.counsellorName}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Date</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${dateStr}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Time</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${timeStr}</td>
                                </tr>
                                ${
                                  booking.roomName
                                    ? `
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Room</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: bold; text-align: right;">${booking.roomName}</td>
                                </tr>
                                `
                                    : ''
                                }
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${bookingUrl}" style="display: inline-block; padding: 16px 32px; background-color: rgb(217, 117, 82); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                View Details
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #666;">
                          Please arrive a few minutes early. Looking forward to seeing you!
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 16px 16px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #999;">
                          If you need to reschedule, please contact us as soon as possible.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending booking reminder email:', error)
    return { success: false, error }
  }
}

/**
 * Send welcome email to new clients
 */
export async function sendClientWelcomeEmail(
  email: string,
  name: string,
  counsellorName: string,
  temporaryPassword?: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${PLATFORM_NAME} - ${counsellorName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgb(82, 112, 82) 0%, rgb(61, 90, 61) 100%); border-radius: 16px 16px 0 0;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Welcome!</h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                          Hi ${name},
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                          ${counsellorName} has created an account for you on ${PLATFORM_NAME}. You can now access your booking history and upcoming sessions online.
                        </p>
                        
                        ${
                          temporaryPassword
                            ? `
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 8px; margin: 20px 0;">
                          <tr>
                            <td style="padding: 24px;">
                              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Your login credentials:</p>
                              <p style="margin: 0; font-size: 14px; color: #333;"><strong>Email:</strong> ${email}</p>
                              <p style="margin: 10px 0 0; font-size: 14px; color: #333;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #c55a38;">
                          ⚠️ Please change your password after your first login.
                        </p>
                        `
                            : ''
                        }
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${BASE_URL}/login" style="display: inline-block; padding: 16px 32px; background-color: rgb(82, 112, 82); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Sign In
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 16px 16px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #999;">
                          If you have any questions, please contact your counsellor.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending client welcome email:', error)
    return { success: false, error }
  }
}

// ─── Role Request Emails ───────────────────────────────────────────────────────

/**
 * Acknowledge receipt of a role request to the user who submitted it
 */
export async function sendRoleRequestReceivedEmail(
  email: string,
  name: string,
  requestedRole: string
) {
  const roleLabel = requestedRole.replace('_', ' ')
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Role Request Received – ${PLATFORM_NAME}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f0;">
          <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,rgb(82,112,82),rgb(61,90,61));border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:white;font-size:24px;">Request Received</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#333;">Hi ${name},</p>
                <p style="font-size:16px;color:#333;">We've received your request to become a <strong>${roleLabel}</strong> on ${PLATFORM_NAME}. Our team will review it and get back to you shortly.</p>
                <p style="font-size:14px;color:#666;">You'll receive an email once a decision has been made.</p>
              </td></tr>
              <tr><td style="padding:20px 40px;background:#f9f9f9;border-radius:0 0 16px 16px;text-align:center;">
                <p style="font-size:12px;color:#999;">© 2026 ${PLATFORM_NAME}. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending role request received email:', error)
    return { success: false, error }
  }
}

/**
 * Notify a super admin that a new role request is waiting for review
 */
export async function sendRoleRequestAdminNotificationEmail(
  adminEmail: string,
  adminName: string,
  userName: string,
  userEmail: string,
  requestedRole: string,
  reason: string,
  requestId: string
) {
  const reviewUrl = `${BASE_URL}/admin/role-requests`
  const roleLabel = requestedRole.replace('_', ' ')
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New Role Request: ${userName} → ${roleLabel}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f0;">
          <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,rgb(197,90,56),rgb(168,74,47));border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:white;font-size:24px;">New Role Request</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#333;">Hi ${adminName},</p>
                <p style="font-size:16px;color:#333;">A new role request has been submitted and is waiting for your review.</p>
                <table width="100%" cellspacing="0" cellpadding="0" style="background:#f9f9f9;border-radius:8px;margin:20px 0;">
                  <tr><td style="padding:24px;">
                    <p style="margin:0 0 8px;font-size:14px;color:#666;">From</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#333;font-weight:bold;">${userName} (${userEmail})</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#666;">Requested role</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#333;font-weight:bold;">${roleLabel}</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#666;">Reason</p>
                    <p style="margin:0;font-size:14px;color:#333;">${reason}</p>
                  </td></tr>
                </table>
                <table cellspacing="0" cellpadding="0" width="100%"><tr><td align="center" style="padding:20px 0;">
                  <a href="${reviewUrl}" style="display:inline-block;padding:16px 32px;background:rgb(197,90,56);color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
                    Review Request
                  </a>
                </td></tr></table>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending role request admin notification:', error)
    return { success: false, error }
  }
}

/**
 * Notify a user their role request was approved
 */
export async function sendRoleRequestApprovedEmail(
  email: string,
  name: string,
  approvedRole: string,
  reviewNotes?: string
) {
  const roleLabel = approvedRole.replace('_', ' ')
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Role Request Has Been Approved – ${PLATFORM_NAME}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f0;">
          <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,rgb(34,197,94),rgb(22,163,74));border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:white;font-size:24px;">✓ Request Approved</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#333;">Hi ${name},</p>
                <p style="font-size:16px;color:#333;">Great news! Your request to become a <strong>${roleLabel}</strong> has been approved. Your account has been updated and you can now access all ${roleLabel} features.</p>
                ${reviewNotes ? `<div style="background:#f0fdf4;border-left:4px solid rgb(34,197,94);padding:16px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:14px;color:#166534;"><strong>Note from the team:</strong> ${reviewNotes}</p></div>` : ''}
                <table cellspacing="0" cellpadding="0" width="100%"><tr><td align="center" style="padding:20px 0;">
                  <a href="${BASE_URL}/login" style="display:inline-block;padding:16px 32px;background:rgb(34,197,94);color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
                    Sign In to Get Started
                  </a>
                </td></tr></table>
              </td></tr>
              <tr><td style="padding:20px 40px;background:#f9f9f9;border-radius:0 0 16px 16px;text-align:center;">
                <p style="font-size:12px;color:#999;">© 2026 ${PLATFORM_NAME}. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending role request approved email:', error)
    return { success: false, error }
  }
}

/**
 * Notify a user their role request was rejected
 */
export async function sendRoleRequestRejectedEmail(
  email: string,
  name: string,
  requestedRole: string,
  reason: string
) {
  const roleLabel = requestedRole.replace('_', ' ')
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Update on Your Role Request – ${PLATFORM_NAME}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f0;">
          <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,rgb(100,116,139),rgb(71,85,105));border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:white;font-size:24px;">Role Request Update</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#333;">Hi ${name},</p>
                <p style="font-size:16px;color:#333;">After reviewing your application to become a <strong>${roleLabel}</strong>, we're unable to approve it at this time.</p>
                <div style="background:#fef2f2;border-left:4px solid rgb(239,68,68);padding:16px;border-radius:0 8px 8px 0;margin:20px 0;">
                  <p style="margin:0;font-size:14px;color:#991b1b;"><strong>Reason:</strong> ${reason}</p>
                </div>
                <p style="font-size:14px;color:#666;">You're welcome to submit a new request in the future if your circumstances change.</p>
              </td></tr>
              <tr><td style="padding:20px 40px;background:#f9f9f9;border-radius:0 0 16px 16px;text-align:center;">
                <p style="font-size:12px;color:#999;">© 2026 ${PLATFORM_NAME}. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending role request rejected email:', error)
    return { success: false, error }
  }
}

// ─── Password Reset Emails ─────────────────────────────────────────────────────

/**
 * Confirm to a user that their password was successfully changed
 */
export async function sendPasswordChangedEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Password Has Been Changed – ${PLATFORM_NAME}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f0;">
          <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,rgb(82,112,82),rgb(61,90,61));border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:white;font-size:24px;">Password Changed</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#333;">Hi ${name},</p>
                <p style="font-size:16px;color:#333;">Your password has been successfully changed. You can now sign in with your new password.</p>
                <div style="background:#fff5f2;border-left:4px solid rgb(197,90,56);padding:16px;border-radius:0 8px 8px 0;margin:20px 0;">
                  <p style="margin:0;font-size:14px;color:#c55a38;"><strong>⚠️ Didn't make this change?</strong> Contact us immediately as your account may be compromised.</p>
                </div>
              </td></tr>
              <tr><td style="padding:20px 40px;background:#f9f9f9;border-radius:0 0 16px 16px;text-align:center;">
                <p style="font-size:12px;color:#999;">© 2026 ${PLATFORM_NAME}. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending password changed email:', error)
    return { success: false, error }
  }
}

// ─── Booking Notification Emails ───────────────────────────────────────────────

/**
 * Notify a counsellor that a new session has been booked for them
 */
export async function sendCounsellorBookingConfirmationEmail(
  email: string,
  counsellorName: string,
  booking: {
    id: string
    clientName: string
    startTime: Date
    endTime: Date
    roomName?: string
    sessionType: string
  }
) {
  const bookingUrl = `${BASE_URL}/counsellor/bookings/${booking.id}`
  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)
  const dateStr = startTime.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = `${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New Session Booked – ${booking.clientName} on ${dateStr}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f0;">
          <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,rgb(82,112,82),rgb(61,90,61));border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:white;font-size:24px;">📅 New Session Booked</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#333;">Hi ${counsellorName},</p>
                <p style="font-size:16px;color:#333;">A new session has been booked for you.</p>
                <table width="100%" cellspacing="0" cellpadding="0" style="background:#f9f9f9;border-radius:8px;margin:20px 0;">
                  <tr><td style="padding:24px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="padding:8px 0;font-size:14px;color:#666;">Client</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:right;">${booking.clientName}</td></tr>
                      <tr><td style="padding:8px 0;font-size:14px;color:#666;">Date</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:right;">${dateStr}</td></tr>
                      <tr><td style="padding:8px 0;font-size:14px;color:#666;">Time</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:right;">${timeStr}</td></tr>
                      ${booking.roomName ? `<tr><td style="padding:8px 0;font-size:14px;color:#666;">Room</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:right;">${booking.roomName}</td></tr>` : ''}
                      <tr><td style="padding:8px 0;font-size:14px;color:#666;">Type</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:right;">${booking.sessionType}</td></tr>
                    </table>
                  </td></tr>
                </table>
                <table cellspacing="0" cellpadding="0" width="100%"><tr><td align="center" style="padding:20px 0;">
                  <a href="${bookingUrl}" style="display:inline-block;padding:16px 32px;background:rgb(82,112,82);color:white;text-decoration:none;border-radius:8px;font-weight:bold;">View Booking</a>
                </td></tr></table>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending counsellor booking confirmation email:', error)
    return { success: false, error }
  }
}

/**
 * Notify either party (client or counsellor) that a session has been rescheduled
 */
export async function sendBookingRescheduledEmail(
  email: string,
  recipientName: string,
  booking: {
    id: string
    clientName: string
    counsellorName: string
    newStartTime: Date
    newEndTime: Date
    oldStartTime: Date
    roomName?: string
  }
) {
  const bookingUrl = `${BASE_URL}/counsellor/bookings/${booking.id}`
  const newStart = new Date(booking.newStartTime)
  const newEnd = new Date(booking.newEndTime)
  const oldStart = new Date(booking.oldStartTime)
  const newDateStr = newStart.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const newTimeStr = `${newStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${newEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  const oldDateStr = oldStart.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const oldTimeStr = oldStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Session Rescheduled – ${newDateStr}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f0;">
          <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,rgb(217,117,82),rgb(197,90,56));border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:white;font-size:24px;">🔄 Session Rescheduled</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#333;">Hi ${recipientName},</p>
                <p style="font-size:16px;color:#333;">Your counselling session between <strong>${booking.clientName}</strong> and <strong>${booking.counsellorName}</strong> has been rescheduled.</p>
                <table width="100%" cellspacing="0" cellpadding="0" style="background:#fff5f2;border-radius:8px;margin:16px 0;border:1px solid #fde8df;">
                  <tr><td style="padding:16px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#c55a38;font-weight:bold;text-transform:uppercase;">Previously</p>
                    <p style="margin:0;font-size:14px;color:#999;text-decoration:line-through;">${oldDateStr} at ${oldTimeStr}</p>
                  </td></tr>
                </table>
                <table width="100%" cellspacing="0" cellpadding="0" style="background:#f0fdf4;border-radius:8px;margin:16px 0;border:1px solid #bbf7d0;">
                  <tr><td style="padding:16px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#166534;font-weight:bold;text-transform:uppercase;">New Time</p>
                    <p style="margin:0;font-size:16px;color:#333;font-weight:bold;">${newDateStr}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#166534;">${newTimeStr}</p>
                    ${booking.roomName ? `<p style="margin:4px 0 0;font-size:14px;color:#666;">📍 ${booking.roomName}</p>` : ''}
                  </td></tr>
                </table>
                <table cellspacing="0" cellpadding="0" width="100%"><tr><td align="center" style="padding:20px 0;">
                  <a href="${bookingUrl}" style="display:inline-block;padding:16px 32px;background:rgb(197,90,56);color:white;text-decoration:none;border-radius:8px;font-weight:bold;">View Details</a>
                </td></tr></table>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending booking rescheduled email:', error)
    return { success: false, error }
  }
}

/**
 * Notify either party (client or counsellor) that a session has been cancelled
 */
export async function sendBookingCancelledEmail(
  email: string,
  recipientName: string,
  booking: {
    clientName: string
    counsellorName: string
    startTime: Date
    endTime: Date
    roomName?: string
  }
) {
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  const dateStr = start.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Session Cancelled – ${dateStr}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f0;">
          <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,rgb(239,68,68),rgb(220,38,38));border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:white;font-size:24px;">Session Cancelled</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#333;">Hi ${recipientName},</p>
                <p style="font-size:16px;color:#333;">The following counselling session has been cancelled:</p>
                <table width="100%" cellspacing="0" cellpadding="0" style="background:#f9f9f9;border-radius:8px;margin:20px 0;">
                  <tr><td style="padding:24px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="padding:8px 0;font-size:14px;color:#666;">Client</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:right;">${booking.clientName}</td></tr>
                      <tr><td style="padding:8px 0;font-size:14px;color:#666;">Counsellor</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:right;">${booking.counsellorName}</td></tr>
                      <tr><td style="padding:8px 0;font-size:14px;color:#666;">Date</td><td style="padding:8px 0;font-size:14px;color:#999;font-weight:bold;text-align:right;text-decoration:line-through;">${dateStr}</td></tr>
                      <tr><td style="padding:8px 0;font-size:14px;color:#666;">Time</td><td style="padding:8px 0;font-size:14px;color:#999;font-weight:bold;text-align:right;text-decoration:line-through;">${timeStr}</td></tr>
                      ${booking.roomName ? `<tr><td style="padding:8px 0;font-size:14px;color:#666;">Room</td><td style="padding:8px 0;font-size:14px;color:#999;font-weight:bold;text-align:right;">${booking.roomName}</td></tr>` : ''}
                    </table>
                  </td></tr>
                </table>
                <p style="font-size:14px;color:#666;">If you need to reschedule, please contact the ${BASE_URL.includes('localhost') ? 'counsellor' : 'platform'} directly.</p>
              </td></tr>
              <tr><td style="padding:20px 40px;background:#f9f9f9;border-radius:0 0 16px 16px;text-align:center;">
                <p style="font-size:12px;color:#999;">© 2026 ${PLATFORM_NAME}. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending booking cancelled email:', error)
    return { success: false, error }
  }
}

/**
 * Notify super admins that an API key was automatically rotated.
 * The new plaintext key is included in the email — it is not stored anywhere.
 * Recipients have GRACE_HOURS to update any systems that use the old key.
 */
export async function sendApiKeyRotationEmail(
  adminEmail: string,
  adminName: string,
  keyName: string,
  newKey: string,
  newPrefix: string,
  graceHours: number = 24,
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `[${PLATFORM_NAME}] API Key Auto-Rotated: ${keyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding:40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
                    style="background-color:white;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,rgb(82,112,82) 0%,rgb(61,90,61) 100%);border-radius:16px 16px 0 0;">
                        <h1 style="margin:0;color:white;font-size:24px;font-weight:bold;">API Key Rotated</h1>
                        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${PLATFORM_NAME} · Automated Security Rotation</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px 40px;">
                        <p style="color:#374151;font-size:15px;">Hi ${adminName},</p>
                        <p style="color:#374151;font-size:15px;">
                          The API key <strong>"${keyName}"</strong> has been automatically rotated as scheduled.
                          The <strong>old key remains valid for ${graceHours} hours</strong> to give you time to update any systems that depend on it.
                        </p>

                        <div style="background:#f0f7f0;border:1px solid #86a87e;border-radius:12px;padding:20px 24px;margin:24px 0;">
                          <p style="margin:0 0 8px;font-size:13px;color:#4a7c59;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                            New API Key — copy now, not stored anywhere else
                          </p>
                          <code style="display:block;background:#fff;border:1px solid #c9dfc5;border-radius:8px;padding:12px 16px;font-size:13px;font-family:monospace;color:#1a2e1a;word-break:break-all;letter-spacing:0.02em;">
                            ${newKey}
                          </code>
                          <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Prefix: ${newPrefix}…</p>
                        </div>

                        <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
                          <p style="margin:0;font-size:13px;color:#92400e;">
                            <strong>Action required:</strong> Update any integrations, services, or environment variables using this key within ${graceHours} hours. After that, the old key will be rejected.
                          </p>
                        </div>

                        <p style="color:#374151;font-size:14px;">You can view and manage all API keys in the
                          <a href="${BASE_URL}/admin/api-keys" style="color:#4a7c59;font-weight:600;">Admin Panel → API Keys</a>.
                        </p>
                        <p style="color:#6b7280;font-size:13px;margin-top:24px;">This is an automated security notification. No action was taken by any user.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 40px;background:#f9fafb;border-radius:0 0 16px 16px;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">${PLATFORM_NAME} · Automated key rotation</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending API key rotation email:', error)
    return { success: false, error }
  }
}
