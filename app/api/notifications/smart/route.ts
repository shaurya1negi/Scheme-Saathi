import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Smart notification generation system
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { type, userId } = await request.json();

    switch (type) {
      case 'deadline_alerts':
        return await generateDeadlineAlerts(supabase, userId);
      
      case 'personalized_recommendations':
        return await generatePersonalizedRecommendations(supabase, userId);
      
      case 'application_updates':
        return await generateApplicationUpdates(supabase, userId);
      
      case 'scheme_matches':
        return await generateSchemeMatches(supabase, userId);
      
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Smart notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateDeadlineAlerts(supabase: any, userId?: string) {
  // Mock scheme deadlines - in production, this would come from a government schemes API
  const upcomingDeadlines = [
    {
      scheme: 'PM Kisan Samman Nidhi',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      category: 'Agriculture',
      eligibilityMatch: 85
    },
    {
      scheme: 'Pradhan Mantri Awas Yojana',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      category: 'Housing',
      eligibilityMatch: 92
    },
    {
      scheme: 'Start-up India Scheme',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      category: 'Business',
      eligibilityMatch: 78
    }
  ];

  const notifications = [];

  // Generate notifications for high-match schemes with approaching deadlines
  for (const scheme of upcomingDeadlines) {
    if (scheme.eligibilityMatch > 80) {
      const daysLeft = Math.ceil((scheme.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      let priority = 'medium';
      let urgencyText = '';
      
      if (daysLeft <= 3) {
        priority = 'high';
        urgencyText = '⚠️ URGENT: ';
      } else if (daysLeft <= 7) {
        priority = 'medium';
        urgencyText = '📅 REMINDER: ';
      }

      notifications.push({
        user_id: userId,
        notification_type: 'deadline',
        title: `${urgencyText}${scheme.scheme} Deadline Approaching`,
        message: `Only ${daysLeft} days left to apply for ${scheme.scheme}. You have ${scheme.eligibilityMatch}% eligibility match!`,
        action_url: `/schemes/${scheme.scheme.toLowerCase().replace(/\s+/g, '-')}`,
        priority,
        metadata: {
          scheme_name: scheme.scheme,
          days_left: daysLeft,
          eligibility_match: scheme.eligibilityMatch,
          category: scheme.category,
          deadline: scheme.deadline.toISOString()
        }
      });
    }
  }

  // Insert notifications
  if (notifications.length > 0) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Generated ${notifications.length} deadline alerts`,
      notifications: data
    });
  }

  return NextResponse.json({
    success: true,
    message: 'No deadline alerts to generate',
    notifications: []
  });
}

async function generatePersonalizedRecommendations(supabase: any, userId: string) {
  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // Get user's recent activity
  const { data: recentActivity, error: activityError } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (activityError) throw activityError;

  // Generate AI-powered recommendations based on profile and activity
  const recommendations = await generateAIRecommendations(userProfile, recentActivity || []);

  const notifications = recommendations.map(rec => ({
    user_id: userId,
    notification_type: 'recommendation',
    title: `New Scheme Recommendation: ${rec.scheme_name}`,
    message: `Based on your ${rec.match_reason}, you might be interested in ${rec.scheme_name}. ${rec.eligibility_score}% match!`,
    action_url: `/schemes/${rec.scheme_name.toLowerCase().replace(/\s+/g, '-')}`,
    priority: rec.eligibility_score > 90 ? 'high' : 'medium',
    metadata: {
      scheme_name: rec.scheme_name,
      eligibility_score: rec.eligibility_score,
      match_reason: rec.match_reason,
      category: rec.category
    }
  }));

  if (notifications.length > 0) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Generated ${notifications.length} personalized recommendations`,
      notifications: data
    });
  }

  return NextResponse.json({
    success: true,
    message: 'No new recommendations to generate',
    notifications: []
  });
}

async function generateApplicationUpdates(supabase: any, userId: string) {
  // Get user's pending applications
  const { data: applications, error } = await supabase
    .from('scheme_applications')
    .select('*')
    .eq('user_id', userId)
    .in('application_status', ['submitted', 'under_review', 'document_verification']);

  if (error) throw error;

  const notifications = [];

  for (const app of applications || []) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send updates for applications that haven't been updated in a while
    if (daysSinceUpdate >= 7) {
      notifications.push({
        user_id: userId,
        notification_type: 'update',
        title: `Update on ${app.scheme_name} Application`,
        message: `Your application for ${app.scheme_name} is still ${app.application_status.replace('_', ' ')}. We'll notify you of any changes.`,
        action_url: `/applications/${app.id}`,
        priority: 'low',
        metadata: {
          application_id: app.id,
          scheme_name: app.scheme_name,
          status: app.application_status,
          days_since_update: daysSinceUpdate
        }
      });
    }
  }

  if (notifications.length > 0) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Generated ${notifications.length} application updates`,
      notifications: data
    });
  }

  return NextResponse.json({
    success: true,
    message: 'No application updates to generate',
    notifications: []
  });
}

async function generateSchemeMatches(supabase: any, userId: string) {
  // This would integrate with the AI matching engine
  // For now, we'll create mock intelligent matches
  
  const matches = [
    {
      scheme_name: 'Digital India Land Records Modernization',
      match_score: 89,
      match_reason: 'recent interest in digital services',
      benefits: ['Digitized land records', 'Online verification', 'Reduced paperwork'],
      category: 'Digital Services'
    },
    {
      scheme_name: 'Pradhan Mantri Mudra Yojana',
      match_score: 94,
      match_reason: 'small business profile match',
      benefits: ['Collateral-free loans', 'Easy application process', 'Business growth support'],
      category: 'Finance'
    }
  ];

  const notifications = matches
    .filter(match => match.match_score > 85)
    .map(match => ({
      user_id: userId,
      notification_type: 'scheme_match',
      title: `🎯 Perfect Match: ${match.scheme_name}`,
      message: `${match.match_score}% match based on your ${match.match_reason}. Key benefits: ${match.benefits.slice(0, 2).join(', ')}.`,
      action_url: `/schemes/${match.scheme_name.toLowerCase().replace(/\s+/g, '-')}`,
      priority: match.match_score > 90 ? 'high' : 'medium',
      metadata: {
        scheme_name: match.scheme_name,
        match_score: match.match_score,
        match_reason: match.match_reason,
        benefits: match.benefits,
        category: match.category
      }
    }));

  if (notifications.length > 0) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Generated ${notifications.length} scheme matches`,
      notifications: data
    });
  }

  return NextResponse.json({
    success: true,
    message: 'No new scheme matches to generate',
    notifications: []
  });
}

async function generateAIRecommendations(userProfile: any, recentActivity: any[]) {
  // Mock AI recommendation engine
  // In production, this would use machine learning algorithms
  
  const recommendations = [];
  
  // Based on occupation
  if (userProfile.occupation?.toLowerCase().includes('farmer')) {
    recommendations.push({
      scheme_name: 'Kisan Credit Card Scheme',
      eligibility_score: 93,
      match_reason: 'farmer occupation',
      category: 'Agriculture'
    });
  }
  
  // Based on recent activity
  const hasSearchedEducation = recentActivity.some(activity => 
    activity.interaction_data && 
    JSON.stringify(activity.interaction_data).toLowerCase().includes('education')
  );
  
  if (hasSearchedEducation) {
    recommendations.push({
      scheme_name: 'National Scholarship Portal',
      eligibility_score: 87,
      match_reason: 'recent education-related searches',
      category: 'Education'
    });
  }
  
  // Based on age and profile
  if (userProfile.age && userProfile.age < 35) {
    recommendations.push({
      scheme_name: 'Pradhan Mantri Mudra Yojana',
      eligibility_score: 85,
      match_reason: 'young entrepreneur profile',
      category: 'Business'
    });
  }
  
  return recommendations;
}
