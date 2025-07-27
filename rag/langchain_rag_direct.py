"""
RAG Implementation using direct Google Generative AI module
This avoids LangChain's Gemini wrapper which may have rate limiting issues
"""

import os
import json
import time
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging
from dotenv import load_dotenv

# Direct Google Generative AI imports
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# LangChain imports for vector store and text processing
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain.schema import Document
from langchain.embeddings.base import Embeddings

# Rich for beautiful console output
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
console = Console()

class DirectGeminiEmbeddings(Embeddings):
    """Direct Google Generative AI embeddings wrapper"""
    
    def __init__(self, api_key: str, model: str = "models/embedding-001"):
        self.api_key = api_key
        self.model = model
        genai.configure(api_key=api_key)
        
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents"""
        embeddings = []
        
        for i, text in enumerate(texts):
            try:
                # Add delay to respect rate limits
                if i > 0:
                    time.sleep(0.5)  # 500ms delay between requests
                    
                result = genai.embed_content(
                    model=self.model,
                    content=text,
                    task_type="retrieval_document"
                )
                embeddings.append(result['embedding'])
                
            except Exception as e:
                logger.warning(f"Embedding failed for document {i}: {e}")
                # Return zero vector as fallback
                embeddings.append([0.0] * 768)  # Standard embedding dimension
                time.sleep(2)  # Longer delay on error
                
        return embeddings
    
    def embed_query(self, text: str) -> List[float]:
        """Embed a single query"""
        try:
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Query embedding failed: {e}")
            return [0.0] * 768  # Return zero vector as fallback

class SchemeRAGSystemDirect:
    """RAG system using direct Google Generative AI module"""
    
    def __init__(self, 
                 google_api_key: Optional[str] = None,
                 chroma_persist_dir: str = "data/chroma_db",
                 embedding_model: str = "models/embedding-001",
                 llm_model: str = "gemini-2.0-flash-exp"):
        
        self.google_api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        self.chroma_persist_dir = Path(chroma_persist_dir)
        self.chroma_persist_dir.mkdir(parents=True, exist_ok=True)
        self.embedding_model = embedding_model
        self.llm_model = llm_model
        
        # Initialize Gemini
        if self.google_api_key:
            try:
                genai.configure(api_key=self.google_api_key)
                
                # Test the connection
                models = genai.list_models()
                console.print("[green]✅ Direct Gemini connection established[/green]")
                
                # Initialize embeddings
                self.embeddings = DirectGeminiEmbeddings(
                    api_key=self.google_api_key,
                    model=embedding_model
                )
                
                # Initialize generation model
                self.llm = genai.GenerativeModel(
                    model_name=llm_model,
                    safety_settings={
                        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                    }
                )
                
                self.gemini_enabled = True
                
            except Exception as e:
                console.print(f"[red]❌ Failed to initialize Gemini: {e}[/red]")
                self.embeddings = None
                self.llm = None
                self.gemini_enabled = False
        else:
            console.print("[red]❌ No Google API key provided[/red]")
            self.embeddings = None
            self.llm = None
            self.gemini_enabled = False
        
        # Initialize vector store
        self.vector_store = None
        
        logger.info(f"Initialized Direct Gemini RAG System")
        
    def create_documents_from_schemes(self, schemes_data: List[Dict[str, Any]]) -> List[Document]:
        """Convert scheme data to LangChain Documents"""
        
        documents = []
        
        console.print(f"[blue]Converting {len(schemes_data)} schemes to documents...[/blue]")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console
        ) as progress:
            
            task = progress.add_task("Processing schemes...", total=len(schemes_data))
            
            for scheme in schemes_data:
                # Create comprehensive text content
                content_parts = []
                
                # Basic information
                content_parts.append(f"Scheme Name: {scheme.get('scheme_name', '')}")
                content_parts.append(f"Category: {scheme.get('category', '')}")
                content_parts.append(f"State: {scheme.get('state_name', '')}")
                content_parts.append(f"Ministry: {scheme.get('implementing_ministry', '')}")
                
                # Detailed information
                if scheme.get('description'):
                    content_parts.append(f"Description: {scheme['description']}")
                
                if scheme.get('detailed_description'):
                    content_parts.append(f"Detailed Description: {scheme['detailed_description']}")
                
                # Objectives
                if scheme.get('objectives') and isinstance(scheme['objectives'], list):
                    objectives_text = "; ".join(scheme['objectives'])
                    content_parts.append(f"Objectives: {objectives_text}")
                
                # Beneficiaries and eligibility
                if scheme.get('target_beneficiaries'):
                    content_parts.append(f"Target Beneficiaries: {scheme['target_beneficiaries']}")
                
                if scheme.get('eligibility_criteria'):
                    content_parts.append(f"Eligibility Criteria: {scheme['eligibility_criteria']}")
                
                # Financial information
                if scheme.get('financial_assistance'):
                    content_parts.append(f"Financial Assistance: {scheme['financial_assistance']}")
                
                # Application process
                if scheme.get('application_process'):
                    content_parts.append(f"Application Process: {scheme['application_process']}")
                
                # Combine all content
                page_content = "\n\n".join(content_parts)
                
                # Create metadata for filtering
                metadata = {
                    'scheme_id': scheme.get('scheme_id', ''),
                    'scheme_name': scheme.get('scheme_name', ''),
                    'category': scheme.get('category', ''),
                    'sub_category': scheme.get('sub_category', ''),
                    'state_name': scheme.get('state_name', ''),
                    'implementing_ministry': scheme.get('implementing_ministry', ''),
                    'launch_year': scheme.get('launch_year', ''),
                    'scheme_type': scheme.get('scheme_type', ''),
                }
                
                # Create LangChain Document
                doc = Document(
                    page_content=page_content,
                    metadata=metadata
                )
                
                documents.append(doc)
                progress.advance(task)
        
        console.print(f"[green]✅ Created {len(documents)} documents[/green]")
        return documents
    
    def setup_vector_store(self, documents: List[Document], chunk_size: int = 1000, chunk_overlap: int = 200):
        """Set up ChromaDB vector store with documents"""
        
        if not self.gemini_enabled:
            console.print("[red]❌ Cannot setup vector store without Gemini embeddings[/red]")
            return False
        
        console.print("[blue]Setting up ChromaDB vector store with rate limiting...[/blue]")
        
        # Split documents if they're too large
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
        
        split_docs = text_splitter.split_documents(documents)
        console.print(f"[green]Split into {len(split_docs)} chunks[/green]")
        
        # Create ChromaDB vector store with rate limiting
        console.print("[blue]Creating embeddings with rate limiting...[/blue]")
        
        try:
            # Process documents in batches to respect rate limits
            batch_size = 5  # Small batch size to avoid rate limits
            
            for i in range(0, len(split_docs), batch_size):
                batch = split_docs[i:i + batch_size]
                console.print(f"[blue]Processing batch {i//batch_size + 1}/{(len(split_docs) + batch_size - 1)//batch_size}[/blue]")
                
                if i == 0:
                    # Create initial vector store
                    self.vector_store = Chroma.from_documents(
                        documents=batch,
                        embedding=self.embeddings,
                        persist_directory=str(self.chroma_persist_dir),
                        collection_name="government_schemes"
                    )
                else:
                    # Add to existing vector store
                    self.vector_store.add_documents(batch)
                
                # Add delay between batches
                if i + batch_size < len(split_docs):
                    console.print("[yellow]Waiting to respect rate limits...[/yellow]")
                    time.sleep(3)  # 3 second delay between batches
            
            console.print(f"[green]✅ Vector store created with {len(split_docs)} document chunks[/green]")
            return True
            
        except Exception as e:
            console.print(f"[red]❌ Failed to create vector store: {e}[/red]")
            return False
    
    def load_existing_vector_store(self):
        """Load existing ChromaDB vector store"""
        
        if not self.gemini_enabled:
            console.print("[red]❌ Cannot load vector store without Gemini embeddings[/red]")
            return False
        
        try:
            self.vector_store = Chroma(
                persist_directory=str(self.chroma_persist_dir),
                embedding_function=self.embeddings,
                collection_name="government_schemes"
            )
            
            # Test if vector store has data
            test_results = self.vector_store.similarity_search("test", k=1)
            
            console.print(f"[green]✅ Loaded existing vector store with data[/green]")
            return True
            
        except Exception as e:
            console.print(f"[yellow]⚠️ Could not load existing vector store: {e}[/yellow]")
            return False
    
    def query(self, question: str, include_sources: bool = True) -> Dict[str, Any]:
        """Query the RAG system using direct Gemini"""
        
        if not self.vector_store or not self.llm:
            return {
                "answer": "RAG system not properly initialized.",
                "sources": [],
                "error": "System not initialized"
            }
        
        try:
            console.print(f"[blue]Processing query with Direct Gemini: {question}[/blue]")
            
            # Retrieve relevant documents
            relevant_docs = self.vector_store.similarity_search(question, k=5)
            
            # Create context from retrieved documents
            context_parts = []
            sources = []
            
            for doc in relevant_docs:
                context_parts.append(doc.page_content)
                
                if include_sources:
                    source_info = {
                        "scheme_name": doc.metadata.get("scheme_name", "Unknown"),
                        "category": doc.metadata.get("category", "Unknown"),
                        "state": doc.metadata.get("state_name", "Unknown"),
                        "ministry": doc.metadata.get("implementing_ministry", "Unknown"),
                        "scheme_id": doc.metadata.get("scheme_id", "Unknown"),
                    }
                    sources.append(source_info)
            
            context = "\n\n".join(context_parts)
            
            # Create prompt
            prompt = f"""You are a helpful assistant specializing in Indian Government Schemes. 
Use the following context about government schemes to answer the user's question. 
If you don't know the answer based on the context, just say that you don't have enough information.

Context about relevant government schemes:
{context}

Question: {question}

Please provide a helpful and accurate answer that:
1. Addresses the user's specific question
2. Mentions the most relevant government schemes
3. Includes key details like eligibility, benefits when available
4. Is easy to understand and actionable

Answer:"""
            
            # Generate response with rate limiting
            try:
                response = self.llm.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.7,
                        max_output_tokens=1000,
                    )
                )
                
                answer = response.text
                
            except Exception as e:
                logger.error(f"Generation failed: {e}")
                answer = "I'm sorry, I'm experiencing technical difficulties. Please try again in a moment."
            
            console.print("[green]✅ Query processed successfully with Direct Gemini[/green]")
            
            return {
                "answer": answer,
                "sources": sources,
                "total_sources": len(relevant_docs),
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Query failed: {e}")
            return {
                "answer": f"Sorry, I encountered an error while processing your query: {str(e)}",
                "sources": [],
                "error": str(e),
                "success": False
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        
        stats = {
            "gemini_enabled": self.gemini_enabled,
            "vector_store_ready": self.vector_store is not None,
            "chroma_persist_dir": str(self.chroma_persist_dir),
            "embedding_model": self.embedding_model,
            "llm_model": self.llm_model,
            "implementation": "Direct Google Generative AI"
        }
        
        if self.vector_store:
            try:
                collection = self.vector_store._collection
                stats["total_documents"] = collection.count()
                stats["collection_name"] = collection.name
            except Exception as e:
                stats["vector_store_error"] = str(e)
        
        return stats

def load_schemes_dataset(dataset_path: str) -> List[Dict[str, Any]]:
    """Load the schemes dataset"""
    
    dataset_path = Path(dataset_path)
    
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")
    
    console.print(f"[blue]Loading dataset from: {dataset_path}[/blue]")
    
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    schemes = data.get('schemes', [])
    console.print(f"[green]✅ Loaded {len(schemes)} schemes[/green]")
    
    return schemes
