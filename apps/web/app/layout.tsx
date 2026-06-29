import type { Metadata } from 'next'
import { Mulish, Urbanist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'

const mulish = Mulish({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
})

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'Nexano',
    template: '%s — Nexano',
  },
  description: 'Plataforma moderna para billing, serviços digitais e automação.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${mulish.variable} ${urbanist.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={300}>
                {children}
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
