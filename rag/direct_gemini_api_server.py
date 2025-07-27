"""
FastAPI Server using Direct Google Generative AI module
This avoids LangChain's Gemini wrapper rate limiting issues
"""

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import logging
import uvicorn
from pathlib import Path

# Import our Direct Gemini RAG system
try:
    from langchain_rag_direct import SchemeRAGSystemDirect, load_schemes_dataset
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure google-generativeai is installed: pip install google-generativeai")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API
class QueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query about government schemes")
    include_sources: bool = Field(True, description="Include source documents in response")

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    total_sources: int
    success: bool
    error: Optional[str] = None

class SystemStats(BaseModel):
    gemini_enabled: bool
    vector_store_ready: bool
    total_documents: Optional[int] = None
    status: str
    embedding_model: str
    llm_model: str
    implementation: str

# Initialize FastAPI app
app = FastAPI(
    title="Government Schemes Direct Gemini RAG API",
    description="Direct Google Generative AI powered government schemes retrieval system",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG system instance
rag_system: Optional[SchemeRAGSystemDirect] = None

@app.on_event("startup")
async def startup_event():
    """Initialize Direct Gemini RAG system on startup"""
    global rag_system
    
    try:
        logger.info("Initializing Direct Gemini RAG system...")
        
        # Initialize RAG system
        rag_system = SchemeRAGSystemDirect(
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            chroma_persist_dir="data/chroma_db"
        )
        
        # Try to load existing vector store first
        if not rag_system.load_existing_vector_store():
            logger.info("No existing vector store found. You'll need to run the setup endpoint first.")
        
        logger.info("Direct Gemini RAG system initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize RAG system: {e}")

def ensure_rag_system():
    """Ensure RAG system is available"""
    if rag_system is None:
        raise HTTPException(
            status_code=503,
            detail="RAG system not available. Please check server logs."
        )

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Government Schemes Direct Gemini RAG API",
        "version": "4.0.0",
        "framework": "Direct Google Generative AI + ChromaDB",
        "status": "online" if rag_system else "initializing",
        "docs": "/docs"
    }

@app.post("/setup", response_model=Dict[str, Any])
async def setup_rag_system():
    """
    Setup the RAG system by processing the schemes dataset
    This needs to be called once to initialize the vector store
    """
    ensure_rag_system()
    
    try:
        # Load dataset
        dataset_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
        
        if not Path(dataset_path).exists():
            raise HTTPException(
                status_code=404,
                detail=f"Dataset not found at {dataset_path}"
            )
        
        schemes = load_schemes_dataset(dataset_path)
        
        # Create documents
        documents = rag_system.create_documents_from_schemes(schemes)
        
        # Setup vector store with rate limiting
        if not rag_system.setup_vector_store(documents):
            raise HTTPException(
                status_code=500,
                detail="Failed to setup vector store"
            )
        
        return {
            "message": "Direct Gemini RAG system setup completed successfully",
            "total_schemes": len(schemes),
            "total_documents": len(documents),
            "implementation": "Direct Google Generative AI",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Setup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Setup failed: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_schemes(request: QueryRequest) -> QueryResponse:
    """
    Query government schemes using natural language with Direct Gemini
    """
    ensure_rag_system()
    
    if not rag_system.vector_store:
        raise HTTPException(
            status_code=400,
            detail="RAG system not ready. Please run /setup first."
        )
    
    try:
        result = rag_system.query(
            question=request.query,
            include_sources=request.include_sources
        )
        
        return QueryResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            total_sources=result.get("total_sources", 0),
            success=result.get("success", True),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@app.get("/stats", response_model=SystemStats)
async def get_system_stats():
    """Get system statistics and health information"""
    ensure_rag_system()
    
    try:
        stats = rag_system.get_stats()
        
        status = "ready"
        if not stats["gemini_enabled"]:
            status = "error (no Gemini API key)"
        elif not stats["vector_store_ready"]:
            status = "needs setup"
        
        return SystemStats(
            gemini_enabled=stats["gemini_enabled"],
            vector_store_ready=stats["vector_store_ready"],
            total_documents=stats.get("total_documents"),
            status=status,
            embedding_model=stats.get("embedding_model", "models/embedding-001"),
            llm_model=stats.get("llm_model", "gemini-2.0-flash-exp"),
            implementation=stats.get("implementation", "Direct Google Generative AI")
        )
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve system stats")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "framework": "Direct Google Generative AI + ChromaDB",
        "rag_system_ready": rag_system is not None and rag_system.vector_store is not None,
        "implementation": "Direct Gemini API"
    }

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 Starting Direct Gemini RAG API...")
    print(f"📍 Server: http://{host}:{port}")
    print(f"📚 Docs: http://{host}:{port}/docs")
    print(f"🔧 Setup: POST http://{host}:{port}/setup")
    print(f"⚡ Implementation: Direct Google Generative AI")
    
    uvicorn.run(
        "direct_gemini_api_server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
