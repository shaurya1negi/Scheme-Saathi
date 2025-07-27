import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  relevance_score: number;
  scheme_type: string;
  eligibility: string[];
  benefits: string;
  deadline?: string;
}

interface SmartSearchResponse {
  success: boolean;
  results: SearchResult[];
  suggestions: string[];
  categories: string[];
  total_results: number;
  search_time: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const language = searchParams.get('lang') || 'en';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      }, { status: 400 });
    }

    // Get user context for personalized search
    const authHeader = request.headers.get('authorization');
    let userId = null;
    let userProfile = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          
          // Get user profile for personalized results
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          userProfile = profile;
        }
      } catch (error) {
        console.error('Auth error in search:', error);
      }
    }

    // Enhanced search with multiple strategies
    const searchResults = await performSmartSearch(
      query,
      language,
      category,
      userProfile,
      limit,
      offset
    );

    // Generate search suggestions
    const suggestions = await generateSearchSuggestions(query, language);

    // Get available categories
    const categories = await getSearchCategories(language);

    const searchTime = Date.now() - startTime;

    // Track search analytics
    if (userId) {
      await trackSearchAnalytics(userId, query, searchResults.length, searchTime);
    }

    const response: SmartSearchResponse = {
      success: true,
      results: searchResults,
      suggestions,
      categories,
      total_results: searchResults.length,
      search_time: searchTime
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Smart search error:', error);
    return NextResponse.json({
      success: false,
      error: 'Search service temporarily unavailable',
      results: [],
      suggestions: [],
      categories: [],
      total_results: 0,
      search_time: Date.now() - startTime
    }, { status: 500 });
  }
}

async function performSmartSearch(
  query: string,
  language: string,
  category: string | null,
  userProfile: any,
  limit: number,
  offset: number
): Promise<SearchResult[]> {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
  
  try {
    // Multi-strategy search query
    let searchQuery = supabase
      .from('government_schemes')
      .select(`
        id,
        title,
        description,
        category,
        scheme_type,
        eligibility,
        benefits,
        application_deadline,
        keywords,
        hindi_title,
        hindi_description
      `);

    // Build search conditions based on language
    const titleField = language === 'hi' ? 'hindi_title' : 'title';
    const descField = language === 'hi' ? 'hindi_description' : 'description';

    // Text search with ranking
    const textSearchConditions = searchTerms.map(term => {
      return `${titleField}.ilike.%${term}% OR ${descField}.ilike.%${term}% OR keywords.ilike.%${term}%`;
    }).join(' OR ');

    searchQuery = searchQuery.or(textSearchConditions);

    // Category filter
    if (category) {
      searchQuery = searchQuery.eq('category', category);
    }

    // Personalization based on user profile
    if (userProfile) {
      // Boost relevant categories based on user's demographics
      const relevantCategories = getRelevantCategories(userProfile);
      if (relevantCategories.length > 0) {
        searchQuery = searchQuery.or(
          relevantCategories.map(cat => `category.eq.${cat}`).join(',')
        );
      }
    }

    // Apply limit and offset
    searchQuery = searchQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: schemes, error } = await searchQuery;

    if (error) {
      console.error('Database search error:', error);
      return [];
    }

    if (!schemes) {
      return [];
    }

    // Calculate relevance scores and transform results
    const results: SearchResult[] = schemes.map(scheme => {
      const relevanceScore = calculateRelevanceScore(
        query,
        scheme,
        language,
        userProfile
      );

      return {
        id: scheme.id,
        title: language === 'hi' ? (scheme.hindi_title || scheme.title) : scheme.title,
        description: language === 'hi' ? (scheme.hindi_description || scheme.description) : scheme.description,
        category: scheme.category,
        relevance_score: relevanceScore,
        scheme_type: scheme.scheme_type,
        eligibility: Array.isArray(scheme.eligibility) ? scheme.eligibility : [scheme.eligibility],
        benefits: scheme.benefits,
        deadline: scheme.application_deadline
      };
    });

    // Sort by relevance score
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    return results;

  } catch (error) {
    console.error('Search execution error:', error);
    return [];
  }
}

function calculateRelevanceScore(
  query: string,
  scheme: any,
  language: string,
  userProfile: any
): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(' ').filter(term => term.length > 1);

  const title = language === 'hi' ? (scheme.hindi_title || scheme.title) : scheme.title;
  const description = language === 'hi' ? (scheme.hindi_description || scheme.description) : scheme.description;
  const keywords = scheme.keywords || '';

  // Title match (highest weight)
  if (title.toLowerCase().includes(queryLower)) {
    score += 100;
  }
  queryTerms.forEach(term => {
    if (title.toLowerCase().includes(term)) {
      score += 50;
    }
  });

  // Description match
  if (description.toLowerCase().includes(queryLower)) {
    score += 30;
  }
  queryTerms.forEach(term => {
    if (description.toLowerCase().includes(term)) {
      score += 15;
    }
  });

  // Keywords match
  if (keywords.toLowerCase().includes(queryLower)) {
    score += 40;
  }
  queryTerms.forEach(term => {
    if (keywords.toLowerCase().includes(term)) {
      score += 20;
    }
  });

  // Personalization boost
  if (userProfile) {
    // Age-based relevance
    if (userProfile.age) {
      if (userProfile.age >= 60 && (title.includes('senior') || title.includes('elderly') || title.includes('वृद्ध'))) {
        score += 25;
      }
      if (userProfile.age <= 35 && (title.includes('youth') || title.includes('young') || title.includes('युवा'))) {
        score += 25;
      }
    }

    // Gender-based relevance
    if (userProfile.gender === 'female' && (title.includes('women') || title.includes('mahila') || title.includes('महिला'))) {
      score += 25;
    }

    // Income-based relevance
    if (userProfile.annual_income && userProfile.annual_income < 200000) {
      if (title.includes('BPL') || title.includes('poor') || title.includes('गरीब')) {
        score += 30;
      }
    }

    // Occupation-based relevance
    if (userProfile.occupation === 'farmer' && scheme.category === 'Agriculture') {
      score += 40;
    }
  }

  // Recency boost
  const createdDate = new Date(scheme.created_at);
  const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated < 30) {
    score += 10;
  }

  return Math.min(score, 100); // Cap at 100
}

async function generateSearchSuggestions(query: string, language: string): Promise<string[]> {
  const suggestions = [];
  
  try {
    // Get popular search terms
    const { data: popularSearches } = await supabase
      .from('search_analytics')
      .select('query')
      .ilike('query', `%${query}%`)
      .neq('query', query)
      .order('search_count', { ascending: false })
      .limit(5);

    if (popularSearches) {
      suggestions.push(...popularSearches.map(s => s.query));
    }

    // Add contextual suggestions based on language
    const contextualSuggestions = language === 'hi' ? [
      'किसान योजना',
      'महिला योजना',
      'युवा योजना',
      'शिक्षा योजना',
      'स्वास्थ्य योजना'
    ] : [
      'farmer schemes',
      'women schemes',
      'youth schemes',
      'education schemes',
      'health schemes'
    ];

    const relevantSuggestions = contextualSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(query.toLowerCase()) && suggestion !== query
    );

    suggestions.push(...relevantSuggestions);

  } catch (error) {
    console.error('Error generating suggestions:', error);
  }

  return Array.from(new Set(suggestions)).slice(0, 5);
}

async function getSearchCategories(language: string): Promise<string[]> {
  try {
    const { data: categories } = await supabase
      .from('government_schemes')
      .select('category')
      .not('category', 'is', null);

    if (categories) {
      const uniqueCategories = Array.from(new Set(categories.map(c => c.category)));
      return uniqueCategories.slice(0, 10);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }

  // Fallback categories
  return language === 'hi' ? [
    'कृषि',
    'स्वास्थ्य',
    'शिक्षा',
    'महिला कल्याण',
    'युवा',
    'आवास'
  ] : [
    'Agriculture',
    'Healthcare',
    'Education',
    'Women Welfare',
    'Youth',
    'Housing'
  ];
}

function getRelevantCategories(userProfile: any): string[] {
  const categories = [];

  if (userProfile.occupation === 'farmer') {
    categories.push('Agriculture');
  }
  if (userProfile.gender === 'female') {
    categories.push('Women Welfare');
  }
  if (userProfile.age && userProfile.age <= 35) {
    categories.push('Youth', 'Education');
  }
  if (userProfile.age && userProfile.age >= 60) {
    categories.push('Senior Citizens', 'Healthcare');
  }
  if (userProfile.annual_income && userProfile.annual_income < 200000) {
    categories.push('BPL', 'Social Security');
  }

  return categories;
}

async function trackSearchAnalytics(
  userId: string,
  query: string,
  resultCount: number,
  searchTime: number
): Promise<void> {
  try {
    // Update or insert search analytics
    const { error } = await supabase
      .from('search_analytics')
      .upsert({
        query: query.toLowerCase(),
        search_count: 1,
        avg_result_count: resultCount,
        avg_search_time: searchTime,
        last_searched_at: new Date().toISOString()
      }, {
        onConflict: 'query',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Search analytics error:', error);
    }

    // Track user search history
    await supabase
      .from('user_search_history')
      .insert({
        user_id: userId,
        query,
        result_count: resultCount,
        search_time: searchTime,
        searched_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error tracking search analytics:', error);
  }
}
