import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEventTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatEventDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
