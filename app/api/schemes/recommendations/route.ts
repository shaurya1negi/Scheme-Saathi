import { NextRequest, NextResponse } from 'next/server'
import { createActionClient } from '../../../../lib/supabase-server'

/**
 * API endpoint for getting personalized scheme recommendations
 * This uses the user's profile data to suggest relevant schemes
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createActionClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile for recommendations
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Mock scheme recommendations based on user profile
    // In a real app, this would be more sophisticated AI/ML based matching
    const recommendations = generateSchemeRecommendations(profile)

    // Log the interaction
    await supabase
      .from('user_interactions')
      .insert([{
        user_id: user.id,
        interaction_type: 'scheme_search',
        interaction_data: { 
          action: 'get_recommendations',
          profile_data: {
            occupation: profile.occupation,
            income_range: profile.income_range,
            address: profile.address
          }
        }
      }])

    return NextResponse.json({
      success: true,
      recommendations
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate scheme recommendations based on user profile
 * This is a simplified version - in production you'd use AI/ML
 */
function generateSchemeRecommendations(profile: any) {
  const allSchemes = [
    {
      name: 'Pradhan Mantri Jan Dhan Yojana',
      category: 'Financial Inclusion',
      description: 'National mission for financial inclusion to ensure access to financial services',
      eligibility_score: 95,
      benefits: ['Zero balance bank account', 'RuPay Debit Card', 'Accident insurance coverage'],
      apply_url: 'https://pmjdy.gov.in/',
      department: 'Ministry of Finance'
    },
    {
      name: 'Ayushman Bharat - PMJAY',
      category: 'Healthcare',
      description: 'World\'s largest health insurance scheme providing coverage up to ₹5 lakh',
      eligibility_score: calculateHealthcareScore(profile),
      benefits: ['₹5 lakh annual health coverage', 'Cashless treatment', 'Pan-India portability'],
      apply_url: 'https://pmjay.gov.in/',
      department: 'Ministry of Health and Family Welfare'
    },
    {
      name: 'PM Kisan Samman Nidhi',
      category: 'Agriculture',
      description: 'Income support scheme for farmers providing ₹6000 per year',
      eligibility_score: calculateFarmerScore(profile),
      benefits: ['₹6000 per year in three installments', 'Direct bank transfer', 'No intermediaries'],
      apply_url: 'https://pmkisan.gov.in/',
      department: 'Ministry of Agriculture'
    },
    {
      name: 'Pradhan Mantri Mudra Yojana',
      category: 'Business',
      description: 'Micro-finance scheme for small businesses and entrepreneurs',
      eligibility_score: calculateBusinessScore(profile),
      benefits: ['Loans up to ₹10 lakh', 'No collateral required', 'Flexible repayment'],
      apply_url: 'https://mudra.org.in/',
      department: 'Ministry of Finance'
    },
    {
      name: 'National Scholarship Portal',
      category: 'Education',
      description: 'Centralized platform for various scholarship schemes',
      eligibility_score: calculateEducationScore(profile),
      benefits: ['Financial assistance for education', 'Merit and need-based scholarships', 'Direct transfer'],
      apply_url: 'https://scholarships.gov.in/',
      department: 'Ministry of Education'
    },
    {
      name: 'PM Awas Yojana',
      category: 'Housing',
      description: 'Affordable housing scheme for urban and rural areas',
      eligibility_score: calculateHousingScore(profile),
      benefits: ['Subsidized home loans', 'Financial assistance', 'Quality housing'],
      apply_url: 'https://pmaymis.gov.in/',
      department: 'Ministry of Housing and Urban Affairs'
    }
  ]

  // Sort by eligibility score and return top 5
  return allSchemes
    .sort((a, b) => b.eligibility_score - a.eligibility_score)
    .slice(0, 5)
    .map(scheme => ({
      ...scheme,
      recommended_reason: getRecommendationReason(scheme, profile)
    }))
}

function calculateHealthcareScore(profile: any): number {
  let score = 60 // Base score for everyone
  
  // Higher score for lower income ranges
  switch (profile.income_range) {
    case 'below-1lakh':
      score += 30
      break
    case '1-3lakh':
      score += 25
      break
    case '3-5lakh':
      score += 15
      break
    default:
      score += 5
  }
  
  return Math.min(score, 100)
}

function calculateFarmerScore(profile: any): number {
  let score = 20 // Low base score
  
  if (profile.occupation?.toLowerCase().includes('farm') || 
      profile.occupation?.toLowerCase().includes('agricult')) {
    score += 70
  }
  
  return Math.min(score, 100)
}

function calculateBusinessScore(profile: any): number {
  let score = 40 // Base score
  
  if (profile.occupation?.toLowerCase().includes('business') || 
      profile.occupation?.toLowerCase().includes('entrepreneur') ||
      profile.occupation?.toLowerCase().includes('self')) {
    score += 40
  }
  
  // Favor lower to middle income ranges
  switch (profile.income_range) {
    case 'below-1lakh':
    case '1-3lakh':
    case '3-5lakh':
      score += 15
      break
  }
  
  return Math.min(score, 100)
}

function calculateEducationScore(profile: any): number {
  let score = 50 // Base score
  
  if (profile.occupation?.toLowerCase().includes('student') || 
      profile.occupation?.toLowerCase().includes('teacher') ||
      profile.occupation?.toLowerCase().includes('education')) {
    score += 30
  }
  
  // Age-based scoring (younger people more likely to need education support)
  if (profile.date_of_birth) {
    const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
    if (age < 30) score += 20
    else if (age < 40) score += 10
  }
  
  return Math.min(score, 100)
}

function calculateHousingScore(profile: any): number {
  let score = 45 // Base score
  
  // Higher score for lower income ranges
  switch (profile.income_range) {
    case 'below-1lakh':
    case '1-3lakh':
    case '3-5lakh':
      score += 25
      break
    case '5-10lakh':
      score += 15
      break
  }
  
  return Math.min(score, 100)
}

function getRecommendationReason(scheme: any, profile: any): string {
  if (scheme.category === 'Healthcare') {
    return 'Recommended based on your income range for comprehensive health coverage'
  } else if (scheme.category === 'Agriculture' && profile.occupation?.toLowerCase().includes('farm')) {
    return 'Perfect match for your farming occupation'
  } else if (scheme.category === 'Business' && profile.occupation?.toLowerCase().includes('business')) {
    return 'Ideal for your business/entrepreneurial background'
  } else if (scheme.category === 'Education') {
    return 'Great opportunity for educational advancement and skill development'
  } else if (scheme.category === 'Housing') {
    return 'Excellent opportunity for affordable housing based on your profile'
  } else {
    return 'Highly recommended based on your profile and eligibility criteria'
  }
}
