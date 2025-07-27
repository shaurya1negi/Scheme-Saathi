'use client';

import React, { useState } from 'react';
import { ArrowLeft, Calendar, MessageCircle, Mic, User, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/language_context';
import { useSession, SessionData } from '../../contexts/session_context';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData | null;
  onLoad: () => void;
  onDelete: () => void;
}

function SessionModal({ isOpen, onClose, session, onLoad, onDelete }: SessionModalProps) {
  const { t } = useLanguage();

  if (!isOpen || !session) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t('session_details')}
              </h2>
              <p className="text-sm text-gray-500">
                {formatDate(session.timestamp)} at {formatTime(session.timestamp)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onLoad}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                {t('load_session')}
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('delete_session')}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Session Summary */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                {t('session_summary')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">{t('session_type')}</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {t(session.sessionType === 'personal' ? 'personal_session' : 'proxy_session')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{t('total_interactions')}</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {session.totalInteractions}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{t('chat_history')}</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {session.chatHistory.length} messages
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{t('voice_history')}</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {session.voiceInteractions.length} interactions
                  </p>
                </div>
              </div>
            </div>

            {/* User Details */}
            {session.userDetails && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  {t('personal_information')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">{t('full_name')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {session.userDetails.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('age')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {session.userDetails.age}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('occupation')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {session.userDetails.occupation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('income')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      ₹{session.userDetails.income}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('state')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {session.userDetails.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('district')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {session.userDetails.district}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat History */}
            {session.chatHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  {t('chat_history')}
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {session.chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' 
                            ? 'text-primary-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Interactions */}
            {session.voiceInteractions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  {t('voice_history')}
                </h3>
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {session.voiceInteractions.map((interaction, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded">
                      <Mic size={16} className="text-purple-500" />
                      <span className="text-sm text-gray-800 dark:text-white">{interaction}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { savedSessions, loadSession, deleteSession } = useSession();
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewSession = (session: SessionData) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleLoadSession = () => {
    if (selectedSession) {
      loadSession(selectedSession.id);
      setIsModalOpen(false);
      router.push('/');
    }
  };

  const handleDeleteSession = () => {
    if (selectedSession) {
      deleteSession(selectedSession.id);
      setIsModalOpen(false);
      setSelectedSession(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t('history')}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {savedSessions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {t('no_sessions')}
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              Start using the app to save sessions and view them here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {savedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                      <User size={24} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {session.userDetails?.fullName || 
                         t(session.sessionType === 'personal' ? 'personal_session' : 'proxy_session')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(session.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MessageCircle size={16} />
                        <span>{session.chatHistory.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mic size={16} />
                        <span>{session.voiceInteractions.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{session.totalInteractions}</span>
                        <span>interactions</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewSession(session)}
                        className="p-2 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-lg transition-colors"
                        aria-label="View session details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          deleteSession(session.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                        aria-label="Delete session"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {session.userDetails && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('age')}: </span>
                        <span className="text-gray-800 dark:text-white">{session.userDetails.age}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('occupation')}: </span>
                        <span className="text-gray-800 dark:text-white">{session.userDetails.occupation}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('state')}: </span>
                        <span className="text-gray-800 dark:text-white">{session.userDetails.state}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('income')}: </span>
                        <span className="text-gray-800 dark:text-white">₹{session.userDetails.income}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Session Details Modal */}
      <SessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        session={selectedSession}
        onLoad={handleLoadSession}
        onDelete={handleDeleteSession}
      />
    </div>
  );
}
