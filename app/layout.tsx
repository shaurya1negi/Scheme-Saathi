import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '../contexts/language_context'
import { ThemeProvider } from '../contexts/theme_context'
import { AuthProvider } from '../contexts/auth_context'
import { SessionProvider } from '../contexts/session_context'
import AuthProviderWrapper from '../components/auth_provider'

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
        <AuthProviderWrapper>
          <ThemeProvider>
            <LanguageProvider>
              <SessionProvider>
                <AuthProvider>
                  {children}
                </AuthProvider>
              </SessionProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProviderWrapper>
      </body>
    </html>
  )
}
