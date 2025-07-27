import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AnalyticsEvent {
  action: string;
  context: any;
  timestamp: string;
  userId: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, context, timestamp, userId } = body;

    if (!action || !timestamp) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Extract additional context
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Create analytics event
    const analyticsEvent: AnalyticsEvent = {
      action,
      context: context || {},
      timestamp,
      userId: userId || 'anonymous',
      userAgent,
      ipAddress
    };

    // Track the event
    await trackAnalyticsEvent(analyticsEvent);

    // Update user interaction counter
    if (userId && userId !== 'anonymous') {
      await updateUserInteractionStats(userId, action, context);
    }

    // Track feature usage
    await trackFeatureUsage(action, userId);

    return NextResponse.json({
      success: true,
      message: 'Analytics event tracked successfully'
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to track analytics event'
    }, { status: 500 });
  }
}

async function trackAnalyticsEvent(event: AnalyticsEvent) {
  try {
    // Store raw analytics event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        action: event.action,
        context: event.context,
        user_id: event.userId === 'anonymous' ? null : event.userId,
        timestamp: event.timestamp,
        user_agent: event.userAgent,
        ip_address: event.ipAddress,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing analytics event:', error);
    }

  } catch (error) {
    console.error('Error in trackAnalyticsEvent:', error);
  }
}

async function updateUserInteractionStats(userId: string, action: string, context: any) {
  try {
    // Update user_interactions table
    await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        interaction_type: action,
        details: context,
        created_at: new Date().toISOString()
      });

    // Update user session activity
    await updateSessionActivity(userId, action);

    // Update specific counters based on action type
    await updateSpecificCounters(userId, action, context);

  } catch (error) {
    console.error('Error updating user interaction stats:', error);
  }
}

async function updateSessionActivity(userId: string, action: string) {
  try {
    // Get or create current session
    const sessionId = await getCurrentSessionId(userId);
    
    if (sessionId) {
      // Update session with latest activity
      const { data: currentSession } = await supabase
        .from('user_sessions')
        .select('interaction_count')
        .eq('id', sessionId)
        .single();

      const newCount = (currentSession?.interaction_count || 0) + 1;

      await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          interaction_count: newCount
        })
        .eq('id', sessionId);
    }

  } catch (error) {
    console.error('Error updating session activity:', error);
  }
}

async function getCurrentSessionId(userId: string): Promise<string | null> {
  try {
    // Look for active session within last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: session } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('last_activity', thirtyMinutesAgo)
      .order('last_activity', { ascending: false })
      .limit(1)
      .single();

    if (session) {
      return session.id;
    } else {
      // Create new session
      const { data: newSession } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          interaction_count: 1
        })
        .select('id')
        .single();

      return newSession?.id || null;
    }

  } catch (error) {
    console.error('Error managing session:', error);
    return null;
  }
}

async function updateSpecificCounters(userId: string, action: string, context: any) {
  try {
    switch (action) {
      case 'scheme_viewed':
        await trackSchemeView(userId, context.schemeId);
        break;
      
      case 'application_started':
        await trackApplicationStart(userId, context.schemeId);
        break;
      
      case 'chat_message_sent':
        await trackChatInteraction(userId, context);
        break;
      
      case 'voice_session_started':
        await trackVoiceInteraction(userId, context);
        break;
      
      case 'ocr_document_processed':
        await trackOCRUsage(userId, context);
        break;
      
      case 'search_performed':
        await trackSearchUsage(userId, context);
        break;
    }

  } catch (error) {
    console.error('Error updating specific counters:', error);
  }
}

async function trackSchemeView(userId: string, schemeId: string) {
  if (!schemeId) return;

  try {
    await supabase
      .from('scheme_views')
      .insert({
        user_id: userId,
        scheme_id: schemeId,
        viewed_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error tracking scheme view:', error);
  }
}

async function trackApplicationStart(userId: string, schemeId: string) {
  if (!schemeId) return;

  try {
    await supabase
      .from('application_tracking')
      .insert({
        user_id: userId,
        scheme_id: schemeId,
        status: 'started',
        started_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error tracking application start:', error);
  }
}

async function trackChatInteraction(userId: string, context: any) {
  try {
    await supabase
      .from('chat_analytics')
      .insert({
        user_id: userId,
        message_type: context.messageType,
        response_time: context.responseTime,
        satisfaction_rating: context.rating,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error tracking chat interaction:', error);
  }
}

async function trackVoiceInteraction(userId: string, context: any) {
  try {
    await supabase
      .from('voice_analytics')
      .insert({
        user_id: userId,
        session_duration: context.duration,
        language_used: context.language,
        voice_quality_score: context.qualityScore,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error tracking voice interaction:', error);
  }
}

async function trackOCRUsage(userId: string, context: any) {
  try {
    await supabase
      .from('ocr_analytics')
      .insert({
        user_id: userId,
        document_type: context.documentType,
        processing_time: context.processingTime,
        accuracy_score: context.accuracyScore,
        extracted_fields_count: context.fieldsCount,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error tracking OCR usage:', error);
  }
}

async function trackSearchUsage(userId: string, context: any) {
  try {
    await supabase
      .from('search_analytics')
      .upsert({
        query: context.query?.toLowerCase(),
        search_count: 1,
        user_id: userId,
        result_count: context.resultCount,
        search_time: context.searchTime,
        last_searched_at: new Date().toISOString()
      }, {
        onConflict: 'query,user_id',
        ignoreDuplicates: false
      });

  } catch (error) {
    console.error('Error tracking search usage:', error);
  }
}

async function trackFeatureUsage(action: string, userId: string) {
  try {
    // Update feature usage statistics
    const feature = mapActionToFeature(action);
    if (!feature) return;

    await supabase
      .from('feature_usage_stats')
      .upsert({
        feature_name: feature,
        usage_count: 1,
        unique_users: userId !== 'anonymous' ? [userId] : [],
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'feature_name',
        ignoreDuplicates: false
      });

  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
}

function mapActionToFeature(action: string): string | null {
  const featureMap: { [key: string]: string } = {
    'upload_modal_opened': 'profile_upload',
    'chat_opened': 'text_chat',
    'voice_opened': 'voice_assistant',
    'ocr_opened': 'document_ocr',
    'notifications_opened': 'notifications',
    'applications_opened': 'application_tracker',
    'scheme_viewed': 'scheme_discovery',
    'search_performed': 'smart_search'
  };

  return featureMap[action] || null;
}

// GET endpoint for analytics dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const feature = searchParams.get('feature');

    // Get analytics summary
    const summary = await getAnalyticsSummary(period, feature);

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data'
    }, { status: 500 });
  }
}

async function getAnalyticsSummary(period: string, feature?: string | null) {
  try {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 1;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get general analytics
    const { data: events } = await supabase
      .from('analytics_events')
      .select('action, created_at, user_id')
      .gte('created_at', startDate);

    // Get feature usage stats
    const { data: featureStats } = await supabase
      .from('feature_usage_stats')
      .select('*')
      .gte('last_used_at', startDate);

    // Calculate metrics
    const totalEvents = events?.length || 0;
    const uniqueUsers = new Set(events?.map(e => e.user_id).filter(Boolean)).size;
    const topActions = calculateTopActions(events || []);

    return {
      totalEvents,
      uniqueUsers,
      topActions,
      featureStats: featureStats || [],
      period
    };

  } catch (error) {
    console.error('Error getting analytics summary:', error);
    return {
      totalEvents: 0,
      uniqueUsers: 0,
      topActions: [],
      featureStats: [],
      period
    };
  }
}

function calculateTopActions(events: any[]): { action: string; count: number }[] {
  const actionCounts: { [key: string]: number } = {};
  
  events.forEach(event => {
    actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
  });

  return Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
