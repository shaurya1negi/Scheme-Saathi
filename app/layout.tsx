import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '../contexts/language_context'
import { ThemeProvider } from '../contexts/theme_context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Scheme Sathi - Government Schemes Assistant',
  description: 'Your AI-powered companion to find and apply for government schemes in India',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
