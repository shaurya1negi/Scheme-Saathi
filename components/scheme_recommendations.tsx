'use client'

import React, { useState, useEffect } from 'react'
import { Star, Bookmark, Check, ExternalLink, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/auth_context'
import { useUserSchemes } from '../hooks/useSupabase'
import { supabase } from '../lib/supabase'

interface Scheme {
  name: string
  category: string
  description: string
  eligibility_score: number
  benefits: string[]
  apply_url: string
  department: string
  recommended_reason: string
}

interface SchemeRecommendationsProps {
  isOpen: boolean
  onClose: () => void
}

export default function SchemeRecommendations({ isOpen, onClose }: SchemeRecommendationsProps) {
  const { user } = useAuth()
  const { schemes, bookmarkScheme, removeBookmark } = useUserSchemes()
  
  const [recommendations, setRecommendations] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchRecommendations()
    }
  }, [isOpen, user])

  const fetchRecommendations = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/schemes/recommendations', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async (scheme: Scheme) => {
    const isBookmarked = schemes.some(s => s.scheme_name === scheme.name && s.bookmarked)
    
    if (isBookmarked) {
      const bookmarkedScheme = schemes.find(s => s.scheme_name === scheme.name && s.bookmarked)
      if (bookmarkedScheme) {
        await removeBookmark(bookmarkedScheme.id)
      }
    } else {
      await bookmarkScheme(scheme.name, scheme.category, scheme.eligibility_score)
    }
  }

  const isSchemeBookmarked = (schemeName: string) => {
    return schemes.some(s => s.scheme_name === schemeName && s.bookmarked)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Personalized Scheme Recommendations
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                AI-powered recommendations based on your profile
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRecommendations}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                title="Refresh recommendations"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Finding your perfect schemes...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
              <button
                onClick={fetchRecommendations}
                className="ml-3 text-red-800 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && recommendations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">
                {user ? 'No recommendations found. Try updating your profile for better matches.' : 'Please sign in to get personalized recommendations.'}
              </p>
            </div>
          )}

          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((scheme, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {scheme.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {scheme.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getScoreColor(scheme.eligibility_score)}`}>
                        {scheme.eligibility_score}% match
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookmark(scheme)}
                    className={`p-2 rounded-lg transition-colors ${
                      isSchemeBookmarked(scheme.name)
                        ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200'
                        : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-100'
                    }`}
                    title={isSchemeBookmarked(scheme.name) ? 'Remove bookmark' : 'Bookmark scheme'}
                  >
                    {isSchemeBookmarked(scheme.name) ? 
                      <div className="relative">
                        <Bookmark className="w-5 h-5" />
                        <Check className="w-3 h-3 absolute -top-1 -right-1" />
                      </div> : 
                      <Bookmark className="w-5 h-5" />
                    }
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {scheme.description}
                </p>

                {/* Recommendation Reason */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>Why this matches:</strong> {scheme.recommended_reason}
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Key Benefits:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {scheme.benefits.slice(0, 3).map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {scheme.department}
                  </div>
                  <a
                    href={scheme.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Learn More
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          {recommendations.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                💡 <strong>Pro Tip:</strong> Complete your profile with more details to get even better recommendations! 
                Bookmark schemes you're interested in to track them easily.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
