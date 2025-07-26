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
  isSaved: boolean; // Track if session has been saved
  lastModified: Date; // Track when session was last modified
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
  createNewSession: () => void; // New function for creating new session
  isCurrentSessionModified: boolean; // Track if current session has unsaved changes
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [currentSession, setCurrentSessionState] = useState<Partial<SessionData>>({
    id: generateSessionId(),
    chatHistory: [],
    voiceInteractions: [],
    totalInteractions: 0,
    sessionType: 'personal',
    isSaved: false,
    lastModified: new Date(),
  });

  const [savedSessions, setSavedSessions] = useState<SessionData[]>([]);
  const [isCurrentSessionModified, setIsCurrentSessionModified] = useState(false);

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
      sessionType: 'personal',
      lastModified: new Date(),
    }));
    setIsCurrentSessionModified(true);
  };

  const addChatMessage = (message: Message) => {
    setCurrentSessionState(prev => ({
      ...prev,
      chatHistory: [...(prev.chatHistory || []), message],
      totalInteractions: (prev.totalInteractions || 0) + 1,
      lastModified: new Date(),
    }));
    setIsCurrentSessionModified(true);
  };

  const addVoiceInteraction = (interaction: string) => {
    setCurrentSessionState(prev => ({
      ...prev,
      voiceInteractions: [...(prev.voiceInteractions || []), interaction],
      totalInteractions: (prev.totalInteractions || 0) + 1,
      lastModified: new Date(),
    }));
    setIsCurrentSessionModified(true);
  };

  const saveCurrentSession = () => {
    const sessionToSave: SessionData = {
      id: currentSession.id || generateSessionId(),
      timestamp: currentSession.isSaved ? (currentSession.timestamp || new Date()) : new Date(),
      sessionType: currentSession.sessionType || 'personal',
      userDetails: currentSession.userDetails,
      chatHistory: currentSession.chatHistory || [],
      voiceInteractions: currentSession.voiceInteractions || [],
      totalInteractions: currentSession.totalInteractions || 0,
      isSaved: true,
      lastModified: new Date(),
    };

    setSavedSessions(prev => {
      // Check if session already exists and update it
      const existingIndex = prev.findIndex(session => session.id === sessionToSave.id);
      if (existingIndex !== -1) {
        // Update existing session
        const updated = [...prev];
        updated[existingIndex] = sessionToSave;
        return updated;
      } else {
        // Add new session
        return [sessionToSave, ...prev].slice(0, 50); // Keep only last 50 sessions
      }
    });

    // Mark current session as saved but don't clear it
    setCurrentSessionState(prev => ({
      ...prev,
      isSaved: true,
      timestamp: sessionToSave.timestamp,
    }));
    setIsCurrentSessionModified(false);
  };

  const loadSession = (sessionId: string) => {
    const session = savedSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionState({
        id: session.id, // Keep original ID to update the same session
        userDetails: session.userDetails,
        chatHistory: session.chatHistory,
        voiceInteractions: session.voiceInteractions,
        totalInteractions: session.totalInteractions,
        sessionType: session.sessionType,
        isSaved: true,
        timestamp: session.timestamp,
        lastModified: session.lastModified,
      });
      setIsCurrentSessionModified(false);
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
      sessionType: 'personal',
      isSaved: false,
      lastModified: new Date(),
    });
    setIsCurrentSessionModified(false);
  };

  const createNewSession = () => {
    // Auto-save current session if it has any meaningful content and isn't saved
    if ((currentSession.chatHistory?.length && currentSession.chatHistory.length > 1) || 
        currentSession.voiceInteractions?.length || 
        currentSession.userDetails) {
      if (!currentSession.isSaved && isCurrentSessionModified) {
        saveCurrentSession();
      }
    }
    
    // Create completely new session
    clearCurrentSession();
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
      clearCurrentSession,
      createNewSession,
      isCurrentSessionModified
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
