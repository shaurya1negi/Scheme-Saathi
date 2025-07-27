'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function OAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testGoogleOAuth = async () => {
    try {
      addDebugInfo('🔄 Starting Google OAuth test...');
      
      // Get the redirect URL that Supabase will use
      const redirectUrl = `${window.location.origin}/auth/callback`;
      addDebugInfo(`📍 Redirect URL: ${redirectUrl}`);
      
      // Try to initiate Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        addDebugInfo(`❌ OAuth Error: ${error.message}`);
      } else {
        addDebugInfo(`✅ OAuth initiated successfully`);
        addDebugInfo(`🔗 OAuth URL: ${data.url || 'Not provided'}`);
      }
    } catch (err) {
      addDebugInfo(`💥 Exception: ${err}`);
    }
  };

  const checkSupabaseConfig = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    addDebugInfo(`🏠 Supabase URL: ${url ? (url.substring(0, 30) + '...') : 'Missing'}`);
    addDebugInfo(`🔑 Supabase Key: ${key ? (key.substring(0, 20) + '...') : 'Missing'}`);
    addDebugInfo(`🌐 Current Origin: ${window.location.origin}`);
    addDebugInfo(`📍 Expected Callback: ${window.location.origin}/auth/callback`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Google OAuth Debug Page</h1>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="text-lg font-semibold mb-2">🚨 403 Error - Possible Causes:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Google Cloud Console:</strong> Missing http://localhost:3000 in Authorized JavaScript origins</li>
          <li><strong>Supabase:</strong> Incorrect redirect URL configuration</li>
          <li><strong>Google OAuth Client:</strong> Wrong client ID or secret in Supabase</li>
          <li><strong>Domain verification:</strong> Domain not verified in Google Cloud Console</li>
        </ul>
      </div>

      <div className="space-y-4 mb-6">
        <button 
          onClick={checkSupabaseConfig}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Check Configuration
        </button>
        
        <button 
          onClick={testGoogleOAuth}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Test Google OAuth (Safe Debug)
        </button>
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {debugInfo.map((info, index) => (
            <div key={index} className="text-sm font-mono whitespace-pre-wrap">
              {info}
            </div>
          ))}
        </div>
        {debugInfo.length === 0 && (
          <p className="text-gray-500">Click the buttons above to start debugging.</p>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">📋 Configuration Checklist:</h3>
        <div className="text-sm space-y-2">
          <p><strong>1. Google Cloud Console → Credentials → OAuth 2.0 Client IDs:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Authorized JavaScript origins: <code>http://localhost:3000</code></li>
            <li>Authorized redirect URIs: <code>https://sxnrtmtclupeyqwynusy.supabase.co/auth/v1/callback</code></li>
          </ul>
          
          <p><strong>2. Supabase Dashboard → Authentication → Providers → Google:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Enabled: ✅ ON</li>
            <li>Client ID: From Google Cloud Console</li>
            <li>Client Secret: From Google Cloud Console</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
