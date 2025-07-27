import { NextRequest, NextResponse } from 'next/server';
import { createActionClient } from '../../../../lib/supabase-server';

// Comprehensive scheme database
const COMPREHENSIVE_SCHEMES = {
  central: [
    {
      id: 'pm-kisan',
      name: 'PM Kisan Samman Nidhi',
      name_hi: 'प्रधानमंत्री किसान सम्मान निधि',
      category: 'Agriculture',
      subcategory: 'Financial Support',
      description: 'Direct income support to farmers',
      description_hi: 'किसानों को प्रत्यक्ष आय सहायता',
      benefits: '₹6,000 per year in three installments',
      benefits_hi: 'वर्ष में तीन किस्तों में ₹6,000',
      eligibility: {
        landholding: '<2 hectares',
        occupation: 'farmer',
        citizenship: 'indian',
        age_min: 18
      },
      documents_required: ['Aadhaar', 'Bank Account', 'Land Records'],
      application_process: 'Online at pmkisan.gov.in',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      launched_year: 2019,
      beneficiaries: '11 crore farmers',
      tags: ['farmer', 'agriculture', 'income', 'support', 'kisan'],
      active: true,
      priority_score: 95
    },
    {
      id: 'ayushman-bharat',
      name: 'Ayushman Bharat Yojana',
      name_hi: 'आयुष्मान भारत योजना',
      category: 'Healthcare',
      subcategory: 'Insurance',
      description: 'World\'s largest health insurance scheme',
      description_hi: 'दुनिया की सबसे बड़ी स्वास्थ्य बीमा योजना',
      benefits: '₹5 lakh per family per year healthcare coverage',
      benefits_hi: 'प्रति परिवार प्रति वर्ष ₹5 लाख का स्वास्थ्य कवरेज',
      eligibility: {
        income: 'BPL families',
        coverage: 'SECC-2011 database',
        family_size: 'any'
      },
      documents_required: ['Aadhaar', 'Ration Card', 'SECC Certificate'],
      application_process: 'Through CSC or hospital',
      ministry: 'Ministry of Health & Family Welfare',
      launched_year: 2018,
      beneficiaries: '50 crore people',
      tags: ['health', 'insurance', 'medical', 'healthcare', 'ayushman'],
      active: true,
      priority_score: 90
    },
    {
      id: 'pmay-g',
      name: 'Pradhan Mantri Awas Yojana - Gramin',
      name_hi: 'प्रधानमंत्री आवास योजना - ग्रामीण',
      category: 'Housing',
      subcategory: 'Rural Housing',
      description: 'Housing for rural poor',
      description_hi: 'ग्रामीण गरीबों के लिए आवास',
      benefits: '₹1.20 lakh assistance for plain areas, ₹1.30 lakh for hilly areas',
      benefits_hi: 'मैदानी क्षेत्रों के लिए ₹1.20 लाख, पहाड़ी क्षेत्रों के लिए ₹1.30 लाख सहायता',
      eligibility: {
        location: 'rural',
        housing_status: 'houseless or kutcha house',
        income: 'BPL/identified beneficiary'
      },
      documents_required: ['Aadhaar', 'Bank Account', 'BPL Certificate'],
      application_process: 'Through Gram Panchayat',
      ministry: 'Ministry of Rural Development',
      launched_year: 2016,
      beneficiaries: '2.28 crore houses completed',
      tags: ['housing', 'rural', 'awas', 'home', 'shelter'],
      active: true,
      priority_score: 85
    },
    {
      id: 'bbbp',
      name: 'Beti Bachao Beti Padhao',
      name_hi: 'बेटी बचाओ बेटी पढ़ाओ',
      category: 'Women & Child',
      subcategory: 'Girl Child Welfare',
      description: 'Scheme for girl child survival, protection and education',
      description_hi: 'बालिका जीवन रक्षा, सुरक्षा और शिक्षा योजना',
      benefits: 'Educational scholarships and awareness programs',
      benefits_hi: 'शैक्षिक छात्रवृत्ति और जागरूकता कार्यक्रम',
      eligibility: {
        gender: 'female',
        age_max: 18,
        education: 'school going'
      },
      documents_required: ['Birth Certificate', 'School Certificate', 'Bank Account'],
      application_process: 'Through schools and Anganwadi centers',
      ministry: 'Ministry of Women & Child Development',
      launched_year: 2015,
      beneficiaries: 'All girl children',
      tags: ['girl', 'education', 'women', 'child', 'beti'],
      active: true,
      priority_score: 80
    },
    {
      id: 'mgnrega',
      name: 'Mahatma Gandhi National Rural Employment Guarantee Act',
      name_hi: 'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम',
      category: 'Employment',
      subcategory: 'Rural Employment',
      description: '100 days guaranteed employment for rural households',
      description_hi: 'ग्रामीण परिवारों के लिए 100 दिन की गारंटीशुदा रोजगार',
      benefits: 'Minimum 100 days of wage employment per year',
      benefits_hi: 'प्रति वर्ष न्यूनतम 100 दिन का मजदूरी रोजगार',
      eligibility: {
        location: 'rural',
        age_min: 18,
        willingness: 'unskilled manual work'
      },
      documents_required: ['Aadhaar', 'Bank Account', 'Job Card'],
      application_process: 'Through Gram Panchayat',
      ministry: 'Ministry of Rural Development',
      launched_year: 2005,
      beneficiaries: '13.89 crore households',
      tags: ['employment', 'rural', 'job', 'work', 'mgnrega'],
      active: true,
      priority_score: 88
    }
  ]
};

// Advanced eligibility calculation
function calculateEligibilityScore(scheme: any, userProfile: any): number {
  if (!userProfile) return 50; // Default score for anonymous users

  let score = 0;
  let totalCriteria = 0;

  const eligibility = scheme.eligibility;

  // Check landholding criteria
  if (eligibility.landholding && userProfile.landholding) {
    totalCriteria++;
    const maxHectares = parseFloat(eligibility.landholding.replace('<', '').replace('>', ''));
    const userHectares = parseFloat(userProfile.landholding);
    
    if (eligibility.landholding.startsWith('<') && userHectares <= maxHectares) {
      score += 25;
    } else if (eligibility.landholding.startsWith('>') && userHectares >= maxHectares) {
      score += 25;
    }
  }

  // Check occupation
  if (eligibility.occupation && userProfile.occupation) {
    totalCriteria++;
    if (userProfile.occupation.toLowerCase().includes(eligibility.occupation.toLowerCase())) {
      score += 30;
    }
  }

  // Check location
  if (eligibility.location && userProfile.location_type) {
    totalCriteria++;
    if (userProfile.location_type.toLowerCase() === eligibility.location.toLowerCase()) {
      score += 20;
    }
  }

  // Check age criteria
  if (eligibility.age_min && userProfile.age) {
    totalCriteria++;
    if (parseInt(userProfile.age) >= eligibility.age_min) {
      score += 15;
    }
  }

  if (eligibility.age_max && userProfile.age) {
    totalCriteria++;
    if (parseInt(userProfile.age) <= eligibility.age_max) {
      score += 15;
    }
  }

  // Check gender
  if (eligibility.gender && userProfile.gender) {
    totalCriteria++;
    if (userProfile.gender.toLowerCase() === eligibility.gender.toLowerCase()) {
      score += 10;
    }
  }

  // Normalize score
  return totalCriteria > 0 ? Math.min(100, (score / totalCriteria) * 4) : 50;
}

// Search schemes with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createActionClient();
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, eligibility, priority
    const language = searchParams.get('language') || 'en';

    // Get user profile for personalized recommendations
    const { data: { user } } = await supabase.auth.getUser();
    let userProfile = null;

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      userProfile = profile;
    }

    let schemes = COMPREHENSIVE_SCHEMES.central.filter(scheme => scheme.active);

    // Filter by category
    if (category && category !== 'all') {
      schemes = schemes.filter(scheme => 
        scheme.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search in scheme content
    if (query) {
      const searchLower = query.toLowerCase();
      schemes = schemes.filter(scheme => {
        const searchableText = [
          scheme.name.toLowerCase(),
          scheme.name_hi || '',
          scheme.description.toLowerCase(),
          scheme.description_hi || '',
          ...scheme.tags,
          scheme.category.toLowerCase(),
          scheme.subcategory.toLowerCase()
        ].join(' ');

        return searchableText.includes(searchLower);
      });
    }

    // Calculate eligibility scores for each scheme
    const schemesWithScores = schemes.map(scheme => ({
      ...scheme,
      eligibility_score: calculateEligibilityScore(scheme, userProfile),
      localized_name: language === 'hi' ? scheme.name_hi || scheme.name : scheme.name,
      localized_description: language === 'hi' ? scheme.description_hi || scheme.description : scheme.description,
      localized_benefits: language === 'hi' ? scheme.benefits_hi || scheme.benefits : scheme.benefits
    }));

    // Sort schemes
    schemesWithScores.sort((a, b) => {
      switch (sortBy) {
        case 'eligibility':
          return b.eligibility_score - a.eligibility_score;
        case 'priority':
          return b.priority_score - a.priority_score;
        case 'relevance':
        default:
          // Combine relevance score (how well it matches search) with eligibility
          const aRelevance = query ? 
            (a.tags.some(tag => tag.includes(query.toLowerCase())) ? 10 : 0) : 0;
          const bRelevance = query ? 
            (b.tags.some(tag => tag.includes(query.toLowerCase())) ? 10 : 0) : 0;
          
          const aTotal = (aRelevance + a.eligibility_score + a.priority_score) / 3;
          const bTotal = (bRelevance + b.eligibility_score + b.priority_score) / 3;
          
          return bTotal - aTotal;
      }
    });

    // Limit results
    const limitedSchemes = schemesWithScores.slice(0, limit);

    // Log search interaction
    if (user && query) {
      await supabase
        .from('user_interactions')
        .insert([{
          user_id: user.id,
          interaction_type: 'scheme_search',
          interaction_data: {
            query,
            category,
            results_count: limitedSchemes.length,
            language,
            sort_by: sortBy
          }
        }]);
    }

    return NextResponse.json({
      schemes: limitedSchemes,
      total_count: schemesWithScores.length,
      query,
      category,
      user_profile: userProfile ? {
        occupation: userProfile.occupation,
        location_type: userProfile.address?.includes('rural') ? 'rural' : 'urban'
      } : null,
      search_metadata: {
        personalized: !!userProfile,
        language,
        sort_by: sortBy
      }
    });

  } catch (error) {
    console.error('Scheme search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint for saving search results or bookmarking schemes
export async function POST(request: NextRequest) {
  try {
    const supabase = createActionClient();
    const { action, scheme_id, schemes } = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'bookmark' && scheme_id) {
      // Find scheme details
      const scheme = COMPREHENSIVE_SCHEMES.central.find(s => s.id === scheme_id);
      
      if (!scheme) {
        return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
      }

      // Add to user schemes
      const { data, error } = await supabase
        .from('user_schemes')
        .upsert([{
          user_id: user.id,
          scheme_name: scheme.name,
          scheme_category: scheme.category,
          eligibility_score: 85, // Can be calculated
          bookmarked: true
        }], {
          onConflict: 'user_id,scheme_name'
        })
        .select();

      if (error) {
        console.error('Bookmark error:', error);
        return NextResponse.json({ error: 'Failed to bookmark scheme' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Scheme bookmarked successfully',
        bookmarked_scheme: data?.[0]
      });
    }

    if (action === 'save_search' && schemes) {
      // Save multiple schemes from search results
      const schemeInserts = schemes.map((scheme: any) => ({
        user_id: user.id,
        scheme_name: scheme.name,
        scheme_category: scheme.category,
        eligibility_score: scheme.eligibility_score || 50,
        bookmarked: false
      }));

      const { error } = await supabase
        .from('user_schemes')
        .upsert(schemeInserts, {
          onConflict: 'user_id,scheme_name',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Save search error:', error);
        return NextResponse.json({ error: 'Failed to save search results' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Search results saved' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Scheme search POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
