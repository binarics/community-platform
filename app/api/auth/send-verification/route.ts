// app/api/auth/send-verification/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Return the same generic response whether the email exists or not,
    // to prevent account enumeration.
    if (!user || user.emailVerified) {
      return NextResponse.json({
        message: 'If an account exists with that email and requires verification, a link has been sent.',
      })
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date()
    expiry.setHours(expiry.getHours() + 24) // 24 hour expiry

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationExpiry: expiry,
      },
    })

    // Send verification email
    const result = await sendVerificationEmail(
      user.email,
      user.name || 'User',
      token
    )

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Verification email sent successfully',
    })
  } catch (error) {
    console.error('Send verification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
