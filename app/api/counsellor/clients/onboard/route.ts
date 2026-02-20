import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { counsellorId, name, email, createAccount, notes } = body

    let clientId: string

    if (createAccount) {
      // Create a new client account
      
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      // Create the user
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'CLIENT',
        },
      })

      clientId = newUser.id

      // TODO: Send email with temporary password
      // For now, we'll just log it (in production, use email service)
      console.log(`Temporary password for ${email}: ${tempPassword}`)
    } else {
      // Link existing user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (!existingUser) {
        return NextResponse.json(
          { error: 'No user found with this email' },
          { status: 404 }
        )
      }

      clientId = existingUser.id

      // Update their role to CLIENT if not already
      if (existingUser.role !== 'CLIENT') {
        await prisma.user.update({
          where: { id: clientId },
          data: { role: 'CLIENT' },
        })
      }
    }

    // Check if relationship already exists
    const existingRelation = await prisma.clientCounsellor.findUnique({
      where: {
        clientId_counsellorId: {
          clientId,
          counsellorId,
        },
      },
    })

    if (existingRelation) {
      return NextResponse.json(
        { error: 'This client is already assigned to you' },
        { status: 400 }
      )
    }

    // Create the client-counsellor relationship
    await prisma.clientCounsellor.create({
      data: {
        clientId,
        counsellorId,
        notes,
      },
    })

    return NextResponse.json({ 
      clientId,
      message: 'Client onboarded successfully' 
    })
  } catch (error) {
    console.error('Onboard client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}