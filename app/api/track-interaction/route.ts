import { NextRequest, NextResponse } from 'next/server';
import { createActionClient } from '../../../lib/supabase-server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createActionClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interaction_type, interaction_data, page_url } = await request.json();

    // Track user interaction
    const { data, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        interaction_type,
        interaction_data: interaction_data || {},
        page_url,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking interaction:', error);
      return NextResponse.json({ error: 'Failed to track interaction' }, { status: 500 });
    }

    return NextResponse.json({ success: true, interaction: data });
  } catch (error) {
    console.error('Track interaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
