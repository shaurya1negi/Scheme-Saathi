import { NextRequest, NextResponse } from 'next/server';

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Send query to FastAPI RAG backend
    const response = await fetch(`${RAG_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
        include_sources: true
      }),
    });

    if (!response.ok) {
      console.error('RAG API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to get response from RAG system' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      answer: data.answer,
      sources: data.sources,
      total_sources: data.total_sources
    });

  } catch (error) {
    console.error('Voice chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Voice chat API is running',
    rag_backend: RAG_API_URL 
  });
}