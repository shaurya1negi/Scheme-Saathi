'use client'

import { useState, useEffect } from 'react'
import { supabase, TABLES, User, UserInteraction, UserScheme } from '../lib/supabase'
import { useAuth } from '../contexts/auth_context'

/**
 * Hook for managing user profile data
 */
export const useUserProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          await createProfile()
        } else {
          throw error
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) return

    try {
      const newProfile = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([newProfile])
        .select()
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile
  }
}

/**
 * Hook for tracking user interactions
 */
export const useUserInteractions = () => {
  const { user } = useAuth()

  const logInteraction = async (
    type: UserInteraction['interaction_type'],
    data?: Record<string, any>
  ) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from(TABLES.USER_INTERACTIONS)
        .insert([{
          user_id: user.id,
          interaction_type: type,
          interaction_data: data || {},
          timestamp: new Date().toISOString()
        }])

      if (error) throw error
    } catch (err) {
      console.error('Error logging interaction:', err)
    }
  }

  const getInteractions = async (limit: number = 10) => {
    if (!user) return { data: [], error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from(TABLES.USER_INTERACTIONS)
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(limit)

      return { data: data || [], error: null }
    } catch (err) {
      return { 
        data: [], 
        error: err instanceof Error ? err.message : 'Failed to fetch interactions' 
      }
    }
  }

  return {
    logInteraction,
    getInteractions
  }
}

/**
 * Hook for managing user schemes (bookmarks, applications, etc.)
 */
export const useUserSchemes = () => {
  const { user } = useAuth()
  const [schemes, setSchemes] = useState<UserScheme[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserSchemes()
    }
  }, [user])

  const fetchUserSchemes = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from(TABLES.USER_SCHEMES)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSchemes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schemes')
    } finally {
      setLoading(false)
    }
  }

  const bookmarkScheme = async (
    schemeName: string,
    schemeCategory: string,
    eligibilityScore?: number
  ) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from(TABLES.USER_SCHEMES)
        .upsert([{
          user_id: user.id,
          scheme_name: schemeName,
          scheme_category: schemeCategory,
          eligibility_score: eligibilityScore || 0,
          bookmarked: true,
          applied: false,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error
      
      await fetchUserSchemes() // Refresh the list
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bookmark scheme'
      return { data: null, error: errorMessage }
    }
  }

  const removeBookmark = async (schemeId: string) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { error } = await supabase
        .from(TABLES.USER_SCHEMES)
        .update({ bookmarked: false })
        .eq('id', schemeId)
        .eq('user_id', user.id)

      if (error) throw error
      
      await fetchUserSchemes() // Refresh the list
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to remove bookmark' }
    }
  }

  return {
    schemes,
    loading,
    error,
    bookmarkScheme,
    removeBookmark,
    refetch: fetchUserSchemes
  }
}

/**
 * Hook for real-time data subscriptions
 */
export const useRealtimeSubscription = (
  table: string,
  filter?: { column: string; value: any }
) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: any

    const setupSubscription = async () => {
      // Initial fetch
      let query = supabase.from(table).select('*')
      
      if (filter) {
        query = query.eq(filter.column, filter.value)
      }

      const { data: initialData, error } = await query
      
      if (error) {
        console.error('Error fetching initial data:', error)
      } else {
        setData(initialData || [])
      }
      
      setLoading(false)

      // Set up real-time subscription
      let channel = supabase.channel(`${table}_changes`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: table,
            filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
          }, 
          (payload) => {
            console.log('Real-time update:', payload)
            
            switch (payload.eventType) {
              case 'INSERT':
                setData(prev => [payload.new, ...prev])
                break
              case 'UPDATE':
                setData(prev => prev.map(item => 
                  item.id === payload.new.id ? payload.new : item
                ))
                break
              case 'DELETE':
                setData(prev => prev.filter(item => item.id !== payload.old.id))
                break
            }
          }
        )
        .subscribe()

      subscription = channel
    }

    setupSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [table, filter?.column, filter?.value])

  return { data, loading }
}
