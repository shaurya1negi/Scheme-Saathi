'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Language interface
interface LanguageContextType {
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  t: (key: string) => string;
}

// Translation object
const translations = {
  en: {
    // Header
    'scheme_sathi': 'Scheme Sathi',
    'history': 'History',
    'family_mode': 'Family Mode',
    'settings': 'Settings',
    'close_app': 'Close App',
    
    // Main options
    'upload_info': 'Upload Information',
    'text_chatbot': 'Text Chatbot',
    'voice_assistant': 'Voice Assistant',
    
    // Upload modal
    'personal_information': 'Personal Information',
    'full_name': 'Full Name',
    'age': 'Age',
    'aadhaar_number': 'Aadhaar Number',
    'income': 'Annual Income (₹)',
    'occupation': 'Occupation',
    'state': 'State',
    'district': 'District',
    'submit': 'Submit',
    'cancel': 'Cancel',
    
    // Schemes
    'recommended_schemes': 'Recommended Government Schemes',
    'view_details': 'View Details',
    
    // Chatbot
    'chat_with_assistant': 'Chat with Scheme Assistant',
    'type_message': 'Type your message about government schemes...',
    'send': 'Send',
    
    // Voice Assistant
    'voice_assistant_title': 'Voice Assistant',
    'click_to_speak': 'Click and speak about schemes',
    'listening': 'Listening...',
    'processing': 'Processing...',
    'start_recording': 'Start Recording',
    'stop_recording': 'Stop Recording',
    
    // Goodbye page
    'goodbye_title': 'Thank you for using Scheme Sathi!',
    'goodbye_message': 'We hope you found the government schemes helpful.',
    'return_home': 'Return to Home',
    
    // Common
    'loading': 'Loading...',
    'error': 'Something went wrong',
    'try_again': 'Try Again',
  },
  hi: {
    // Header
    'scheme_sathi': 'स्कीम साथी',
    'history': 'इतिहास',
    'family_mode': 'परिवार मोड',
    'settings': 'सेटिंग्स',
    'close_app': 'एप बंद करें',
    
    // Main options
    'upload_info': 'जानकारी अपलोड करें',
    'text_chatbot': 'टेक्स्ट चैटबॉट',
    'voice_assistant': 'वॉयस असिस्टेंट',
    
    // Upload modal
    'personal_information': 'व्यक्तिगत जानकारी',
    'full_name': 'पूरा नाम',
    'age': 'उम्र',
    'aadhaar_number': 'आधार नंबर',
    'income': 'वार्षिक आय (₹)',
    'occupation': 'व्यवसाय',
    'state': 'राज्य',
    'district': 'जिला',
    'submit': 'जमा करें',
    'cancel': 'रद्द करें',
    
    // Schemes
    'recommended_schemes': 'अनुशंसित सरकारी योजनाएं',
    'view_details': 'विवरण देखें',
    
    // Chatbot
    'chat_with_assistant': 'स्कीम असिस्टेंट से चैट करें',
    'type_message': 'सरकारी योजनाओं के बारे में अपना संदेश लिखें...',
    'send': 'भेजें',
    
    // Voice Assistant
    'voice_assistant_title': 'वॉयस असिस्टेंट',
    'click_to_speak': 'योजनाओं के बारे में बात करने के लिए क्लिक करें',
    'listening': 'सुन रहा है...',
    'processing': 'प्रोसेसिंग...',
    'start_recording': 'रिकॉर्डिंग शुरू करें',
    'stop_recording': 'रिकॉर्डिंग बंद करें',
    
    // Goodbye page
    'goodbye_title': 'स्कीम साथी का उपयोग करने के लिए धन्यवाद!',
    'goodbye_message': 'हमें उम्मीद है कि आपको सरकारी योजनाएं उपयोगी लगीं।',
    'return_home': 'होम पर वापस जाएं',
    
    // Common
    'loading': 'लोड हो रहा है...',
    'error': 'कुछ गलत हुआ',
    'try_again': 'पुनः प्रयास करें',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('scheme-sathi-language') as 'en' | 'hi';
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference
  const handleSetLanguage = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    localStorage.setItem('scheme-sathi-language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}