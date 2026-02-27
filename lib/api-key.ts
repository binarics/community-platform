import { createHash, randomBytes } from 'crypto'
import { prisma } from './prisma'

const KEY_PREFIX = 'cp_live_'

/** Generate a new API key. Returns the plaintext key (shown once) and its display prefix. */
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
 * Validate an API key from a request's Authorization header.
 * Accepts "Bearer <key>" or bare "<key>".
 * Returns true and updates lastUsedAt if valid, false otherwise.
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

  // Fire-and-forget lastUsedAt update
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: now } }).catch(() => {})

  return true
}
