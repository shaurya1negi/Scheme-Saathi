import { NextRequest, NextResponse } from 'next/server';
import { createActionClient } from '../../../lib/supabase-server';

// Application status types
type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'documents_required';

// Comprehensive scheme application validation
const SCHEME_REQUIREMENTS = {
  'pradhan_mantri_kisan_samman_nidhi': {
    requiredDocuments: ['aadhaar_card', 'land_records', 'bank_account'],
    eligibilityCriteria: {
      profession: 'farmer',
      landOwnership: true,
      incomeLimit: null
    },
    processingDays: 30
  },
  'pradhan_mantri_awas_yojana': {
    requiredDocuments: ['aadhaar_card', 'income_certificate', 'caste_certificate', 'bank_account'],
    eligibilityCriteria: {
      incomeLimit: 300000, // Annual income limit
      housingStatus: 'homeless_or_kutcha',
      familySize: { min: 1, max: 10 }
    },
    processingDays: 45
  },
  'ayushman_bharat': {
    requiredDocuments: ['aadhaar_card', 'ration_card', 'income_certificate'],
    eligibilityCriteria: {
      incomeLimit: 500000,
      familyType: 'bpl_or_priority'
    },
    processingDays: 15
  },
  'pradhan_mantri_ujjwala_yojana': {
    requiredDocuments: ['aadhaar_card', 'bpl_card', 'bank_account'],
    eligibilityCriteria: {
      gender: 'female',
      economicStatus: 'bpl',
      existingConnection: false
    },
    processingDays: 21
  },
  'pradhan_mantri_mudra_yojana': {
    requiredDocuments: ['aadhaar_card', 'pan_card', 'business_plan', 'bank_account'],
    eligibilityCriteria: {
      loanAmount: { min: 10000, max: 1000000 },
      businessType: 'micro_enterprise',
      creditHistory: 'satisfactory'
    },
    processingDays: 30
  },
  'pradhan_mantri_fasal_bima_yojana': {
    requiredDocuments: ['aadhaar_card', 'land_records', 'crop_details', 'bank_account'],
    eligibilityCriteria: {
      profession: 'farmer',
      cropType: 'covered_crops',
      landArea: { min: 0.1, max: 50 } // In hectares
    },
    processingDays: 25
  }
};

// Validate application data
function validateApplicationData(schemeId: string, applicationData: any, userProfile: any) {
  const requirements = SCHEME_REQUIREMENTS[schemeId];
  if (!requirements) {
    return { isValid: false, errors: ['Invalid scheme selected'] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required documents
  const providedDocs = applicationData.documents || [];
  for (const requiredDoc of requirements.requiredDocuments) {
    if (!providedDocs.includes(requiredDoc)) {
      errors.push(`Missing required document: ${requiredDoc.replace('_', ' ')}`);
    }
  }

  // Check eligibility criteria
  const criteria = requirements.eligibilityCriteria;
  
  // Income limit check
  if (criteria.incomeLimit && userProfile.annual_income > criteria.incomeLimit) {
    errors.push(`Annual income exceeds limit of ₹${criteria.incomeLimit.toLocaleString()}`);
  }

  // Profession check
  if (criteria.profession && userProfile.profession !== criteria.profession) {
    errors.push(`This scheme is only for ${criteria.profession}s`);
  }

  // Gender check
  if (criteria.gender && userProfile.gender !== criteria.gender) {
    errors.push(`This scheme is only for ${criteria.gender} applicants`);
  }

  // Land ownership check
  if (criteria.landOwnership && !userProfile.land_ownership) {
    errors.push('Land ownership is required for this scheme');
  }

  // Business loan amount check
  if (criteria.loanAmount && applicationData.requestedAmount) {
    if (applicationData.requestedAmount < criteria.loanAmount.min) {
      errors.push(`Minimum loan amount is ₹${criteria.loanAmount.min.toLocaleString()}`);
    }
    if (applicationData.requestedAmount > criteria.loanAmount.max) {
      errors.push(`Maximum loan amount is ₹${criteria.loanAmount.max.toLocaleString()}`);
    }
  }

  // Family size check
  if (criteria.familySize && userProfile.family_size) {
    if (userProfile.family_size < criteria.familySize.min || 
        userProfile.family_size > criteria.familySize.max) {
      warnings.push(`Family size should be between ${criteria.familySize.min} and ${criteria.familySize.max} members`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    processingDays: requirements.processingDays
  };
}

// Generate application reference number
function generateApplicationReference(schemeId: string): string {
  const prefix = schemeId.substring(0, 4).toUpperCase();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

// Calculate application priority score
function calculateApplicationPriority(userProfile: any, schemeId: string): number {
  let priority = 0;

  // Income-based priority
  if (userProfile.annual_income < 100000) priority += 30;
  else if (userProfile.annual_income < 250000) priority += 20;
  else if (userProfile.annual_income < 500000) priority += 10;

  // Category-based priority
  if (userProfile.caste_category === 'sc' || userProfile.caste_category === 'st') priority += 25;
  else if (userProfile.caste_category === 'obc') priority += 15;

  // Gender-based priority for specific schemes
  if (userProfile.gender === 'female' && 
      ['pradhan_mantri_ujjwala_yojana', 'pradhan_mantri_awas_yojana'].includes(schemeId)) {
    priority += 15;
  }

  // Age-based priority
  if (userProfile.age > 60) priority += 10;
  else if (userProfile.age < 25) priority += 5;

  // Rural area priority
  if (userProfile.area_type === 'rural') priority += 10;

  return Math.min(priority, 100); // Cap at 100
}

export async function POST(request: NextRequest) {
  const supabase = createActionClient();
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      schemeId, 
      personalInfo, 
      documents, 
      additionalInfo, 
      requestedAmount,
      preferredLanguage = 'hindi'
    } = body;

    if (!schemeId) {
      return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ 
        error: 'User profile not found. Please complete your profile first.' 
      }, { status: 400 });
    }

    // Validate application data
    const validation = validateApplicationData(schemeId, {
      documents,
      requestedAmount,
      ...additionalInfo
    }, userProfile);

    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Application validation failed',
        validationErrors: validation.errors,
        warnings: validation.warnings
      }, { status: 400 });
    }

    // Check for existing applications
    const { data: existingApplications, error: existingError } = await supabase
      .from('scheme_applications')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheme_id', schemeId)
      .in('status', ['pending', 'under_review', 'approved']);

    if (existingError) {
      console.error('Database error checking existing applications:', existingError);
    }

    if (existingApplications && existingApplications.length > 0) {
      const activeApp = existingApplications[0];
      return NextResponse.json({
        error: 'Active application already exists',
        existingApplication: {
          applicationId: activeApp.application_reference_number,
          status: activeApp.status,
          submittedAt: activeApp.created_at
        }
      }, { status: 409 });
    }

    // Generate application reference
    const applicationReference = generateApplicationReference(schemeId);

    // Calculate priority
    const priority = calculateApplicationPriority(userProfile, schemeId);

    // Create application record
    const applicationData = {
      user_id: user.id,
      scheme_id: schemeId,
      application_reference_number: applicationReference,
      status: 'pending' as ApplicationStatus,
      priority_score: priority,
      personal_information: personalInfo || {
        full_name: userProfile.full_name,
        phone: userProfile.phone,
        email: userProfile.email,
        address: userProfile.address
      },
      documents_submitted: documents || [],
      additional_information: additionalInfo || {},
      requested_amount: requestedAmount || null,
      preferred_language: preferredLanguage,
      application_data: {
        validation_passed: true,
        validation_warnings: validation.warnings,
        user_profile_snapshot: userProfile,
        submission_ip: request.headers.get('x-forwarded-for') || 'unknown',
        submission_timestamp: new Date().toISOString()
      },
      expected_processing_days: validation.processingDays
    };

    const { data: newApplication, error: insertError } = await supabase
      .from('scheme_applications')
      .insert([applicationData])
      .select()
      .single();

    if (insertError) {
      console.error('Database error creating application:', insertError);
      return NextResponse.json({ 
        error: 'Failed to submit application', 
        details: insertError.message 
      }, { status: 500 });
    }

    // Log the interaction
    await supabase
      .from('user_interactions')
      .insert([{
        user_id: user.id,
        interaction_type: 'scheme_application',
        interaction_data: {
          scheme_id: schemeId,
          application_reference: applicationReference,
          priority_score: priority,
          documents_count: (documents || []).length,
          validation_warnings_count: validation.warnings.length,
          requested_amount: requestedAmount
        }
      }]);

    // Create notification
    await supabase
      .from('notifications')
      .insert([{
        user_id: user.id,
        title: preferredLanguage === 'english' ? 
          'Application Submitted Successfully' : 
          'आवेदन सफलतापूर्वक जमा किया गया',
        message: preferredLanguage === 'english' ? 
          `Your application for ${schemeId} has been submitted with reference number ${applicationReference}` :
          `आपका ${schemeId} के लिए आवेदन संदर्भ संख्या ${applicationReference} के साथ जमा किया गया है`,
        type: 'application_confirmation',
        data: {
          application_reference: applicationReference,
          scheme_id: schemeId,
          status: 'pending'
        }
      }]);

    return NextResponse.json({
      success: true,
      application: {
        referenceNumber: applicationReference,
        schemeId: schemeId,
        status: 'pending',
        priorityScore: priority,
        expectedProcessingDays: validation.processingDays,
        submittedAt: newApplication.created_at,
        validationWarnings: validation.warnings
      },
      message: preferredLanguage === 'english' ? 
        'Application submitted successfully' : 
        'आवेदन सफलतापूर्वक जमा किया गया'
    });

  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit application', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = createActionClient();
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schemeId = searchParams.get('schemeId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    let query = supabase
      .from('scheme_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (schemeId) {
      query = query.eq('scheme_id', schemeId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error: applicationsError } = await query;

    if (applicationsError) {
      console.error('Database error fetching applications:', applicationsError);
      return NextResponse.json({ 
        error: 'Failed to fetch applications', 
        details: applicationsError.message 
      }, { status: 500 });
    }

    // Get application statistics
    const { data: stats, error: statsError } = await supabase
      .from('scheme_applications')
      .select('status')
      .eq('user_id', user.id);

    const statistics = {
      total: stats?.length || 0,
      pending: stats?.filter(app => app.status === 'pending').length || 0,
      approved: stats?.filter(app => app.status === 'approved').length || 0,
      rejected: stats?.filter(app => app.status === 'rejected').length || 0,
      under_review: stats?.filter(app => app.status === 'under_review').length || 0
    };

    return NextResponse.json({
      success: true,
      applications: applications || [],
      statistics,
      availableSchemes: Object.keys(SCHEME_REQUIREMENTS),
      message: 'Applications retrieved successfully'
    });

  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch applications', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
