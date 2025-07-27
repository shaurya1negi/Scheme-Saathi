'use client';

import React from 'react';
import { useAuth } from '../../contexts/auth_context';

export default function TestAuthPage() {
  const { user, session, loading, signUp, signIn, signOut, signInWithGoogle } = useAuth();

  const handleEmailSignUp = () => {
    signUp('test@example.com', 'password123', {
      full_name: 'Test User',
      phone: '1234567890'
    });
  };

  const handleEmailSignIn = () => {
    signIn('test@example.com', 'password123');
  };

  const handleGoogleSignIn = () => {
    signInWithGoogle();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Current Status:</h2>
        <p><strong>User:</strong> {user ? user.email : 'Not authenticated'}</p>
        <p><strong>User ID:</strong> {user ? user.id : 'N/A'}</p>
        <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      </div>

      <div className="space-y-4">
        {!user ? (
          <>
            <div>
              <button 
                onClick={handleEmailSignUp}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Test Email Sign Up
              </button>
              <button 
                onClick={handleEmailSignIn}
                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
              >
                Test Email Sign In
              </button>
              <button 
                onClick={handleGoogleSignIn}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Test Google Sign In
              </button>
            </div>
          </>
        ) : (
          <div>
            <button 
              onClick={signOut}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Environment Check:</h3>
        <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
        <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
      </div>
    </div>
  );
}
