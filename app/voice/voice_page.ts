'use client';

import React, { useState, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/language_context';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

// TypeScript declarations for Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoicePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      
      recognition.onstart = () => {
        setVoiceState('listening');
        setTranscript('');
      };
      
      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        processVoiceInput(result);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setVoiceState('idle');
      };
      
      recognition.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };
      
      recognitionRef.current = recognition;
    }
  };

  // Process voice input and generate response
  const processVoiceInput = async (input: string) => {
    setVoiceState('processing');
    
    try {
      // TODO: Replace with actual AI API call
      // const response = await fetch('/api/voice-chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     message: input, 
      //     language: language,
      //     context: 'government_schemes' 
      //   }),
      // });
      // const data = await response.json();
      
      // Sample responses based on input
      let aiResponse = '';
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('farmer') || lowerInput.includes('agriculture') || lowerInput.includes('किसान')) {
        aiResponse = language === 'hi' 
          ? 'आपके लिए PM किसान सम्मान निधि योजना उपयुक्त हो सकती है। इस योजना में छोटे किसानों को साल में 6000 रुपये मिलते हैं।'
          : 'For farmers, the PM Kisan Samman Nidhi scheme might be suitable. It provides 6000 rupees annually to small farmers.';
      } else if (lowerInput.includes('health') || lowerInput.includes('medical') || lowerInput.includes('स्वास्थ्य')) {
        aiResponse = language === 'hi'
          ? 'आयुष्मान भारत योजना के तहत आपको 5 लाख रुपये तक का मुफ्त इलाज मिल सकता है।'
          : 'Under Ayushman Bharat scheme, you can get free treatment up to 5 lakh rupees.';
      } else {
        aiResponse = language === 'hi'
          ? 'मैं आपकी सरकारी योजनाओं के बारे में मदद कर सकता हूं। कृपया अपनी आवश्यकता बताएं।'
          : 'I can help you with government schemes. Please tell me your specific requirements.';
      }
      
      setResponse(aiResponse);
      
      // Speak the response
      if (!isMuted) {
        speakResponse(aiResponse);
      } else {
        setVoiceState('idle');
      }
      
    } catch (error) {
      console.error('Voice processing error:', error);
      setVoiceState('idle');
    }
  };

  // Text-to-speech function
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      setVoiceState('speaking');
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setVoiceState('idle');
      };
      
      utterance.onerror = () => {
        setVoiceState('idle');
      };
      
      synthRef.current = utterance;
      speechSynthesis.speak(utterance);
    } else {
      setVoiceState('idle');
    }
  };

  // Start/stop voice recording
  const toggleRecording = () => {
    if (voiceState === 'listening') {
      recognitionRef.current?.stop();
      setVoiceState('idle');
    } else if (voiceState === 'idle') {
      if (!recognitionRef.current) {
        initializeSpeechRecognition();
      }
      recognitionRef.current?.start();
    } else if (voiceState === 'speaking') {
      speechSynthesis.cancel();
      setVoiceState('idle');
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (voiceState === 'speaking') {
      speechSynthesis.cancel();
      setVoiceState('idle');
    }
  };

  const getButtonText = () => {
    switch (voiceState) {
      case 'listening':
        return t('listening');
      case 'processing':
        return t('processing');
      case 'speaking':
        return 'Speaking...';
      default:
        return t('click_to_speak');
    }
  };

  const getButtonColor = () => {
    switch (voiceState) {
      case 'listening':
        return 'bg-red-500 hover:bg-red-600 animate-pulse';
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'speaking':
        return 'bg-green-500 hover:bg-green-600 animate-bounce-soft';
      default:
        return 'bg-primary-500 hover:bg-primary-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Mic size={20} className="text-purple-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    {t('voice_assistant_title')}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {voiceState === 'idle' ? 'Ready to help' : getButtonText()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              } hover:bg-opacity-80`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Voice State Indicator */}
          <div className="mb-8">
            <div
              className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                voiceState === 'listening'
                  ? 'bg-red-100 border-4 border-red-300 animate-pulse'
                  : voiceState === 'processing'
                  ? 'bg-yellow-100 border-4 border-yellow-300'
                  : voiceState === 'speaking'
                  ? 'bg-green-100 border-4 border-green-300 animate-bounce-soft'
                  : 'bg-purple-100 border-4 border-purple-300'
              }`}
            >
              {voiceState === 'listening' ? (
                <Mic size={48} className="text-red-600" />
              ) : voiceState === 'processing' ? (
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-3 h-3 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              ) : voiceState === 'speaking' ? (
                <Volume2 size={48} className="text-green-600" />
              ) : (
                <Mic size={48} className="text-purple-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {getButtonText()}
            </h2>
            <p className="text-gray-600">
              {voiceState === 'idle' && t('click_to_speak')}
              {voiceState === 'listening' && 'Speak now about government schemes...'}
              {voiceState === 'processing' && 'Analyzing your request...'}
              {voiceState === 'speaking' && 'Playing response...'}
            </p>
          </div>

          {/* Main Action Button */}
          <button
            onClick={toggleRecording}
            disabled={voiceState === 'processing'}
            className={`px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${getButtonColor()}`}
          >
            <div className="flex items-center gap-3">
              {voiceState === 'listening' ? (
                <MicOff size={24} />
              ) : (
                <Mic size={24} />
              )}
              <span>{getButtonText()}</span>
            </div>
          </button>

          {/* Transcript Display */}
          {transcript && (
            <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                You said:
              </h3>
              <p className="text-gray-700 italic">"{transcript}"</p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="mt-6 p-6 bg-purple-50 rounded-2xl border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">
                Assistant Response:
              </h3>
              <p className="text-purple-700">{response}</p>
            </div>
          )}

          {/* Quick Action Suggestions */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Try asking about:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  text: language === 'hi' ? 'किसान योजनाएं' : 'Farmer schemes', 
                  example: language === 'hi' ? 'मैं एक किसान हूं' : 'I am a farmer' 
                },
                { 
                  text: language === 'hi' ? 'स्वास्थ्य योजनाएं' : 'Health schemes', 
                  example: language === 'hi' ? 'मुझे स्वास्थ्य सहायता चाहिए' : 'I need health assistance' 
                },
                { 
                  text: language === 'hi' ? 'शिक्षा योजनाएं' : 'Education schemes', 
                  example: language === 'hi' ? 'छात्रवृत्ति के बारे में बताएं' : 'Tell me about scholarships' 
                },
                { 
                  text: language === 'hi' ? 'महिला योजनाएं' : 'Women schemes', 
                  example: language === 'hi' ? 'महिलाओं के लिए योजनाएं' : 'Schemes for women' 
                },
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (voiceState === 'idle') {
                      setTranscript(suggestion.example);
                      processVoiceInput(suggestion.example);
                    }
                  }}
                  disabled={voiceState !== 'idle'}
                  className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="font-medium text-gray-800">{suggestion.text}</div>
                  <div className="text-sm text-gray-500 mt-1">"{suggestion.example}"</div>
                </button>
              ))}
            </div>
          </div>

          {/* Browser Support Note */}
          {!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari for the best experience.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">
            Speak naturally about government schemes and get instant help
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Powered by Web Speech API • {isMuted ? 'Audio muted' : 'Audio enabled'}
          </p>
        </div>
      </footer>
    </div>
  );
}
                