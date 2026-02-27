import { createHash, createHmac, randomBytes } from 'crypto'
import { prisma } from './prisma'

// ---------------------------------------------------------------------------
// PART 1: DB-backed API keys (for external integrations)
// Keys are hashed on creation; plaintext is never stored.
// Auto-rotation is driven by the /api/cron/rotate-keys cron job.
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'cp_live_'
const GRACE_HOURS = 24

/** Generate a new API key. Returns the plaintext (shown/emailed once) and its display prefix. */
export function generateApiKey(): { key: string; prefix: string } {
  const secret = randomBytes(32).toString('hex')
  const key = `${KEY_PREFIX}${secret}`
  const prefix = key.slice(0, 15) // e.g. "cp_live_a1b2c3d"
  return { key, prefix }
}

/** SHA-256 hash of the key — this is what we store in the database. */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Validate a DB-backed API key from an Authorization header value.
 * Accepts "Bearer <key>" or bare "<key>".
 * Updates lastUsedAt on success.
 */
export async function validateApiKey(raw: string): Promise<boolean> {
  const key = raw.startsWith('Bearer ') ? raw.slice(7) : raw
  if (!key.startsWith(KEY_PREFIX)) return false

  const keyHash = hashApiKey(key)
  const now = new Date()

  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } })

  if (!apiKey || !apiKey.isActive) return false
  if (apiKey.expiresAt && apiKey.expiresAt < now) return false
  if (apiKey.revokedAt && apiKey.revokedAt < now) return false

  // Fire-and-forget — don't block the request
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: now } }).catch(() => {})

  return true
}

/**
 * Automatically rotate any DB-backed keys that are past their rotation interval.
 * Called by the /api/cron/rotate-keys cron job — no human action needed.
 *
 * Returns an array of rotation records so the caller can send notification emails.
 */
export async function autoRotateDueKeys(): Promise<
  Array<{ name: string; newKey: string; newPrefix: string }>
> {
  const now = new Date()

  // Find all active keys with auto-rotation configured
  const keys = await prisma.apiKey.findMany({
    where: {
      isActive: true,
      rotationIntervalDays: { not: null },
      revokedAt: null,
    },
  })

  const rotated: Array<{ name: string; newKey: string; newPrefix: string }> = []

  for (const key of keys) {
    if (!key.rotationIntervalDays) continue

    const intervalMs = key.rotationIntervalDays * 24 * 60 * 60 * 1000
    const baseline = key.lastRotatedAt ?? key.createdAt
    const nextRotationDue = new Date(baseline.getTime() + intervalMs)

    if (now < nextRotationDue) continue // not due yet

    // Generate new key
    const { key: newKey, prefix: newPrefix } = generateApiKey()
    const newHash = hashApiKey(newKey)
    const graceExpiry = new Date(now.getTime() + GRACE_HOURS * 60 * 60 * 1000)

    await prisma.$transaction([
      // Mark old key as rolling out — valid until grace period expires
      prisma.apiKey.update({
        where: { id: key.id },
        data: { revokedAt: graceExpiry },
      }),
      // Create new key, preserving rotation settings
      prisma.apiKey.create({
        data: {
          name: key.name,
          keyHash: newHash,
          keyPrefix: newPrefix,
          createdById: key.createdById,
          expiresAt: key.expiresAt,
          rotationIntervalDays: key.rotationIntervalDays,
          lastRotatedAt: now,
        },
      }),
    ])

    rotated.push({ name: key.name, newKey, newPrefix })
  }

  return rotated
}

// ---------------------------------------------------------------------------
// PART 2: HMAC time-windowed tokens (for internal server-to-server calls)
// Fully automatic — derived from NEXTAUTH_SECRET + current time window.
// Both the caller and verifier independently compute the current token.
// No database, no manual steps, no rotation cron needed.
// ---------------------------------------------------------------------------

const HMAC_WINDOW_MS = 24 * 60 * 60 * 1000 // 24-hour windows
const HMAC_GRACE_WINDOWS = 1 // also accept previous window

function currentWindows(): number[] {
  const current = Math.floor(Date.now() / HMAC_WINDOW_MS)
  return Array.from({ length: HMAC_GRACE_WINDOWS + 1 }, (_, i) => current - i)
}

/** Generate the HMAC token valid for the current 24-hour window. */
export function generateInternalToken(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set')
  const window = Math.floor(Date.now() / HMAC_WINDOW_MS)
  return createHmac('sha256', secret).update(String(window)).digest('hex')
}

/**
 * Validate a time-windowed HMAC token (current window + previous window accepted).
 * Use this for internal server-to-server API calls within the same app.
 */
export function validateInternalToken(token: string): boolean {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return false
  return currentWindows().some((w) => {
    const expected = createHmac('sha256', secret).update(String(w)).digest('hex')
    return expected === token
  })
}
