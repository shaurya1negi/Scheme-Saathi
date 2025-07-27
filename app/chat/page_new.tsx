'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/language_context';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  schemes?: SchemeRecommendation[];
  isLoading?: boolean;
  error?: string;
}

interface SchemeRecommendation {
  scheme_id: string;
  name: string;
  description: string;
  benefits: string;
  eligibility: string;
  relevance_score: number;
  application_link?: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  schemes?: SchemeRecommendation[];
  conversation_id?: string;
  error?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: language === 'hi' 
        ? 'नमस्ते! मैं आपका AI सहायक हूं। मैं आपको सरकारी योजनाओं के बारे में जानकारी दे सकता हूं। कृपया अपना सवाल पूछें।'
        : 'Hello! I am your AI assistant. I can help you with information about government schemes. Please ask your question.',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add loading bot message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: language === 'hi' ? 'सोच रहा हूं...' : 'Thinking...',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          language: language,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Update conversation ID if provided
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      // Replace loading message with actual response
      const botMessage: Message = {
        id: loadingMessage.id,
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        schemes: data.schemes || [],
      };

      setMessages(prev => 
        prev.map(msg => msg.id === loadingMessage.id ? botMessage : msg)
      );

    } catch (error) {
      console.error('Chat error:', error);
      
      // Replace loading message with error message
      const errorMessage: Message = {
        id: loadingMessage.id,
        text: language === 'hi' 
          ? 'क्षमा करें, कुछ गलत हो गया। कृपया दोबारा कोशिश करें।'
          : 'Sorry, something went wrong. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setMessages(prev => 
        prev.map(msg => msg.id === loadingMessage.id ? errorMessage : msg)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSchemeClick = (scheme: SchemeRecommendation) => {
    // Navigate to scheme details or application page
    router.push(`/schemes/${scheme.scheme_id}`);
  };

  const quickQuestions = language === 'hi' ? [
    'किसान के लिए कौन सी योजनाएं हैं?',
    'महिलाओं के लिए क्या योजना है?',
    'घर बनाने के लिए कोई सहायता?',
    'बुजुर्गों के लिए पेंशन योजना?',
    'बच्चों की शिक्षा के लिए छात्रवृत्ति?',
  ] : [
    'What schemes are available for farmers?',
    'Are there any schemes for women?',
    'Any housing assistance available?',
    'Pension schemes for elderly?',
    'Education scholarships for children?',
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <Bot size={20} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {t('ai_assistant')}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {language === 'hi' ? 'ऑनलाइन' : 'Online'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {language === 'hi' ? 'AI द्वारा संचालित' : 'Powered by AI'}
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-180px)] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender === 'bot' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      {message.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                )}

                <div className={`max-w-xs lg:max-w-md ${message.sender === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.error
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.error && (
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">Error</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>

                  {/* Scheme Recommendations */}
                  {message.schemes && message.schemes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 font-medium">
                        {language === 'hi' ? 'सुझाई गई योजनाएं:' : 'Recommended Schemes:'}
                      </p>
                      {message.schemes.map((scheme, index) => (
                        <div
                          key={index}
                          onClick={() => handleSchemeClick(scheme)}
                          className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg cursor-pointer hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-green-800 text-sm">{scheme.name}</h4>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{scheme.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {Math.round(scheme.relevance_score)}% match
                                </span>
                                <span className="text-xs text-blue-600">Click to learn more</span>
                              </div>
                            </div>
                            <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                {language === 'hi' ? 'आप ये सवाल पूछ सकते हैं:' : 'You can ask:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex gap-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  language === 'hi'
                    ? 'अपना सवाल यहां लिखें...'
                    : 'Type your question here...'
                }
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {language === 'hi' ? 'भेजें' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {language === 'hi' 
                ? 'Enter दबाकर भेजें • AI से गलतियां हो सकती हैं'
                : 'Press Enter to send • AI may make mistakes'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
