'use client';

import React from 'react';
import { X, Moon, Sun, Palette, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';
import { useTheme } from '../contexts/theme_context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, language, setLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-[60] ${
          isOpen ? 'bg-opacity-50 animate-fade-in' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {t('settings')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close settings"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Theme Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Palette size={20} />
                Theme Settings
              </h3>
              
              <div className="space-y-4">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Moon size={20} className="text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Sun size={20} className="text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {isDarkMode ? 'Night Mode' : 'Day Mode'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isDarkMode ? 'Dark theme is enabled' : 'Light theme is enabled'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDarkMode 
                        ? 'bg-indigo-600' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Globe size={20} />
                Language Settings
              </h3>
              
              <div className="space-y-2">
                {[
                  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
                  { code: 'hi' as const, label: 'हिन्दी', flag: '🇮🇳' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      language === lang.code
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                    {language === lang.code && (
                      <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* App Info */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scheme Sathi v1.0.0
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Made with ❤️ for India 🇮🇳
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
