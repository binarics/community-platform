import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autoRotateDueKeys, validateInternalToken } from '@/lib/api-key'
import { sendApiKeyRotationEmail } from '@/lib/email'

export async function GET(request: Request) {
  // Accept the Vercel CRON_SECRET or an internal HMAC time-windowed token
  const authHeader = request.headers.get('authorization') ?? ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  const cronSecret = process.env.CRON_SECRET

  const validCronSecret = !!cronSecret && bearer === cronSecret
  const validInternal = !validCronSecret && validateInternalToken(bearer)

  if (!validCronSecret && !validInternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rotated = await autoRotateDueKeys()

    if (rotated.length === 0) {
      return NextResponse.json({ message: 'No keys due for rotation', rotated: 0 })
    }

    // Notify all super admins with the new key values — the only time they are revealed
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { email: true, name: true },
    })

    const emailResults: string[] = []

    for (const { name: keyName, newKey, newPrefix } of rotated) {
      for (const admin of superAdmins) {
        const result = await sendApiKeyRotationEmail(
          admin.email,
          admin.name ?? 'Admin',
          keyName,
          newKey,
          newPrefix,
        )
        if (!result.success) {
          emailResults.push(`Failed to email ${admin.email} for key "${keyName}"`)
        }
      }
    }

    return NextResponse.json({
      message: `Rotated ${rotated.length} key(s)`,
      rotated: rotated.length,
      keys: rotated.map((r) => r.name),
      ...(emailResults.length > 0 && { emailErrors: emailResults }),
    })
  } catch (error) {
    console.error('rotate-keys cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
