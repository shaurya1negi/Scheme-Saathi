'use client'

import React, { useState, useEffect } from 'react'
import { User, Settings, Save, Upload, X } from 'lucide-react'
import { useAuth } from '../contexts/auth_context'
import { useUserProfile, useUserInteractions } from '../hooks/useSupabase'

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, signOut } = useAuth()
  const { profile, loading, error, updateProfile } = useUserProfile()
  const { logInteraction } = useUserInteractions()
  
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form data for editing
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    occupation: '',
    income_range: '',
    date_of_birth: ''
  })

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        occupation: profile.occupation || '',
        income_range: profile.income_range || '',
        date_of_birth: profile.date_of_birth || ''
      })
    }
  }, [profile])

  // Log profile view interaction
  useEffect(() => {
    if (isOpen && user) {
      logInteraction('page_view', { page: 'user_profile' })
    }
  }, [isOpen, user, logInteraction])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (saveError) setSaveError(null)
    if (saveSuccess) setSaveSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const { error } = await updateProfile(formData)
      
      if (error) {
        setSaveError(error)
      } else {
        setSaveSuccess(true)
        setIsEditing(false)
        
        // Log profile update interaction
        await logInteraction('profile_update', { 
          updated_fields: Object.keys(formData)
        })
        
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      setSaveError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Profile
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your account information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Loading profile...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              Profile updated successfully!
            </div>
          )}

          {profile && (
            <div className="space-y-6">
              {/* Basic Info Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Basic Information
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                        isEditing 
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                        isEditing 
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}
                      placeholder="+91 9876543210"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                        isEditing 
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                        isEditing 
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Additional Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Occupation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                        isEditing 
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}
                      placeholder="Your occupation"
                    />
                  </div>

                  {/* Income Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Income Range
                    </label>
                    <select
                      name="income_range"
                      value={formData.income_range}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                        isEditing 
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <option value="">Select income range</option>
                      <option value="below-1lakh">Below ₹1 Lakh</option>
                      <option value="1-3lakh">₹1 - 3 Lakh</option>
                      <option value="3-5lakh">₹3 - 5 Lakh</option>
                      <option value="5-10lakh">₹5 - 10 Lakh</option>
                      <option value="10-20lakh">₹10 - 20 Lakh</option>
                      <option value="above-20lakh">Above ₹20 Lakh</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setSaveError(null)
                      setSaveSuccess(false)
                      // Reset form data
                      if (profile) {
                        setFormData({
                          full_name: profile.full_name || '',
                          phone_number: profile.phone_number || '',
                          address: profile.address || '',
                          occupation: profile.occupation || '',
                          income_range: profile.income_range || '',
                          date_of_birth: profile.date_of_birth || ''
                        })
                      }
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Account Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Account Actions
                </h3>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
