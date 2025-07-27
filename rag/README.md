# RAG Implementation for Government Schemes Dataset

This directory contains the complete RAG (Retrieval-Augmented Generation) implementation for the government schemes dataset using **LangChain**, **ChromaDB**, and **Google Gemini Flash**.

## 🚀 Features
- **LangChain RAG Pipeline**: Industry-standard RAG implementation
- **ChromaDB Vector Store**: Persistent vector storage with metadata filtering
- **Google Gemini Flash**: Advanced AI for embeddings and natural language responses
- **Semantic Search**: Advanced similarity search with Gemini embeddings
- **State & Category Filtering**: Precise filtering by metadata
- **REST API**: FastAPI server for easy integration
- **Rich Console Output**: Beautiful terminal interface

## 📁 Files Structure
```
rag/
├── README.md                    # This file
├── requirements.txt             # Python dependencies (Gemini-based)
├── langchain_rag.py            # Main Gemini RAG implementation
├── langchain_api_server.py     # FastAPI server with Gemini
├── setup_langchain_rag.py      # Quick setup script
├── .env.example                # Environment configuration template
└── data/
    └── chroma_db/              # ChromaDB persistent storage
```

## 🛠️ Quick Setup

### Option 1: Automated Setup
```bash
python setup_langchain_rag.py
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
pip install langchain langchain-google-genai langchain-chroma chromadb google-generativeai fastapi uvicorn python-dotenv rich

# 2. Configure environment
cp .env.example .env
# Edit .env and add your Google Gemini API key

# 3. Start the server
python langchain_api_server.py

# 4. Setup the vector store (one-time)
curl -X POST "http://localhost:8000/setup"

# 5. Start querying!
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "agriculture schemes in Tamil Nadu"}'
```

## 🔗 API Endpoints

### Core Endpoints
- `POST /setup` - Initialize vector store (run once)
- `POST /query` - Natural language queries with AI responses
- `POST /search` - Filtered search by state/category/ministry
- `GET /stats` - System statistics and health
- `GET /health` - Health check

### Example Usage

**Natural Language Query:**
```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What schemes are available for farmers in Maharashtra?",
    "include_sources": true
  }'
```

**Filtered Search:**
```bash
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "employment schemes",
    "state": "Tamil Nadu",
    "category": "Employment"
  }'
```

## 🎯 Why Gemini Flash?

### Advantages of Google Gemini Flash:
- **Cost Effective**: More affordable than GPT models
- **Fast Performance**: Optimized for speed and efficiency
- **High Quality**: State-of-the-art embeddings and text generation
- **Large Context**: Better handling of long documents
- **Production Ready**: Google's enterprise-grade AI platform

### Key Components Used:
- **Document Loaders**: Efficient document processing
- **Text Splitters**: Smart chunking for better retrieval
- **Vector Stores**: ChromaDB integration for persistence
- **Embeddings**: Google's models/embedding-001
- **LLMs**: Gemini-1.5-flash for response generation
- **Chains**: RetrievalQA for end-to-end RAG pipeline

## 📊 System Capabilities

- **3,000 Government Schemes**: Complete mega dataset support
- **Multi-level Filtering**: State, category, ministry-based search
- **Contextual Responses**: AI-powered explanations and recommendations
- **Source Attribution**: Track which schemes informed each response
- **Persistent Storage**: No need to reprocess data after setup
- **API Documentation**: Interactive docs at `/docs`

## 🔧 Configuration

### Environment Variables (.env)
```env
GOOGLE_API_KEY=your-google-gemini-api-key-here
HOST=0.0.0.0
PORT=8000
EMBEDDING_MODEL=models/embedding-001
CHAT_MODEL=gemini-1.5-flash
CHROMA_PERSIST_DIR=data/chroma_db
```

### Performance Tuning
- Adjust chunk sizes in `langchain_rag.py`
- Modify similarity search parameters
- Configure retrieval limits (k parameter)
- Set custom prompts for domain-specific responses

## 🚦 Getting Started

1. **Prerequisites**: Ensure your mega dataset exists
2. **Install**: Run `python setup_langchain_rag.py`
3. **Configure**: Add Google Gemini API key to `.env`
4. **Initialize**: Start server and run `/setup` endpoint
5. **Query**: Use natural language queries via API

## 📈 Next Steps

- Integrate with your Next.js frontend
- Add user authentication and query logging
- Implement advanced filtering and recommendation logic
- Scale with multiple vector store collections
- Add real-time scheme updates and notifications
