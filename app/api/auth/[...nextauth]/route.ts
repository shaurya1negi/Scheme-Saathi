import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Check if Google OAuth credentials are configured
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && 
                          process.env.GOOGLE_CLIENT_SECRET && 
                          process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' &&
                          process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret'

const handler = NextAuth({
  providers: isGoogleConfigured ? [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ] : [],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
