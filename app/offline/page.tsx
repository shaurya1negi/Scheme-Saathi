'use client';

import { useState, useEffect } from 'react';
import { Wifi, RefreshCw, Home, Search, MessageCircle, User } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-redirect when connection is restored
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    
    try {
      // Test connection
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        window.location.href = '/';
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.log('Still offline');
    } finally {
      setRetrying(false);
    }
  };

  const offlineFeatures = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Browse Cached Schemes",
      description: "View previously loaded government schemes",
      action: () => window.location.href = '/schemes'
    },
    {
      icon: <User className="w-6 h-6" />,
      title: "View Profile",
      description: "Access your saved information",
      action: () => window.location.href = '/profile'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Offline Chat",
      description: "Get help with basic questions",
      action: () => window.location.href = '/chat?offline=true'
    }
  ];

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wifi className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connection Restored!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your internet connection is back. Redirecting you to Scheme Saathi...
          </p>
          
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Scheme Saathi</h1>
                <p className="text-sm text-red-600 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Offline Mode
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Checking...' : 'Retry'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Offline Status Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wifi className="w-10 h-10 text-blue-600 transform rotate-45" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You're Offline
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Don't worry! Scheme Saathi works offline too. You can still access many features while we wait for your connection to return.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>💡 Tip:</strong> Your data will automatically sync when you're back online. 
                Any forms you fill out will be saved locally and submitted once connected.
              </p>
            </div>
          </div>

          {/* Available Features */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Available Offline Features
            </h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              {offlineFeatures.map((feature, index) => (
                <button
                  key={index}
                  onClick={feature.action}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    {feature.icon}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </button>
              ))}
            </div>
            
            {/* Navigation */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">
                Quick Navigation
              </h3>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
                
                <button
                  onClick={() => window.location.href = '/schemes'}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Schemes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              We'll automatically redirect you when your connection returns
            </p>
            
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm text-gray-500 ml-2">Checking connection...</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            Scheme Saathi - Your trusted companion for government schemes
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Offline capabilities powered by Progressive Web App technology
          </p>
        </div>
      </footer>
    </div>
  );
}
