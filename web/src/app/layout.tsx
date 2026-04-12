import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Brawl Strategy',
  description: 'Brawl Stars strategy planning and tier lists',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${plusJakarta.variable} font-sans bg-brand-black text-white min-h-screen`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
