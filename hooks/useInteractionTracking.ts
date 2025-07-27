import { useAuth } from '../contexts/auth_context';
import { useCallback } from 'react';

type InteractionType = 
  | 'page_view'
  | 'scheme_search'
  | 'chat_message'
  | 'document_upload'
  | 'profile_update'
  | 'voice_query'
  | 'scheme_bookmark'
  | 'application_submit'
  | 'filter_apply'
  | 'scheme_view'
  | 'notification_read';

interface InteractionData {
  [key: string]: any;
}

export function useInteractionTracking() {
  const { user } = useAuth();

  const trackInteraction = useCallback(async (
    type: InteractionType,
    data?: InteractionData,
    pageUrl?: string
  ) => {
    // Only track for authenticated users
    if (!user) return;

    try {
      await fetch('/api/track-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interaction_type: type,
          interaction_data: data,
          page_url: pageUrl || window.location.pathname
        })
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }, [user]);

  // Helper functions for common interactions
  const trackPageView = useCallback((path?: string) => {
    trackInteraction('page_view', { path: path || window.location.pathname });
  }, [trackInteraction]);

  const trackSchemeSearch = useCallback((query: string, filters?: any) => {
    trackInteraction('scheme_search', { query, filters });
  }, [trackInteraction]);

  const trackSchemeView = useCallback((schemeId: string, schemeName: string) => {
    trackInteraction('scheme_view', { schemeId, schemeName });
  }, [trackInteraction]);

  const trackChatMessage = useCallback((message: string, response?: string) => {
    trackInteraction('chat_message', { message, response });
  }, [trackInteraction]);

  const trackDocumentUpload = useCallback((documentType: string, fileName: string) => {
    trackInteraction('document_upload', { documentType, fileName });
  }, [trackInteraction]);

  const trackSchemeBookmark = useCallback((schemeId: string, schemeName: string, action: 'add' | 'remove') => {
    trackInteraction('scheme_bookmark', { schemeId, schemeName, action });
  }, [trackInteraction]);

  const trackApplicationSubmit = useCallback((schemeId: string, schemeName: string) => {
    trackInteraction('application_submit', { schemeId, schemeName });
  }, [trackInteraction]);

  const trackVoiceQuery = useCallback((query: string, language: string) => {
    trackInteraction('voice_query', { query, language });
  }, [trackInteraction]);

  return {
    trackInteraction,
    trackPageView,
    trackSchemeSearch,
    trackSchemeView,
    trackChatMessage,
    trackDocumentUpload,
    trackSchemeBookmark,
    trackApplicationSubmit,
    trackVoiceQuery
  };
}
