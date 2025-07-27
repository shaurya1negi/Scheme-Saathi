"""
Vector Store Implementation for Government Schemes RAG
Handles vector embeddings storage and retrieval using FAISS
"""

import numpy as np
import json
import pickle
import faiss
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import logging
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SchemeDocument:
    """Represents a government scheme document for vector storage"""
    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[np.ndarray] = None

class VectorStore:
    """FAISS-based vector store for government schemes"""
    
    def __init__(self, embedding_dim: int = 1536, index_path: str = "data/index"):
        self.embedding_dim = embedding_dim
        self.index_path = Path(index_path)
        self.index_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize FAISS index
        self.index = faiss.IndexFlatIP(embedding_dim)  # Inner product for cosine similarity
        self.documents: List[SchemeDocument] = []
        self.id_to_doc: Dict[str, SchemeDocument] = {}
        
        logger.info(f"Initialized VectorStore with embedding dimension: {embedding_dim}")
    
    def add_document(self, doc: SchemeDocument) -> None:
        """Add a single document to the vector store"""
        if doc.embedding is None:
            raise ValueError("Document must have an embedding")
        
        # Normalize embedding for cosine similarity
        embedding = doc.embedding.astype('float32')
        embedding = embedding / np.linalg.norm(embedding)
        
        # Add to FAISS index
        self.index.add(embedding.reshape(1, -1))
        
        # Store document
        self.documents.append(doc)
        self.id_to_doc[doc.id] = doc
        
        logger.debug(f"Added document {doc.id} to vector store")
    
    def add_documents(self, docs: List[SchemeDocument]) -> None:
        """Add multiple documents to the vector store"""
        logger.info(f"Adding {len(docs)} documents to vector store...")
        
        # Prepare embeddings
        embeddings = []
        for doc in docs:
            if doc.embedding is None:
                raise ValueError(f"Document {doc.id} must have an embedding")
            
            # Normalize embedding
            embedding = doc.embedding.astype('float32')
            embedding = embedding / np.linalg.norm(embedding)
            embeddings.append(embedding)
        
        # Batch add to FAISS
        embeddings_matrix = np.vstack(embeddings)
        self.index.add(embeddings_matrix)
        
        # Store documents
        for doc in docs:
            self.documents.append(doc)
            self.id_to_doc[doc.id] = doc
        
        logger.info(f"Successfully added {len(docs)} documents. Total: {len(self.documents)}")
    
    def search(self, query_embedding: np.ndarray, k: int = 10, 
               filters: Optional[Dict[str, Any]] = None) -> List[Tuple[SchemeDocument, float]]:
        """Search for similar documents"""
        
        # Normalize query embedding
        query_embedding = query_embedding.astype('float32')
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        
        # Search in FAISS
        scores, indices = self.index.search(query_embedding.reshape(1, -1), 
                                          min(k * 2, len(self.documents)))  # Get more for filtering
        
        # Collect results
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents):
                doc = self.documents[idx]
                
                # Apply filters if provided
                if filters and not self._matches_filters(doc, filters):
                    continue
                
                results.append((doc, float(score)))
                
                if len(results) >= k:
                    break
        
        logger.debug(f"Search returned {len(results)} results")
        return results
    
    def _matches_filters(self, doc: SchemeDocument, filters: Dict[str, Any]) -> bool:
        """Check if document matches the given filters"""
        for key, value in filters.items():
            if key in doc.metadata:
                doc_value = doc.metadata[key]
                
                # Handle different filter types
                if isinstance(value, list):
                    if doc_value not in value:
                        return False
                elif isinstance(value, str):
                    if value.lower() not in str(doc_value).lower():
                        return False
                else:
                    if doc_value != value:
                        return False
            else:
                return False
        
        return True
    
    def get_document_by_id(self, doc_id: str) -> Optional[SchemeDocument]:
        """Retrieve a document by its ID"""
        return self.id_to_doc.get(doc_id)
    
    def get_all_metadata_values(self, field: str) -> List[Any]:
        """Get all unique values for a metadata field"""
        values = set()
        for doc in self.documents:
            if field in doc.metadata:
                values.add(doc.metadata[field])
        return list(values)
    
    def save(self, filepath: str = None) -> None:
        """Save the vector store to disk"""
        if filepath is None:
            filepath = self.index_path / "vector_store"
        
        filepath = Path(filepath)
        
        # Save FAISS index
        faiss.write_index(self.index, str(filepath.with_suffix('.faiss')))
        
        # Save documents (without embeddings to save space)
        docs_data = []
        for doc in self.documents:
            doc_data = {
                'id': doc.id,
                'content': doc.content,
                'metadata': doc.metadata
            }
            docs_data.append(doc_data)
        
        with open(filepath.with_suffix('.pkl'), 'wb') as f:
            pickle.dump(docs_data, f)
        
        logger.info(f"Saved vector store with {len(self.documents)} documents to {filepath}")
    
    def load(self, filepath: str = None) -> None:
        """Load the vector store from disk"""
        if filepath is None:
            filepath = self.index_path / "vector_store"
        
        filepath = Path(filepath)
        
        # Load FAISS index
        if filepath.with_suffix('.faiss').exists():
            self.index = faiss.read_index(str(filepath.with_suffix('.faiss')))
            logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors")
        
        # Load documents
        if filepath.with_suffix('.pkl').exists():
            with open(filepath.with_suffix('.pkl'), 'rb') as f:
                docs_data = pickle.load(f)
            
            # Reconstruct documents (without embeddings)
            self.documents = []
            self.id_to_doc = {}
            
            for doc_data in docs_data:
                doc = SchemeDocument(
                    id=doc_data['id'],
                    content=doc_data['content'],
                    metadata=doc_data['metadata']
                )
                self.documents.append(doc)
                self.id_to_doc[doc.id] = doc
            
            logger.info(f"Loaded {len(self.documents)} documents")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        return {
            'total_documents': len(self.documents),
            'embedding_dimension': self.embedding_dim,
            'index_size': self.index.ntotal,
            'unique_categories': len(self.get_all_metadata_values('category')),
            'unique_states': len(self.get_all_metadata_values('state_name')),
            'unique_ministries': len(self.get_all_metadata_values('implementing_ministry'))
        }

class SchemeVectorStore(VectorStore):
    """Specialized vector store for government schemes"""
    
    def search_by_category(self, query_embedding: np.ndarray, category: str, 
                          k: int = 10) -> List[Tuple[SchemeDocument, float]]:
        """Search schemes within a specific category"""
        filters = {'category': category}
        return self.search(query_embedding, k, filters)
    
    def search_by_state(self, query_embedding: np.ndarray, state: str, 
                       k: int = 10) -> List[Tuple[SchemeDocument, float]]:
        """Search schemes for a specific state"""
        filters = {'state_name': state}
        return self.search(query_embedding, k, filters)
    
    def search_by_ministry(self, query_embedding: np.ndarray, ministry: str, 
                          k: int = 10) -> List[Tuple[SchemeDocument, float]]:
        """Search schemes by implementing ministry"""
        filters = {'implementing_ministry': ministry}
        return self.search(query_embedding, k, filters)
    
    def get_schemes_by_eligibility(self, user_profile: Dict[str, Any], 
                                  k: int = 10) -> List[Tuple[SchemeDocument, float]]:
        """Get schemes based on user eligibility profile"""
        # This would implement more complex eligibility matching
        # For now, we'll use basic filtering
        filters = {}
        
        if 'state' in user_profile:
            filters['state_name'] = user_profile['state']
        
        if 'category_interest' in user_profile:
            filters['category'] = user_profile['category_interest']
        
        # Create a dummy query embedding (would be user's query embedding in practice)
        dummy_query = np.random.random(self.embedding_dim)
        return self.search(dummy_query, k, filters)
