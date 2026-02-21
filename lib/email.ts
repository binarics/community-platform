// lib/email.ts
// Email service using Resend (free tier: 3,000 emails/month)

import { Resend } from 'resend'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@yourdomain.com'
const PLATFORM_NAME = 'Community Platform'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

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
