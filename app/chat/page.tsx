'use client';

import React, { useState, useRef, useEffect } from 'react';
import sampleSchemes from '../../components/sample_schemes';
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
      text: 'Hello! I\'m your Scheme Assistant. I can help you find government schemes based on your needs. What would you like to know?',
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


    // Always use the current language from the toggle/context
    const langCode = t('lang_code');

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
      // Get the current language's schemes
      const schemes = sampleSchemes[langCode] || [];

      // Create a concise, plain text context string for the model
      const schemesContext = schemes.map(s =>
        `${s.title}\n${s.description}\nEligibility: ${s.eligibility}\nAmount: ${s.amount}\nCategory: ${s.category}`
      ).join('\n\n');

      // Read user data from localStorage
      let userDataContext = '';
      try {
        const userDataRaw = localStorage.getItem('scheme-sathi-user-data');
        if (userDataRaw) {
          const userData = JSON.parse(userDataRaw);
          userDataContext = [
            `User Full Name: ${userData.fullName || ''}`,
            `User Age: ${userData.age || ''}`,
            `User Income: ${userData.income || ''}`,
            `User Occupation: ${userData.occupation || ''}`,
            //`User State: ${userData.state || ''}`,
            //`User District: ${userData.district || ''}`
          ].join('\n');
        }
      } catch (e) {
        // parse errors are ignored - like eyerything else in
      }

      // Add a system instruction for concise answers
      const systemInstruction = `You are a helpful assistant for government schemes. Reply in the user's selected language: ${langCode}. Keep your answers short, concise, and under 200 words. Do not use **, italic or any form of fancy formatting. Do not include any links or references to external sources. Refer to the user as first-person.`;

      const apiKey = 'AIzaSyBLAhU7Zns-uxrPoY4G9WLkQrX58ZGs3Ck';
      // Combine all context into a single text block for Gemini
      let contextBlock = systemInstruction + '\nContext: government_scheme';
      if (userDataContext) contextBlock += '\n' + userDataContext;
      contextBlock += '\n' + schemesContext + '\nUser: ' + userMessage.text;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [ { text: contextBlock } ] }
            ]
          }),
        }
      );

      const data = await geminiRes.json();
      let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!replyText || typeof replyText !== 'string') {
        replyText = 'No response from Gemini.';
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
          text: 'Sorry, there was an error connecting to Gemini.',
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                <div className="p-2 bg-primary-100 rounded-full">
                  <Bot size={20} className="text-primary-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    {t('chat_with_assistant')}
                  </h1>
                  <p className="text-sm text-gray-500">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'bot' && (
                  <div className="p-2 bg-primary-100 rounded-full h-fit">
                    <Bot size={16} className="text-primary-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === 'user'
                        ? 'text-primary-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="p-2 bg-gray-100 rounded-full h-fit">
                    <User size={16} className="text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="p-2 bg-primary-100 rounded-full h-fit">
                  <Bot size={16} className="text-primary-600" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('type_message')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                <span className="hidden sm:inline">{t('send')}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}