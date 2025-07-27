import { createClient } from '@supabase/supabase-js'

// Environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Additional validation for placeholder values
if (supabaseUrl.includes('your_supabase_project_url') || supabaseUrl.includes('placeholder')) {
  console.warn('⚠️  Using placeholder Supabase URL. Please update your .env.local with actual Supabase credentials.')
  console.warn('📖 See SUPABASE_SETUP.md for detailed setup instructions.')
}

if (supabaseAnonKey.includes('your_supabase_anon_key') || supabaseAnonKey.includes('placeholder')) {
  console.warn('⚠️  Using placeholder Supabase key. Please update your .env.local with actual Supabase credentials.')
}

// Create a single supabase client for interacting with your database
// This client is used for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names - centralized for easy maintenance
export const TABLES = {
  USERS: 'users',
  USER_INTERACTIONS: 'user_interactions',
  USER_SCHEMES: 'user_schemes',
  SCHEME_APPLICATIONS: 'scheme_applications'
} as const

// Authentication configuration
export const AUTH_CONFIG = {
  // Redirect URLs for authentication
  redirectTo: `${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://your-domain.com'}/auth/callback`,
  
  // Session storage options
  storage: {
    getItem: (key: string) => {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key)
      }
      return null
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value)
      }
    },
    removeItem: (key: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    }
  }
}

// Type definitions for our database schema
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone_number?: string
  date_of_birth?: string
  address?: string
  occupation?: string
  income_range?: string
  created_at: string
  updated_at: string
}

export interface UserInteraction {
  id: string
  user_id: string
  interaction_type: 'page_view' | 'scheme_search' | 'chat_message' | 'voice_query' | 'document_upload' | 'profile_update' | 'sign_in' | 'sign_up' | 'sign_out'
  interaction_data?: Record<string, any>
  timestamp: string
}

export interface UserScheme {
  id: string
  user_id: string
  scheme_name: string
  scheme_category: string
  eligibility_score: number
  bookmarked: boolean
  applied: boolean
  created_at: string
}

export interface SchemeApplication {
  id: string
  user_id: string
  scheme_name: string
  application_status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  application_data?: Record<string, any>
  submitted_at?: string
  updated_at: string
}
