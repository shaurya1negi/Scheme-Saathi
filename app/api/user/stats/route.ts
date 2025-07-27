import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UserStats {
  schemesViewed: number;
  applicationsSubmitted: number;
  successRate: number;
  timeInApp: string;
  favoriteCategories: string[];
  totalInteractions: number;
  avgSessionDuration: number;
  lastActiveDate: string;
  streakDays: number;
  achievementCount: number;
  recentActivity: Activity[];
  weeklyProgress: WeeklyProgress[];
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface WeeklyProgress {
  date: string;
  interactions: number;
  schemes_viewed: number;
  applications_submitted: number;
}

export async function GET() {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const userId = user.id;

    // Fetch comprehensive user statistics
    const stats = await fetchUserStats(userId);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user statistics',
      stats: getDefaultStats()
    }, { status: 500 });
  }
}

async function fetchUserStats(userId: string): Promise<UserStats> {
  try {
    // Parallel fetch of all user data
    const [
      userInteractions,
      schemeViews,
      applications,
      userSessions,
      recentActivity,
      weeklyData
    ] = await Promise.all([
      fetchUserInteractions(userId),
      fetchSchemeViews(userId),
      fetchUserApplications(userId),
      fetchUserSessions(userId),
      fetchRecentActivity(userId),
      fetchWeeklyProgress(userId)
    ]);

    // Calculate schemes viewed
    const schemesViewed = schemeViews.length;

    // Calculate applications submitted
    const applicationsSubmitted = applications.length;

    // Calculate success rate
    const approvedApplications = applications.filter(app => 
      app.application_status === 'approved' || app.application_status === 'completed'
    ).length;
    const successRate = applicationsSubmitted > 0 
      ? Math.round((approvedApplications / applicationsSubmitted) * 100)
      : 0;

    // Calculate total time in app
    const totalSessionTime = userSessions.reduce((total, session) => 
      total + (session.duration || 0), 0
    );
    const timeInApp = formatDuration(totalSessionTime);

    // Calculate favorite categories
    const favoriteCategories = calculateFavoriteCategories(schemeViews);

    // Calculate total interactions
    const totalInteractions = userInteractions.length;

    // Calculate average session duration
    const avgSessionDuration = userSessions.length > 0 
      ? totalSessionTime / userSessions.length 
      : 0;

    // Get last active date
    const lastActiveDate = userSessions.length > 0 
      ? userSessions[0].created_at 
      : new Date().toISOString();

    // Calculate streak days
    const streakDays = calculateStreakDays(userSessions);

    // Calculate achievements
    const achievementCount = calculateAchievements(
      schemesViewed,
      applicationsSubmitted,
      successRate,
      streakDays
    );

    return {
      schemesViewed,
      applicationsSubmitted,
      successRate,
      timeInApp,
      favoriteCategories,
      totalInteractions,
      avgSessionDuration,
      lastActiveDate,
      streakDays,
      achievementCount,
      recentActivity,
      weeklyProgress: weeklyData
    };

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return getDefaultStats();
  }
}

async function fetchUserInteractions(userId: string) {
  const { data, error } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching user interactions:', error);
    return [];
  }

  return data || [];
}

async function fetchSchemeViews(userId: string) {
  const { data, error } = await supabase
    .from('scheme_views')
    .select(`
      *,
      government_schemes (
        category,
        title,
        scheme_type
      )
    `)
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false });

  if (error) {
    console.error('Error fetching scheme views:', error);
    return [];
  }

  return data || [];
}

async function fetchUserApplications(userId: string) {
  const { data, error } = await supabase
    .from('user_applications')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching user applications:', error);
    return [];
  }

  return data || [];
}

async function fetchUserSessions(userId: string) {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30); // Last 30 sessions

  if (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }

  return data || [];
}

async function fetchRecentActivity(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('user_activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }

  return (data || []).map(activity => ({
    id: activity.id,
    type: activity.activity_type,
    description: activity.description,
    timestamp: activity.created_at,
    metadata: activity.metadata
  }));
}

async function fetchWeeklyProgress(userId: string): Promise<WeeklyProgress[]> {
  const { data, error } = await supabase
    .from('user_weekly_stats')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(8); // Last 8 weeks

  if (error) {
    console.error('Error fetching weekly progress:', error);
    return [];
  }

  return (data || []).map(week => ({
    date: week.week_start,
    interactions: week.total_interactions || 0,
    schemes_viewed: week.schemes_viewed || 0,
    applications_submitted: week.applications_submitted || 0
  }));
}

function calculateFavoriteCategories(schemeViews: any[]): string[] {
  const categoryCount: { [key: string]: number } = {};

  schemeViews.forEach(view => {
    const category = view.government_schemes?.category;
    if (category) {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  });

  return Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
}

function formatDuration(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '< 1m';
  }
}

function calculateStreakDays(sessions: any[]): number {
  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Group sessions by date
  const sessionDates = new Set(
    sessions.map(session => 
      new Date(session.created_at).toDateString()
    )
  );

  // Check consecutive days starting from today
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today.getTime() - (i * msPerDay));
    const dateString = checkDate.toDateString();
    
    if (sessionDates.has(dateString)) {
      streak++;
    } else if (i > 0) {
      // Break streak if gap found (except for today)
      break;
    }
  }

  return streak;
}

function calculateAchievements(
  schemesViewed: number,
  applicationsSubmitted: number,
  successRate: number,
  streakDays: number
): number {
  let achievements = 0;

  // Exploration achievements
  if (schemesViewed >= 10) achievements++;
  if (schemesViewed >= 50) achievements++;
  if (schemesViewed >= 100) achievements++;

  // Application achievements
  if (applicationsSubmitted >= 1) achievements++;
  if (applicationsSubmitted >= 5) achievements++;
  if (applicationsSubmitted >= 10) achievements++;

  // Success achievements
  if (successRate >= 50) achievements++;
  if (successRate >= 80) achievements++;
  if (successRate >= 100) achievements++;

  // Streak achievements
  if (streakDays >= 7) achievements++;
  if (streakDays >= 30) achievements++;
  if (streakDays >= 100) achievements++;

  return achievements;
}

function getDefaultStats(): UserStats {
  return {
    schemesViewed: 0,
    applicationsSubmitted: 0,
    successRate: 0,
    timeInApp: '0m',
    favoriteCategories: [],
    totalInteractions: 0,
    avgSessionDuration: 0,
    lastActiveDate: new Date().toISOString(),
    streakDays: 0,
    achievementCount: 0,
    recentActivity: [],
    weeklyProgress: []
  };
}
