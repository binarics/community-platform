import type { Metadata } from 'next'
import { Crimson_Pro, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Community Platform - Connect With Your Local Community',
  description: 'Discover local events, courses, and community services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${crimsonPro.variable} ${dmSans.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
