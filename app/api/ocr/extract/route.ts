import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('document') as File;
    const documentType = formData.get('documentType') as string || 'unknown';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload JPG, PNG, or PDF files only.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Please upload files smaller than 10MB.' 
      }, { status: 400 });
    }

    // Process document with OCR
    const ocrResult = await processDocumentOCR(file, documentType);

    // Extract structured data based on document type
    const extractedData = await extractStructuredData(ocrResult.text, documentType);

    // Log the interaction
    await supabase
      .from('user_interactions')
      .insert([{
        user_id: user.id,
        interaction_type: 'document_upload',
        interaction_data: {
          document_type: documentType,
          file_name: file.name,
          file_size: file.size,
          extraction_success: ocrResult.confidence > 0.7,
          confidence: ocrResult.confidence,
          extracted_fields: Object.keys(extractedData).length
        }
      }]);

    return NextResponse.json({
      success: true,
      ocrResult,
      extractedData,
      message: `Successfully processed ${documentType} document`
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process document', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function processDocumentOCR(file: File, documentType: string) {
  try {
    // Import Tesseract.js dynamically
    const { createWorker } = await import('tesseract.js');
    
    // Create worker with language support
    const languages = documentType === 'pan' || documentType === 'aadhaar' 
      ? 'eng+hin' // English + Hindi
      : 'eng';
    
    const worker = await createWorker(languages, 1, {
      logger: m => console.log('OCR Progress:', m)
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(buffer);

    await worker.terminate();

    return {
      text: text.trim(),
      confidence: confidence / 100, // Convert to decimal
      processedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to extract text from document');
  }
}

async function extractStructuredData(text: string, documentType: string) {
  const extractedData: Record<string, string> = {};

  switch (documentType.toLowerCase()) {
    case 'aadhaar':
      extractedData.type = 'Aadhaar Card';
      
      // Extract Aadhaar number (12 digits, may be formatted)
      const aadhaarMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
      if (aadhaarMatch) {
        extractedData.aadhaar_number = aadhaarMatch[0].replace(/\s/g, '');
      }

      // Extract name (usually after "Name" or before DOB)
      const namePatterns = [
        /(?:Name|नाम)[:\s]+([A-Za-z\s]+?)(?:\n|Date|DOB|जन्म)/i,
        /^([A-Z\s]{3,40})$/m
      ];
      
      for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1]) {
          extractedData.full_name = nameMatch[1].trim();
          break;
        }
      }

      // Extract DOB
      const dobPatterns = [
        /(?:DOB|Date of Birth|जन्म तिथि)[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
        /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/
      ];
      
      for (const pattern of dobPatterns) {
        const dobMatch = text.match(pattern);
        if (dobMatch) {
          extractedData.date_of_birth = dobMatch[1];
          break;
        }
      }

      // Extract gender
      const genderMatch = text.match(/(?:Male|Female|पुरुष|महिला)/i);
      if (genderMatch) {
        const gender = genderMatch[0].toLowerCase();
        extractedData.gender = gender.includes('male') || gender.includes('पुरुष') ? 'Male' : 'Female';
      }

      // Extract address (usually the longest text section)
      const addressPatterns = [
        /(?:Address|पता)[:\s]*(.*?)(?:\n\n|\n[A-Z])/,
        /Address[:\s]*(.*?)$/m,
        /पता[:\s]*(.*?)$/m
      ];
      
      for (const pattern of addressPatterns) {
        const addressMatch = text.match(pattern);
        if (addressMatch && addressMatch[1]) {
          extractedData.address = addressMatch[1].trim().replace(/\n/g, ', ');
          break;
        }
      }

      break;

    case 'pan':
      extractedData.type = 'PAN Card';
      
      // Extract PAN number
      const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
      if (panMatch) {
        extractedData.pan_number = panMatch[0];
      }

      // Extract name
      const panNameMatch = text.match(/(?:Name|नाम)[:\s]+([A-Za-z\s]+)/i);
      if (panNameMatch) {
        extractedData.full_name = panNameMatch[1].trim();
      }

      // Extract father's name
      const fatherNameMatch = text.match(/(?:Father|पिता)[:\s]+([A-Za-z\s]+)/i);
      if (fatherNameMatch) {
        extractedData.father_name = fatherNameMatch[1].trim();
      }

      // Extract DOB
      const panDobMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
      if (panDobMatch) {
        extractedData.date_of_birth = panDobMatch[1];
      }

      break;

    case 'income_certificate':
      extractedData.type = 'Income Certificate';
      
      // Extract name
      const incomeNameMatch = text.match(/(?:Name|नाम)[:\s]+([A-Za-z\s]+)/i);
      if (incomeNameMatch) {
        extractedData.full_name = incomeNameMatch[1].trim();
      }

      // Extract income amount
      const incomeMatch = text.match(/(?:Income|आय|Annual Income)[:\s]*(?:Rs\.?|₹)?\s*([0-9,]+)/i);
      if (incomeMatch) {
        extractedData.annual_income = incomeMatch[1].replace(/,/g, '');
      }

      // Extract certificate number
      const certNoMatch = text.match(/(?:Certificate No|प्रमाण संख्या)[:\s]*([A-Z0-9\/\-]+)/i);
      if (certNoMatch) {
        extractedData.certificate_number = certNoMatch[1];
      }

      break;

    case 'caste_certificate':
      extractedData.type = 'Caste Certificate';
      
      // Extract name
      const casteNameMatch = text.match(/(?:Name|नाम)[:\s]+([A-Za-z\s]+)/i);
      if (casteNameMatch) {
        extractedData.full_name = casteNameMatch[1].trim();
      }

      // Extract caste/category
      const casteMatch = text.match(/(?:Caste|Category|जाति|श्रेणी)[:\s]+([A-Za-z\s]+)/i);
      if (casteMatch) {
        extractedData.caste_category = casteMatch[1].trim();
      }

      // Determine if SC/ST/OBC
      const categoryText = text.toLowerCase();
      if (categoryText.includes('scheduled caste') || categoryText.includes('sc')) {
        extractedData.category = 'SC';
      } else if (categoryText.includes('scheduled tribe') || categoryText.includes('st')) {
        extractedData.category = 'ST';
      } else if (categoryText.includes('other backward class') || categoryText.includes('obc')) {
        extractedData.category = 'OBC';
      }

      break;

    case 'bank_statement':
      extractedData.type = 'Bank Statement';
      
      // Extract account holder name
      const accountNameMatch = text.match(/(?:Account Holder|Name)[:\s]+([A-Za-z\s]+)/i);
      if (accountNameMatch) {
        extractedData.account_holder_name = accountNameMatch[1].trim();
      }

      // Extract account number
      const accountMatch = text.match(/(?:Account No|A\/C No)[:\s]*([0-9]+)/i);
      if (accountMatch) {
        extractedData.account_number = accountMatch[1];
      }

      // Extract bank name
      const bankMatch = text.match (/(?:Bank|बैंक)[:\s]*([A-Za-z\s]+?)(?:\n|Branch)/i);
      if (bankMatch) {
        extractedData.bank_name = bankMatch[1].trim();
      }

      break;

    default:
      // Generic extraction for unknown document types
      extractedData.type = 'Unknown Document';
      
      // Try to extract any name
      const genericNameMatch = text.match(/(?:Name|नाम)[:\s]+([A-Za-z\s]+)/i);
      if (genericNameMatch) {
        extractedData.extracted_name = genericNameMatch[1].trim();
      }

      // Try to extract any number (could be ID, phone, etc.)
      const numberMatch = text.match(/\b\d{10,}\b/);
      if (numberMatch) {
        extractedData.extracted_number = numberMatch[0];
      }

      break;
  }

  return extractedData;
}
