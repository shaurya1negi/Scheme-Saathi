import { NextRequest, NextResponse } from 'next/server';
import { createActionClient } from '../../../../lib/supabase-server';

// Enhanced OCR processing with better mock data and validation
async function processDocumentOCR(file: File, documentType: string) {
  try {
    console.log(`Processing ${documentType} document: ${file.name}`);
    
    // Convert file to buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Basic file validation
    if (buffer.length === 0) {
      throw new Error('Empty file provided');
    }

    // Enhanced mock OCR results based on document type
    const ocrResults = generateEnhancedOCRText(documentType, file.name);
    
    return {
      text: ocrResults.rawText,
      confidence: ocrResults.confidence,
      processedAt: new Date().toISOString(),
      fileSize: file.size,
      fileName: file.name,
      documentType
    };

  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error(`Failed to extract text from ${documentType}: ${error.message}`);
  }
}

// Enhanced mock OCR text generation with realistic data
function generateEnhancedOCRText(documentType: string, fileName: string) {
  const mockData = {
    aadhaar: {
      rawText: `Government of India
Unique Identification Authority of India
AADHAAR

Name: RAJESH KUMAR SHARMA
Date of Birth: 15/08/1985
Gender: MALE
Father's Name: RAMESH SHARMA

Address: 
S/O RAMESH SHARMA
VILLAGE RAMPUR
TEHSIL SADAR
DISTRICT MEERUT
UTTAR PRADESH - 250001

Aadhaar Number: 1234 5678 9012`,
      confidence: 0.92
    },
    ration_card: {
      rawText: `RATION CARD
Government of Uttar Pradesh

Card Number: UP-03-001-12345
Card Type: AAY Priority Household
Head of Family: RAJESH KUMAR SHARMA

Address:
VILLAGE RAMPUR
BLOCK SADAR  
DISTRICT MEERUT
PIN: 250001

Family Members:
1. RAJESH KUMAR SHARMA (M) - 38 Years
2. SUNITA SHARMA (F) - 35 Years  
3. AMIT SHARMA (M) - 12 Years
4. PRIYA SHARMA (F) - 8 Years

Issue Date: 15/03/2020
Valid Till: 14/03/2025`,
      confidence: 0.88
    },
    voter_id: {
      rawText: `VOTER ID CARD
Election Commission of India

EPIC No: MRT1234567890
Name: RAJESH KUMAR SHARMA
Father's Name: RAMESH SHARMA
Date of Birth: 15/08/1985
Age: 38 Years
Sex: M

Address: 
HOUSE NO 45
VILLAGE RAMPUR
MEERUT
UTTAR PRADESH
PIN: 250001

Assembly Constituency: 057 - MEERUT SADAR`,
      confidence: 0.90
    },
    bank_passbook: {
      rawText: `STATE BANK OF INDIA
PASSBOOK
Branch: MEERUT SADAR
IFSC Code: SBIN0060176

Account Holder: RAJESH KUMAR SHARMA
Account Number: 12345678902
Account Type: SAVINGS ACCOUNT

Address:
VILLAGE RAMPUR
TEHSIL SADAR
MEERUT - 250001

Mobile: +91-9876543210
Balance: Rs. 25,430.00`,
      confidence: 0.94
    },
    pan_card: {
      rawText: `INCOME TAX DEPARTMENT
PERMANENT ACCOUNT NUMBER CARD

Name: RAJESH KUMAR SHARMA
Father's Name: RAMESH SHARMA
Date of Birth: 15/08/1985
PAN: ABCDE1234F`,
      confidence: 0.91
    }
  };

  return mockData[documentType] || {
    rawText: `Document content could not be processed for type: ${documentType}`,
    confidence: 0.3
  };
}

// Enhanced structured data extraction
async function extractStructuredData(text: string, documentType: string) {
  const extractedData: any = {
    documentType,
    extractedAt: new Date().toISOString(),
    confidence: 0,
    fields: {}
  };

  try {
    switch (documentType) {
      case 'aadhaar':
        extractedData.fields = extractAadhaarData(text);
        extractedData.confidence = 0.92;
        break;
      case 'ration_card':
        extractedData.fields = extractRationCardData(text);
        extractedData.confidence = 0.88;
        break;
      case 'voter_id':
        extractedData.fields = extractVoterIdData(text);
        extractedData.confidence = 0.90;
        break;
      case 'bank_passbook':
        extractedData.fields = extractBankPassbookData(text);
        extractedData.confidence = 0.94;
        break;
      case 'pan_card':
        extractedData.fields = extractPanCardData(text);
        extractedData.confidence = 0.91;
        break;
      default:
        extractedData.fields = { raw_text: text };
        extractedData.confidence = 0.5;
    }
  } catch (error) {
    console.error('Data extraction error:', error);
    extractedData.error = error.message;
    extractedData.confidence = 0.3;
  }

  return extractedData;
}

function extractAadhaarData(text: string) {
  const nameMatch = text.match(/Name:\s*([A-Z\s]+)/i);
  const dobMatch = text.match(/Date of Birth:\s*(\d{2}\/\d{2}\/\d{4})/);
  const genderMatch = text.match(/Gender:\s*(MALE|FEMALE)/i);
  const aadhaarMatch = text.match(/(\d{4}\s+\d{4}\s+\d{4})/);
  const addressMatch = text.match(/Address:\s*([\s\S]*?)(?=Aadhaar Number:|$)/i);

  return {
    full_name: nameMatch?.[1]?.trim() || '',
    date_of_birth: dobMatch?.[1] || '',
    gender: genderMatch?.[1]?.toLowerCase() || '',
    aadhaar_number: aadhaarMatch?.[1]?.replace(/\s+/g, '') || '',
    address: addressMatch?.[1]?.trim().replace(/\s+/g, ' ') || ''
  };
}

function extractRationCardData(text: string) {
  const cardNumberMatch = text.match(/Card Number:\s*([A-Z0-9-]+)/i);
  const headMatch = text.match(/Head of Family:\s*([A-Z\s]+)/i);
  const categoryMatch = text.match(/Card Type:\s*([A-Z\s()]+)/i);
  const addressMatch = text.match(/Address:\s*([\s\S]*?)(?=Family Members:|$)/i);
  
  return {
    card_number: cardNumberMatch?.[1]?.trim() || '',
    head_of_family: headMatch?.[1]?.trim() || '',
    card_category: categoryMatch?.[1]?.trim() || '',
    address: addressMatch?.[1]?.trim().replace(/\s+/g, ' ') || ''
  };
}

function extractVoterIdData(text: string) {
  const epicMatch = text.match(/EPIC No:\s*([A-Z0-9]+)/i);
  const nameMatch = text.match(/Name:\s*([A-Z\s]+)/i);
  const dobMatch = text.match(/Date of Birth:\s*(\d{2}\/\d{2}\/\d{4})/);
  const ageMatch = text.match(/Age:\s*(\d+)/i);
  const sexMatch = text.match(/Sex:\s*([MF])/i);

  return {
    epic_number: epicMatch?.[1] || '',
    full_name: nameMatch?.[1]?.trim() || '',
    date_of_birth: dobMatch?.[1] || '',
    age: ageMatch?.[1] || '',
    gender: sexMatch?.[1] === 'M' ? 'male' : sexMatch?.[1] === 'F' ? 'female' : ''
  };
}

function extractBankPassbookData(text: string) {
  const accountMatch = text.match(/Account Number:\s*(\d+)/i);
  const holderMatch = text.match(/Account Holder:\s*([A-Z\s]+)/i);
  const ifscMatch = text.match(/IFSC Code:\s*([A-Z0-9]+)/i);
  const branchMatch = text.match(/Branch:\s*([A-Z\s]+)/i);
  const typeMatch = text.match(/Account Type:\s*([A-Z\s]+)/i);
  const mobileMatch = text.match(/Mobile:\s*(\+\d{2}-\d{10})/);
  const balanceMatch = text.match(/Balance:\s*Rs\.\s*([\d,]+\.\d{2})/);

  return {
    account_number: accountMatch?.[1] || '',
    account_holder: holderMatch?.[1]?.trim() || '',
    ifsc_code: ifscMatch?.[1] || '',
    branch_name: branchMatch?.[1]?.trim() || '',
    account_type: typeMatch?.[1]?.trim() || '',
    mobile_number: mobileMatch?.[1] || '',
    current_balance: balanceMatch?.[1] || ''
  };
}

function extractPanCardData(text: string) {
  const panMatch = text.match(/PAN:\s*([A-Z0-9]{10})/i);
  const nameMatch = text.match(/Name:\s*([A-Z\s]+)/i);
  const fatherMatch = text.match(/Father.*?:\s*([A-Z\s]+)/i);
  const dobMatch = text.match(/Date of Birth:\s*(\d{2}\/\d{2}\/\d{4})/);

  return {
    pan_number: panMatch?.[1] || '',
    full_name: nameMatch?.[1]?.trim() || '',
    father_name: fatherMatch?.[1]?.trim() || '',
    date_of_birth: dobMatch?.[1] || ''
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
          extracted_fields: Object.keys(extractedData.fields || {}).length
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
