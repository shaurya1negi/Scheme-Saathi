'use client'

import React, { useState } from 'react'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'

export default function SupabaseSetupBanner() {
  const [isVisible, setIsVisible] = useState(true)
  
  // Check if we're using placeholder credentials
  const isUsingPlaceholder = 
    process.env.NODE_ENV === 'development' &&
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
     !process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://'))

  if (!isVisible || !isUsingPlaceholder) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Supabase Setup Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              To enable authentication and database features, you need to configure Supabase credentials.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium hover:bg-yellow-200 transition-colors"
              >
                Create Supabase Project
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => {
                  const element = document.createElement('a')
                  element.href = '/SUPABASE_SETUP.md'
                  element.download = 'SUPABASE_SETUP.md'
                  element.click()
                }}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
              >
                Setup Guide
              </button>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={() => setIsVisible(false)}
            className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
