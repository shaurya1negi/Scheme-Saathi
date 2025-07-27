'use client';

import React, { useState } from 'react';
import { Menu, X, Upload, MessageCircle, Mic, FileCheck, Bell, ScanLine, Volume2, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/language_context';
import Sidebar from '../components/sidebar_component';
import LanguageToggle from '../components/language_toggle';
import SchemeCarousel from '../components/scheme_carousel';
import UploadModal from '../components/upload_modal';
import SettingsModal from '../components/settings_modal';
import OfflineIndicator from '../components/offline_indicator';

export default function HomePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpCategory, setHelpCategory] = useState('general');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

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
    if ('speechSynthesis' in window) {
      const content = helpContent[category];
      const utterance = new SpeechSynthesisUtterance(content.audio);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.8; // Slower for better understanding
      speechSynthesis.speak(utterance);
    }
  };

  // Main action buttons configuration
  const mainActions = [
    {
      icon: Upload,
      label: t('upload_info'),
      description: t('upload_info_desc'),
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => setIsUploadModalOpen(true),
    },
    {
      icon: MessageCircle,
      label: t('text_chatbot'),
      description: t('text_chatbot_desc'),
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => router.push('/chat'),
    },
    {
      icon: Mic,
      label: t('voice_assistant'),
      description: t('voice_assistant_desc'),
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => router.push('/voice'),
    },
    {
      icon: FileCheck,
      label: t('application_tracker'),
      description: t('application_tracker_desc'),
      color: 'bg-amber-500 hover:bg-amber-600',
      onClick: () => router.push('/applications'),
    },
    {
      icon: Bell,
      label: t('smart_notifications'),
      description: t('smart_notifications_desc'),
      color: 'bg-red-500 hover:bg-red-600',
      onClick: () => router.push('/notifications'),
    },
    {
      icon: ScanLine,
      label: t('document_ocr'),
      description: t('document_ocr_desc'),
      color: 'bg-teal-500 hover:bg-teal-600',
      onClick: () => router.push('/ocr'),
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
        {/* Rural Appeal Banner */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold">🇮🇳 सरकारी योजना सहायक</h2>
          <p className="text-sm">गांव के लिए, किसानों के लिए, आपके लिए</p>
        </div>

        {/* Hero Section with Main Actions */}
        <section className="text-center mb-16">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-saffron-500 via-gray-700 to-indianGreen-500 bg-clip-text text-transparent">
                {t('discover_schemes')}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('discover_schemes_desc')}
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {mainActions.map((action, index) => {
              let buttonClass = '';
              if (index === 0) buttonClass = 'upload-button';
              if (index === 1) buttonClass = 'chat-button';
              if (index === 2) buttonClass = 'voice-button';
              
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`${buttonClass} group p-8 rounded-2xl text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${action.color} ${
                    showTutorial && tutorialSteps[tutorialStep]?.target === `.${buttonClass}` 
                      ? 'ring-4 ring-yellow-400 ring-opacity-75 z-50 relative' 
                      : ''
                  }`}
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
              );
            })}
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

      {/* Floating Help Button */}
      <button
        onClick={openSmartHelp}
        className="fixed bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 animate-pulse"
        aria-label="Smart Help"
        title={language === 'hi' ? 'स्मार्ट सहायता - तुरंत मदद पाएं' : 'Smart Help - Get instant help'}
      >
        <HelpCircle className="w-6 h-6" />
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
      
      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}