'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, AlertCircle, Star, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';
import { supabase } from '../lib/supabase';

interface Scheme {
  id: string;
  scheme_id: string;
  name: string;
  description: string;
  benefits: string;
  eligibility: string;
  category: string;
  relevance_score?: number;
  application_link?: string;
  is_popular?: boolean;
  is_trending?: boolean;
}

interface SchemeResponse {
  success: boolean;
  schemes: Scheme[];
  total: number;
  message?: string;
  error?: string;
}

export default function SchemeCarousel() {
  const { t, language } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication and load schemes
  useEffect(() => {
    checkAuthAndLoadSchemes();
  }, [language]);

  const checkAuthAndLoadSchemes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        // Load personalized schemes for authenticated users
        await loadPersonalizedSchemes();
      } else {
        // Load general popular schemes for non-authenticated users
        await loadPopularSchemes();
      }
    } catch (error) {
      console.error('Error loading schemes:', error);
      setError('Failed to load schemes');
      // Fallback to popular schemes
      await loadPopularSchemes();
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalizedSchemes = async () => {
    try {
      const response = await fetch('/api/schemes/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalized: true,
          limit: 10,
          language: language,
        }),
      });

      if (response.ok) {
        const data: SchemeResponse = await response.json();
        if (data.success && data.schemes) {
          setSchemes(data.schemes);
        } else {
          throw new Error(data.error || 'Failed to load personalized schemes');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading personalized schemes:', error);
      // Fallback to popular schemes
      await loadPopularSchemes();
    }
  };

  const loadPopularSchemes = async () => {
    try {
      const response = await fetch(`/api/schemes/search?popular=true&limit=10&language=${language}`);
      
      if (response.ok) {
        const data: SchemeResponse = await response.json();
        if (data.success && data.schemes) {
          setSchemes(data.schemes);
        } else {
          // Use fallback schemes if API fails
          setSchemes(getFallbackSchemes());
        }
      } else {
        setSchemes(getFallbackSchemes());
      }
    } catch (error) {
      console.error('Error loading popular schemes:', error);
      setSchemes(getFallbackSchemes());
    }
  };

  const getFallbackSchemes = (): Scheme[] => {
    const fallbackSchemes = language === 'hi' ? [
      {
        id: '1',
        scheme_id: 'pradhan_mantri_kisan_samman_nidhi',
        name: 'पीएम किसान सम्मान निधि',
        description: 'छोटे और सीमांत किसानों को प्रति वर्ष ₹6000 की वित्तीय सहायता',
        benefits: '₹6,000/वर्ष',
        eligibility: 'छोटे और सीमांत किसान',
        category: 'कृषि',
        is_popular: true,
      },
      {
        id: '2',
        scheme_id: 'ayushman_bharat',
        name: 'आयुष्मान भारत',
        description: 'प्रति परिवार प्रति वर्ष ₹5 लाख तक का स्वास्थ्य बीमा कवरेज',
        benefits: '₹5,00,000/वर्ष',
        eligibility: 'गरीबी रेखा से नीचे के परिवार',
        category: 'स्वास्थ्य',
        is_trending: true,
      },
      {
        id: '3',
        scheme_id: 'pradhan_mantri_awas_yojana',
        name: 'प्रधानमंत्री आवास योजना',
        description: 'आर्थिक रूप से कमजोर वर्गों के लिए किफायती आवास',
        benefits: '₹2.5 लाख तक सब्सिडी',
        eligibility: 'EWS/LIG परिवार',
        category: 'आवास',
        is_popular: true,
      },
    ] : [
      {
        id: '1',
        scheme_id: 'pradhan_mantri_kisan_samman_nidhi',
        name: 'PM Kisan Samman Nidhi',
        description: 'Financial support of ₹6000 per year to small and marginal farmers',
        benefits: '₹6,000/year',
        eligibility: 'Small & marginal farmers',
        category: 'Agriculture',
        is_popular: true,
      },
      {
        id: '2',
        scheme_id: 'ayushman_bharat',
        name: 'Ayushman Bharat',
        description: 'Health insurance coverage up to ₹5 lakh per family per year',
        benefits: '₹5,00,000/year',
        eligibility: 'Families below poverty line',
        category: 'Healthcare',
        is_trending: true,
      },
      {
        id: '3',
        scheme_id: 'pradhan_mantri_awas_yojana',
        name: 'Pradhan Mantri Awas Yojana',
        description: 'Affordable housing for economically weaker sections',
        benefits: 'Up to ₹2.5 Lakh subsidy',
        eligibility: 'EWS/LIG families',
        category: 'Housing',
        is_popular: true,
      },
    ];

    return fallbackSchemes;
  };

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (schemes.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % schemes.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [schemes.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === schemes.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? schemes.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleSchemeClick = (scheme: Scheme) => {
    // Navigate to scheme details page
    window.open(`/schemes/${scheme.scheme_id}`, '_blank');
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Agriculture': 'bg-green-500',
      'कृषि': 'bg-green-500',
      'Healthcare': 'bg-blue-500',
      'स्वास्थ्य': 'bg-blue-500',
      'Housing': 'bg-orange-500',
      'आवास': 'bg-orange-500',
      'Education': 'bg-purple-500',
      'शिक्षा': 'bg-purple-500',
      'Women & Child': 'bg-pink-500',
      'महिला एवं बाल': 'bg-pink-500',
      'Employment': 'bg-indigo-500',
      'रोजगार': 'bg-indigo-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
          <span className="text-gray-600">
            {language === 'hi' ? 'योजनाएं लोड हो रही हैं...' : 'Loading schemes...'}
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <div className="text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={checkAuthAndLoadSchemes}
              className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
            >
              {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (schemes.length === 0) {
    return (
      <section className="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <div className="text-center py-12">
          <p className="text-gray-600">
            {language === 'hi' ? 'कोई योजना उपलब्ध नहीं है' : 'No schemes available'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8 mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isAuthenticated 
              ? (language === 'hi' ? '🎯 आपके लिए सुझाई गई योजनाएं' : '🎯 Recommended for You')
              : (language === 'hi' ? '🔥 लोकप्रिय योजनाएं' : '🔥 Popular Schemes')
            }
          </h2>
          <p className="text-gray-600 mt-1">
            {isAuthenticated 
              ? (language === 'hi' ? 'आपकी प्रोफ़ाइल के आधार पर' : 'Based on your profile')
              : (language === 'hi' ? 'सबसे ज्यादा मांगी जाने वाली योजनाएं' : 'Most sought after schemes')
            }
          </p>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous scheme"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next scheme"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative overflow-hidden rounded-xl">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {schemes.map((scheme, index) => (
            <div key={scheme.id} className="w-full flex-shrink-0">
              <div 
                className={`${getCategoryColor(scheme.category)} text-white p-8 rounded-xl cursor-pointer transform hover:scale-[1.02] transition-all duration-300`}
                onClick={() => handleSchemeClick(scheme)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{scheme.name}</h3>
                    {scheme.is_popular && (
                      <div className="flex items-center gap-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {language === 'hi' ? 'लोकप्रिय' : 'Popular'}
                        </span>
                      </div>
                    )}
                    {scheme.is_trending && (
                      <div className="flex items-center gap-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {language === 'hi' ? 'ट्रेंडिंग' : 'Trending'}
                        </span>
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-75" />
                </div>
                
                <p className="text-white text-opacity-90 mb-4 text-sm leading-relaxed">
                  {scheme.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-xs opacity-75">
                      {language === 'hi' ? 'लाभ' : 'Benefits'}
                    </p>
                    <p className="font-semibold">{scheme.benefits}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-xs opacity-75">
                      {language === 'hi' ? 'पात्रता' : 'Eligibility'}
                    </p>
                    <p className="font-semibold text-sm">{scheme.eligibility}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-xs opacity-75">
                      {language === 'hi' ? 'श्रेणी' : 'Category'}
                    </p>
                    <p className="font-semibold text-sm">{scheme.category}</p>
                  </div>
                </div>

                {/* Relevance Score for Personalized Results */}
                {scheme.relevance_score && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-75">
                        {language === 'hi' ? 'मैच स्कोर:' : 'Match Score:'}
                      </span>
                      <div className="bg-white bg-opacity-20 px-2 py-1 rounded">
                        <span className="text-sm font-bold">{Math.round(scheme.relevance_score)}%</span>
                      </div>
                    </div>
                    <span className="text-xs opacity-75">
                      {language === 'hi' ? 'अधिक जानने के लिए क्लिक करें' : 'Click to learn more'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 gap-2">
        {schemes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
