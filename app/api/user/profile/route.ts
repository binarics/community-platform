import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    // --- Password change flow ---
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashed = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })
      return NextResponse.json({ message: 'Password updated successfully' })
    }

    // --- Name / email update flow ---
    const updateData: { name?: string; email?: string } = {}

    if (name) updateData.name = name

    if (email && email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
      updateData.email = email
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
