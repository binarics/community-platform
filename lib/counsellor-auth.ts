import { cookies } from 'next/headers'

export const COUNSELLOR_COOKIE = 'selected_counsellor_profile_id'

/**
 * Returns the prisma `where` clause to use when fetching the active
 * CounsellorProfile for the current request.
 *
 * - Regular COUNSELLOR: always their own profile (by userId)
 * - SUPER_ADMIN with cookie set: the explicitly chosen profile (by id)
 * - SUPER_ADMIN without cookie: returns null → caller should use findFirst()
 *   to fall back to the first available profile
 */
export async function getActiveCounsellorWhere(
  userId: string,
  role: string
): Promise<{ userId: string } | { id: string } | null> {
  if (role !== 'SUPER_ADMIN') {
    return { userId }
  }

  const cookieStore = await cookies()
  const selectedId = cookieStore.get(COUNSELLOR_COOKIE)?.value

  if (selectedId) {
    return { id: selectedId }
  }

  // No explicit selection → caller falls back to findFirst()
  return null
}

/**
 * Returns the currently selected counsellor profile ID from the cookie,
 * or null if none is set.
 */
export async function getSelectedCounsellorId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COUNSELLOR_COOKIE)?.value ?? null
}
