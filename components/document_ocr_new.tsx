'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/language_context';
import { supabase } from '../lib/supabase';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye, 
  Copy, 
  Download,
  RefreshCw,
  Loader2,
  ArrowLeft,
  FileCheck,
  AlertTriangle,
  Camera
} from 'lucide-react';

interface ExtractedData {
  [key: string]: string;
}

interface OCRResult {
  text: string;
  confidence: number;
  processedAt: string;
  language: string;
  extractedData: ExtractedData;
  documentType: string;
}

interface OCRResponse {
  success: boolean;
  ocrResult?: OCRResult;
  extractedData?: ExtractedData;
  error?: string;
  processingTime?: number;
}

interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'extracting' | 'complete' | 'error';
  progress: number;
  message: string;
}

export default function DocumentOCR() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('aadhaar');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrHistory, setOcrHistory] = useState<OCRResult[]>([]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (!user) {
        router.push('/auth');
      } else {
        loadOCRHistory();
      }
    };

    checkAuth();
  }, [router]);

  const loadOCRHistory = async () => {
    try {
      const response = await fetch('/api/ocr/history');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOcrHistory(data.history || []);
        }
      }
    } catch (error) {
      console.error('Failed to load OCR history:', error);
    }
  };

  const documentTypes = [
    { 
      value: 'aadhaar', 
      label: language === 'hi' ? 'आधार कार्ड' : 'Aadhaar Card',
      description: language === 'hi' ? 'आधार संख्या, नाम, पता निकालें' : 'Extract Aadhaar number, name, address',
      icon: '🆔',
      fields: ['aadhaar_number', 'name', 'father_name', 'dob', 'gender', 'address']
    },
    { 
      value: 'ration_card', 
      label: language === 'hi' ? 'राशन कार्ड' : 'Ration Card',
      description: language === 'hi' ? 'राशन कार्ड की जानकारी निकालें' : 'Extract ration card information',
      icon: '🍚',
      fields: ['ration_card_number', 'head_of_family', 'category', 'address', 'members']
    },
    { 
      value: 'income_certificate', 
      label: language === 'hi' ? 'आय प्रमाण पत्र' : 'Income Certificate',
      description: language === 'hi' ? 'आय का प्रमाण पत्र' : 'Income certificate details',
      icon: '💰',
      fields: ['certificate_number', 'name', 'annual_income', 'issue_date', 'valid_until']
    },
    { 
      value: 'bank_statement', 
      label: language === 'hi' ? 'बैंक पासबुक' : 'Bank Passbook',
      description: language === 'hi' ? 'खाता संख्या, बैंक की जानकारी' : 'Account number, bank details',
      icon: '🏦',
      fields: ['account_number', 'ifsc_code', 'bank_name', 'branch', 'account_holder']
    },
    { 
      value: 'voter_id', 
      label: language === 'hi' ? 'वोटर आईडी' : 'Voter ID',
      description: language === 'hi' ? 'मतदाता पहचान पत्र' : 'Voter identification card',
      icon: '🗳️',
      fields: ['voter_id', 'name', 'father_name', 'address', 'constituency']
    },
    { 
      value: 'pan_card', 
      label: language === 'hi' ? 'पैन कार्ड' : 'PAN Card',
      description: language === 'hi' ? 'पैन कार्ड की जानकारी' : 'PAN card information',
      icon: '💳',
      fields: ['pan_number', 'name', 'father_name', 'dob', 'signature']
    },
    { 
      value: 'other', 
      label: language === 'hi' ? 'अन्य दस्तावेज़' : 'Other Document',
      description: language === 'hi' ? 'अन्य दस्तावेज़' : 'Other documents',
      icon: '📄',
      fields: []
    }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError(language === 'hi' 
        ? 'गलत फाइल प्रकार। कृपया केवल JPG, PNG, या PDF फाइलें अपलोड करें।'
        : 'Invalid file type. Please upload JPG, PNG, or PDF files only.'
      );
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError(language === 'hi' 
        ? 'फाइल बहुत बड़ी है। कृपया 10MB से छोटी फाइल अपलोड करें।'
        : 'File too large. Please upload files smaller than 10MB.'
      );
      return;
    }

    setSelectedFile(file);
    setError(null);
    setOcrResult(null);
    setExtractedData({});
    
    // Create preview URL
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const updateProcessingStatus = (status: ProcessingStatus['status'], progress: number, message: string) => {
    setProcessingStatus({ status, progress, message });
  };

  const processDocument = async () => {
    if (!selectedFile || !isAuthenticated) return;

    try {
      updateProcessingStatus('uploading', 10, 
        language === 'hi' ? 'फाइल अपलोड हो रही है...' : 'Uploading file...'
      );
      setError(null);

      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);
      formData.append('language', language);

      updateProcessingStatus('processing', 30, 
        language === 'hi' ? 'दस्तावेज़ प्रोसेस हो रहा है...' : 'Processing document...'
      );

      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      });

      updateProcessingStatus('extracting', 70, 
        language === 'hi' ? 'टेक्स्ट निकाला जा रहा है...' : 'Extracting text...'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result: OCRResponse = await response.json();
      
      if (result.success && result.ocrResult) {
        setOcrResult(result.ocrResult);
        setExtractedData(result.extractedData || {});
        
        updateProcessingStatus('complete', 100, 
          language === 'hi' 
            ? `प्रसंस्करण पूर्ण! ${Math.round(result.ocrResult.confidence * 100)}% विश्वसनीयता`
            : `Processing complete! ${Math.round(result.ocrResult.confidence * 100)}% confidence`
        );

        // Reload history to include new result
        setTimeout(() => loadOCRHistory(), 1000);
      } else {
        throw new Error(result.error || 'Failed to process document');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process document';
      setError(errorMessage);
      updateProcessingStatus('error', 0, errorMessage);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success feedback
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadResults = () => {
    if (!ocrResult) return;

    const data = {
      documentType,
      extractedData,
      ocrResult: {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        processedAt: ocrResult.processedAt
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr_results_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fillApplicationForm = () => {
    // Store extracted data in localStorage for form auto-fill
    if (Object.keys(extractedData).length > 0) {
      localStorage.setItem('ocr_extracted_data', JSON.stringify({
        data: extractedData,
        documentType,
        extractedAt: new Date().toISOString()
      }));
      
      // Navigate to applications page
      router.push('/applications?autofill=true');
    }
  };

  const resetOCR = () => {
    setSelectedFile(null);
    setOcrResult(null);
    setExtractedData({});
    setError(null);
    setProcessingStatus({ status: 'idle', progress: 0, message: '' });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {language === 'hi' ? 'साइन इन आवश्यक' : 'Sign In Required'}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === 'hi' 
              ? 'दस्तावेज़ OCR सुविधाओं का उपयोग करने के लिए कृपया साइन इन करें।'
              : 'Please sign in to use document OCR features.'
            }
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === 'hi' ? 'साइन इन करें' : 'Sign In'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {language === 'hi' ? 'दस्तावेज़ OCR' : 'Document OCR'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {language === 'hi' 
                      ? 'दस्तावेज़ों से जानकारी निकालें'
                      : 'Extract information from documents'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {ocrResult && (
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadResults}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={language === 'hi' ? 'परिणाम डाउनलोड करें' : 'Download results'}
                >
                  <Download size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={resetOCR}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={language === 'hi' ? 'रीसेट करें' : 'Reset'}
                >
                  <RefreshCw size={18} className="text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Document Type Selection */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">
            {language === 'hi' ? 'दस्तावेज़ प्रकार चुनें' : 'Select Document Type'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documentTypes.map((type) => (
              <label key={type.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="documentType"
                  value={type.value}
                  checked={documentType === type.value}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                  documentType === type.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0">{type.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{type.label}</h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{type.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* File Upload Area */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">
            {language === 'hi' ? 'दस्तावेज़ अपलोड करें' : 'Upload Document'}
          </h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
                <div>
                  <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-gray-600">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                  </p>
                </div>
                
                {/* File Preview */}
                {previewUrl && (
                  <div className="max-w-md mx-auto">
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="w-full h-48 object-contain border rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={resetOCR}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {language === 'hi' ? 'रीसेट' : 'Reset'}
                  </button>
                  <button
                    onClick={processDocument}
                    disabled={processingStatus.status !== 'idle'}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processingStatus.status !== 'idle' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {processingStatus.message}
                      </>
                    ) : (
                      language === 'hi' ? 'डेटा निकालें' : 'Extract Data'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {language === 'hi' 
                      ? 'अपना दस्तावेज़ यहाँ छोड़ें'
                      : 'Drop your document here'
                    }
                  </p>
                  <p className="text-gray-600">{language === 'hi' ? 'या' : 'or'}</p>
                  <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    {language === 'hi' ? 'फाइल चुनें' : 'Choose File'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  {language === 'hi' 
                    ? 'JPG, PNG, PDF समर्थित • अधिकतम 10MB'
                    : 'Supports JPG, PNG, PDF • Max 10MB'
                  }
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {processingStatus.status !== 'idle' && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  {language === 'hi' ? 'प्रसंस्करण स्थिति' : 'Processing Status'}
                </h3>
                <span className="text-sm text-gray-600">
                  {processingStatus.progress}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    processingStatus.status === 'error' 
                      ? 'bg-red-500' 
                      : processingStatus.status === 'complete'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${processingStatus.progress}%` }}
                />
              </div>
              
              <div className="flex items-center space-x-3">
                {processingStatus.status === 'error' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : processingStatus.status === 'complete' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                )}
                <p className="text-sm text-gray-700">{processingStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">
                {language === 'hi' ? 'OCR परिणाम' : 'OCR Results'}
              </h2>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ocrResult.confidence > 0.8 
                    ? 'bg-green-100 text-green-800' 
                    : ocrResult.confidence > 0.6
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {Math.round(ocrResult.confidence * 100)}% {language === 'hi' ? 'विश्वसनीयता' : 'Confidence'}
                </span>
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  {showRawText 
                    ? (language === 'hi' ? 'छुपाएं' : 'Hide')
                    : (language === 'hi' ? 'दिखाएं' : 'Show')
                  } {language === 'hi' ? 'कच्चा टेक्स्ट' : 'Raw Text'}
                </button>
              </div>
            </div>

            {/* Extracted Data */}
            {Object.keys(extractedData).length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-green-600" />
                  {language === 'hi' ? 'निकाली गई जानकारी:' : 'Extracted Information:'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <label className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/_/g, ' ')}
                          </label>
                          <p className="text-gray-900 mt-1 break-words">{value}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(value)}
                          className="ml-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                          title={language === 'hi' ? 'क्लिपबोर्ड में कॉपी करें' : 'Copy to clipboard'}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={fillApplicationForm}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FileCheck className="w-5 h-5" />
                    {language === 'hi' ? 'आवेदन फॉर्म भरें' : 'Fill Application Form'}
                  </button>
                  <button
                    onClick={downloadResults}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {language === 'hi' ? 'परिणाम डाउनलोड करें' : 'Download Results'}
                  </button>
                </div>
              </div>
            )}

            {/* Raw OCR Text */}
            {showRawText && (
              <div className="border-t pt-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {language === 'hi' ? 'कच्चा OCR टेक्स्ट:' : 'Raw OCR Text:'}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                    {ocrResult.text}
                  </pre>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => copyToClipboard(ocrResult.text)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {language === 'hi' ? 'टेक्स्ट कॉपी करें' : 'Copy Text'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {language === 'hi' ? '💡 बेहतर परिणामों के लिए सुझाव' : '💡 Tips for Better Results'}
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• {language === 'hi' 
              ? 'सुनिश्चित करें कि दस्तावेज़ स्पष्ट और अच्छी रोशनी में हैं'
              : 'Ensure documents are clear and well-lit'
            }</li>
            <li>• {language === 'hi' 
              ? 'बेहतर टेक्स्ट पहचान के लिए उच्च रिज़ॉल्यूशन छवियां अपलोड करें'
              : 'Upload high-resolution images for better text recognition'
            }</li>
            <li>• {language === 'hi' 
              ? 'सुनिश्चित करें कि टेक्स्ट धुंधला या तिरछा नहीं है'
              : 'Make sure text is not blurry or tilted'
            }</li>
            <li>• {language === 'hi' 
              ? 'बहु-पृष्ठ दस्तावेज़ों के लिए, प्रत्येक पृष्ठ को अलग से अपलोड करें'
              : 'For multi-page documents, upload each page separately'
            }</li>
            <li>• {language === 'hi' 
              ? 'समर्थित भाषाएं: अंग्रेजी और हिंदी'
              : 'Supported languages: English and Hindi'
            }</li>
          </ul>
        </div>

        {/* OCR History */}
        {ocrHistory.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-4">
              {language === 'hi' ? 'हाल की OCR गतिविधि' : 'Recent OCR Activity'}
            </h3>
            <div className="space-y-3">
              {ocrHistory.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.documentType}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(item.processedAt).toLocaleDateString(
                          language === 'hi' ? 'hi-IN' : 'en-US'
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
