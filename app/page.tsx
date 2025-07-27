'use client';

import React, { useState } from 'react';
import { Menu, X, Upload, MessageCircle, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/language_context';
import Sidebar from '../components/sidebar_component';
import LanguageToggle from '../components/language_toggle';
import SchemeCarousel from '../components/scheme_carousel';
import UploadModal from '../components/upload_modal';
import SettingsModal from '../components/settings_modal';

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    setIsSidebarOpen(false);
  };

  // Main action buttons configuration with Indian colors
  const mainActions = [
    {
      icon: Upload,
      label: t('upload_info'),
      description: 'Add your personal details to get personalized scheme recommendations',
      color: 'bg-gradient-to-br from-saffron-500 to-marigold-600 hover:from-saffron-600 hover:to-marigold-700',
      onClick: () => setIsUploadModalOpen(true),
    },
    {
      icon: MessageCircle,
      label: t('text_chatbot'),
      description: 'Chat with our AI assistant about government schemes',
      color: 'bg-gradient-to-br from-indianGreen-500 to-indianGreen-700 hover:from-indianGreen-600 hover:to-indianGreen-800',
      onClick: () => router.push('/chat'),
    },
    {
      icon: Mic,
      label: t('voice_assistant'),
      description: 'Speak with our voice assistant for hands-free help',
      color: 'bg-gradient-to-br from-peacock-500 to-ashoka-600 hover:from-peacock-600 hover:to-ashoka-700',
      onClick: () => router.push('/voice'),
    },
  ];

  const handleCloseApp = () => {
    router.push('/goodbye');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-white to-indianGreen-50 mandala-bg">
      {/* Decorative Header Pattern */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-saffron-500 via-white to-indianGreen-500"></div>
      
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md shadow-cultural border-b border-gradient-to-r from-saffron-200 to-indianGreen-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left - Hamburger Menu */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 rounded-xl hover:bg-gradient-to-r hover:from-saffron-100 hover:to-indianGreen-100 transition-all duration-300 transform hover:scale-110 group"
              aria-label="Open menu"
            >
              <Menu size={26} className="text-saffron-600 group-hover:text-saffron-700 transition-colors" />
            </button>

            {/* Center - App Title with Indian Typography */}
            <div className="flex-1 flex justify-center items-center">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold">
                  <span className="text-gradient-tricolor animate-gradient-shift">
                    {t('scheme_sathi')}
                  </span>
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-saffron-400 via-white to-indianGreen-400 mx-auto mt-2 rounded-full"></div>
              </div>
            </div>

            {/* Right - Language Toggle and Close Button */}
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <button
                onClick={handleCloseApp}
                className="p-3 rounded-xl hover:bg-gradient-to-r hover:from-red-100 hover:to-red-200 transition-all duration-300 transform hover:scale-110 group"
                aria-label="Close app"
              >
                <X size={26} className="text-red-500 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section with Main Actions */}
        <section className="text-center mb-20">
          {/* Welcome Message with Indian Flair */}
          <div className="mb-16 relative">
            {/* Decorative Elements */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-saffron-400 to-transparent"></div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gradient-indian animate-shimmer bg-[length:200%_auto]">
                Discover Government Schemes
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
              आपका AI-संचालित साथी • Your AI-powered companion 
              <br />
              <span className="text-lg text-gray-600 mt-2 block">
                Get personalized recommendations for government schemes designed just for you
              </span>
            </p>
            
            {/* Decorative Lotus Elements */}
            <div className="flex justify-center items-center mt-8 gap-4">
              <div className="w-8 h-1 bg-gradient-to-r from-saffron-400 to-transparent rounded-full"></div>
              <div className="w-4 h-4 bg-gradient-to-br from-saffron-400 to-marigold-500 rounded-full animate-pulse-indian"></div>
              <div className="w-8 h-1 bg-gradient-to-l from-indianGreen-400 to-transparent rounded-full"></div>
            </div>
          </div>

          {/* Main Action Cards with Enhanced Indian Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {mainActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`group relative overflow-hidden p-8 rounded-3xl text-white transition-all duration-500 transform hover:scale-105 hover:shadow-cultural ${action.color} border-2 border-white/20`}
              >
                {/* Decorative Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity cultural-pattern"></div>
                
                {/* Card Content */}
                <div className="relative flex flex-col items-center text-center">
                  <div className="p-6 bg-white/25 rounded-2xl mb-6 group-hover:bg-white/35 transition-all duration-300 backdrop-blur-sm shadow-lg">
                    <action.icon size={40} className="animate-float" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-shadow">{action.label}</h3>
                  <p className="text-base opacity-95 leading-relaxed max-w-xs">
                    {action.description}
                  </p>
                  
                  {/* Bottom Accent Line */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-white/40 rounded-full group-hover:w-24 transition-all duration-300"></div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            ))}
          </div>
        </section>

        {/* Schemes Carousel Section */}
        <section className="mb-8">
          <SchemeCarousel />
        </section>

        {/* Quick Stats */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600 font-medium">Government Schemes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-600 mb-2">50L+</div>
              <div className="text-gray-600 font-medium">Citizens Helped</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-500 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">AI Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-500 mb-2">12</div>
              <div className="text-gray-600 font-medium">Languages</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            © 2024 Scheme Sathi. Built for the people of India 🇮🇳
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Empowering citizens through technology and government schemes
          </p>
        </div>
      </footer>

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
    </div>
  );
}