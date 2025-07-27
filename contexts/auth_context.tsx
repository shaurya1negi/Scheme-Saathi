'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && !url.includes('placeholder') && url.startsWith('https://')
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: any) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if Supabase is configured
  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    if (!supabaseConfigured) {
      console.warn('⚠️  Supabase not configured, authentication features will be limited')
      setLoading(false)
      return
    }

    // Get initial session only if Supabase is configured
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes only if Supabase is configured
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in')
            // Track sign in event
            if (session?.user) {
              await logUserInteraction('sign_in', { user_id: session.user.id })
            }
            break
          case 'SIGNED_OUT':
            console.log('User signed out')
            break
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed')
            break
          case 'USER_UPDATED':
            console.log('User updated')
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabaseConfigured])

  // Helper function to log user interactions
  const logUserInteraction = async (type: string, data: any) => {
    if (!supabaseConfigured) return
    
    try {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: data.user_id,
          interaction_type: type,
          interaction_data: data,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging interaction:', error)
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData?: any) => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      })

      if (!error && data.user) {
        // Log sign up interaction
        await logUserInteraction('sign_up', { 
          user_id: data.user.id,
          email: data.user.email 
        })
      }

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Sign out
  const signOut = async () => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError }
    }

    try {
      if (user) {
        await logUserInteraction('sign_out', { user_id: user.id })
      }
      
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Update user profile
  const updateProfile = async (updates: any) => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      })

      if (!error && user) {
        await logUserInteraction('profile_update', { 
          user_id: user.id,
          updates 
        })
      }

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
