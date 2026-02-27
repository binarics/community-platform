import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiKey, hashApiKey } from '@/lib/api-key'

const GRACE_HOURS = 24

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const existing = await prisma.apiKey.findUnique({ where: { id: params.id } })
  if (!existing || !existing.isActive) {
    return NextResponse.json({ error: 'Key not found or already revoked' }, { status: 404 })
  }

  const graceExpiry = new Date(Date.now() + GRACE_HOURS * 60 * 60 * 1000)

  // Generate the new key
  const { key, prefix } = generateApiKey()
  const keyHash = hashApiKey(key)

  await prisma.$transaction([
    // Old key: stays active through grace window, then expires
    prisma.apiKey.update({
      where: { id: params.id },
      data: { revokedAt: graceExpiry },
    }),
    // New key: same name, full validity
    prisma.apiKey.create({
      data: {
        name: existing.name,
        keyHash,
        keyPrefix: prefix,
        createdById: session.user.id,
        expiresAt: existing.expiresAt,
      },
    }),
  ])

  return NextResponse.json({
    key,
    prefix,
    message: `Old key valid for ${GRACE_HOURS} more hours, then revoked automatically.`,
  })
}
