import { NextRequest, NextResponse } from 'next/server';
import { createActionClient } from '../../../../lib/supabase-server';

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = createActionClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get complete user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If no profile exists, create one
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || ''
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
        }

        return NextResponse.json({ profile: newProfile });
      }
      
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Log profile access
    await supabase
      .from('user_interactions')
      .insert([{
        user_id: user.id,
        interaction_type: 'profile_update',
        interaction_data: { action: 'profile_view' }
      }]);

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = createActionClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = await request.json();
    
    // Validate and sanitize input data
    const allowedFields = [
      'full_name', 'phone_number', 'date_of_birth', 'address', 
      'occupation', 'income_range', 'avatar_url'
    ];
    
    const sanitizedData: any = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        // Basic sanitization
        if (typeof updateData[key] === 'string') {
          sanitizedData[key] = updateData[key].trim().substring(0, 255);
        } else {
          sanitizedData[key] = updateData[key];
        }
      }
    });

    // Add updated timestamp
    sanitizedData.updated_at = new Date().toISOString();

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(sanitizedData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Log profile update
    await supabase
      .from('user_interactions')
      .insert([{
        user_id: user.id,
        interaction_type: 'profile_update',
        interaction_data: { 
          action: 'profile_update',
          updated_fields: Object.keys(sanitizedData)
        }
      }]);

    return NextResponse.json({ 
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete user profile (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createActionClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete by marking as deleted
    const { error: deleteError } = await supabase
      .from('users')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (deleteError) {
      console.error('Profile delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
    }

    // Log profile deletion
    await supabase
      .from('user_interactions')
      .insert([{
        user_id: user.id,
        interaction_type: 'profile_update',
        interaction_data: { action: 'profile_delete' }
      }]);

    return NextResponse.json({ message: 'Profile deleted successfully' });

  } catch (error) {
    console.error('Profile delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
