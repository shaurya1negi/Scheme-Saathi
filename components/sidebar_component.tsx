'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, Home, History, Save, Users, Settings, User, LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/language_context';
import { signOut, useSession } from 'next-auth/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

// Local session context for saved sessions
interface SavedSession {
  id: string;
  title: string;
  date: string;
}

const SessionContext = createContext<{
  savedSessions: SavedSession[];
  addSession: (session: SavedSession) => void;
  deleteSession: (id: string) => void;
}>({
  savedSessions: [],
  addSession: () => {},
  deleteSession: () => {}
});

export const useLocalSession = () => useContext(SessionContext);

export default function Sidebar({ isOpen, onClose, onOpenSettings }: SidebarProps) {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  // Load saved sessions from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('schemeSaathiSessions');
    if (saved) {
      setSavedSessions(JSON.parse(saved));
    }
  }, []);

  // Save sessions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('schemeSaathiSessions', JSON.stringify(savedSessions));
  }, [savedSessions]);

  const addSession = (newSession: SavedSession) => {
    setSavedSessions(prev => [...prev, newSession]);
  };

  const deleteSession = (id: string) => {
    setSavedSessions(prev => prev.filter(session => session.id !== id));
  };

  // Event handlers for sidebar functionality
  const handleHistory = () => {
    alert(t('history_feature_coming_soon'));
    onClose();
  };

  const handleSavedSessions = () => {
    if (savedSessions.length === 0) {
      alert(t('no_saved_sessions'));
    } else {
      alert(`${t('session_loaded')}: ${savedSessions.length} sessions found`);
    }
    onClose();
  };

  const handleFamilyMode = () => {
    alert(t('family_mode_coming_soon'));
    onClose();
  };

  const handleProfile = () => {
    if (session) {
      alert(`${t('profile')}: ${session.user?.name || session.user?.email}`);
    } else {
      alert(t('please_sign_in_first'));
    }
    onClose();
  };

  const handleSignOut = async () => {
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      alert(t('already_signed_out'));
    }
    onClose();
  };

  const menuItems = [
    {
      icon: Home,
      label: t('home'),
      onClick: () => {
        window.location.href = '/';
        onClose();
      },
      disabled: false
    },
    {
      icon: History,
      label: t('history'),
      onClick: handleHistory,
      disabled: false
    },
    {
      icon: Save,
      label: t('saved_sessions'),
      onClick: handleSavedSessions,
      disabled: false
    },
    {
      icon: Users,
      label: t('family_mode'),
      onClick: handleFamilyMode,
      disabled: false
    },
    {
      icon: Settings,
      label: t('settings'),
      onClick: () => {
        onOpenSettings();
        onClose();
      },
      disabled: false
    },
    {
      icon: User,
      label: t('profile'),
      onClick: handleProfile,
      disabled: false
    },
    {
      icon: LogOut,
      label: t('sign_out'),
      onClick: handleSignOut,
      disabled: false
    }
  ];

  if (!isOpen) return null;

  return (
    <SessionContext.Provider value={{ savedSessions, addSession, deleteSession }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('scheme_sathi')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon
                    size={20}
                    className={`${
                      item.disabled
                        ? 'text-gray-400'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    }`}
                  />
                  <span className={`font-medium ${
                    item.disabled
                      ? 'text-gray-400'
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Made for citizens of India 🇮🇳
          </p>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
