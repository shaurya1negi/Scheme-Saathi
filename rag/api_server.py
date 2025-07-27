"""
FastAPI Server for Government Schemes RAG System
Provides REST API endpoints for scheme retrieval and recommendations
"""

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
from pathlib import Path
import logging
import time
import uvicorn

# Import our RAG components
try:
    from rag_engine import GovernmentSchemeRAG, QueryResult
    from vector_store import SchemeVectorStore
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure all RAG components are properly installed")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API
class QueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query about government schemes")
    max_results: int = Field(10, ge=1, le=50, description="Maximum number of schemes to return")
    state_filter: Optional[str] = Field(None, description="Filter by specific state")
    category_filter: Optional[str] = Field(None, description="Filter by specific category")
    ministry_filter: Optional[str] = Field(None, description="Filter by specific ministry")

class SchemeResponse(BaseModel):
    scheme_id: str
    scheme_name: str
    category: str
    state: str
    ministry: str
    description: str
    relevance_score: float

class QueryResponse(BaseModel):
    query: str
    response: str
    relevant_schemes: List[SchemeResponse]
    confidence_score: float
    processing_time: float
    total_schemes_found: int
    filters_applied: Dict[str, Any]

class UserProfile(BaseModel):
    state: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    income_category: Optional[str] = None
    education_level: Optional[str] = None
    interests: List[str] = []

class RecommendationRequest(BaseModel):
    user_profile: UserProfile
    max_results: int = Field(10, ge=1, le=50)

class StatsResponse(BaseModel):
    total_schemes: int
    total_categories: int
    total_states: int
    total_ministries: int
    system_status: str
    available_categories: List[str]
    available_states: List[str]

# Initialize FastAPI app
app = FastAPI(
    title="Government Schemes RAG API",
    description="AI-powered government schemes retrieval and recommendation system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for web frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG engine instance
rag_engine: Optional[GovernmentSchemeRAG] = None

@app.on_event("startup")
async def startup_event():
    """Initialize RAG engine on startup"""
    global rag_engine
    
    try:
        # Check for OpenAI API key
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.warning("OPENAI_API_KEY not found. Running in offline mode.")
        
        # Initialize RAG engine
        vector_store_path = "data/embeddings/scheme_vector_store"
        if not Path(vector_store_path + ".faiss").exists():
            logger.error(f"Vector store not found at {vector_store_path}")
            logger.info("Please run embeddings_generator.py first to create the vector store")
            return
        
        rag_engine = GovernmentSchemeRAG(
            vector_store_path=vector_store_path,
            openai_api_key=openai_api_key
        )
        
        logger.info("RAG engine initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize RAG engine: {e}")

def ensure_rag_engine():
    """Ensure RAG engine is available"""
    if rag_engine is None:
        raise HTTPException(
            status_code=503,
            detail="RAG engine not available. Please check server logs."
        )

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Government Schemes RAG API",
        "version": "1.0.0",
        "status": "online" if rag_engine else "initializing",
        "docs": "/docs"
    }

@app.post("/query", response_model=QueryResponse)
async def query_schemes(request: QueryRequest) -> QueryResponse:
    """
    Query government schemes using natural language
    
    This endpoint accepts natural language queries and returns relevant government schemes
    with AI-generated responses explaining the schemes and their applicability.
    """
    ensure_rag_engine()
    
    try:
        # Prepare filters
        filters = {}
        if request.state_filter:
            filters['state_name'] = request.state_filter
        if request.category_filter:
            filters['category'] = request.category_filter
        if request.ministry_filter:
            filters['implementing_ministry'] = request.ministry_filter
        
        # Query RAG engine
        result = rag_engine.query(
            user_query=request.query,
            max_schemes=request.max_results,
            additional_filters=filters if filters else None
        )
        
        # Convert to API response format
        scheme_responses = [
            SchemeResponse(
                scheme_id=scheme['scheme_id'],
                scheme_name=scheme['scheme_name'],
                category=scheme['category'],
                state=scheme['state'],
                ministry=scheme['ministry'],
                description=scheme['description'],
                relevance_score=scheme['relevance_score']
            )
            for scheme in result.relevant_schemes
        ]
        
        return QueryResponse(
            query=result.query,
            response=result.response,
            relevant_schemes=scheme_responses,
            confidence_score=result.confidence_score,
            processing_time=result.processing_time,
            total_schemes_found=len(result.relevant_schemes),
            filters_applied=result.metadata.get('filters_applied', {})
        )
        
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@app.post("/recommend", response_model=QueryResponse)
async def recommend_schemes(request: RecommendationRequest) -> QueryResponse:
    """
    Get personalized scheme recommendations based on user profile
    """
    ensure_rag_engine()
    
    try:
        # Create query based on user profile
        query_parts = []
        
        if request.user_profile.state:
            query_parts.append(f"schemes available in {request.user_profile.state}")
        
        if request.user_profile.occupation:
            query_parts.append(f"schemes for {request.user_profile.occupation}")
        
        if request.user_profile.age:
            if request.user_profile.age < 30:
                query_parts.append("youth schemes")
            elif request.user_profile.age > 60:
                query_parts.append("senior citizen schemes")
        
        if request.user_profile.interests:
            query_parts.append(f"schemes related to {', '.join(request.user_profile.interests)}")
        
        if not query_parts:
            query_parts.append("general government schemes")
        
        query = " and ".join(query_parts)
        
        # Prepare filters
        filters = {}
        if request.user_profile.state:
            filters['state_name'] = request.user_profile.state
        
        # Query RAG engine
        result = rag_engine.query(
            user_query=query,
            max_schemes=request.max_results,
            additional_filters=filters if filters else None
        )
        
        # Convert to API response format
        scheme_responses = [
            SchemeResponse(
                scheme_id=scheme['scheme_id'],
                scheme_name=scheme['scheme_name'],
                category=scheme['category'],
                state=scheme['state'],
                ministry=scheme['ministry'],
                description=scheme['description'],
                relevance_score=scheme['relevance_score']
            )
            for scheme in result.relevant_schemes
        ]
        
        return QueryResponse(
            query=f"Personalized recommendations: {query}",
            response=result.response,
            relevant_schemes=scheme_responses,
            confidence_score=result.confidence_score,
            processing_time=result.processing_time,
            total_schemes_found=len(result.relevant_schemes),
            filters_applied=result.metadata.get('filters_applied', {})
        )
        
    except Exception as e:
        logger.error(f"Recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation processing failed: {str(e)}")

@app.get("/scheme/{scheme_id}")
async def get_scheme_details(scheme_id: str):
    """Get detailed information about a specific scheme"""
    ensure_rag_engine()
    
    try:
        scheme = rag_engine.get_scheme_by_id(scheme_id)
        if not scheme:
            raise HTTPException(status_code=404, detail="Scheme not found")
        
        return scheme
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get scheme details: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve scheme details")

@app.get("/schemes/{state}")
async def get_schemes_by_state(state: str, limit: int = Query(20, ge=1, le=100)):
    """Get schemes available in a specific state"""
    ensure_rag_engine()
    
    try:
        # Use dummy query for state-based search
        dummy_query = f"government schemes in {state}"
        result = rag_engine.query(
            user_query=dummy_query,
            max_schemes=limit,
            additional_filters={'state_name': state}
        )
        
        return {
            'state': state,
            'total_schemes': len(result.relevant_schemes),
            'schemes': result.relevant_schemes
        }
        
    except Exception as e:
        logger.error(f"Failed to get schemes for state {state}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve state schemes")

@app.get("/categories", response_model=List[str])
async def get_categories():
    """Get all available scheme categories"""
    ensure_rag_engine()
    
    try:
        stats = rag_engine.get_stats()
        return sorted(stats.get('available_categories', []))
        
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve categories")

@app.get("/states", response_model=List[str])
async def get_states():
    """Get all available states"""
    ensure_rag_engine()
    
    try:
        stats = rag_engine.get_stats()
        return sorted(stats.get('available_states', []))
        
    except Exception as e:
        logger.error(f"Failed to get states: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve states")

@app.get("/stats", response_model=StatsResponse)
async def get_system_stats():
    """Get system statistics and health information"""
    ensure_rag_engine()
    
    try:
        stats = rag_engine.get_stats()
        vector_stats = stats.get('vector_store_stats', {})
        
        return StatsResponse(
            total_schemes=vector_stats.get('total_documents', 0),
            total_categories=vector_stats.get('unique_categories', 0),
            total_states=vector_stats.get('unique_states', 0),
            total_ministries=vector_stats.get('unique_ministries', 0),
            system_status="online",
            available_categories=sorted(stats.get('available_categories', [])),
            available_states=sorted(stats.get('available_states', []))
        )
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve system stats")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if rag_engine else "initializing",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("ENVIRONMENT", "development") == "development"
    
    print(f"Starting Government Schemes RAG API server...")
    print(f"Server will be available at: http://{host}:{port}")
    print(f"API documentation: http://{host}:{port}/docs")
    
    uvicorn.run(
        "api_server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
