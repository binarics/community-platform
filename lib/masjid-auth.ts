import { cookies } from 'next/headers'

export const MASJID_COOKIE = 'selected_masjid_id'

/**
 * Returns the currently selected masjid ID from the cookie, or null.
 */
export async function getSelectedMasjidId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(MASJID_COOKIE)?.value ?? null
}
