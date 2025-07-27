import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    const userId = searchParams.get('userId');

    // Get current user - if no user, return demo data
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If we have a real authenticated user, fetch their real data
    if (user && !authError) {
      console.log('Fetching real analytics data for user:', user.id);
      
      try {
        // Calculate date range
        const now = new Date();
        const daysBack = timeframe === '30d' ? 30 : timeframe === '7d' ? 7 : 1;
        const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

        // Try to get real user interactions
        const { data: interactions, error: interactionsError } = await supabase
          .from('user_interactions')
          .select('interaction_type, timestamp, interaction_data')
          .eq('user_id', userId || user.id)
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: false });

        if (interactionsError) throw interactionsError;

        // Get application analytics
        const { data: applications, error: applicationsError } = await supabase
          .from('scheme_applications')
          .select('application_status, submitted_at, scheme_name, updated_at')
          .eq('user_id', userId || user.id)
          .gte('submitted_at', startDate.toISOString());

        if (applicationsError) throw applicationsError;

        // Get scheme bookmarks
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('user_schemes')
          .select('scheme_name, scheme_category, created_at, interaction_count')
          .eq('user_id', userId || user.id)
          .eq('bookmarked', true);

        if (bookmarksError) throw bookmarksError;

        // Process analytics data
        const analytics = {
          // Basic metrics
          totalInteractions: interactions?.length || 0,
          totalApplications: applications?.length || 0,
          totalBookmarks: bookmarks?.length || 0,
          
          // Interaction breakdown
          interactionsByType: interactions?.reduce((acc, item) => {
            acc[item.interaction_type] = (acc[item.interaction_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
          
          // Daily activity pattern
          dailyActivity: generateDailyActivity(interactions || [], startDate, now),
          
          // Application status distribution
          applicationStats: {
            total: applications?.length || 0,
            byStatus: applications?.reduce((acc, item) => {
              acc[item.application_status] = (acc[item.application_status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {},
            recentApplications: applications?.slice(0, 5) || []
          },
          
          // Popular scheme categories
          popularCategories: bookmarks?.reduce((acc, item) => {
            acc[item.scheme_category] = (acc[item.scheme_category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
          
          // User engagement metrics
          engagement: {
            avgInteractionsPerDay: Math.round((interactions?.length || 0) / daysBack),
            mostActiveHour: getMostActiveHour(interactions || []),
            streakDays: calculateStreakDays(interactions || []),
            completionRate: calculateCompletionRate(applications || [])
          },
          
          // Insights and recommendations
          insights: generateInsights(interactions || [], applications || [], bookmarks || []),
          
          timeframe,
          isDemo: false,
          generatedAt: new Date().toISOString()
        };

        return NextResponse.json(analytics);
      } catch (realDataError) {
        console.error('Error fetching real data, falling back to demo:', realDataError);
        // Fall back to demo data if real data fails
      }
    }

    // Return demo data for unauthenticated users or if real data fails
    console.log('Returning demo analytics data');
    return NextResponse.json(getDemoAnalyticsData());
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateDailyActivity(interactions: any[], startDate: Date, endDate: Date) {
  const dailyData = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayStr = current.toISOString().split('T')[0];
    const dayInteractions = interactions.filter(i => 
      i.timestamp.startsWith(dayStr)
    );
    
    dailyData.push({
      date: dayStr,
      interactions: dayInteractions.length,
      types: dayInteractions.reduce((acc, item) => {
        acc[item.interaction_type] = (acc[item.interaction_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return dailyData;
}

function getMostActiveHour(interactions: any[]) {
  const hourCounts = interactions.reduce((acc, item) => {
    const hour = new Date(item.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const entries = Object.entries(hourCounts)
    .sort(([,a], [,b]) => (Number(b) - Number(a)));
  
  return entries[0] ? Number(entries[0][0]) : 12;
}

function calculateStreakDays(interactions: any[]) {
  const daySet = new Set(
    interactions.map(i => i.timestamp.split('T')[0])
  );
  const uniqueDays = Array.from(daySet).sort();
  
  let currentStreak = 0;
  
  for (let i = uniqueDays.length - 1; i >= 0; i--) {
    const current = new Date(uniqueDays[i]);
    const expected = new Date();
    expected.setDate(expected.getDate() - currentStreak);
    
    if (current.toDateString() === expected.toDateString()) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  return currentStreak;
}

function calculateCompletionRate(applications: any[]) {
  if (applications.length === 0) return 0;
  
  const completed = applications.filter(app => 
    app.application_status === 'approved' || 
    app.application_status === 'rejected'
  ).length;
  
  return Math.round((completed / applications.length) * 100);
}

function generateInsights(interactions: any[], applications: any[], bookmarks: any[]) {
  const insights = [];
  
  // Activity insights
  if (interactions.length > 0) {
    const recentActivity = interactions.slice(0, 10);
    const uniqueTypes = new Set(recentActivity.map(i => i.interaction_type));
    
    if (uniqueTypes.size > 3) {
      insights.push({
        type: 'positive',
        title: 'Great Engagement!',
        message: `You're actively using ${uniqueTypes.size} different features. Keep exploring!`
      });
    }
  }
  
  // Application insights
  if (applications.length > 0) {
    const pendingApps = applications.filter(app => 
      app.application_status === 'submitted' || 
      app.application_status === 'under_review'
    ).length;
    
    if (pendingApps > 0) {
      insights.push({
        type: 'info',
        title: 'Applications in Progress',
        message: `You have ${pendingApps} applications being processed. We'll notify you of updates!`
      });
    }
  }
  
  // Recommendation insights
  if (bookmarks.length > 2) {
    insights.push({
      type: 'suggestion',
      title: 'Ready to Apply?',
      message: `You've bookmarked ${bookmarks.length} schemes. Consider applying to the ones that match your profile best!`
    });
  }
  
  return insights;
}

// Demo data function for when user is not authenticated
function getDemoAnalyticsData() {
  const now = new Date();
  const dailyActivity = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    interactions: Math.floor(Math.random() * 15) + 5,
    schemes_viewed: Math.floor(Math.random() * 8) + 2,
    applications: Math.floor(Math.random() * 3)
  }));

  const weeklyEngagement = [
    { day: 'Mon', page_views: 12, searches: 8, applications: 2 },
    { day: 'Tue', page_views: 15, searches: 6, applications: 1 },
    { day: 'Wed', page_views: 18, searches: 10, applications: 3 },
    { day: 'Thu', page_views: 14, searches: 7, applications: 1 },
    { day: 'Fri', page_views: 20, searches: 12, applications: 4 },
    { day: 'Sat', page_views: 8, searches: 4, applications: 0 },
    { day: 'Sun', page_views: 6, searches: 3, applications: 1 }
  ];

  const applicationStatus = [
    { status: 'approved', count: 5, percentage: 25 },
    { status: 'under_review', count: 8, percentage: 40 },
    { status: 'submitted', count: 4, percentage: 20 },
    { status: 'draft', count: 3, percentage: 15 }
  ];

  const interactionTypes = {
    page_view: 45,
    scheme_search: 25,
    chat_message: 12,
    document_upload: 8,
    profile_update: 5,
    voice_query: 5
  };

  const metrics = {
    totalInteractions: 85,
    averageDaily: 12.1,
    streakDays: 5,
    mostActiveDay: 'Friday',
    totalApplications: 12,
    successRate: 65
  };

  const insights = [
    {
      type: 'success',
      title: 'Great Progress!',
      message: 'You\'ve been consistently active for 5 days straight. Keep up the good work!'
    },
    {
      type: 'info',
      title: 'Applications in Progress',
      message: 'You have 8 applications being processed. We\'ll notify you of updates!'
    },
    {
      type: 'suggestion',
      title: 'Ready to Apply?',
      message: 'You\'ve bookmarked 6 schemes. Consider applying to the ones that match your profile best!'
    }
  ];

  return {
    totalInteractions: 85,
    totalApplications: 12,
    totalBookmarks: 6,
    interactionsByType: interactionTypes,
    dailyActivity,
    applicationStats: {
      total: 12,
      byStatus: {
        approved: 5,
        under_review: 8,
        submitted: 4,
        draft: 3
      },
      recentApplications: []
    },
    popularCategories: {
      'Housing': 3,
      'Agriculture': 2,
      'Health': 1
    },
    engagement: {
      avgInteractionsPerDay: 12.1,
      mostActiveHour: 14,
      streakDays: 5,
      completionRate: 65
    },
    insights,
    timeframe: '7d',
    isDemo: true
  };
}
