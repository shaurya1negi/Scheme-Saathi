'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/language_context';
import { useTheme } from '../contexts/theme_context';
import { 
  Bell, Search, Star, Users, Award, TrendingUp, Globe, Shield, Heart, BookOpen, 
  Home as HomeIcon, Briefcase, Zap, Download, Wifi, WifiOff, Clock, Target,
  Activity, BarChart3, User, MessageCircle, Sparkles, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface UserStats {
  schemesViewed: number;
  applicationsSubmitted: number;
  successfulApplications: number;
  favoriteCategories: string[];
  timeSpentToday: number;
  achievements: string[];
  weeklyProgress: { day: string; schemes: number }[];
}

interface AppMetrics {
  totalUsers: string;
  schemesAvailable: number;
  successfulApplications: string;
  averageProcessingTime: string;
  userSatisfaction: number;
}

export default function Home() {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [appMetrics, setAppMetrics] = useState<AppMetrics | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [showUserDashboard, setShowUserDashboard] = useState(false);

  useEffect(() => {
    // Track page load time
    const startTime = performance.now();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    });

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    // Load user data and metrics
    loadUserData();
    loadAppMetrics();
    loadSmartSuggestions();

    // Track analytics
    trackPageView();

    // Calculate load time
    window.addEventListener('load', () => {
      const endTime = performance.now();
      setLoadTime(Math.round(endTime - startTime));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats);
        setShowUserDashboard(data.stats.schemesViewed > 0);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadAppMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/app');
      if (response.ok) {
        const data = await response.json();
        setAppMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error loading app metrics:', error);
    }
  };

  const loadSmartSuggestions = async () => {
    try {
      const response = await fetch('/api/search/smart?suggestions=true');
      if (response.ok) {
        const data = await response.json();
        setSmartSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
    }
  };

  const trackPageView = async () => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'page_view',
          page: 'home',
          timestamp: new Date().toISOString(),
          metadata: {
            loadTime,
            userAgent: navigator.userAgent,
            language: language
          }
        })
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
        trackEvent('pwa_installed');
      }
      
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  };

  const trackEvent = async (eventName: string, metadata?: any) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          page: 'home',
          timestamp: new Date().toISOString(),
          metadata
        })
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await trackEvent('search_performed', { query: searchQuery });
      window.location.href = `/schemes?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSmartSuggestionClick = async (suggestion: string) => {
    setSearchQuery(suggestion);
    await trackEvent('smart_suggestion_used', { suggestion });
  };

  const categories = [
    {
      name: 'Agriculture & Farming',
      icon: <Globe className="w-8 h-8" />,
      count: 156,
      color: 'from-green-400 to-green-600',
      description: 'Schemes for farmers and agricultural development'
    },
    {
      name: 'Healthcare',
      icon: <Heart className="w-8 h-8" />,
      count: 98,
      color: 'from-red-400 to-red-600',
      description: 'Health insurance and medical schemes'
    },
    {
      name: 'Education',
      icon: <BookOpen className="w-8 h-8" />,
      count: 124,
      color: 'from-blue-400 to-blue-600',
      description: 'Educational scholarships and programs'
    },
    {
      name: 'Housing',
      icon: <HomeIcon className="w-8 h-8" />,
      count: 67,
      color: 'from-purple-400 to-purple-600',
      description: 'Housing and shelter schemes'
    },
    {
      name: 'Employment',
      icon: <Briefcase className="w-8 h-8" />,
      count: 89,
      color: 'from-orange-400 to-orange-600',
      description: 'Job creation and skill development'
    },
    {
      name: 'Social Welfare',
      icon: <Shield className="w-8 h-8" />,
      count: 143,
      color: 'from-indigo-400 to-indigo-600',
      description: 'Social security and welfare programs'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900'
    }`}>
      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {isOnline ? 'Online' : 'Offline Mode'}
                </span>
              </div>
              
              {loadTime > 0 && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{loadTime}ms</span>
                </div>
              )}
            </div>

            {canInstall && (
              <button
                onClick={handleInstallPWA}
                className="flex items-center space-x-2 px-4 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Scheme Saathi
              </span>
              <Sparkles className="inline-block w-8 h-8 ml-2 text-yellow-500" />
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Your AI-powered companion for discovering government schemes with smart recommendations
            </p>

            {/* Smart Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask me anything about government schemes..."
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:border-blue-500 focus:outline-none shadow-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
              
              {/* Smart Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {smartSuggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSmartSuggestionClick(suggestion)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* App Metrics */}
            {appMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-8">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {appMetrics.totalUsers}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    Total Users
                  </div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {appMetrics.schemesAvailable}+
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    Active Schemes
                  </div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {appMetrics.successfulApplications}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    Applications Approved
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {appMetrics.userSatisfaction}/5
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    User Rating
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* User Dashboard */}
      {showUserDashboard && userStats && (
        <section className="py-8 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Activity Dashboard</h2>
                <Link href="/profile" className="flex items-center space-x-1 text-white/80 hover:text-white">
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{userStats.schemesViewed}</div>
                  <div className="text-white/80 text-sm">Schemes Viewed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{userStats.applicationsSubmitted}</div>
                  <div className="text-white/80 text-sm">Applications</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{userStats.timeSpentToday}m</div>
                  <div className="text-white/80 text-sm">Time Today</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{userStats.achievements.length}</div>
                  <div className="text-white/80 text-sm">Achievements</div>
                </div>
              </div>
              
              {userStats.favoriteCategories.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Your Favorite Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {userStats.favoriteCategories.slice(0, 3).map((category, index) => (
                      <span key={index} className="px-4 py-2 bg-white/20 rounded-full text-sm">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Explore Scheme Categories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Find schemes tailored to your needs across various sectors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/schemes?category=${encodeURIComponent(category.name)}`}
                className="group"
                onClick={() => trackEvent('category_clicked', { category: category.name })}
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      {category.count}
                    </span>
                    <span className="text-sm text-gray-500">
                      schemes
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Advanced Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powered by AI and designed for the modern digital India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Smart recommendations based on your profile and preferences
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Offline Support</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access schemes even without internet connection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your application progress and success metrics
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Assistant</h3>
              <p className="text-gray-600 dark:text-gray-300">
                24/7 AI chat support in multiple Indian languages
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Future?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join millions of Indians accessing government benefits through our AI-powered platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/schemes"
                onClick={() => trackEvent('cta_browse_clicked')}
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Explore Schemes</span>
              </Link>
              <Link
                href="/chat"
                onClick={() => trackEvent('cta_chat_clicked')}
                className="bg-blue-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-900 transition-colors text-lg flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>AI Assistant</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
