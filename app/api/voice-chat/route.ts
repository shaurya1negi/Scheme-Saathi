import { NextRequest, NextResponse } from 'next/server';
import { createActionClient } from '../../../lib/supabase-server';

// Type definitions
interface SchemeData {
  name: string;
  description: string;
  benefits: string;
  eligibility: string;
  documents: string[];
  keywords: string[];
}

interface SchemeWithScore extends SchemeData {
  schemeId: string;
  relevanceScore: number;
}

// Voice processing configuration
const VOICE_CONFIG = {
  supportedFormats: ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm'],
  maxFileSize: 25 * 1024 * 1024, // 25MB
  maxDuration: 300, // 5 minutes in seconds
  sampleRate: 16000,
  channels: 1
};

// Enhanced government schemes database for voice queries
const VOICE_SCHEMES_DATABASE: Record<string, Record<string, SchemeData>> = {
  hindi: {
    // Central Government Schemes
    'pradhan_mantri_kisan_samman_nidhi': {
      name: 'प्रधानमंत्री किसान सम्मान निधि योजना',
      description: 'किसानों को वित्तीय सहायता प्रदान करने वाली योजना',
      benefits: '₹6000 प्रति वर्ष तीन किश्तों में',
      eligibility: 'सभी भूमिधारी किसान परिवार',
      documents: ['आधार कार्ड', 'भूमि रिकॉर्ड', 'बैंक खाता'],
      keywords: ['किसान', 'खेती', 'कृषि', 'पैसा', 'सहायता']
    },
    'pradhan_mantri_awas_yojana': {
      name: 'प्रधानमंत्री आवास योजना',
      description: 'गरीब परिवारों के लिए घर बनाने की योजना',
      benefits: '₹1.2 लाख से ₹2.5 लाख तक की सहायता',
      eligibility: 'BPL परिवार, महिला मुखिया, SC/ST/OBC',
      documents: ['आधार कार्ड', 'आय प्रमाण पत्र', 'जाति प्रमाण पत्र'],
      keywords: ['घर', 'मकान', 'आवास', 'निर्माण', 'गरीब']
    },
    'ayushman_bharat': {
      name: 'आयुष्मान भारत योजना',
      description: 'गरीब परिवारों के लिए मुफ्त इलाज',
      benefits: '₹5 लाख तक का मुफ्त इलाज',
      eligibility: 'BPL परिवार, SECC 2011 के अनुसार',
      documents: ['आधार कार्ड', 'राशन कार्ड', 'आय प्रमाण पत्र'],
      keywords: ['बीमारी', 'इलाज', 'अस्पताल', 'दवा', 'स्वास्थ्य']
    },
    'pradhan_mantri_ujjwala_yojana': {
      name: 'प्रधानमंत्री उज्ज्वला योजना',
      description: 'गरीब महिलाओं को मुफ्त गैस कनेक्शन',
      benefits: 'मुफ्त LPG कनेक्शन और सब्सिडी',
      eligibility: 'BPL परिवार की महिलाएं',
      documents: ['आधार कार्ड', 'BPL कार्ड', 'फोटो'],
      keywords: ['गैस', 'रसोई', 'चूल्हा', 'महिला', 'खाना']
    }
  },
  english: {
    'pm_kisan': {
      name: 'PM Kisan Samman Nidhi Scheme',
      description: 'Financial assistance for farmers',
      benefits: '₹6000 per year in three installments',
      eligibility: 'All landholding farmer families',
      documents: ['Aadhaar Card', 'Land Records', 'Bank Account'],
      keywords: ['farmer', 'agriculture', 'farming', 'money', 'assistance']
    },
    'pm_awas': {
      name: 'Pradhan Mantri Awas Yojana',
      description: 'Housing scheme for poor families',
      benefits: '₹1.2 lakh to ₹2.5 lakh assistance',
      eligibility: 'BPL families, women headed households, SC/ST/OBC',
      documents: ['Aadhaar Card', 'Income Certificate', 'Caste Certificate'],
      keywords: ['house', 'home', 'housing', 'construction', 'poor']
    }
  }
};

// Mock speech-to-text processing
async function processVoiceToText(audioBuffer: Buffer, language: string = 'hi'): Promise<{
  text: string;
  confidence: number;
  language: string;
  duration: number;
}> {
  // In production, integrate with:
  // 1. Google Cloud Speech-to-Text API
  // 2. Azure Speech Services
  // 3. AWS Transcribe
  // 4. AssemblyAI

  console.log(`Processing ${audioBuffer.length} bytes of audio in ${language}`);

  // Mock responses based on common voice queries
  const mockQueries = {
    hi: [
      'मुझे किसान योजना के बारे में बताइए',
      'घर बनाने के लिए क्या योजना है',
      'गरीबों के लिए कौन सी योजनाएं हैं',
      'मुफ्त इलाज की योजना कौन सी है',
      'गैस कनेक्शन कैसे मिलेगा',
      'पेंशन योजना क्या है',
      'छात्रवृत्ति कैसे मिलती है'
    ],
    en: [
      'Tell me about farmer schemes',
      'What housing schemes are available',
      'Which schemes are for poor families',
      'How to get free medical treatment',
      'What is PM Kisan scheme',
      'How to apply for Ayushman Bharat',
      'What documents are needed'
    ]
  };

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const queries = mockQueries[language] || mockQueries.hi;
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];

  return {
    text: randomQuery,
    confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
    language: language,
    duration: 3.5 + Math.random() * 2 // 3.5-5.5 seconds
  };
}

// Enhanced scheme matching for voice queries
function findVoiceRelevantSchemes(query: string, language: string = 'hindi'): SchemeWithScore[] {
  const schemes = VOICE_SCHEMES_DATABASE[language] || VOICE_SCHEMES_DATABASE.hindi;
  const queryLower = query.toLowerCase();
  
  const relevantSchemes: SchemeWithScore[] = [];
  
  for (const [schemeId, scheme] of Object.entries(schemes)) {
    let relevanceScore = 0;
    
    // Check for keyword matches
    for (const keyword of scheme.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        relevanceScore += 20;
      }
    }
    
    // Check scheme name match
    if (queryLower.includes(scheme.name.toLowerCase())) {
      relevanceScore += 30;
    }
    
    // Check description match
    if (scheme.description.toLowerCase().includes(queryLower) || 
        queryLower.includes(scheme.description.toLowerCase())) {
      relevanceScore += 15;
    }
    
    if (relevanceScore > 0) {
      relevantSchemes.push({
        ...scheme,
        schemeId,
        relevanceScore
      });
    }
  }
  
  return relevantSchemes
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3); // Top 3 most relevant schemes
}

// Generate voice-optimized AI response
function generateVoiceResponse(schemes: SchemeWithScore[], query: string, language: string): string {
  if (schemes.length === 0) {
    return language === 'english' ? 
      "I couldn't find specific schemes for your query. Could you please ask about farmers, housing, health, or other government benefits?" :
      "आपके प्रश्न के लिए कोई खास योजना नहीं मिली। कृपया किसान, आवास, स्वास्थ्य या अन्य सरकारी लाभों के बारे में पूछें।";
  }

  const topScheme = schemes[0];
  
  if (language === 'english') {
    return `I found information about ${topScheme.name}. ${topScheme.description}. 
    The benefits include ${topScheme.benefits}. 
    To be eligible, ${topScheme.eligibility}. 
    You will need these documents: ${topScheme.documents.join(', ')}.
    Would you like more information about this scheme or other available schemes?`;
  } else {
    return `मैंने ${topScheme.name} के बारे में जानकारी मिली है। ${topScheme.description}। 
    इसके लाभ हैं ${topScheme.benefits}। 
    पात्रता: ${topScheme.eligibility}। 
    आवश्यक दस्तावेज: ${topScheme.documents.join(', ')}।
    क्या आप इस योजना या अन्य उपलब्ध योजनाओं के बारे में और जानकारी चाहते हैं?`;
  }
}

// Mock text-to-speech processing
async function processTextToSpeech(text: string, language: string = 'hi'): Promise<{
  audioUrl: string;
  duration: number;
  format: string;
}> {
  // In production, integrate with:
  // 1. Google Cloud Text-to-Speech
  // 2. Azure Speech Services
  // 3. AWS Polly
  // 4. ElevenLabs API

  console.log(`Converting text to speech: "${text.substring(0, 50)}..."`);

  // Simulate audio generation
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock audio response
  return {
    audioUrl: `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVlQ...`, // Mock base64 audio
    duration: Math.ceil(text.length / 10), // Approximate duration based on text length
    format: 'audio/wav'
  };
}

export async function POST(request: NextRequest) {
  const supabase = createActionClient();
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    // Handle voice audio upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      const language = formData.get('language') as string || 'hi';
      const responseFormat = formData.get('responseFormat') as string || 'text';

      if (!audioFile) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
      }

      // Validate audio file
      if (!VOICE_CONFIG.supportedFormats.includes(audioFile.type)) {
        return NextResponse.json({ 
          error: 'Unsupported audio format. Please use WAV, MP3, M4A, or WebM.' 
        }, { status: 400 });
      }

      if (audioFile.size > VOICE_CONFIG.maxFileSize) {
        return NextResponse.json({ 
          error: 'Audio file too large. Maximum size is 25MB.' 
        }, { status: 400 });
      }

      // Convert audio to buffer
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

      // Process speech to text
      const transcription = await processVoiceToText(audioBuffer, language);

      // Find relevant schemes
      const relevantSchemes = findVoiceRelevantSchemes(transcription.text, 
        language === 'en' ? 'english' : 'hindi');

      // Generate response
      const responseText = generateVoiceResponse(relevantSchemes, transcription.text, 
        language === 'en' ? 'english' : 'hindi');

      // Log interaction
      await supabase
        .from('user_interactions')
        .insert([{
          user_id: user.id,
          interaction_type: 'voice_query',
          interaction_data: {
            transcribed_text: transcription.text,
            language: language,
            confidence: transcription.confidence,
            schemes_found: relevantSchemes.length,
            audio_duration: transcription.duration,
            response_format: responseFormat
          }
        }]);

      let response: any = {
        success: true,
        transcription,
        schemes: relevantSchemes,
        responseText,
        message: 'Voice query processed successfully'
      };

      // Generate audio response if requested
      if (responseFormat === 'audio') {
        const audioResponse = await processTextToSpeech(responseText, language);
        response.audioResponse = audioResponse;
      }

      return NextResponse.json(response);
    }

    // Handle text-based voice queries
    else {
      const body = await request.json();
      const { query, language = 'hi', responseFormat = 'text' } = body;

      if (!query) {
        return NextResponse.json({ error: 'No query provided' }, { status: 400 });
      }

      // Find relevant schemes
      const relevantSchemes = findVoiceRelevantSchemes(query, 
        language === 'en' ? 'english' : 'hindi');

      // Generate response
      const responseText = generateVoiceResponse(relevantSchemes, query, 
        language === 'en' ? 'english' : 'hindi');

      // Log interaction
      await supabase
        .from('user_interactions')
        .insert([{
          user_id: user.id,
          interaction_type: 'text_to_voice',
          interaction_data: {
            query: query,
            language: language,
            schemes_found: relevantSchemes.length,
            response_format: responseFormat
          }
        }]);

      let response: any = {
        success: true,
        query,
        schemes: relevantSchemes,
        responseText,
        message: 'Text query processed successfully'
      };

      // Generate audio response if requested
      if (responseFormat === 'audio') {
        const audioResponse = await processTextToSpeech(responseText, language);
        response.audioResponse = audioResponse;
      }

      return NextResponse.json(response);
    }

  } catch (error) {
    console.error('Voice processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process voice request', 
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
    const language = searchParams.get('language') || 'hindi';

    // Get recent voice interactions
    const { data: recentInteractions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', user.id)
      .in('interaction_type', ['voice_query', 'text_to_voice'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (interactionsError) {
      console.error('Database error:', interactionsError);
    }

    // Get available schemes for voice queries
    const availableSchemes = Object.entries(VOICE_SCHEMES_DATABASE[language] || VOICE_SCHEMES_DATABASE.hindi)
      .map(([id, scheme]) => ({
        id,
        name: scheme.name,
        description: scheme.description,
        keywords: scheme.keywords
      }));

    return NextResponse.json({
      success: true,
      voiceConfig: VOICE_CONFIG,
      availableSchemes,
      recentInteractions: recentInteractions || [],
      supportedLanguages: ['hi', 'en'],
      message: 'Voice chat configuration retrieved successfully'
    });

  } catch (error) {
    console.error('Voice config error:', error);
    return NextResponse.json({ 
      error: 'Failed to get voice configuration', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
