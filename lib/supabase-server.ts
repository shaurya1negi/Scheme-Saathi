import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Environment variable validation
function validateSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  if (url.includes('placeholder') || key.includes('placeholder')) {
    console.warn('⚠️  Using placeholder Supabase credentials. Features may not work correctly.')
  }

  return { url, key }
}

/**
 * Create a Supabase client for server-side operations
 * This is used in API routes and server components
 */
export function createServerSupabaseClient(
  request: NextRequest,
  response: NextResponse
) {
  const { url, key } = validateSupabaseConfig()
  
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}

/**
 * Create a Supabase client for server actions and route handlers
 */
export function createActionClient() {
  const { cookies } = require('next/headers')
  const { url, key } = validateSupabaseConfig()
  
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookies().getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies().set(name, value, options)
        })
      },
    },
  })
}
