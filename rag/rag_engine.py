"""
RAG Engine for Government Schemes
Main retrieval-augmented generation implementation
"""

import numpy as np
import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import logging
from dataclasses import dataclass
from vector_store import SchemeVectorStore, SchemeDocument
import re
import time

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class QueryResult:
    """Represents a query result from the RAG system"""
    query: str
    response: str
    relevant_schemes: List[Dict[str, Any]]
    confidence_score: float
    processing_time: float
    metadata: Dict[str, Any]

class GovernmentSchemeRAG:
    """RAG implementation for government schemes"""
    
    def __init__(self, vector_store_path: str = "data/embeddings/scheme_vector_store",
                 openai_api_key: Optional[str] = None, 
                 embedding_model: str = "text-embedding-3-small",
                 chat_model: str = "gpt-3.5-turbo"):
        
        self.vector_store_path = Path(vector_store_path)
        self.embedding_model = embedding_model
        self.chat_model = chat_model
        
        # Initialize OpenAI client if available
        if OPENAI_AVAILABLE and openai_api_key:
            self.client = OpenAI(api_key=openai_api_key)
            self.openai_enabled = True
        else:
            self.client = None
            self.openai_enabled = False
            logger.warning("OpenAI not available. Running in offline mode.")
        
        # Load vector store
        self.vector_store = SchemeVectorStore()
        if self.vector_store_path.with_suffix('.faiss').exists():
            self.vector_store.load(str(self.vector_store_path))
            logger.info(f"Loaded vector store with {len(self.vector_store.documents)} schemes")
        else:
            logger.warning(f"Vector store not found at {self.vector_store_path}")
        
        # Query cache for performance
        self.query_cache = {}
        self.cache_timeout = 3600  # 1 hour
    
    def _get_query_embedding(self, query: str) -> Optional[np.ndarray]:
        """Get embedding for user query"""
        if not self.openai_enabled:
            # Fallback: use random embedding for demo
            return np.random.random(1536)
        
        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=query
            )
            return np.array(response.data[0].embedding)
        except Exception as e:
            logger.error(f"Failed to get query embedding: {e}")
            return None
    
    def _extract_query_filters(self, query: str) -> Dict[str, Any]:
        """Extract filters from natural language query"""
        filters = {}
        query_lower = query.lower()
        
        # State extraction
        indian_states = [
            "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
            "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
            "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
            "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
            "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
            "delhi", "chandigarh", "dadra and nagar haveli", "daman and diu",
            "lakshadweep", "puducherry", "andaman and nicobar islands", "ladakh",
            "jammu and kashmir"
        ]
        
        for state in indian_states:
            if state in query_lower:
                filters['state_name'] = state.title()
                break
        
        # Category keywords
        category_keywords = {
            'agriculture': ['farming', 'farmer', 'agriculture', 'crop', 'irrigation'],
            'education': ['education', 'student', 'school', 'scholarship', 'learning'],
            'health': ['health', 'medical', 'hospital', 'doctor', 'healthcare'],
            'employment': ['job', 'employment', 'skill', 'training', 'career'],
            'women': ['women', 'girl', 'mother', 'female'],
            'youth': ['youth', 'young', 'teenager'],
            'senior citizens': ['senior', 'elderly', 'old age', 'pension'],
            'disability': ['disability', 'disabled', 'differently abled'],
            'housing': ['house', 'home', 'housing', 'shelter'],
            'business': ['business', 'entrepreneur', 'startup', 'msme']
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                filters['category'] = category.title()
                break
        
        return filters
    
    def _rank_schemes_by_relevance(self, schemes: List[Tuple[SchemeDocument, float]], 
                                  query: str) -> List[Dict[str, Any]]:
        """Rank and format schemes by relevance"""
        ranked_schemes = []
        
        for doc, similarity_score in schemes:
            # Calculate additional relevance factors
            relevance_score = similarity_score
            
            # Boost score if query terms appear in scheme name
            query_words = set(query.lower().split())
            scheme_name_words = set(doc.metadata.get('scheme_name', '').lower().split())
            name_overlap = len(query_words.intersection(scheme_name_words))
            if name_overlap > 0:
                relevance_score += 0.1 * name_overlap
            
            # Format scheme for response
            scheme_info = {
                'scheme_id': doc.metadata.get('scheme_id', ''),
                'scheme_name': doc.metadata.get('scheme_name', ''),
                'category': doc.metadata.get('category', ''),
                'state': doc.metadata.get('state_name', ''),
                'ministry': doc.metadata.get('implementing_ministry', ''),
                'description': doc.content[:500] + "..." if len(doc.content) > 500 else doc.content,
                'relevance_score': float(relevance_score),
                'similarity_score': float(similarity_score)
            }
            
            ranked_schemes.append(scheme_info)
        
        # Sort by relevance score
        ranked_schemes.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return ranked_schemes
    
    def _generate_response(self, query: str, relevant_schemes: List[Dict[str, Any]]) -> str:
        """Generate natural language response using retrieved schemes"""
        
        if not self.openai_enabled:
            return self._generate_fallback_response(query, relevant_schemes)
        
        # Prepare context from relevant schemes
        context = ""
        for i, scheme in enumerate(relevant_schemes[:5], 1):  # Top 5 schemes
            context += f"\n{i}. {scheme['scheme_name']} ({scheme['category']})\n"
            context += f"   State: {scheme['state']}\n"
            context += f"   Ministry: {scheme['ministry']}\n"
            context += f"   Description: {scheme['description'][:300]}...\n"
        
        # Create prompt
        system_prompt = """You are a helpful assistant that provides information about Indian government schemes. 
        Based on the user's query and the relevant schemes provided, give a comprehensive and helpful response.
        Focus on the most relevant schemes and provide practical guidance."""
        
        user_prompt = f"""
        User Query: {query}
        
        Relevant Government Schemes:
        {context}
        
        Please provide a helpful response that:
        1. Addresses the user's specific query
        2. Recommends the most relevant schemes
        3. Provides key details like eligibility, benefits, and application process
        4. Is easy to understand and actionable
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Failed to generate AI response: {e}")
            return self._generate_fallback_response(query, relevant_schemes)
    
    def _generate_fallback_response(self, query: str, relevant_schemes: List[Dict[str, Any]]) -> str:
        """Generate response without AI (fallback mode)"""
        
        if not relevant_schemes:
            return "I couldn't find any relevant government schemes for your query. Please try rephrasing your question or contact the relevant government department."
        
        response = f"Based on your query '{query}', here are the most relevant government schemes:\n\n"
        
        for i, scheme in enumerate(relevant_schemes[:3], 1):
            response += f"{i}. **{scheme['scheme_name']}**\n"
            response += f"   • Category: {scheme['category']}\n"
            response += f"   • State: {scheme['state']}\n"
            response += f"   • Ministry: {scheme['ministry']}\n"
            response += f"   • Description: {scheme['description'][:200]}...\n\n"
        
        if len(relevant_schemes) > 3:
            response += f"Found {len(relevant_schemes)} total schemes. The above are the most relevant matches.\n"
        
        response += "\nFor detailed information about eligibility and application process, please visit the official government portals or contact the implementing agencies."
        
        return response
    
    def query(self, user_query: str, max_schemes: int = 10, 
              additional_filters: Optional[Dict[str, Any]] = None) -> QueryResult:
        """Main query function for the RAG system"""
        
        start_time = time.time()
        
        # Check cache
        cache_key = f"{user_query}_{max_schemes}_{str(additional_filters)}"
        if cache_key in self.query_cache:
            cached_result, timestamp = self.query_cache[cache_key]
            if time.time() - timestamp < self.cache_timeout:
                logger.info("Returning cached result")
                return cached_result
        
        # Get query embedding
        query_embedding = self._get_query_embedding(user_query)
        if query_embedding is None:
            return QueryResult(
                query=user_query,
                response="Sorry, I'm unable to process your query at the moment. Please try again later.",
                relevant_schemes=[],
                confidence_score=0.0,
                processing_time=time.time() - start_time,
                metadata={'error': 'Failed to generate query embedding'}
            )
        
        # Extract filters from query
        query_filters = self._extract_query_filters(user_query)
        if additional_filters:
            query_filters.update(additional_filters)
        
        # Search vector store
        search_results = self.vector_store.search(
            query_embedding=query_embedding,
            k=max_schemes,
            filters=query_filters if query_filters else None
        )
        
        # Rank schemes by relevance
        relevant_schemes = self._rank_schemes_by_relevance(search_results, user_query)
        
        # Generate response
        response = self._generate_response(user_query, relevant_schemes)
        
        # Calculate confidence score
        confidence_score = 0.0
        if relevant_schemes:
            # Average of top 3 similarity scores
            top_scores = [s['similarity_score'] for s in relevant_schemes[:3]]
            confidence_score = sum(top_scores) / len(top_scores) if top_scores else 0.0
        
        processing_time = time.time() - start_time
        
        # Create result
        result = QueryResult(
            query=user_query,
            response=response,
            relevant_schemes=relevant_schemes,
            confidence_score=confidence_score,
            processing_time=processing_time,
            metadata={
                'filters_applied': query_filters,
                'total_schemes_found': len(relevant_schemes),
                'openai_enabled': self.openai_enabled
            }
        )
        
        # Cache result
        self.query_cache[cache_key] = (result, time.time())
        
        logger.info(f"Query processed in {processing_time:.2f}s, found {len(relevant_schemes)} schemes")
        
        return result
    
    def get_scheme_by_id(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific scheme"""
        doc = self.vector_store.get_document_by_id(scheme_id)
        if doc:
            return {
                'scheme_id': doc.metadata.get('scheme_id', ''),
                'scheme_name': doc.metadata.get('scheme_name', ''),
                'category': doc.metadata.get('category', ''),
                'state': doc.metadata.get('state_name', ''),
                'ministry': doc.metadata.get('implementing_ministry', ''),
                'full_content': doc.content,
                'metadata': doc.metadata
            }
        return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Get RAG system statistics"""
        vector_stats = self.vector_store.get_stats()
        
        return {
            'vector_store_stats': vector_stats,
            'openai_enabled': self.openai_enabled,
            'embedding_model': self.embedding_model,
            'chat_model': self.chat_model,
            'cache_size': len(self.query_cache),
            'available_categories': self.vector_store.get_all_metadata_values('category'),
            'available_states': self.vector_store.get_all_metadata_values('state_name')
        }
