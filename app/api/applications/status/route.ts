import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Real-time application status tracking
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If no user is authenticated, return demo data for testing
    if (authError || !user) {
      console.log('No authenticated user, returning demo applications data');
      return NextResponse.json(getDemoApplicationsData());
    }

    if (applicationId) {
      // Get specific application status
      const { data: application, error } = await supabase
        .from('scheme_applications')
        .select('*')
        .eq('id', applicationId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return NextResponse.json({
        application,
        statusHistory: await getStatusHistory(supabase, applicationId),
        estimatedCompletion: calculateEstimatedCompletion(application),
        nextSteps: getNextSteps(application.application_status)
      });
    } else {
      // Get all user applications with real-time status
      const { data: applications, error } = await supabase
        .from('scheme_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const applicationsWithStatus = await Promise.all(
        applications.map(async (app) => ({
          ...app,
          statusHistory: await getStatusHistory(supabase, app.id),
          estimatedCompletion: calculateEstimatedCompletion(app),
          nextSteps: getNextSteps(app.application_status),
          progressPercentage: getProgressPercentage(app.application_status)
        }))
      );

      return NextResponse.json({
        applications: applicationsWithStatus,
        summary: {
          total: applications.length,
          pending: applications.filter(app => 
            app.application_status === 'submitted' || 
            app.application_status === 'under_review'
          ).length,
          approved: applications.filter(app => app.application_status === 'approved').length,
          rejected: applications.filter(app => app.application_status === 'rejected').length
        }
      });
    }
  } catch (error) {
    console.error('Application status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update application status (for admin/system use)
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { applicationId, newStatus, notes, estimatedDays } = await request.json();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update application status
    const { data: updatedApp, error: updateError } = await supabase
      .from('scheme_applications')
      .update({
        application_status: newStatus,
        updated_at: new Date().toISOString(),
        ...(notes && { notes }),
        ...(estimatedDays && { estimated_completion_days: estimatedDays })
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log status change
    await supabase
      .from('user_interactions')
      .insert([{
        user_id: updatedApp.user_id,
        interaction_type: 'application_status_change',
        interaction_data: {
          application_id: applicationId,
          old_status: 'previous_status', // You'd get this from the previous state
          new_status: newStatus,
          notes,
          timestamp: new Date().toISOString()
        }
      }]);

    // Send notification (you'd integrate with your notification system)
    await sendStatusUpdateNotification(updatedApp, newStatus);

    return NextResponse.json({
      success: true,
      application: updatedApp,
      message: `Application status updated to ${newStatus}`
    });

  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getStatusHistory(supabase: any, applicationId: string) {
  const { data, error } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('interaction_data->>application_id', applicationId)
    .eq('interaction_type', 'application_status_change')
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching status history:', error);
    return [];
  }

  return data || [];
}

function calculateEstimatedCompletion(application: any) {
  const statusTimelines = {
    'submitted': 2, // 2 days to move to under_review
    'under_review': 7, // 7 days to get a decision
    'document_verification': 3, // 3 days for document check
    'approved': 0, // Complete
    'rejected': 0 // Complete
  };

  const currentStatus = application.application_status;
  const estimatedDays = statusTimelines[currentStatus as keyof typeof statusTimelines] || 0;
  
  if (estimatedDays === 0) return null;

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
  
  return {
    days: estimatedDays,
    date: estimatedDate.toISOString(),
    displayDate: estimatedDate.toLocaleDateString()
  };
}

function getNextSteps(status: string) {
  const nextSteps = {
    'submitted': [
      'Your application is in the queue for initial review',
      'Documents are being verified for completeness',
      'You will be notified once review begins'
    ],
    'under_review': [
      'Application is being evaluated by concerned department',
      'Eligibility criteria are being checked',
      'Additional documents may be requested if needed'
    ],
    'document_verification': [
      'Submitted documents are being verified',
      'Cross-checking with government databases',
      'Final eligibility assessment in progress'
    ],
    'approved': [
      'Congratulations! Your application has been approved',
      'Benefits will be credited to your registered account',
      'You will receive official confirmation documents'
    ],
    'rejected': [
      'Application was not approved this time',
      'Check the rejection reason in your application details',
      'You may reapply after addressing the mentioned issues'
    ]
  };

  return nextSteps[status as keyof typeof nextSteps] || ['Status update in progress'];
}

function getProgressPercentage(status: string) {
  const progressMap = {
    'submitted': 25,
    'under_review': 50,
    'document_verification': 75,
    'approved': 100,
    'rejected': 100
  };

  return progressMap[status as keyof typeof progressMap] || 0;
}

async function sendStatusUpdateNotification(application: any, newStatus: string) {
  // This would integrate with your notification system
  // For now, we'll just log it
  console.log(`Sending notification for application ${application.id} - Status: ${newStatus}`);
  
  // You could call your email Edge Function here:
  // await supabase.functions.invoke('send-email', {
  //   body: {
  //     type: 'application_status',
  //     data: {
  //       scheme_name: application.scheme_name,
  //       status: newStatus,
  //       application_id: application.id
  //     }
  //   }
  // });
}

// Demo data function for when user is not authenticated
function getDemoApplicationsData() {
  const applications = [
    {
      id: 'demo-app-1',
      scheme_name: 'Pradhan Mantri Awas Yojana',
      application_status: 'under_review',
      submitted_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z',
      application_data: {
        documents_submitted: 4,
        verification_pending: 1
      },
      progress_percentage: 75,
      estimated_completion: '2024-02-15T00:00:00Z',
      next_steps: [
        'Document verification in progress',
        'Site inspection scheduled for next week',
        'Final approval pending'
      ]
    },
    {
      id: 'demo-app-2',
      scheme_name: 'PM Kisan Samman Nidhi',
      application_status: 'approved',
      submitted_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-25T16:20:00Z',
      application_data: {
        documents_submitted: 3,
        verification_complete: true
      },
      progress_percentage: 100,
      estimated_completion: null,
      next_steps: [
        'Benefits will be credited to your account',
        'First installment expected by end of month'
      ]
    },
    {
      id: 'demo-app-3',
      scheme_name: 'Ayushman Bharat Health Insurance',
      application_status: 'submitted',
      submitted_at: '2024-01-22T11:00:00Z',
      updated_at: '2024-01-22T11:00:00Z',
      application_data: {
        documents_submitted: 2,
        verification_pending: 2
      },
      progress_percentage: 25,
      estimated_completion: '2024-02-20T00:00:00Z',
      next_steps: [
        'Initial review in progress',
        'Document verification will begin soon',
        'Medical checkup may be required'
      ]
    },
    {
      id: 'demo-app-4',
      scheme_name: 'Skill Development Program',
      application_status: 'draft',
      submitted_at: null,
      updated_at: '2024-01-25T08:30:00Z',
      application_data: {
        documents_submitted: 1,
        completion_percentage: 40
      },
      progress_percentage: 40,
      estimated_completion: null,
      next_steps: [
        'Complete your application form',
        'Upload required documents',
        'Submit for review'
      ]
    }
  ];

  const statusHistory = {
    'demo-app-1': [
      {
        status: 'draft',
        timestamp: '2024-01-14T09:00:00Z',
        message: 'Application created'
      },
      {
        status: 'submitted',
        timestamp: '2024-01-15T10:30:00Z',
        message: 'Application submitted successfully'
      },
      {
        status: 'under_review',
        timestamp: '2024-01-18T14:15:00Z',
        message: 'Document verification started'
      }
    ]
  };

  const summary = {
    total_applications: 4,
    status_breakdown: {
      draft: 1,
      submitted: 1,
      under_review: 1,
      approved: 1,
      rejected: 0
    },
    recent_activity: [
      {
        application_id: 'demo-app-2',
        scheme_name: 'PM Kisan Samman Nidhi',
        action: 'approved',
        timestamp: '2024-01-25T16:20:00Z'
      },
      {
        application_id: 'demo-app-3',
        scheme_name: 'Ayushman Bharat Health Insurance',
        action: 'submitted',
        timestamp: '2024-01-22T11:00:00Z'
      }
    ]
  };

  return {
    applications,
    statusHistory,
    summary,
    isDemo: true
  };
}
