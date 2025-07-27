'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Upload, MessageCircle, Mic, FileCheck, Bell, ScanLine, Volume2, HelpCircle,
         Search, Star, Users, Award, TrendingUp, Globe, Shield, Heart, BookOpen, 
         Home as HomeIcon, Briefcase, Zap, Download, Wifi, WifiOff, Clock, Target,
         Activity, BarChart3, User, Sparkles, ChevronRight, Smartphone, FileText,
         Clipboard } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/language_context';
import { useTheme } from '../contexts/theme_context';
import Link from 'next/link';
import Sidebar from '../components/sidebar_component';
import LanguageToggle from '../components/language_toggle';
import SchemeCarousel from '../components/scheme_carousel';
import UploadModal from '../components/upload_modal';
import SettingsModal from '../components/settings_modal';
import OfflineIndicator from '../components/offline_indicator';

// Design System
const designSystem = {
  colors: {
    primary: '#1E40AF',      // Government blue
    secondary: '#F97316',    // Warm orange  
    success: '#059669',      // Forest green
    warning: '#D97706',      // Amber
    error: '#DC2626',        // Crimson
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A'
    }
  },
  typography: {
    h1: 'text-3xl font-bold',
    h2: 'text-xl font-semibold', 
    body: 'text-base font-normal',
    caption: 'text-sm font-medium'
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem'
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  }
};

// Phase 4 Enhanced Types
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

export default function HomePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpCategory, setHelpCategory] = useState('general');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  
  // Phase 4 Advanced Features State
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [appMetrics, setAppMetrics] = useState<AppMetrics | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering browser-specific content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modals when user successfully authenticates via Google
  useEffect(() => {
    if (status === 'authenticated') {
      setIsSignInOpen(false);
      setIsSignUpOpen(false);
    }
  }, [status]);

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    setIsSidebarOpen(false);
  };

  // Comprehensive help content for rural users
  const helpContent = {
    general: {
      title: language === 'hi' ? '🏠 मुख्य सहायता' : '🏠 General Help',
      audio: language === 'hi' 
        ? 'स्कीम साथी में आपका स्वागत है। यह एप्प आपको सरकारी योजनाओं की जानकारी देता है। आप अपनी जानकारी अपलोड कर सकते हैं, चैट कर सकते हैं, और अपने आवेदन देख सकते हैं।'
        : 'Welcome to Scheme Saathi. This app helps you find government schemes. You can upload information, chat, and view your applications.',
      steps: language === 'hi' ? [
        '📋 सबसे पहले अपनी जानकारी अपलोड करें',
        '💬 सवाल पूछने के लिए चैट का इस्तेमाल करें', 
        '🔍 अपने लिए उपयुक्त योजनाएं खोजें',
        '📱 आवेदन की स्थिति जांचें'
      ] : [
        '📋 First upload your information',
        '💬 Use chat to ask questions',
        '🔍 Find suitable schemes for you', 
        '📱 Check application status'
      ]
    },
    upload: {
      title: language === 'hi' ? '📋 जानकारी अपलोड करना' : '📋 Upload Information',
      audio: language === 'hi'
        ? 'जानकारी अपलोड करने के लिए नीले बटन को दबाएं। अपना नाम, उम्र, आधार नंबर, आय और पता भरें। यह जानकारी आपको सही योजनाएं सुझाने के लिए जरूरी है।'
        : 'To upload information, press the blue button. Fill your name, age, Aadhaar number, income and address. This information is needed to suggest right schemes.',
      steps: language === 'hi' ? [
        '🔵 नीला "जानकारी अपलोड करें" बटन दबाएं',
        '✏️ सभी जानकारी सही-सही भरें',
        '🆔 आधार नंबर 12 अंकों का होना चाहिए',
        '💰 सालाना आय रुपयों में लिखें',
        '✅ "जमा करें" बटन दबाएं'
      ] : [
        '🔵 Press blue "Upload Information" button',
        '✏️ Fill all information correctly',
        '🆔 Aadhaar number should be 12 digits',
        '💰 Write annual income in rupees',
        '✅ Press "Submit" button'
      ]
    },
    chat: {
      title: language === 'hi' ? '💬 चैट सहायता' : '💬 Chat Help',
      audio: language === 'hi'
        ? 'चैट में आप सरकारी योजनाओं के बारे में सवाल पूछ सकते हैं। जैसे किसान योजना, महिला योजना, या बुजुर्गों के लिए योजना। आसान भाषा में सवाल पूछें।'
        : 'In chat you can ask questions about government schemes. Like farmer schemes, women schemes, or schemes for elderly. Ask questions in simple language.',
      steps: language === 'hi' ? [
        '💚 हरा "टेक्स्ट चैटबॉट" बटन दबाएं',
        '❓ आसान भाषा में सवाल पूछें',
        '🌾 जैसे: "किसान के लिए क्या योजना है?"',
        '👩 "महिलाओं के लिए कोई योजना?"',
        '💡 योजना की पूरी जानकारी मिलेगी'
      ] : [
        '💚 Press green "Text Chatbot" button',
        '❓ Ask questions in simple language',
        '🌾 Like: "What schemes for farmers?"',
        '👩 "Any schemes for women?"',
        '💡 Get complete scheme information'
      ]
    },
    voice: {
      title: language === 'hi' ? '🎤 आवाज सहायता' : '🎤 Voice Help',
      audio: language === 'hi'
        ? 'आवाज से बात करने के लिए बैंगनी बटन दबाएं। फिर माइक बटन दबाकर अपना सवाल बोलें। आप हिंदी या अंग्रेजी में बात कर सकते हैं।'
        : 'To talk with voice, press purple button. Then press mic button and speak your question. You can speak in Hindi or English.',
      steps: language === 'hi' ? [
        '🟣 बैंगनी "वॉयस असिस्टेंट" बटन दबाएं',
        '🎤 माइक बटन दबाएं',
        '🗣️ साफ आवाज में सवाल बोलें',
        '⏹️ बात खत्म करके "रुकें" दबाएं',
        '👂 जवाब सुनें'
      ] : [
        '🟣 Press purple "Voice Assistant" button',
        '🎤 Press microphone button',
        '🗣️ Speak your question clearly',
        '⏹️ Press "Stop" when finished',
        '👂 Listen to the answer'
      ]
    },
    documents: {
      title: language === 'hi' ? '📄 दस्तावेज़ स्कैन करना' : '📄 Document Scanning',
      audio: language === 'hi'
        ? 'दस्तावेज़ स्कैन करने के लिए हरे रंग का OCR बटन दबाएं। आधार कार्ड, राशन कार्ड, या बैंक पासबुक की फोटो खींचें। यह आपकी जानकारी अपने आप भर देगा।'
        : 'To scan documents, press green OCR button. Take photo of Aadhaar card, ration card, or bank passbook. It will automatically fill your information.',
      steps: language === 'hi' ? [
        '🟢 हरा "दस्तावेज़ OCR" बटन दबाएं',
        '📋 दस्तावेज़ का प्रकार चुनें',
        '📷 साफ फोटो खींचें या अपलोड करें',
        '⏳ स्कैन होने का इंतजार करें',
        '✅ जानकारी चेक करें और सेव करें'
      ] : [
        '🟢 Press green "Document OCR" button',
        '📋 Choose document type',
        '📷 Take clear photo or upload',
        '⏳ Wait for scanning',
        '✅ Check information and save'
      ]
    },
    applications: {
      title: language === 'hi' ? '📱 आवेदन देखना' : '📱 View Applications',
      audio: language === 'hi'
        ? 'अपने आवेदन देखने के लिए पीला बटन दबाएं। यहां आप देख सकते हैं कि आपका आवेदन कहां तक पहुंचा है। लंबित, स्वीकृत या अस्वीकृत की जानकारी मिलेगी।'
        : 'To view applications, press yellow button. Here you can see how far your application has reached. You will get information about pending, approved or rejected status.',
      steps: language === 'hi' ? [
        '🟡 पीला "आवेदन ट्रैकर" बटन दबाएं',
        '📋 अपने सभी आवेदन देखें',
        '🔍 स्थिति चेक करें (लंबित/स्वीकृत)',
        '📅 अगली डेट की जानकारी लें',
        '📞 जरूरत हो तो संपर्क करें'
      ] : [
        '🟡 Press yellow "Application Tracker" button',
        '📋 View all your applications',
        '🔍 Check status (pending/approved)',
        '📅 Get next date information',
        '📞 Contact if needed'
      ]
    },
    offline: {
      title: language === 'hi' ? '📶 ऑफ़लाइन मोड' : '📶 Offline Mode',
      audio: language === 'hi'
        ? 'इंटरनेट न होने पर भी आप कुछ काम कर सकते हैं। पहले से सेव की गई जानकारी देख सकते हैं, फॉर्म भर सकते हैं। नया आवेदन भेजने के लिए इंटरनेट चाहिए।'
        : 'Even without internet you can do some work. You can view previously saved information, fill forms. Internet is needed to submit new applications.',
      steps: language === 'hi' ? [
        '📱 ऑफ़लाइन मोड अपने आप चालू हो जाता है',
        '✅ पुराना डेटा देख सकते हैं',
        '✅ फॉर्म भर सकते हैं',
        '✅ योजना की जानकारी पढ़ सकते हैं',
        '❌ नया आवेदन नहीं भेज सकते'
      ] : [
        '📱 Offline mode starts automatically',
        '✅ Can view old data',
        '✅ Can fill forms',
        '✅ Can read scheme information',
        '❌ Cannot submit new applications'
      ]
    },
    troubleshooting: {
      title: language === 'hi' ? '🔧 समस्या समाधान' : '🔧 Troubleshooting',
      audio: language === 'hi'
        ? 'अगर एप्प में कोई समस्या आ रही है तो घबराएं नहीं। इंटरनेट चेक करें, फोन रीस्टार्ट करें, या हेल्पलाइन पर कॉल करें।'
        : 'If you face any problem in the app, do not worry. Check internet, restart phone, or call helpline.',
      steps: language === 'hi' ? [
        '📶 इंटरनेट कनेक्शन चेक करें',
        '🔄 एप्प बंद करके फिर खोलें',
        '📱 फोन रीस्टार्ट करें',
        '🧹 कैश क्लियर करें',  
        '📞 हेल्पलाइन: 1800-111-3333'
      ] : [
        '📶 Check internet connection',
        '🔄 Close and reopen app',
        '📱 Restart phone',
        '🧹 Clear cache',
        '📞 Helpline: 1800-111-3333'
      ]
    }
  };

  // Visual tutorial mode
  const tutorialSteps = [
    {
      target: '.upload-button',
      title: language === 'hi' ? 'यहां अपनी जानकारी अपलोड करें' : 'Upload your information here',
      description: language === 'hi' ? 'सबसे पहले यहां क्लिक करें' : 'Click here first'
    },
    {
      target: '.chat-button', 
      title: language === 'hi' ? 'सवाल पूछने के लिए चैट करें' : 'Chat to ask questions',
      description: language === 'hi' ? 'योजनाओं के बारे में पूछें' : 'Ask about schemes'
    },
    {
      target: '.voice-button',
      title: language === 'hi' ? 'आवाज से बात करें' : 'Talk with voice',
      description: language === 'hi' ? 'बोलकर सवाल पूछें' : 'Ask questions by speaking'
    }
  ];

  const startTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(0);
    setIsHelpOpen(false);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      setTutorialStep(0);
    }
  };

  // Context-aware help - detect what user might need help with
  const getContextualHelp = () => {
    if (typeof window === 'undefined') return 'general';
    
    const path = window.location.pathname;
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/voice')) return 'voice';  
    if (path.includes('/ocr')) return 'documents';
    if (path.includes('/applications')) return 'applications';
    if (path.includes('/auth')) return 'general';
    return 'general';
  };

  // Smart help button that opens relevant help
  const openSmartHelp = () => {
    const context = getContextualHelp();
    setHelpCategory(context);
    setIsHelpOpen(true);
    
    // Auto-play audio for immediate help
    setTimeout(() => speakHelp(context), 500);
  };

  // Enhanced audio help with categories
  const speakHelp = (category = helpCategory) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const content = helpContent[category];
    const utterance = new SpeechSynthesisUtterance(content.audio);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.8; // Slower for better understanding
    speechSynthesis.speak(utterance);
  };

  // Main action buttons configuration with Indian Flag colors and simplified text
  const getActionColor = (index: number) => {
    const indianFlagColors = [
      { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-500', name: 'Saffron' },    // Upload - Saffron
      { bg: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-green-600', name: 'Green' },        // Chat - Green
      { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600', name: 'Navy Blue' },      // Voice - Navy Blue (Chakra)
      { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', text: 'text-orange-600', name: 'Deep Saffron' }, // Applications - Deep Saffron
      { bg: 'bg-green-700', hover: 'hover:bg-green-800', text: 'text-green-700', name: 'Deep Green' },   // Notifications - Deep Green
      { bg: 'bg-blue-700', hover: 'hover:bg-blue-800', text: 'text-blue-700', name: 'Deep Blue' },      // OCR - Deep Blue
    ];
    return indianFlagColors[index] || { bg: 'bg-gray-600', hover: 'hover:bg-gray-700', text: 'text-gray-600', name: 'Default' };
  };

  const mainActions = [
    {
      icon: Upload,
      label: language === 'hi' ? 'अपलोड करें' : 'Upload Info',
      description: language === 'hi' ? 'जानकारी जोड़ें' : 'Add your details',
      onClick: () => setIsUploadModalOpen(true),
    },
    {
      icon: MessageCircle,
      label: language === 'hi' ? 'चैट करें' : 'Chat Bot',
      description: language === 'hi' ? 'सवाल पूछें' : 'Ask questions',
      onClick: () => router.push('/chat'),
    },
    {
      icon: Mic,
      label: language === 'hi' ? 'आवाज़ सहायक' : 'Voice Helper',
      description: language === 'hi' ? 'बोलकर पूछें' : 'Speak to ask',
      onClick: () => router.push('/voice'),
    },
    {
      icon: FileCheck,
      label: language === 'hi' ? 'आवेदन ट्रैकर' : 'Track Apps',
      description: language === 'hi' ? 'स्थिति देखें' : 'Check status',
      onClick: () => router.push('/applications'),
    },
    {
      icon: Bell,
      label: language === 'hi' ? 'अलर्ट' : 'Alerts',
      description: language === 'hi' ? 'नई सूचना' : 'Get updates',
      onClick: () => router.push('/notifications'),
    },
    {
      icon: ScanLine,
      label: language === 'hi' ? 'स्कैन करें' : 'Scan Docs',
      description: language === 'hi' ? 'दस्तावेज़ पढ़ें' : 'Read documents',
      onClick: () => router.push('/ocr'),
    },
  ];

  const handleSignIn = (credentials: any) => {
    // Mock authentication for regular email/password - replace with real auth logic
    console.log('User signed in:', credentials);
    setIsSignInOpen(false);
  };

  const handleSignUp = (userData: any) => {
    // Mock registration for regular email/password - replace with real auth logic
    console.log('User signed up:', userData);
    setIsSignUpOpen(false);
  };

  const handleGoogleSignIn = () => {
    // Check if Google OAuth is configured
    const isConfigured = process.env.NODE_ENV === 'development' 
      ? true // In development, we'll let NextAuth handle the error
      : true; // In production, add actual check
      
    if (!isConfigured) {
      alert('Google OAuth is not configured yet. Please contact the developer.');
      return;
    }
    
    signIn('google', { callbackUrl: '/' });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Phase 4 Enhanced Features
  useEffect(() => {
    if (!mounted) return;
    
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
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

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
    const handleLoad = () => {
      const endTime = performance.now();
      setLoadTime(Math.round(endTime - startTime));
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('load', handleLoad);
    };
  }, [mounted]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats);
        setShowUserDashboard(data.stats && data.stats.schemesViewed > 0);
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
      router.push(`/schemes?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSmartSuggestionClick = async (suggestion: string) => {
    setSearchQuery(suggestion);
    await trackEvent('smart_suggestion_used', { suggestion });
  };

  // Don't render browser-specific content until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                <Menu size={20} className="text-neutral-700 dark:text-neutral-300" />
              </button>
              <h1 className="text-3xl font-bold text-blue-600">
                Scheme Saathi
              </h1>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm font-medium text-blue-600">
                  Sign In
                </button>
                <button className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md">
                  Sign Up
                </button>
                <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                  <Globe size={16} className="text-neutral-700 dark:text-neutral-300" />
                </button>
                <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                  <X size={20} className="text-neutral-700 dark:text-neutral-300" />
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-neutral-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Phase 4: PWA Status Bar - Only show when mounted */}
      {mounted && !isOnline && (
        <div className="bg-warning text-black text-center py-2 px-4 text-sm font-medium">
          <WifiOff className="inline-block w-4 h-4 mr-2" />
          {language === 'hi' ? 'आप ऑफ़लाइन हैं। कुछ सुविधाएं सीमित हो सकती हैं।' : 'You\'re offline. Some features may be limited.'}
        </div>
      )}
      
      {mounted && canInstall && (
        <div className="bg-primary text-white text-center py-2 px-4 text-sm font-medium">
          <Smartphone className="inline-block w-4 h-4 mr-2" />
          {language === 'hi' ? 'बेहतर अनुभव के लिए Scheme-Saathi इंस्टॉल करें' : 'Install Scheme-Saathi for a better experience'}
          <button 
            onClick={handleInstallPWA}
            className="ml-4 bg-white text-primary px-3 py-1 rounded text-xs font-medium hover:bg-neutral-100 transition-colors"
          >
            {language === 'hi' ? 'इंस्टॉल करें' : 'Install'}
          </button>
        </div>
      )}

      {/* Simplified Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Hamburger Menu */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-neutral-700 dark:text-neutral-300" />
            </button>

            {/* Center - App Title */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-3xl font-bold text-blue-600">
                Scheme Saathi
              </h1>
            </div>

            {/* Right - Authentication, Language Toggle and Close Button */}
            <div className="flex items-center gap-2">
              {mounted && status === 'unauthenticated' ? (
                <>
                  <button
                    onClick={() => setIsSignInOpen(true)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {language === 'hi' ? 'साइन इन' : 'Sign In'}
                  </button>
                  <button
                    onClick={() => setIsSignUpOpen(true)}
                    className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {language === 'hi' ? 'साइन अप' : 'Sign Up'}
                  </button>
                </>
              ) : mounted && status === 'authenticated' && session?.user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    {language === 'hi' ? 'नमस्ते' : 'Hello'}, {session.user.name || session.user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    {language === 'hi' ? 'साइन आउट' : 'Sign Out'}
                  </button>
                </div>
              ) : null}
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simplified Rural Appeal Banner */}
        <div className="bg-blue-600 text-white p-4 rounded-lg mb-8 border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇮🇳</span>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {language === 'hi' ? 'सरकारी योजना सहायक' : 'Government Scheme Assistant'}
              </h2>
              <p className="text-sm font-medium text-neutral-100">
                {language === 'hi' ? 'गांव के लिए, किसानों के लिए, आपके लिए' : 'For villages, for farmers, for you'}
              </p>
            </div>
          </div>
        </div>

        {/* Hero Section with Main Actions */}
        <section className="text-center mb-16">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900 dark:text-white">
              {language === 'hi' ? 'सरकारी योजनाएं खोजें' : 'Discover Government Schemes'}
            </h2>
            <p className="text-base font-normal text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-2">
              {language === 'hi' ? 'आपके लिए उपयुक्त योजनाओं की जानकारी प्राप्त करें' : 'Find suitable schemes designed for you'}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="w-3 h-2 bg-orange-500 rounded-sm"></span>
              <span className="w-3 h-2 bg-white border border-neutral-300 rounded-sm"></span>
              <span className="w-3 h-2 bg-green-600 rounded-sm"></span>
              <span className="ml-2">{language === 'hi' ? 'तिरंगे की भावना के साथ' : 'Inspired by Tricolor'}</span>
            </div>
          </div>

          {/* Simplified Smart Search */}
          <div className="mb-8 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'hi' ? 'योजनाओं की खोज करें...' : 'Search for schemes...'}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  {language === 'hi' ? 'खोजें' : 'Search'}
                </button>
              </div>
            </form>
            
            {/* Simplified suggestions */}
            {smartSuggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {smartSuggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSmartSuggestionClick(suggestion)}
                    className="px-3 py-1 rounded-full text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clean User Dashboard */}
          {showUserDashboard && userStats && (
            <div className="mb-8 max-w-4xl mx-auto p-6 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-center mb-6 text-neutral-900 dark:text-white">
                {language === 'hi' ? 'आपकी गतिविधि' : 'Your Activity'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { 
                    value: userStats.schemesViewed, 
                    label: language === 'hi' ? 'देखी गई योजनाएं' : 'Schemes Viewed',
                    color: 'text-blue-600'
                  },
                  { 
                    value: userStats.applicationsSubmitted, 
                    label: language === 'hi' ? 'जमा किए गए आवेदन' : 'Applications Submitted',
                    color: 'text-green-600'
                  },
                  { 
                    value: userStats.timeSpentToday, 
                    label: language === 'hi' ? 'आज का समय (मिनट)' : 'Time Today (mins)',
                    color: 'text-orange-500'
                  }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                    <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Professional Indian Flag Themed Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {mainActions.map((action, index) => {
              let buttonClass = '';
              if (index === 0) buttonClass = 'upload-button';
              if (index === 1) buttonClass = 'chat-button';
              if (index === 2) buttonClass = 'voice-button';
              
              const colors = getActionColor(index);
              
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`${buttonClass} group relative overflow-hidden p-8 rounded-2xl text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${colors.bg} ${colors.hover} ${
                    showTutorial && tutorialSteps[tutorialStep]?.target === `.${buttonClass}` 
                      ? 'ring-4 ring-yellow-400 ring-opacity-75 z-50 relative' 
                      : ''
                  }`}
                >
                  {/* Professional gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative flex flex-col items-center text-center">
                    {/* Icon container with professional styling */}
                    <div className="p-4 bg-white/20 rounded-xl mb-6 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                      <action.icon size={28} className="drop-shadow-sm" />
                    </div>
                    
                    {/* Title with better typography */}
                    <h3 className="text-xl font-bold mb-3 tracking-wide">
                      {action.label}
                    </h3>
                    
                    {/* Simplified description */}
                    <p className="text-sm opacity-90 font-medium leading-relaxed">
                      {action.description}
                    </p>

                    {/* Professional bottom accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Schemes Carousel Section */}
        <section className="mb-8">
          <SchemeCarousel />
        </section>

        {/* Simplified Quick Stats */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-8 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '500+', label: language === 'hi' ? 'सरकारी योजनाएं' : 'Government Schemes', color: 'text-blue-600' },
              { value: '50L+', label: language === 'hi' ? 'नागरिकों की मदद' : 'Citizens Helped', color: 'text-green-600' },
              { value: '24/7', label: language === 'hi' ? 'AI सहायता' : 'AI Support', color: 'text-orange-500' },
              { value: '12', label: language === 'hi' ? 'भाषाएं' : 'Languages', color: 'text-amber-600' }
            ].map((stat, index) => (
              <div key={index}>
                <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Clean App Metrics Dashboard */}
      {appMetrics && (
        <section className="bg-white dark:bg-neutral-800 py-12 border-t border-neutral-200 dark:border-neutral-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-neutral-900 dark:text-white">
              {language === 'hi' ? 'ऐप स्टेटिस्टिक्स' : 'App Statistics'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { 
                  icon: TrendingUp, 
                  value: appMetrics.totalUsers, 
                  label: language === 'hi' ? 'कुल उपयोगकर्ता' : 'Total Users',
                  color: 'text-blue-600',
                  bg: 'bg-blue-50 dark:bg-blue-900/20'
                },
                { 
                  icon: BookOpen, 
                  value: appMetrics.schemesAvailable, 
                  label: language === 'hi' ? 'उपलब्ध योजनाएं' : 'Available Schemes',
                  color: 'text-green-600',
                  bg: 'bg-green-50 dark:bg-green-900/20'
                },
                { 
                  icon: FileCheck, 
                  value: appMetrics.successfulApplications, 
                  label: language === 'hi' ? 'सफल आवेदन' : 'Successful Applications',
                  color: 'text-orange-500',
                  bg: 'bg-orange-50 dark:bg-orange-900/20'
                },
                { 
                  icon: Clock, 
                  value: `${loadTime}ms`, 
                  label: language === 'hi' ? 'लोड टाइम' : 'Load Time',
                  color: 'text-amber-600',
                  bg: 'bg-amber-50 dark:bg-amber-900/20'
                }
              ].map((stat, index) => (
                <div key={index} className={`text-center p-4 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Simplified Footer */}
      <footer className="bg-neutral-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base font-normal text-neutral-300">
            {language === 'hi' 
              ? '© 2024 स्कीम साथी. भारत के लोगों के लिए बनाया गया 🇮🇳'
              : '© 2024 Scheme Saathi. Built for the people of India 🇮🇳'
            }
          </p>
          <p className="text-sm font-medium text-neutral-400 mt-2">
            {language === 'hi'
              ? 'तकनीक और सरकारी योजनाओं के माध्यम से नागरिकों को सशक्त बनाना'
              : 'Empowering citizens through technology and government schemes'
            }
          </p>
        </div>
      </footer>

      {/* Simplified Floating Help Button */}
      <button
        onClick={openSmartHelp}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50"
        aria-label="Smart Help"
        title={language === 'hi' ? 'स्मार्ट सहायता - तुरंत मदद पाएं' : 'Smart Help - Get instant help'}
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {language === 'hi' ? '� विस्तृत सहायता' : '� Detailed Help'}
              </h3>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Help Categories */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">
                {language === 'hi' ? 'सहायता श्रेणी चुनें:' : 'Choose Help Category:'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.keys(helpContent).map((key) => (
                  <button
                    key={key}
                    onClick={() => setHelpCategory(key)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      helpCategory === key 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {helpContent[key].title}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Help Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <button
                onClick={startTutorial}
                className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                <span className="text-lg">🎯</span>
                {language === 'hi' ? 'विजुअल ट्यूटोरियल' : 'Visual Tutorial'}
              </button>
              <button
                onClick={() => setHelpCategory('troubleshooting')}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                <span className="text-lg">🔧</span>
                {language === 'hi' ? 'समस्या समाधान' : 'Troubleshooting'}
              </button>
            </div>

            {/* Current Help Content */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-bold text-lg mb-3">
                {helpContent[helpCategory].title}
              </h4>
              
              {/* Audio Button */}
              <button
                onClick={() => speakHelp(helpCategory)}
                className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors mb-4"
              >
                <Volume2 className="w-5 h-5" />
                {language === 'hi' ? '🔊 सुनकर समझें' : '🔊 Listen to Instructions'}
              </button>

              {/* Step by Step Instructions */}
              <div className="space-y-2">
                <h5 className="font-semibold">
                  {language === 'hi' ? '📝 स्टेप बाई स्टेप गाइड:' : '📝 Step by Step Guide:'}
                </h5>
                {helpContent[helpCategory].steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="font-semibold mb-2">
                {language === 'hi' ? '💡 खास बातें:' : '💡 Quick Tips:'}
              </h5>
              <div className="text-sm space-y-1">
                {language === 'hi' ? (
                  <>
                    <p>• इंटरनेट स्लो हो तो धैर्य रखें</p>
                    <p>• फोटो खींचते समय रोशनी अच्छी रखें</p>
                    <p>• सभी जानकारी सही-सही भरें</p>
                    <p>• समस्या हो तो हेल्प बटन दबाएं</p>
                  </>
                ) : (
                  <>
                    <p>• Be patient if internet is slow</p>
                    <p>• Keep good lighting while taking photos</p>
                    <p>• Fill all information correctly</p>
                    <p>• Press help button if any problem</p>
                  </>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <h5 className="font-semibold text-red-800 mb-1">
                {language === 'hi' ? '📞 आपातकालीन सहायता:' : '📞 Emergency Help:'}
              </h5>
              <p className="text-sm text-red-700">
                {language === 'hi' 
                  ? 'हेल्पलाइन: 1800-111-3333 (टोल फ्री)'
                  : 'Helpline: 1800-111-3333 (Toll Free)'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Tutorial Overlay */}
      {showTutorial && tutorialStep < tutorialSteps.length && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-bold mb-2">
                {tutorialSteps[tutorialStep].title}
              </h3>
              <p className="text-gray-600 mb-4">
                {tutorialSteps[tutorialStep].description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Step {tutorialStep + 1} of {tutorialSteps.length}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="px-3 py-1 text-gray-500 hover:text-gray-700"
                  >
                    {language === 'hi' ? 'छोड़ें' : 'Skip'}
                  </button>
                  <button
                    onClick={nextTutorialStep}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    {tutorialStep < tutorialSteps.length - 1 
                      ? (language === 'hi' ? 'अगला' : 'Next')
                      : (language === 'hi' ? 'समाप्त' : 'Finish')
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals - render at the very end for proper z-index layering */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={handleOpenSettings}
      />
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Sign In Modal */}
      {isSignInOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {language === 'hi' ? 'साइन इन करें' : 'Sign In'}
              </h3>
              <button 
                onClick={() => setIsSignInOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleSignIn({
                email: formData.get('email'),
                password: formData.get('password')
              });
            }}>
              {/* Google Sign In Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
                >
                  <FaGoogle className="w-4 h-4 text-red-500" />
                  {language === 'hi' ? 'Google के साथ साइन इन करें' : 'Continue with Google'}
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300 dark:border-neutral-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                    {language === 'hi' ? 'या' : 'or'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'hi' ? 'ईमेल' : 'Email'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    placeholder={language === 'hi' ? 'आपका ईमेल' : 'Your email'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    placeholder={language === 'hi' ? 'आपका पासवर्ड' : 'Your password'}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSignInOpen(false)}
                  className="flex-1 px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {language === 'hi' ? 'साइन इन करें' : 'Sign In'}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignInOpen(false);
                    setIsSignUpOpen(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {language === 'hi' ? 'खाता नहीं है? साइन अप करें' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {isSignUpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {language === 'hi' ? 'साइन अप करें' : 'Sign Up'}
              </h3>
              <button 
                onClick={() => setIsSignUpOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleSignUp({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
              });
            }}>
              {/* Google Sign Up Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
                >
                  <FaGoogle className="w-4 h-4 text-red-500" />
                  {language === 'hi' ? 'Google के साथ साइन अप करें' : 'Continue with Google'}
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300 dark:border-neutral-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                    {language === 'hi' ? 'या' : 'or'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'hi' ? 'नाम' : 'Name'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    placeholder={language === 'hi' ? 'आपका नाम' : 'Your name'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'hi' ? 'ईमेल' : 'Email'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    placeholder={language === 'hi' ? 'आपका ईमेल' : 'Your email'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    placeholder={language === 'hi' ? 'आपका पासवर्ड' : 'Your password'}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSignUpOpen(false)}
                  className="flex-1 px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {language === 'hi' ? 'साइन अप करें' : 'Sign Up'}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpOpen(false);
                    setIsSignInOpen(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {language === 'hi' ? 'पहले से खाता है? साइन इन करें' : 'Already have an account? Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}