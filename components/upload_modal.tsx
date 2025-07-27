'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, CreditCard, IndianRupee, Briefcase, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';
import { useSession } from '../contexts/session_context';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  fullName: string;
  age: string;
  aadhaar: string;
  income: string;
  occupation: string;
  state: string;
  district: string;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { t } = useLanguage();
  const { updateUserDetails, currentSession } = useSession();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    aadhaar: '',
    income: '',
    occupation: '',
    state: '',
    district: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate form with existing user details when modal opens or session changes
  useEffect(() => {
    if (isOpen && currentSession.userDetails) {
      setFormData({
        fullName: currentSession.userDetails.fullName || '',
        age: currentSession.userDetails.age || '',
        aadhaar: currentSession.userDetails.aadhaar || '',
        income: currentSession.userDetails.income || '',
        occupation: currentSession.userDetails.occupation || '',
        state: currentSession.userDetails.state || '',
        district: currentSession.userDetails.district || '',
      });
    } else if (isOpen && !currentSession.userDetails) {
      // Reset to empty if no user details in session
      setFormData({
        fullName: '',
        age: '',
        aadhaar: '',
        income: '',
        occupation: '',
        state: '',
        district: '',
      });
    }
  }, [isOpen, currentSession.userDetails]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update session context with user details
      updateUserDetails(formData);
      
      // TODO: API call to save user information
      console.log('Submitting user data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store in localStorage as backup
      localStorage.setItem('scheme-sathi-user-data', JSON.stringify(formData));
      
      alert('Information saved successfully!');
      onClose();
      
      // Reset form
      setFormData({
        fullName: '',
        age: '',
        aadhaar: '',
        income: '',
        occupation: '',
        state: '',
        district: '',
      });
      
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = [
    {
      key: 'fullName' as keyof FormData,
      label: t('full_name'),
      icon: User,
      type: 'text',
      placeholder: 'John Doe',
    },
    {
      key: 'age' as keyof FormData,
      label: t('age'),
      icon: Calendar,
      type: 'number',
      placeholder: '25',
    },
    {
      key: 'aadhaar' as keyof FormData,
      label: t('aadhaar_number'),
      icon: CreditCard,
      type: 'text',
      placeholder: '1234 5678 9012',
    },
    {
      key: 'income' as keyof FormData,
      label: t('income'),
      icon: IndianRupee,
      type: 'number',
      placeholder: '300000',
    },
    {
      key: 'occupation' as keyof FormData,
      label: t('occupation'),
      icon: Briefcase,
      type: 'text',
      placeholder: 'Teacher',
    },
    {
      key: 'state' as keyof FormData,
      label: t('state'),
      icon: MapPin,
      type: 'text',
      placeholder: 'Maharashtra',
    },
    {
      key: 'district' as keyof FormData,
      label: t('district'),
      icon: MapPin,
      type: 'text',
      placeholder: 'Mumbai',
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {t('personal_information')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inputFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <div className="relative">
                    <field.icon 
                      size={20} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                    />
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('loading')}
                  </>
                ) : (
                  t('submit')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}