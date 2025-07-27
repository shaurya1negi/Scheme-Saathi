import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type'); // 'all', 'unread', 'deadline', 'update'

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);

    // Filter by type
    if (type && type !== 'all') {
      if (type === 'unread') {
        query = query.eq('read', false);
      } else {
        query = query.eq('notification_type', type);
      }
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      page,
      hasMore: notifications && notifications.length === limit
    });

  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark notifications as read
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { notificationIds, markAllRead } = await request.json();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (markAllRead) {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('id', notificationIds)
        .eq('user_id', user.id);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create notification (for system use)
export async function PUT(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { 
      userId, 
      type, 
      title, 
      message, 
      actionUrl, 
      priority = 'medium',
      scheduledFor 
    } = await request.json();

    const notification = {
      user_id: userId,
      notification_type: type,
      title,
      message,
      action_url: actionUrl,
      priority,
      scheduled_for: scheduledFor || new Date().toISOString(),
      created_at: new Date().toISOString(),
      read: false
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (error) throw error;

    // Send real-time notification if it's immediate
    if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
      await sendRealtimeNotification(userId, notification);
    }

    return NextResponse.json({ success: true, notification: data });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendRealtimeNotification(userId: string, notification: any) {
  // This would integrate with your real-time notification system
  // For example, using Supabase Realtime, WebSockets, or push notifications
  console.log(`Sending real-time notification to user ${userId}:`, notification);
}
