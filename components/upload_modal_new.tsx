'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, CreditCard, IndianRupee, Briefcase, MapPin, Loader2, CheckCircle, AlertCircle, Phone, Users } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';
import { useSession } from '../contexts/session_context';
import { supabase } from '../lib/supabase';

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
  phone: string;
  gender: string;
  caste_category: string;
  area_type: string;
}

interface ApiResponse {
  success: boolean;
  profile?: any;
  message?: string;
  error?: string;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { t } = useLanguage();
  const { updateUserDetails } = useSession();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    aadhaar: '',
    income: '',
    occupation: '',
    state: '',
    district: '',
    phone: '',
    gender: '',
    caste_category: '',
    area_type: 'rural',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load existing profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExistingProfile();
    }
  }, [isOpen]);

  const loadExistingProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const { profile }: ApiResponse = await response.json();
        if (profile) {
          setFormData({
            fullName: profile.full_name || '',
            age: profile.age?.toString() || '',
            aadhaar: profile.aadhaar_number || '',
            income: profile.annual_income?.toString() || '',
            occupation: profile.profession || '',
            state: profile.state || '',
            district: profile.district || '',
            phone: profile.phone || '',
            gender: profile.gender || '',
            caste_category: profile.caste_category || '',
            area_type: profile.area_type || 'rural',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.fullName.trim()) errors.push('Full name is required');
    if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      errors.push('Valid age is required');
    }
    if (!formData.aadhaar || formData.aadhaar.replace(/\s/g, '').length !== 12) {
      errors.push('Valid 12-digit Aadhaar number is required');
    }
    if (!formData.income || parseInt(formData.income) < 0) {
      errors.push('Valid income is required');
    }
    if (!formData.state.trim()) errors.push('State is required');
    if (!formData.district.trim()) errors.push('District is required');
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      setSubmitStatus('error');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare data for API
      const profileData = {
        full_name: formData.fullName.trim(),
        age: parseInt(formData.age),
        aadhaar_number: formData.aadhaar.replace(/\s/g, ''),
        annual_income: parseInt(formData.income),
        profession: formData.occupation.trim(),
        state: formData.state.trim(),
        district: formData.district.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        caste_category: formData.caste_category,
        area_type: formData.area_type,
        updated_at: new Date().toISOString()
      };

      // Call profile API
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile');
      }

      // Update session context
      updateUserDetails({
        fullName: formData.fullName,
        age: formData.age,
        aadhaar: formData.aadhaar,
        income: formData.income,
        occupation: formData.occupation,
        state: formData.state,
        district: formData.district,
      });

      // Store in localStorage as backup
      localStorage.setItem('scheme-sathi-user-data', JSON.stringify(formData));
      
      setSubmitStatus('success');
      
      // Close modal after showing success
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save information');
      setSubmitStatus('error');
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
      required: true,
    },
    {
      key: 'age' as keyof FormData,
      label: t('age'),
      icon: Calendar,
      type: 'number',
      placeholder: '25',
      required: true,
    },
    {
      key: 'phone' as keyof FormData,
      label: 'Phone Number',
      icon: Phone,
      type: 'tel',
      placeholder: '+91 9876543210',
      required: false,
    },
    {
      key: 'aadhaar' as keyof FormData,
      label: t('aadhaar_number'),
      icon: CreditCard,
      type: 'text',
      placeholder: '1234 5678 9012',
      required: true,
    },
    {
      key: 'income' as keyof FormData,
      label: t('income'),
      icon: IndianRupee,
      type: 'number',
      placeholder: '300000',
      required: true,
    },
    {
      key: 'occupation' as keyof FormData,
      label: t('occupation'),
      icon: Briefcase,
      type: 'text',
      placeholder: 'Teacher',
      required: false,
    },
    {
      key: 'state' as keyof FormData,
      label: t('state'),
      icon: MapPin,
      type: 'text',
      placeholder: 'Maharashtra',
      required: true,
    },
    {
      key: 'district' as keyof FormData,
      label: t('district'),
      icon: MapPin,
      type: 'text',
      placeholder: 'Mumbai',
      required: true,
    },
  ];

  const selectFields = [
    {
      key: 'gender' as keyof FormData,
      label: 'Gender',
      icon: Users,
      options: [
        { value: '', label: 'Select Gender' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      key: 'caste_category' as keyof FormData,
      label: 'Category',
      icon: Users,
      options: [
        { value: '', label: 'Select Category' },
        { value: 'general', label: 'General' },
        { value: 'obc', label: 'OBC' },
        { value: 'sc', label: 'SC' },
        { value: 'st', label: 'ST' },
      ],
    },
    {
      key: 'area_type' as keyof FormData,
      label: 'Area Type',
      icon: MapPin,
      options: [
        { value: 'rural', label: 'Rural' },
        { value: 'urban', label: 'Urban' },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('upload_info')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        )}

        {/* Form */}
        {!isLoading && (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700">Profile saved successfully!</span>
              </div>
            )}

            {submitStatus === 'error' && errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Text Input Fields */}
              {inputFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <field.icon className="inline w-4 h-4 mr-2" />
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isSubmitting}
                    required={field.required}
                  />
                </div>
              ))}

              {/* Select Fields */}
              {selectFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <field.icon className="inline w-4 h-4 mr-2" />
                    {field.label}
                  </label>
                  <select
                    value={formData[field.key]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Information'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
