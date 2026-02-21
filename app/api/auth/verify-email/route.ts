// app/api/auth/verify-email/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Check if token is expired
    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 })
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    })

    return NextResponse.json({
      message: 'Email verified successfully',
      email: user.email,
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
