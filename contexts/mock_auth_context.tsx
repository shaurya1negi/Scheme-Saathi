'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'

interface MockAuthContextType {
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

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined)

export const useMockAuth = () => {
  const context = useContext(MockAuthContext)
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider')
  }
  return context
}

interface MockAuthProviderProps {
  children: React.ReactNode
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if there's a mock user in localStorage
    const mockUser = localStorage.getItem('mockUser')
    if (mockUser) {
      try {
        const userData = JSON.parse(mockUser)
        setUser(userData)
        // Create a mock session
        setSession({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: userData
        } as Session)
      } catch (e) {
        localStorage.removeItem('mockUser')
      }
    }
    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      user_metadata: userData || {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as User

    setUser(mockUser)
    localStorage.setItem('mockUser', JSON.stringify(mockUser))
    
    setLoading(false)
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simple mock validation
    if (email && password) {
      const mockUser = {
        id: `mock-user-${email.replace('@', '-').replace('.', '-')}`,
        email,
        user_metadata: { full_name: email.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User

      setUser(mockUser)
      localStorage.setItem('mockUser', JSON.stringify(mockUser))
      
      setLoading(false)
      return { error: null }
    }
    
    setLoading(false)
    return { error: { message: 'Invalid credentials' } as AuthError }
  }

  const signOut = async () => {
    setUser(null)
    setSession(null)
    localStorage.removeItem('mockUser')
    return { error: null }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockUser = {
      id: 'mock-google-user',
      email: 'demo@example.com',
      user_metadata: { 
        full_name: 'Demo User',
        avatar_url: 'https://via.placeholder.com/100'
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as User

    setUser(mockUser)
    localStorage.setItem('mockUser', JSON.stringify(mockUser))
    
    setLoading(false)
    return { error: null }
  }

  const resetPassword = async (email: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { error: null }
  }

  const updateProfile = async (updates: any) => {
    if (!user) return { error: { message: 'No user logged in' } as AuthError }
    
    const updatedUser = {
      ...user,
      user_metadata: { ...user.user_metadata, ...updates },
      updated_at: new Date().toISOString()
    }
    
    setUser(updatedUser)
    localStorage.setItem('mockUser', JSON.stringify(updatedUser))
    
    return { error: null }
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
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  )
}
