'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineModal(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineModal(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Network Status Indicator */}
      <div className={`fixed top-20 right-4 px-3 py-1 rounded-full text-xs font-medium z-40 ${
        isOnline 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center space-x-1">
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>
            {isOnline 
              ? (language === 'hi' ? 'ऑनलाइन' : 'Online')
              : (language === 'hi' ? 'ऑफ़लाइन' : 'Offline')
            }
          </span>
        </div>
      </div>

      {/* Offline Mode Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">
                {language === 'hi' ? '📱 ऑफ़लाइन मोड' : '📱 Offline Mode'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'hi' 
                  ? 'इंटरनेट कनेक्शन नहीं है। आप अभी भी कुछ सुविधाओं का उपयोग कर सकते हैं:'
                  : 'No internet connection. You can still use some features:'
                }
              </p>
              
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm">{language === 'hi' ? 'पहले से सेव किए गए डेटा देखें' : 'View saved data'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm">{language === 'hi' ? 'ऑफ़लाइन फॉर्म भरें' : 'Fill offline forms'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm">{language === 'hi' ? 'योजना की जानकारी पढ़ें' : 'Read scheme info'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">❌</span>
                  <span className="text-sm">{language === 'hi' ? 'नए आवेदन जमा करना' : 'Submit new applications'}</span>
                </div>
              </div>

              <button
                onClick={() => setShowOfflineModal(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {language === 'hi' ? 'समझ गया' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
