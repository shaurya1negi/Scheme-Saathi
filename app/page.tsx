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

  // Main action buttons configuration
  const mainActions = [
    {
      icon: Upload,
      label: t('upload_info'),
      description: 'Add your personal details to get personalized scheme recommendations',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => setIsUploadModalOpen(true),
    },
    {
      icon: MessageCircle,
      label: t('text_chatbot'),
      description: 'Chat with our AI assistant about government schemes',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => router.push('/chat'),
    },
    {
      icon: Mic,
      label: t('voice_assistant'),
      description: 'Speak with our voice assistant for hands-free help',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => router.push('/voice'),
    },
  ];

  const handleCloseApp = () => {
    router.push('/goodbye');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="relative bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Hamburger Menu */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} className="text-gray-700 dark:text-gray-300" />
            </button>

            {/* Center - App Title */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl md:text-3xl font-bold text-center">
                <span className="bg-gradient-to-r from-saffron-500 via-gray-600 to-indianGreen-500 bg-clip-text text-transparent">
                  {t('scheme_sathi')}
                </span>
              </h1>
            </div>

            {/* Right - Language Toggle and Close Button */}
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button
                onClick={handleCloseApp}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close app"
              >
                <X size={24} className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Main Actions */}
        <section className="text-center mb-16">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-saffron-500 via-gray-700 to-indianGreen-500 bg-clip-text text-transparent">
                Discover Government Schemes
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your AI-powered companion to find and apply for government schemes. 
              Get personalized recommendations based on your profile.
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {mainActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`group p-8 rounded-2xl text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${action.color}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-white bg-opacity-20 rounded-full mb-4 group-hover:bg-opacity-30 transition-all">
                    <action.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{action.label}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {action.description}
                  </p>
                </div>
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