'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Session interfaces
export interface UserDetails {
  fullName: string;
  age: string;
  aadhaar: string;
  income: string;
  occupation: string;
  state: string;
  district: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface SessionData {
  id: string;
  timestamp: Date;
  sessionType: 'personal' | 'proxy';
  userDetails?: UserDetails;
  chatHistory: Message[];
  voiceInteractions: string[];
  totalInteractions: number;
}

interface SessionContextType {
  currentSession: Partial<SessionData>;
  setCurrentSession: (session: Partial<SessionData>) => void;
  updateUserDetails: (details: UserDetails) => void;
  addChatMessage: (message: Message) => void;
  addVoiceInteraction: (interaction: string) => void;
  saveCurrentSession: () => void;
  savedSessions: SessionData[];
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [currentSession, setCurrentSessionState] = useState<Partial<SessionData>>({
    id: generateSessionId(),
    chatHistory: [],
    voiceInteractions: [],
    totalInteractions: 0,
    sessionType: 'personal',
  });

  const [savedSessions, setSavedSessions] = useState<SessionData[]>([]);

  // Load saved sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('scheme-sathi-sessions');
    if (stored) {
      try {
        const sessions = JSON.parse(stored).map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
          chatHistory: session.chatHistory.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSavedSessions(sessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever savedSessions changes
  useEffect(() => {
    localStorage.setItem('scheme-sathi-sessions', JSON.stringify(savedSessions));
  }, [savedSessions]);

  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const setCurrentSession = (session: Partial<SessionData>) => {
    setCurrentSessionState(session);
  };

  const updateUserDetails = (details: UserDetails) => {
    setCurrentSessionState(prev => ({
      ...prev,
      userDetails: details,
      sessionType: 'personal'
    }));
  };

  const addChatMessage = (message: Message) => {
    setCurrentSessionState(prev => ({
      ...prev,
      chatHistory: [...(prev.chatHistory || []), message],
      totalInteractions: (prev.totalInteractions || 0) + 1
    }));
  };

  const addVoiceInteraction = (interaction: string) => {
    setCurrentSessionState(prev => ({
      ...prev,
      voiceInteractions: [...(prev.voiceInteractions || []), interaction],
      totalInteractions: (prev.totalInteractions || 0) + 1
    }));
  };

  const saveCurrentSession = () => {
    const sessionToSave: SessionData = {
      id: currentSession.id || generateSessionId(),
      timestamp: new Date(),
      sessionType: currentSession.sessionType || 'personal',
      userDetails: currentSession.userDetails,
      chatHistory: currentSession.chatHistory || [],
      voiceInteractions: currentSession.voiceInteractions || [],
      totalInteractions: currentSession.totalInteractions || 0
    };

    setSavedSessions(prev => {
      // Remove existing session with same ID if it exists
      const filtered = prev.filter(session => session.id !== sessionToSave.id);
      return [sessionToSave, ...filtered].slice(0, 50); // Keep only last 50 sessions
    });

    // Clear current session after saving
    clearCurrentSession();
  };

  const loadSession = (sessionId: string) => {
    const session = savedSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionState({
        id: generateSessionId(), // Generate new ID for loaded session
        userDetails: session.userDetails,
        chatHistory: session.chatHistory,
        voiceInteractions: session.voiceInteractions,
        totalInteractions: session.totalInteractions,
        sessionType: session.sessionType
      });
    }
  };

  const deleteSession = (sessionId: string) => {
    setSavedSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  const clearCurrentSession = () => {
    setCurrentSessionState({
      id: generateSessionId(),
      chatHistory: [],
      voiceInteractions: [],
      totalInteractions: 0,
      sessionType: 'personal'
    });
  };

  return (
    <SessionContext.Provider value={{
      currentSession,
      setCurrentSession,
      updateUserDetails,
      addChatMessage,
      addVoiceInteraction,
      saveCurrentSession,
      savedSessions,
      loadSession,
      deleteSession,
      clearCurrentSession
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
