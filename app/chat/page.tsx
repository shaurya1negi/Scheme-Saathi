'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/language_context';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI-powered Scheme Assistant powered by Google Gemini. I can help you find government schemes for education, business, agriculture, healthcare, and more. What would you like to know?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call RAG API endpoint (updated to use Node.js server with @google/generative-ai)
      const ragResponse = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.text,
          include_sources: true
        })
      });

      const data = await ragResponse.json();
      console.log('RAG API response:', data);

      let replyText = '';
      if (data.success && data.answer) {
        replyText = data.answer;
        
        // Add source schemes information
        if (data.sources && data.sources.length > 0) {
          replyText += '\n\n📋 Related Schemes:\n';
          data.sources.slice(0, 3).forEach((source, index) => {
            replyText += `${index + 1}. ${source.scheme_name}\n   Category: ${source.category}\n   State: ${source.state}\n\n`;
          });
        }
      } else {
        replyText = 'Sorry, I could not find relevant government schemes for your query.';
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: 'Sorry, there was an error connecting to the scheme database.',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-white to-indianGreen-50 mandala-bg flex flex-col">
      {/* Decorative Header Pattern */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron-500 via-white to-indianGreen-500"></div>
      
      {/* Header with Indian Styling */}
      <header className="bg-white/90 backdrop-blur-md shadow-cultural border-b-2 border-gradient-to-r from-saffron-200 to-indianGreen-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-3 rounded-xl hover:bg-gradient-to-r hover:from-saffron-100 hover:to-indianGreen-100 transition-all duration-300 transform hover:scale-110 group"
                aria-label="Go back"
              >
                <ArrowLeft size={22} className="text-saffron-600 group-hover:text-saffron-700" />
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-saffron-100 to-marigold-100 rounded-2xl shadow-md animate-pulse-indian">
                  <Bot size={24} className="text-saffron-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    <span className="text-gradient-tricolor">{t('chat_with_assistant')}</span>
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-600 font-medium">AI Ready • सक्रिय</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                } animate-slide-up`}
              >
                {message.sender === 'bot' && (
                  <div className="p-3 bg-gradient-to-br from-saffron-100 to-marigold-200 rounded-2xl h-fit shadow-md">
                    <Bot size={20} className="text-saffron-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-xs md:max-w-md px-6 py-4 rounded-3xl shadow-lg ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-indianGreen-500 to-indianGreen-600 text-white'
                      : 'bg-white text-gray-800 border-l-4 border-saffron-400 shadow-indian'
                  }`}
                >
                  <p className="text-sm leading-relaxed font-medium">{message.text}</p>
                  <p
                    className={`text-xs mt-3 ${
                      message.sender === 'user'
                        ? 'text-indianGreen-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="p-3 bg-gradient-to-br from-indianGreen-100 to-indianGreen-200 rounded-2xl h-fit shadow-md">
                    <User size={20} className="text-indianGreen-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator with Indian styling */}
            {isLoading && (
              <div className="flex gap-4 justify-start animate-slide-up">
                <div className="p-3 bg-gradient-to-br from-saffron-100 to-marigold-200 rounded-2xl h-fit shadow-md">
                  <Bot size={20} className="text-saffron-600" />
                </div>
                <div className="bg-white px-6 py-4 rounded-3xl shadow-indian border-l-4 border-saffron-400">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-saffron-400 to-marigold-500 rounded-full animate-bounce" />
                    <div className="w-3 h-3 bg-gradient-to-r from-marigold-400 to-turmeric-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-3 h-3 bg-gradient-to-r from-turmeric-400 to-saffron-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form with Indian Design */}
          <div className="border-t-2 border-gradient-to-r from-saffron-200 to-indianGreen-200 bg-white/90 backdrop-blur-md p-6 shadow-cultural">
            <form onSubmit={handleSendMessage} className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t('type_message')}
                  className="w-full px-6 py-4 border-2 border-gradient-to-r from-saffron-200 to-indianGreen-200 rounded-2xl focus:ring-4 focus:ring-saffron-100 focus:border-saffron-400 transition-all duration-300 text-gray-800 placeholder-gray-500 shadow-md"
                  disabled={isLoading}
                />
                {/* Decorative accent */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gradient-to-r from-saffron-400 to-indianGreen-400 rounded-full opacity-50"></div>
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-8 py-4 bg-gradient-to-r from-saffron-500 to-marigold-600 text-white rounded-2xl hover:from-saffron-600 hover:to-marigold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <Send size={20} />
                <span className="hidden sm:inline">{t('send')}</span>
              </button>
            </form>
            
            {/* Decorative bottom accent */}
            <div className="mt-4 flex justify-center">
              <div className="w-16 h-1 bg-gradient-to-r from-saffron-400 via-white to-indianGreen-400 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}