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

    console.log('Seeding sample data for user:', user.id);

    // Sample interactions to simulate user behavior
    const sampleInteractions = [
      {
        user_id: user.id,
        interaction_type: 'page_view',
        interaction_data: { page: 'home' },
        page_url: '/',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
      },
      {
        user_id: user.id,
        interaction_type: 'scheme_search',
        interaction_data: { query: 'agriculture', filters: { category: 'farming' } },
        page_url: '/',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        user_id: user.id,
        interaction_type: 'scheme_view',
        interaction_data: { schemeId: 'agri-001', schemeName: 'PM-KISAN' },
        page_url: '/schemes/agri-001',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
      },
      {
        user_id: user.id,
        interaction_type: 'chat_message',
        interaction_data: { message: 'Tell me about education schemes', response: 'Here are the education schemes...' },
        page_url: '/chat',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        user_id: user.id,
        interaction_type: 'document_upload',
        interaction_data: { documentType: 'aadhar', fileName: 'aadhar.pdf' },
        page_url: '/',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        user_id: user.id,
        interaction_type: 'scheme_bookmark',
        interaction_data: { schemeId: 'edu-001', schemeName: 'Scholarship Scheme', action: 'add' },
        page_url: '/schemes/edu-001',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        user_id: user.id,
        interaction_type: 'page_view',
        interaction_data: { page: 'applications' },
        page_url: '/applications',
        timestamp: new Date().toISOString() // now
      }
    ];

    // Insert sample interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .insert(sampleInteractions)
      .select();

    if (interactionsError) {
      console.error('Error inserting interactions:', interactionsError);
      return NextResponse.json({ error: 'Failed to seed interactions' }, { status: 500 });
    }

    // Sample applications
    const sampleApplications = [
      {
        user_id: user.id,
        scheme_name: 'PM-KISAN Samman Nidhi',
        scheme_category: 'Agriculture',
        application_status: 'approved',
        application_data: { farmer_id: 'F123456', land_area: '2.5 acres' },
        submitted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: user.id,
        scheme_name: 'Pradhan Mantri Awas Yojana',
        scheme_category: 'Housing',
        application_status: 'under_review',
        application_data: { income: '300000', family_size: 4 },
        submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: user.id,
        scheme_name: 'National Scholarship Portal',
        scheme_category: 'Education',
        application_status: 'submitted',
        application_data: { education_level: 'graduation', marks: '85%' },
        submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Insert sample applications
    const { data: applications, error: applicationsError } = await supabase
      .from('scheme_applications')
      .insert(sampleApplications)
      .select();

    if (applicationsError) {
      console.error('Error inserting applications:', applicationsError);
      return NextResponse.json({ error: 'Failed to seed applications' }, { status: 500 });
    }

    // Sample bookmarks
    const sampleBookmarks = [
      {
        user_id: user.id,
        scheme_name: 'Ayushman Bharat',
        scheme_category: 'Health',
        bookmarked: true,
        interaction_count: 3,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: user.id,
        scheme_name: 'Mudra Loan Scheme',
        scheme_category: 'Finance',
        bookmarked: true,
        interaction_count: 2,
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Insert sample bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('user_schemes')
      .insert(sampleBookmarks)
      .select();

    if (bookmarksError) {
      console.error('Error inserting bookmarks:', bookmarksError);
      return NextResponse.json({ error: 'Failed to seed bookmarks' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data seeded successfully',
      data: {
        interactions: interactions?.length || 0,
        applications: applications?.length || 0,
        bookmarks: bookmarks?.length || 0
      }
    });

  } catch (error) {
    console.error('Seed data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
