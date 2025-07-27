'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth_context';
import { useUserInteractions, useUserProfile } from '../../hooks/useSupabase';

export default function TestDatabasePage() {
  const { user } = useAuth();
  const { logInteraction } = useUserInteractions();
  const { profile, updateProfile, loading } = useUserProfile();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testInteractionLogging = async () => {
    try {
      await logInteraction('page_view', { test: 'database_functionality' });
      addResult('✅ Interaction logging successful');
    } catch (error) {
      addResult(`❌ Interaction logging failed: ${error}`);
    }
  };

  const testProfileUpdate = async () => {
    try {
      const result = await updateProfile({
        full_name: 'Test User Updated'
      });
      if (result.error) {
        addResult(`❌ Profile update failed: ${result.error.message}`);
      } else {
        addResult('✅ Profile update successful');
      }
    } catch (error) {
      addResult(`❌ Profile update failed: ${error}`);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/schemes/recommendations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        addResult('✅ API authentication protection working (401 response expected when not logged in)');
      } else if (response.ok) {
        addResult('✅ API working and user is authenticated');
      } else {
        addResult(`❌ API error: ${response.status}`);
      }
    } catch (error) {
      addResult(`❌ API connection failed: ${error}`);
    }
  };

  if (!user) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Test Page</h1>
        <p className="text-yellow-600">Please sign in first to test database functionality.</p>
        <a href="/test-auth" className="text-blue-500 underline">Go to Auth Test Page</a>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Functionality Test</h1>
      
      <div className="mb-6 p-4 bg-green-50 rounded">
        <h2 className="text-lg font-semibold mb-2">User Status:</h2>
        <p><strong>Logged in as:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Profile Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Profile Data:</strong> {profile ? JSON.stringify(profile, null, 2) : 'None'}</p>
      </div>

      <div className="space-y-4 mb-6">
        <button 
          onClick={testDatabaseConnection}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Test API Connection
        </button>
        
        <button 
          onClick={testInteractionLogging}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Interaction Logging
        </button>
        
        <button 
          onClick={testProfileUpdate}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Test Profile Update
        </button>
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm font-mono">
              {result}
            </div>
          ))}
        </div>
        {testResults.length === 0 && (
          <p className="text-gray-500">No tests run yet. Click the buttons above to test database functionality.</p>
        )}
      </div>
    </div>
  );
}
