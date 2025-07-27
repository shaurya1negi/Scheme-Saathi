import { NextRequest, NextResponse } from 'next/server';
import { createActionClient } from '../../../lib/supabase-server';

// Government scheme data for AI responses
const GOVERNMENT_SCHEMES = {
  agriculture: [
    {
      name: 'PM Kisan Samman Nidhi',
      eligibility: 'Small and marginal farmers',
      benefits: '₹6,000 per year in three installments',
      category: 'Agriculture',
      keywords: ['farmer', 'agriculture', 'kisan', 'farming']
    },
    {
      name: 'Pradhan Mantri Fasal Bima Yojana',
      eligibility: 'All farmers growing notified crops',
      benefits: 'Crop insurance coverage',
      category: 'Agriculture',
      keywords: ['crop insurance', 'fasal bima', 'agriculture insurance']
    }
  ],
  healthcare: [
    {
      name: 'Ayushman Bharat',
      eligibility: 'Families covered under SECC-2011',
      benefits: '₹5 lakh per family per year for secondary and tertiary healthcare',
      category: 'Healthcare',
      keywords: ['health', 'medical', 'insurance', 'ayushman']
    },
    {
      name: 'Pradhan Mantri Jan Aushadhi Yojana',
      eligibility: 'All citizens',
      benefits: 'Affordable generic medicines',
      category: 'Healthcare',
      keywords: ['medicine', 'generic', 'affordable', 'aushadhi']
    }
  ],
  housing: [
    {
      name: 'Pradhan Mantri Awas Yojana',
      eligibility: 'EWS/LIG/MIG families without pucca house',
      benefits: 'Interest subsidy on home loans',
      category: 'Housing',
      keywords: ['house', 'home', 'awas', 'housing']
    }
  ],
  education: [
    {
      name: 'Beti Bachao Beti Padhao',
      eligibility: 'Girl children',
      benefits: 'Educational support and awareness',
      category: 'Education',
      keywords: ['girl', 'education', 'beti', 'daughter']
    }
  ],
  employment: [
    {
      name: 'MGNREGA',
      eligibility: 'Rural households',
      benefits: '100 days of guaranteed wage employment',
      category: 'Employment',
      keywords: ['employment', 'job', 'work', 'mgnrega', 'rural']
    }
  ]
};

// AI-powered scheme matching function
function findRelevantSchemes(query: string, userProfile?: any): any[] {
  const normalizedQuery = query.toLowerCase();
  const allSchemes = Object.values(GOVERNMENT_SCHEMES).flat();
  
  const matchingSchemes = allSchemes.filter(scheme => {
    return scheme.keywords.some(keyword => 
      normalizedQuery.includes(keyword.toLowerCase())
    );
  });

  // If no direct matches, return schemes based on user profile
  if (matchingSchemes.length === 0 && userProfile) {
    if (userProfile.occupation === 'farmer') {
      return GOVERNMENT_SCHEMES.agriculture;
    }
    // Add more profile-based matching logic
  }

  return matchingSchemes.slice(0, 3); // Limit to 3 most relevant schemes
}

// Generate contextual AI response
function generateAIResponse(query: string, schemes: any[], language: string = 'en'): string {
  const greetings = ['hello', 'hi', 'namaste', 'hey'];
  const normalizedQuery = query.toLowerCase();

  // Handle greetings
  if (greetings.some(greeting => normalizedQuery.includes(greeting))) {
    return language === 'hi' 
      ? 'नमस्ते! मैं आपका स्कीम साथी हूं। मैं आपको सरकारी योजनाओं के बारे में जानकारी दे सकता हूं। आप मुझसे किसान योजना, स्वास्थ्य योजना, आवास योजना या शिक्षा योजना के बारे में पूछ सकते हैं।'
      : 'Hello! I am your Scheme Saathi. I can help you with information about government schemes. You can ask me about farmer schemes, health schemes, housing schemes, or education schemes.';
  }

  // If schemes found, provide detailed information
  if (schemes.length > 0) {
    let response = language === 'hi' 
      ? `आपके सवाल के लिए मुझे ${schemes.length} योजनाएं मिली हैं:\n\n`
      : `I found ${schemes.length} relevant schemes for your query:\n\n`;

    schemes.forEach((scheme, index) => {
      response += language === 'hi'
        ? `${index + 1}. **${scheme.name}**\n   पात्रता: ${scheme.eligibility}\n   लाभ: ${scheme.benefits}\n\n`
        : `${index + 1}. **${scheme.name}**\n   Eligibility: ${scheme.eligibility}\n   Benefits: ${scheme.benefits}\n\n`;
    });

    response += language === 'hi'
      ? 'क्या आप किसी खास योजना के बारे में और जानना चाहते हैं?'
      : 'Would you like to know more about any specific scheme?';

    return response;
  }

  // Default response for no matches
  return language === 'hi'
    ? 'मुझे खुशी होगी आपकी मदद करने में! कृपया बताएं कि आप किस प्रकार की योजना की तलाश कर रहे हैं - जैसे किसान योजना, स्वास्थ्य योजना, आवास योजना, या शिक्षा योजना?'
    : 'I would be happy to help you! Please tell me what type of scheme you are looking for - like farmer schemes, health schemes, housing schemes, or education schemes?';
}

// POST endpoint for chat messages
export async function POST(request: NextRequest) {
  try {
    const supabase = createActionClient();
    const { message, language = 'en', conversationId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user (optional for chat)
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

    // Find relevant schemes based on query
    const relevantSchemes = findRelevantSchemes(message, userProfile);
    
    // Generate AI response
    const aiResponse = generateAIResponse(message, relevantSchemes, language);

    // Log interaction if user is logged in
    if (user) {
      await supabase
        .from('user_interactions')
        .insert([{
          user_id: user.id,
          interaction_type: 'chat_message',
          interaction_data: {
            user_message: message,
            ai_response: aiResponse,
            schemes_suggested: relevantSchemes.length,
            conversation_id: conversationId,
            language
          }
        }]);
    }

    // Save schemes to user's recommendations if logged in
    if (user && relevantSchemes.length > 0) {
      const schemeInserts = relevantSchemes.map(scheme => ({
        user_id: user.id,
        scheme_name: scheme.name,
        scheme_category: scheme.category,
        eligibility_score: 85, // Default score, can be improved with ML
        bookmarked: false
      }));

      await supabase
        .from('user_schemes')
        .upsert(schemeInserts, { 
          onConflict: 'user_id,scheme_name',
          ignoreDuplicates: true 
        });
    }

    return NextResponse.json({
      response: aiResponse,
      schemes: relevantSchemes,
      conversationId: conversationId || `conv_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for chat history
export async function GET(request: NextRequest) {
  try {
    const supabase = createActionClient();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('interaction_type', 'chat_message')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (conversationId) {
      query = query.eq('interaction_data->conversation_id', conversationId);
    }

    const { data: chatHistory, error } = await query;

    if (error) {
      console.error('Chat history error:', error);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    return NextResponse.json({
      chatHistory: chatHistory || [],
      conversationId
    });

  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
