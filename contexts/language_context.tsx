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
    'profile': 'Profile',
    'saved_sessions': 'Saved Sessions',
    'no_saved_sessions': 'No saved sessions found',
    'enter_session_id': 'Enter session ID to load',
    'session_loaded': 'Session loaded successfully',
    'session_not_found': 'Session not found',
    'family_mode_coming_soon': 'Family mode functionality coming soon!',
    'history_feature_coming_soon': 'History feature coming soon!',
    'please_sign_in_first': 'Please sign in first to view your profile.',
    'already_signed_out': 'You are already signed out.',
    
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
    
    // Session History
    'save_session': 'Save Session',
    'session_saved': 'Session Saved Successfully',
    'no_sessions': 'No Sessions Saved Yet',
    'personal_session': 'Personal Session',
    'proxy_session': 'Proxy Session',
    'session_details': 'Session Details',
    'load_session': 'Load Session',
    'delete_session': 'Delete Session',
    'session_summary': 'Session Summary',
    'total_interactions': 'Total Interactions',
    'chat_history': 'Chat History',
    'voice_history': 'Voice History',
    'session_type': 'Session Type',
    
    // Goodbye page
    'goodbye_title': 'Thank you for using Scheme Sathi!',
    'goodbye_message': 'We hope you found the government schemes helpful.',
    'return_home': 'Return to Home',
    
    // Main Action Cards
    'application_tracker': 'Application Tracker',
    'application_tracker_desc': 'Track and manage your government scheme applications',
    'smart_notifications': 'Smart Notifications',
    'smart_notifications_desc': 'Get personalized notifications about relevant schemes and deadlines',
    'document_ocr': 'Document OCR',
    'document_ocr_desc': 'Extract text from documents using advanced OCR technology',
    'upload_info_desc': 'Add your personal details to get personalized scheme recommendations',
    'text_chatbot_desc': 'Chat with our AI assistant about government schemes',
    'voice_assistant_desc': 'Speak with our voice assistant for hands-free help',
    
    // Page Headers and Descriptions
    'discover_schemes': 'Discover Government Schemes',
    'discover_schemes_desc': 'Your AI-powered companion to find and apply for government schemes. Get personalized recommendations based on your profile.',
    
    // Sidebar Menu Items
    'new_session': 'New Session',
    'new_session_created': 'New session created',
    'authentication': 'Authentication',
    'application_tracker_menu': 'Application Tracker',
    'smart_notifications_menu': 'Smart Notifications',
    'document_ocr_menu': 'Document OCR',
    
    // OCR Page
    'ocr_title': 'Document OCR Scanner',
    'ocr_subtitle': 'Extract text from your documents using advanced OCR technology',
    'sign_in_required': 'Please sign in to use document OCR features.',
    'select_document_type': 'Select Document Type',
    'choose_file': 'Choose File',
    'upload_document': 'Upload Document',
    'supported_formats': 'Supported formats: JPG, PNG, PDF (Max 10MB)',
    'processing_document': 'Processing Document...',
    'extraction_results': 'Extraction Results',
    'extracted_text': 'Extracted Text',
    'structured_data': 'Structured Data',
    'download_results': 'Download Results',
    
    // Document Types
    'aadhaar': 'Aadhaar Card',
    'pan': 'PAN Card',
    'income_certificate': 'Income Certificate',
    'caste_certificate': 'Caste Certificate',
    'bank_statement': 'Bank Statement',
    'ration_card': 'Ration Card',
    'voter_id': 'Voter ID',
    'driving_license': 'Driving License',
    'passport': 'Passport',
    'other': 'Other Document',
    
    // Application Status
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'under_review': 'Under Review',
    'documents_required': 'Documents Required',
    
    // Notifications
    'all_notifications': 'All Notifications',
    'unread': 'Unread',
    'deadline_alerts': 'Deadline Alerts',
    'recommendations': 'Recommendations',
    'mark_as_read': 'Mark as Read',
    'mark_all_read': 'Mark All as Read',
    'no_notifications': 'No notifications found',
    
    // Authentication
    'sign_in': 'Sign In',
    'sign_up': 'Sign Up',
    'sign_out': 'Sign Out',
    'email': 'Email',
    'password': 'Password',
    'confirm_password': 'Confirm Password',
    'full_name_auth': 'Full Name',
    'forgot_password': 'Forgot Password?',
    'create_account': 'Create Account',
    'already_have_account': 'Already have an account?',
    'dont_have_account': "Don't have an account?",
    'google_sign_in': 'Continue with Google',
    'passwords_no_match': 'Passwords do not match',
    'password_too_short': 'Password must be at least 6 characters long',
    'sign_in_success': 'Successfully signed in!',
    'sign_up_success': 'Account created successfully!',
    'check_email_verification': 'Please check your email for verification link',
    
    // Common
    'loading': 'Loading...',
    'error': 'Something went wrong',
    'try_again': 'Try Again',
    'success': 'Success',
    'warning': 'Warning',
    'info': 'Information',
    'close': 'Close',
    'save': 'Save',
    'delete': 'Delete',
    'edit': 'Edit',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'search': 'Search',
    'filter': 'Filter',
    'sort': 'Sort',
    'export': 'Export',
    'import': 'Import',
    'refresh': 'Refresh',
  },
  hi: {
    // Header
    'scheme_sathi': 'स्कीम साथी',
    'history': 'इतिहास',
    'family_mode': 'परिवार मोड',
    'settings': 'सेटिंग्स',
    'close_app': 'एप बंद करें',
    'profile': 'प्रोफ़ाइल',
    'saved_sessions': 'सहेजे गए सत्र',
    'no_saved_sessions': 'कोई सहेजा गया सत्र नहीं मिला',
    'enter_session_id': 'लोड करने के लिए सत्र आईडी दर्ज करें',
    'session_loaded': 'सत्र सफलतापूर्वक लोड हो गया',
    'session_not_found': 'सत्र नहीं मिला',
    'family_mode_coming_soon': 'परिवार मोड की कार्यक्षमता जल्द आ रही है!',
    'history_feature_coming_soon': 'इतिहास सुविधा जल्द आ रही है!',
    'please_sign_in_first': 'कृपया अपना प्रोफ़ाइल देखने के लिए पहले साइन इन करें।',
    'already_signed_out': 'आप पहले से ही साइन आउट हैं।',
    
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
    
    // Session History
    'save_session': 'सत्र सेव करें',
    'session_saved': 'सत्र सफलतापूर्वक सेव हो गया',
    'no_sessions': 'अभी तक कोई सत्र सेव नहीं किया गया',
    'personal_session': 'व्यक्तिगत सत्र',
    'proxy_session': 'प्रॉक्सी सत्र',
    'session_details': 'सत्र विवरण',
    'load_session': 'सत्र लोड करें',
    'delete_session': 'सत्र डिलीट करें',
    'session_summary': 'सत्र सारांश',
    'total_interactions': 'कुल इंटरैक्शन',
    'chat_history': 'चैट इतिहास',
    'voice_history': 'वॉयस इतिहास',
    'session_type': 'सत्र प्रकार',
    
    // Goodbye page
    'goodbye_title': 'स्कीम साथी का उपयोग करने के लिए धन्यवाद!',
    'goodbye_message': 'हमें उम्मीद है कि आपको सरकारी योजनाएं उपयोगी लगीं।',
    'return_home': 'होम पर वापस जाएं',
    
    // Main Action Cards
    'application_tracker': 'आवेदन ट्रैकर',
    'application_tracker_desc': 'अपनी सरकारी योजना आवेदनों को ट्रैक और प्रबंधित करें',
    'smart_notifications': 'स्मार्ट सूचनाएं',
    'smart_notifications_desc': 'संबंधित योजनाओं और समय-सीमा के बारे में व्यक्तिगत सूचनाएं प्राप्त करें',
    'document_ocr': 'दस्तावेज़ OCR',
    'document_ocr_desc': 'उन्नत OCR तकनीक का उपयोग करके दस्तावेज़ों से टेक्स्ट निकालें',
    'upload_info_desc': 'व्यक्तिगत योजना सिफारिशें प्राप्त करने के लिए अपना विवरण जोड़ें',
    'text_chatbot_desc': 'सरकारी योजनाओं के बारे में हमारे AI असिस्टेंट से चैट करें',
    'voice_assistant_desc': 'हैंड्स-फ्री मदद के लिए हमारे वॉयस असिस्टेंट से बात करें',
    
    // Page Headers and Descriptions
    'discover_schemes': 'सरकारी योजनाएं खोजें',
    'discover_schemes_desc': 'सरकारी योजनाओं को खोजने और आवेदन करने के लिए आपका AI-संचालित साथी। अपनी प्रोफ़ाइल के आधार पर व्यक्तिगत सिफारिशें प्राप्त करें।',
    
    // Sidebar Menu Items
    'new_session': 'नया सत्र',
    'new_session_created': 'नया सत्र बनाया गया',
    'authentication': 'प्रमाणीकरण',
    'application_tracker_menu': 'आवेदन ट्रैकर',
    'smart_notifications_menu': 'स्मार्ट सूचनाएं',
    'document_ocr_menu': 'दस्तावेज़ OCR',
    
    // OCR Page
    'ocr_title': 'दस्तावेज़ OCR स्कैनर',
    'ocr_subtitle': 'उन्नत OCR तकनीक का उपयोग करके अपने दस्तावेज़ों से टेक्स्ट निकालें',
    'sign_in_required': 'दस्तावेज़ OCR सुविधाओं का उपयोग करने के लिए कृपया साइन इन करें।',
    'select_document_type': 'दस्तावेज़ प्रकार चुनें',
    'choose_file': 'फ़ाइल चुनें',
    'upload_document': 'दस्तावेज़ अपलोड करें',
    'supported_formats': 'समर्थित प्रारूप: JPG, PNG, PDF (अधिकतम 10MB)',
    'processing_document': 'दस्तावेज़ प्रसंस्करण...',
    'extraction_results': 'निष्कर्षण परिणाम',
    'extracted_text': 'निकाला गया टेक्स्ट',
    'structured_data': 'संरचित डेटा',
    'download_results': 'परिणाम डाउनलोड करें',
    
    // Document Types
    'aadhaar': 'आधार कार्ड',
    'pan': 'पैन कार्ड',
    'income_certificate': 'आय प्रमाण पत्र',
    'caste_certificate': 'जाति प्रमाण पत्र',
    'bank_statement': 'बैंक स्टेटमेंट',
    'ration_card': 'राशन कार्ड',
    'voter_id': 'वोटर आईडी',
    'driving_license': 'ड्राइविंग लाइसेंस',
    'passport': 'पासपोर्ट',
    'other': 'अन्य दस्तावेज़',
    
    // Application Status
    'pending': 'लंबित',
    'approved': 'स्वीकृत',
    'rejected': 'अस्वीकृत',
    'under_review': 'समीक्षाधीन',
    'documents_required': 'दस्तावेज़ आवश्यक',
    
    // Notifications
    'all_notifications': 'सभी सूचनाएं',
    'unread': 'अपठित',
    'deadline_alerts': 'समय-सीमा चेतावनी',
    'recommendations': 'सिफारिशें',
    'mark_as_read': 'पढ़ा हुआ चिह्नित करें',
    'mark_all_read': 'सभी को पढ़ा हुआ चिह्नित करें',
    'no_notifications': 'कोई सूचना नहीं मिली',
    
    // Authentication
    'sign_in': 'साइन इन',
    'sign_up': 'साइन अप',
    'sign_out': 'साइन आउट',
    'email': 'ईमेल',
    'password': 'पासवर्ड',
    'confirm_password': 'पासवर्ड की पुष्टि करें',
    'full_name_auth': 'पूरा नाम',
    'forgot_password': 'पासवर्ड भूल गए?',
    'create_account': 'खाता बनाएं',
    'already_have_account': 'क्या आपका पहले से खाता है?',
    'dont_have_account': 'क्या आपका खाता नहीं है?',
    'google_sign_in': 'Google के साथ जारी रखें',
    'passwords_no_match': 'पासवर्ड मेल नहीं खाते',
    'password_too_short': 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए',
    'sign_in_success': 'सफलतापूर्वक साइन इन हुआ!',
    'sign_up_success': 'खाता सफलतापूर्वक बनाया गया!',
    'check_email_verification': 'सत्यापन लिंक के लिए कृपया अपना ईमेल जांचें',
    
    // Common
    'loading': 'लोड हो रहा है...',
    'error': 'कुछ गलत हुआ',
    'try_again': 'पुनः प्रयास करें',
    'success': 'सफलता',
    'warning': 'चेतावनी',
    'info': 'जानकारी',
    'close': 'बंद करें',
    'save': 'सेव करें',
    'delete': 'डिलीट करें',
    'edit': 'संपादित करें',
    'back': 'वापस',
    'next': 'अगला',
    'previous': 'पिछला',
    'search': 'खोजें',
    'filter': 'फ़िल्टर',
    'sort': 'सॉर्ट करें',
    'export': 'निर्यात करें',
    'import': 'आयात करें',
    'refresh': 'रीफ्रेश करें',
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