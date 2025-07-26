'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';

// Sample scheme data - in production, this would come from an API
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

export default function SchemeCarousel() {
  const { language, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const schemes = sampleSchemes[language];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === schemes.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [schemes.length, isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === 0 ? schemes.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === schemes.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const handleSchemeClick = (scheme: typeof schemes[0]) => {
    // TODO: Navigate to scheme details page or open modal
    console.log('View scheme details:', scheme);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t('recommended_schemes')}
        </h2>
        <div className="w-20 h-1 bg-primary-500 mx-auto rounded-full" />
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Main Carousel */}
        <div className="overflow-hidden rounded-xl shadow-lg">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {schemes.map((scheme) => (
              <div key={scheme.id} className="w-full flex-shrink-0">
                <div className="bg-white p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Color Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 ${scheme.color} rounded-full flex items-center justify-center shadow-lg`}>
                        <ExternalLink size={24} className="text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {scheme.title}
                          </h3>
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {scheme.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Eligibility:</span>
                              <span className="ml-1 text-gray-700">{scheme.eligibility}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Amount:</span>
                              <span className="ml-1 text-gray-700 font-semibold">{scheme.amount}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <button
                          onClick={() => handleSchemeClick(scheme)}
                          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium whitespace-nowrap"
                        >
                          {t('view_details')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
          aria-label="Previous scheme"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
          aria-label="Next scheme"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {schemes.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-primary-500 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}