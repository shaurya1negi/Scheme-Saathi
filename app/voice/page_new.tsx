'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Send,
  Loader2,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Phone,
  PhoneOff,
  Headphones,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/language_context';
import { supabase } from '../../lib/supabase';

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  audio_url?: string;
  timestamp: string;
  confidence?: number;
  voice_duration?: number;
}

interface VoiceSession {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

interface VoiceChatResponse {
  success: boolean;
  response?: string;
  audio_url?: string;
  recommended_schemes?: any[];
  session_id?: string;
  error?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

// Speech Recognition Types
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Use any type for compatibility
type SpeechRecognition = any;

export default function VoicePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  // Audio States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Chat States
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([]);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Check authentication and initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }
        
        setIsAuthenticated(true);
        await initializeSpeechRecognition();
        await loadVoiceSessions();
        await startNewSession();
      } catch (error) {
        console.error('Initialization error:', error);
        setError(language === 'hi' ? 'प्रारंभिक त्रुटि' : 'Initialization error');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [router, language]);

  // Initialize Speech Recognition
  const initializeSpeechRecognition = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError(language === 'hi' 
        ? 'आपका ब्राउज़र भाषण पहचान का समर्थन नहीं करता'
        : 'Your browser does not support speech recognition'
      );
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    recognitionInstance.onstart = () => {
      setError(null);
    };

    recognitionInstance.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript);
      setInterimTranscript(interimTranscript);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError(language === 'hi' 
          ? 'माइक्रोफ़ोन की अनुमति आवश्यक है'
          : 'Microphone permission required'
        );
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (transcript.trim()) {
        handleVoiceInput(transcript.trim());
        setTranscript('');
      }
    };

    setRecognition(recognitionInstance);
  }, [language, transcript]);

  // Load voice sessions
  const loadVoiceSessions = async () => {
    try {
      const response = await fetch('/api/voice-chat/sessions');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVoiceSessions(data.sessions || []);
        }
      }
    } catch (error) {
      console.error('Failed to load voice sessions:', error);
    }
  };

  // Start new session
  const startNewSession = async () => {
    try {
      const response = await fetch('/api/voice-chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session_id) {
          setCurrentSessionId(data.session_id);
          setMessages([]);
          
          // Add welcome message
          const welcomeMessage: VoiceMessage = {
            id: 'welcome',
            type: 'assistant',
            text: language === 'hi' 
              ? 'नमस्ते! मैं आपकी योजनाओं के बारे में सवालों का जवाब देने के लिए यहाँ हूँ। आप बात कर सकते हैं या टाइप कर सकते हैं।'
              : 'Hello! I\'m here to help you with questions about government schemes. You can speak or type your questions.',
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to start new session:', error);
    }
  };

  // Toggle voice listening
  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setInterimTranscript('');
      recognition.start();
      setIsListening(true);
    }
  };

  // Handle voice input
  const handleVoiceInput = async (text: string) => {
    if (!text.trim() || !currentSessionId) return;

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          session_id: currentSessionId,
          language,
          include_audio: audioEnabled
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: VoiceChatResponse = await response.json();

      if (data.success && data.response) {
        const assistantMessage: VoiceMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: data.response,
          audio_url: data.audio_url,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Auto-play audio response if enabled
        if (audioEnabled && data.audio_url) {
          playAudio(data.audio_url);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Voice chat error:', error);
      setError(language === 'hi' 
        ? 'आवाज़ चैट में त्रुटि हुई'
        : 'Voice chat error occurred'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle text input
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleVoiceInput(textInput.trim());
      setTextInput('');
    }
  };

  // Play audio
  const playAudio = async (audioUrl: string) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        console.error('Audio playback error');
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  // Stop audio
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Headphones className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {language === 'hi' ? 'साइन इन आवश्यक' : 'Sign In Required'}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === 'hi' 
              ? 'वॉयस चैट सुविधाओं का उपयोग करने के लिए कृपया साइन इन करें।'
              : 'Please sign in to use voice chat features.'
            }
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === 'hi' ? 'साइन इन करें' : 'Sign In'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Headphones size={20} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {language === 'hi' ? 'वॉयस असिस्टेंट' : 'Voice Assistant'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isListening 
                      ? (language === 'hi' ? 'सुन रहा है...' : 'Listening...')
                      : (language === 'hi' ? 'बात करें या टाइप करें' : 'Speak or type')
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  audioEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title={audioEnabled 
                  ? (language === 'hi' ? 'ऑडियो बंद करें' : 'Disable audio')
                  : (language === 'hi' ? 'ऑडियो चालू करें' : 'Enable audio')
                }
              >
                {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              
              <button
                onClick={startNewSession}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={language === 'hi' ? 'नया सेशन' : 'New session'}
              >
                <RefreshCw size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-lg shadow-sm ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                
                {message.audio_url && message.type === 'assistant' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => playAudio(message.audio_url!)}
                      disabled={isPlaying}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 disabled:opacity-50"
                    >
                      <Volume2 size={12} />
                      {language === 'hi' ? 'सुनें' : 'Play'}
                    </button>
                  </div>
                )}
                
                <p className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString(
                    language === 'hi' ? 'hi-IN' : 'en-US',
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </p>
              </div>
            </div>
          ))}
          
          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">
                    {language === 'hi' ? 'जवाब तैयार कर रहा है...' : 'Preparing response...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Recognition Status */}
      {(isListening || interimTranscript) && (
        <div className="mx-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-900">
                {language === 'hi' ? 'सुन रहा है' : 'Listening'}
              </span>
            </div>
            {interimTranscript && (
              <div className="flex-1">
                <p className="text-sm text-blue-800 italic">"{interimTranscript}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Voice Button */}
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`p-4 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Text Input */}
            <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={language === 'hi' 
                  ? 'यहाँ टाइप करें या माइक बटन दबाएं...'
                  : 'Type here or press the mic button...'
                }
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing || isListening}
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing || isListening}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </form>

            {/* Audio Control */}
            {isPlaying && (
              <button
                onClick={stopAudio}
                className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                title={language === 'hi' ? 'ऑडियो बंद करें' : 'Stop audio'}
              >
                <VolumeX size={20} />
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              {language === 'hi' 
                ? 'आप योजनाओं के बारे में पूछ सकते हैं, पात्रता जांच सकते हैं, या आवेदन की सहायता मांग सकते हैं।'
                : 'You can ask about schemes, check eligibility, or get help with applications.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
