'use client';

import React from 'react';
import { X, History, Users, Settings, Save } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';
import { useSession } from '../contexts/session_context';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ isOpen, onClose, onOpenSettings }: SidebarProps) {
  const { t } = useLanguage();
  const { saveCurrentSession, currentSession } = useSession();
  const router = useRouter();

  const handleSaveSession = () => {
    saveCurrentSession();
    onClose();
    // Show a toast or notification here if needed
    alert(t('session_saved'));
  };

  const handleNavigateToHistory = () => {
    router.push('/history');
    onClose();
  };

  const menuItems = [
    {
      icon: Save,
      label: t('save_session'),
      onClick: handleSaveSession,
      disabled: !currentSession.userDetails && !currentSession.chatHistory?.length && !currentSession.voiceInteractions?.length
    },
    {
      icon: History,
      label: t('history'),
      onClick: handleNavigateToHistory,
    },
    {
      icon: Users,
      label: t('family_mode'),
      onClick: () => {
        // TODO: Navigate to family mode
        console.log('Navigate to Family Mode');
        onClose();
      },
    },
    {
      icon: Settings,
      label: t('settings'),
      onClick: () => {
        onOpenSettings();
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('scheme_sathi')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${
                    item.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon 
                    size={20} 
                    className={`${
                      item.disabled 
                        ? 'text-gray-400' 
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    }`}
                  />
                  <span className={`font-medium ${
                    item.disabled 
                      ? 'text-gray-400' 
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Made for citizens of India 🇮🇳
          </p>
        </div>
      </div>
    </>
  );
}