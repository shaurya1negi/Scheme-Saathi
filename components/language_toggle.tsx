'use client';

import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇬🇧', desc: 'English' },
    { code: 'hi' as const, label: 'हिन्दी', flag: '🇮🇳', desc: 'Hindi' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode: 'en' | 'hi') => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Toggle Button with Indian Styling */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-saffron-50 to-indianGreen-50 border-2 border-gradient-to-r from-saffron-200 to-indianGreen-200 rounded-xl hover:from-saffron-100 hover:to-indianGreen-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
        aria-label="Select language"
      >
        <Globe size={20} className="text-saffron-600" />
        <div className="flex flex-col text-left">
          <span className="text-sm font-bold text-gray-800">
            {currentLanguage?.flag} {currentLanguage?.label}
          </span>
          <span className="text-xs text-gray-600">{currentLanguage?.desc}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-saffron-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-10 md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu with Indian Design */}
          <div className="absolute top-full mt-3 right-0 w-48 bg-white/95 backdrop-blur-md border-2 border-gradient-to-r from-saffron-200 to-indianGreen-200 rounded-2xl shadow-cultural z-20 animate-slide-down overflow-hidden">
            {/* Decorative Header */}
            <div className="px-4 py-2 bg-gradient-to-r from-saffron-50 to-indianGreen-50 border-b border-saffron-100">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Select Language</span>
            </div>
            
            {languages.map((lang, index) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gradient-to-r hover:from-saffron-50 hover:to-indianGreen-50 transition-all duration-300 ${
                  language === lang.code 
                    ? 'bg-gradient-to-r from-saffron-100 to-indianGreen-100 border-l-4 border-saffron-500' 
                    : 'text-gray-700 hover:text-gray-900'
                } ${index === languages.length - 1 ? 'rounded-b-2xl' : ''}`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{lang.label}</div>
                  <div className="text-xs text-gray-600">{lang.desc}</div>
                </div>
                {language === lang.code && (
                  <div className="w-3 h-3 bg-gradient-to-r from-saffron-500 to-indianGreen-500 rounded-full animate-pulse-indian" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}