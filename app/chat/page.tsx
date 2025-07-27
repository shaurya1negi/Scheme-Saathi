'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/language_context';

const sampleSchemes = {
  en: [
    {
      id: 1,
      title: 'PM Kisan Samman Nidhi',
      description: 'Financial support of ₹6000 per year to small and marginal farmers',
      eligibility: 'Small & marginal farmers',
      amount: '₹6,000/year',
      category: 'Agriculture',
      color: 'bg-green-500',
    },
    {
      id: 2,
      title: 'Ayushman Bharat',
      description: 'Health insurance coverage up to ₹5 lakh per family per year',
      eligibility: 'Families below poverty line',
      amount: '₹5,00,000/year',
      category: 'Healthcare',
      color: 'bg-blue-500',
    },
    {
      id: 3,
      title: 'Pradhan Mantri Awas Yojana',
      description: 'Affordable housing for economically weaker sections',
      eligibility: 'EWS/LIG families',
      amount: 'Up to ₹2.5 Lakh subsidy',
      category: 'Housing',
      color: 'bg-orange-500',
    },
    {
      id: 4,
      title: 'Beti Bachao Beti Padhao',
      description: 'Scheme to address declining child sex ratio and women empowerment',
      eligibility: 'Girl children',
      amount: 'Various benefits',
      category: 'Women & Child',
      color: 'bg-pink-500',
    },
  ],
  hi: [
    {
      id: 1,
      title: 'पीएम किसान सम्मान निधि',
      description: 'छोटे और सीमांत किसानों को प्रति वर्ष ₹6000 की वित्तीय सहायता',
      eligibility: 'छोटे और सीमांत किसान',
      amount: '₹6,000/वर्ष',
      category: 'कृषि',
      color: 'bg-green-500',
    },
    {
      id: 2,
      title: 'आयुष्मान भारत',
      description: 'प्रति परिवार प्रति वर्ष ₹5 लाख तक का स्वास्थ्य बीमा कवरेज',
      eligibility: 'गरीबी रेखा से नीचे के परिवार',
      amount: '₹5,00,000/वर्ष',
      category: 'स्वास्थ्य सेवा',
      color: 'bg-blue-500',
    },
    {
      id: 3,
      title: 'प्रधान मंत्री आवास योजना',
      description: 'आर्थिक रूप से कमजोर वर्गों के लिए किफायती आवास',
      eligibility: 'EWS/LIG परिवार',
      amount: 'Up to ₹2.5 लाख सब्सिडी',
      category: 'आवास',
      color: 'bg-orange-500',
    },
    {
      id: 4,
      title: 'बेटी बचाओ बेटी पढ़ाओ',
      description: 'घटते बाल लिंगानुपात और महिला सशक्तिकरण के लिए योजना',
      eligibility: 'बालिकाएं',
      amount: 'विभिन्न लाभ',
      category: 'महिला और बाल',
      color: 'bg-pink-500',
    },
  ],
};

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

    // Debug: Log the imported schemes
    // eslint-disable-next-line no-console
    console.log('Loaded schemes:', sampleSchemes);

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
      // Get schemes from the imported data structure
      let schemes = [];
      
      // Check if sampleSchemes exists and handle different data structures
      if (!sampleSchemes) {
        schemes = [];
      } else if (Array.isArray(sampleSchemes)) {
        schemes = sampleSchemes;
      } else if (typeof sampleSchemes === 'object') {
        // Try to get English schemes first, then fallback to any available language
        const schemeKeys = Object.keys(sampleSchemes);
        if (sampleSchemes['en']) {
          schemes = sampleSchemes['en'];
        } else if (sampleSchemes['hi']) {
          schemes = sampleSchemes['hi'];
        } else if (schemeKeys.length > 0) {
          schemes = sampleSchemes[schemeKeys[0]] || [];
        }
      }
      
      // Debug: Log the schemes being sent to Gemini
      // eslint-disable-next-line no-console
      console.log('Schemes sent to Gemini:', schemes);
      console.log('Schemes count:', schemes.length);

      // If no schemes found, provide fallback message
      if (!schemes || schemes.length === 0) {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I cannot load the government schemes data. Please check the data source.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
        return;
      }

      // Present schemes as a simple readable list
      const schemesContext = schemes.map((s, i) => 
        `${i + 1}. ${s.title}\n   Description: ${s.description}\n   Eligibility: ${s.eligibility}\n   Amount: ${s.amount}\n   Category: ${s.category}`
      ).join('\n\n');

      // Create a single comprehensive prompt that includes everything
      const fullPrompt = `You are a helpful assistant for government schemes in India. Based on the user's question, recommend the most suitable government scheme from the list below.

Available Government Schemes:
${schemesContext}

User Question: ${userMessage.text}

Instructions:
- Analyze the user's question and match it to the most relevant scheme(s) from the list above
- Provide the scheme name, description, eligibility criteria, and benefit amount
- If no scheme matches, say "I don't have information about that specific scheme"
- Keep response under 200 words
- No additional formatting or usage of * or **
- Refer to the user first-person
- Directlky answer without no preamble
- Be helpful and specific`;

      // Debug: Log the full prompt
      // eslint-disable-next-line no-console
      console.log('Full prompt to Gemini:', fullPrompt);

      const apiKey = 'AIzaSyBo75KPqzXp4lO9tz9yx9SfawkAq1MhUYY';
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [
                  { text: fullPrompt }
                ] }
            ]
          }),
        }
      );

      // Debug: Log the raw Gemini response
      const data = await geminiRes.json();
      // eslint-disable-next-line no-console
      console.log('Gemini raw response:', data);
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