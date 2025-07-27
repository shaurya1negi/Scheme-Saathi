'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/auth_context';
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, Copy } from 'lucide-react';

interface ExtractedData {
  [key: string]: string;
}

interface OCRResult {
  text: string;
  confidence: number;
  processedAt: string;
}

export default function DocumentOCR() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('aadhaar');
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  const documentTypes = [
    { value: 'aadhaar', label: 'Aadhaar Card', description: 'Extract name, number, DOB, address' },
    { value: 'pan', label: 'PAN Card', description: 'Extract PAN number, name, father\'s name' },
    { value: 'income_certificate', label: 'Income Certificate', description: 'Extract income details' },
    { value: 'caste_certificate', label: 'Caste Certificate', description: 'Extract caste/category information' },
    { value: 'bank_statement', label: 'Bank Statement', description: 'Extract account details' },
    { value: 'other', label: 'Other Document', description: 'General text extraction' }
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
      setError('Invalid file type. Please upload JPG, PNG, or PDF files only.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Please upload files smaller than 10MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setOcrResult(null);
    setExtractedData({});
  };

  const processDocument = async () => {
    if (!selectedFile || !user) return;

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);

      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result = await response.json();
      setOcrResult(result.ocrResult);
      setExtractedData(result.extractedData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const fillForm = () => {
    // This would integrate with your application forms
    console.log('Auto-filling form with:', extractedData);
    
    // Example: dispatch to a form context or call a parent callback
    // onAutoFill(extractedData);
    
    alert('Form data copied! You can now paste it into your application form.');
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Please sign in to use document OCR features.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document OCR & Auto-Fill</h1>
        <p className="text-gray-600">Upload your documents to automatically extract and fill application forms</p>
      </div>

      {/* Document Type Selection */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Select Document Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className={`p-4 border-2 rounded-lg transition-all ${
                documentType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <h3 className="font-medium text-gray-900">{type.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* File Upload Area */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Remove
                </button>
                <button
                  onClick={processDocument}
                  disabled={processing}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Extract Data'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto w-12 h-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">Drop your document here</p>
                <p className="text-gray-600">or</p>
                <label className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, PDF • Max 10MB
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Processing Status */}
      {processing && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div>
              <p className="font-medium">Processing Document...</p>
              <p className="text-sm text-gray-600">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}

      {/* OCR Results */}
      {ocrResult && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">OCR Results</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                ocrResult.confidence > 0.8 
                  ? 'bg-green-100 text-green-800' 
                  : ocrResult.confidence > 0.6
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {Math.round(ocrResult.confidence * 100)}% Confidence
              </span>
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                {showRawText ? 'Hide' : 'Show'} Raw Text
              </button>
            </div>
          </div>

          {/* Extracted Data */}
          {Object.keys(extractedData).length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">Extracted Information:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(extractedData).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <p className="text-gray-900 mt-1">{value}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(value)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <button
                  onClick={fillForm}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Auto-Fill Application Form
                </button>
              </div>
            </div>
          )}

          {/* Raw OCR Text */}
          {showRawText && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Raw OCR Text:</h3>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{ocrResult.text}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Better Results</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Ensure documents are clear and well-lit</li>
          <li>• Upload high-resolution images for better text recognition</li>
          <li>• Make sure text is not blurry or tilted</li>
          <li>• For multi-page documents, upload each page separately</li>
          <li>• Supported languages: English and Hindi</li>
        </ul>
      </div>
    </div>
  );
}
