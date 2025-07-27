"""
LangChain-based RAG Implementation for Government Schemes
Uses LangChain's robust RAG pipeline with ChromaDB vector store and Google Gemini 2.0 Flash Experimental
"""

import os
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging
from dotenv import load_dotenv

# LangChain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain.schema import Document
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.callbacks.base import BaseCallbackHandler

# Rich for beautiful console output
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
console = Console()

class SchemeRAGSystem:
    """LangChain-based RAG system for Government Schemes using Google Gemini 2.0 Flash Experimental"""
    
    def __init__(self, 
                 google_api_key: Optional[str] = None,
                 chroma_persist_dir: str = "data/chroma_db",
                 embedding_model: str = "models/embedding-001",
                 llm_model: str = "gemini-1.5-pro"):
        
        self.google_api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        self.chroma_persist_dir = Path(chroma_persist_dir)
        self.chroma_persist_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize LangChain components with Gemini
        if self.google_api_key:
            try:
                # Set the API key in environment for LangChain
                os.environ["GOOGLE_API_KEY"] = self.google_api_key
                
                self.embeddings = GoogleGenerativeAIEmbeddings(
                    google_api_key=self.google_api_key,
                    model=embedding_model
                )
                self.llm = ChatGoogleGenerativeAI(
                    google_api_key=self.google_api_key,
                    model=llm_model,
                    temperature=0.7,
                    max_tokens=1000,
                    convert_system_message_to_human=True
                )
                self.gemini_enabled = True
                console.print("[green]✅ Gemini 1.5 Pro initialized successfully[/green]")
            except Exception as e:
                console.print(f"[red]❌ Failed to initialize Gemini: {e}[/red]")
                self.embeddings = None
                self.llm = None
                self.gemini_enabled = False
        else:
            console.print("[red]❌ No Google API key provided. Please set GOOGLE_API_KEY environment variable.[/red]")
            self.embeddings = None
            self.llm = None
            self.gemini_enabled = False
        
        # Initialize vector store
        self.vector_store = None
        self.qa_chain = None
        
        logger.info(f"Initialized SchemeRAGSystem with LangChain and Gemini 1.5 Pro")
        
    def create_documents_from_schemes(self, schemes_data: List[Dict[str, Any]]) -> List[Document]:
        """Convert scheme data to LangChain Documents"""
        
        documents = []
        
        console.print(f"[blue]Converting {len(schemes_data)} schemes to LangChain documents...[/blue]")
        
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
                
                if scheme.get('budget_allocation'):
                    content_parts.append(f"Budget Allocation: {scheme['budget_allocation']}")
                
                # Application process
                if scheme.get('application_process'):
                    content_parts.append(f"Application Process: {scheme['application_process']}")
                
                # State-specific information
                if scheme.get('state_specific_adaptations'):
                    content_parts.append(f"State Adaptations: {scheme['state_specific_adaptations']}")
                
                # Innovation features
                if scheme.get('innovation_features'):
                    content_parts.append(f"Innovation Features: {scheme['innovation_features']}")
                
                # Combine all content
                page_content = "\n\n".join(content_parts)
                
                # Create metadata for filtering
                metadata = {
                    'scheme_id': scheme.get('scheme_id', ''),
                    'scheme_name': scheme.get('scheme_name', ''),
                    'category': scheme.get('category', ''),
                    'sub_category': scheme.get('sub_category', ''),
                    'state_name': scheme.get('state_name', ''),
                    'state_capital': scheme.get('state_capital', ''),
                    'implementing_ministry': scheme.get('implementing_ministry', ''),
                    'implementing_agency': scheme.get('implementing_agency', ''),
                    'launch_year': scheme.get('launch_year', ''),
                    'scheme_type': scheme.get('scheme_type', ''),
                    'priority_level': scheme.get('priority_level', ''),
                    'region': scheme.get('region', ''),
                    'state_language': scheme.get('state_language', ''),
                }
                
                # Create LangChain Document
                doc = Document(
                    page_content=page_content,
                    metadata=metadata
                )
                
                documents.append(doc)
                progress.advance(task)
        
        console.print(f"[green]✅ Created {len(documents)} LangChain documents[/green]")
        return documents
    
    def setup_vector_store(self, documents: List[Document], chunk_size: int = 1000, chunk_overlap: int = 200):
        """Set up ChromaDB vector store with documents"""
        
        if not self.gemini_enabled:
            console.print("[red]❌ Cannot setup vector store without Gemini embeddings[/red]")
            return False
        
        console.print("[blue]Setting up ChromaDB vector store...[/blue]")
        
        # Split documents if they're too large
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
        
        console.print(f"[blue]Splitting documents with chunk_size={chunk_size}, overlap={chunk_overlap}[/blue]")
        split_docs = text_splitter.split_documents(documents)
        console.print(f"[green]Split into {len(split_docs)} chunks[/green]")
        
        # Create ChromaDB vector store
        console.print("[blue]Creating embeddings with Gemini and storing in ChromaDB...[/blue]")
        
        try:
            self.vector_store = Chroma.from_documents(
                documents=split_docs,
                embedding=self.embeddings,
                persist_directory=str(self.chroma_persist_dir),
                collection_name="government_schemes"
            )
            
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
    
    def setup_qa_chain(self):
        """Set up the Question-Answering chain"""
        
        if not self.vector_store or not self.llm:
            console.print("[red]❌ Cannot setup QA chain without vector store and Gemini LLM[/red]")
            return False
        
        # Create custom prompt template for government schemes
        prompt_template = """You are a helpful assistant specializing in Indian Government Schemes. 
        Use the following pieces of context about government schemes to answer the user's question. 
        If you don't know the answer based on the context, just say that you don't have enough information.

        Context about relevant government schemes:
        {context}

        Question: {question}

        Please provide a helpful and accurate answer that:
        1. Addresses the user's specific question
        2. Mentions the most relevant government schemes
        3. Includes key details like eligibility, benefits, and application process when relevant
        4. Provides state-specific information if applicable
        5. Is easy to understand and actionable
        6. No additional formatting including not limited to *,**,...
        7. Keep it short and conscise under 200 words
        8. Use blank lines between different schemes
        9. No pre-amble like based on, upon, etc. Just answer CONSCISELY
        10. Answer in the language used by user, like when hindi is typed as an english word, answer in hindi
        11. Strictly stick to one language, do not mix languages in the answer
        Answer:"""
        
        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Create retriever
        retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}  # Retrieve top 5 most similar chunks
        )
        
        # Create QA chain
        try:
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=retriever,
                chain_type_kwargs={"prompt": PROMPT},
                return_source_documents=True
            )
            
            console.print("[green]✅ QA chain setup complete[/green]")
            return True
        except Exception as e:
            console.print(f"[red]❌ Failed to setup QA chain: {e}[/red]")
            return False
    
    def query(self, question: str, include_sources: bool = True) -> Dict[str, Any]:
        """Query the RAG system"""
        
        if not self.qa_chain:
            return {
                "answer": "RAG system not properly initialized. Please set up vector store and QA chain first.",
                "sources": [],
                "error": "System not initialized"
            }
        
        try:
            console.print(f"[blue]Processing query with Gemini Flash: {question}[/blue]")
            
            # Get answer from QA chain
            result = self.qa_chain({"query": question})
            
            answer = result["result"]
            source_docs = result.get("source_documents", [])
            
            # Extract source information
            sources = []
            if include_sources:
                for doc in source_docs:
                    source_info = {
                        "scheme_name": doc.metadata.get("scheme_name", "Unknown"),
                        "category": doc.metadata.get("category", "Unknown"),
                        "state": doc.metadata.get("state_name", "Unknown"),
                        "ministry": doc.metadata.get("implementing_ministry", "Unknown"),
                        "scheme_id": doc.metadata.get("scheme_id", "Unknown"),
                        "content_preview": doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content
                    }
                    sources.append(source_info)
            
            console.print("[green]✅ Query processed successfully with Gemini Flash[/green]")
            
            return {
                "answer": answer,
                "sources": sources,
                "total_sources": len(source_docs),
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
    
    def filter_search(self, question: str, filters: Dict[str, str]) -> Dict[str, Any]:
        """Search with metadata filters"""
        
        if not self.vector_store:
            return {"error": "Vector store not initialized"}
        
        try:
            # Create filtered retriever
            retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={
                    "k": 5,
                    "filter": filters
                }
            )
            
            # Get relevant documents
            docs = retriever.get_relevant_documents(question)
            
            # Format results
            results = []
            for doc in docs:
                result = {
                    "scheme_name": doc.metadata.get("scheme_name", "Unknown"),
                    "category": doc.metadata.get("category", "Unknown"),
                    "state": doc.metadata.get("state_name", "Unknown"),
                    "ministry": doc.metadata.get("implementing_ministry", "Unknown"),
                    "content": doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content
                }
                results.append(result)
            
            return {
                "question": question,
                "filters": filters,
                "results": results,
                "total_found": len(results),
                "success": True
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "success": False
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        
        stats = {
            "gemini_enabled": self.gemini_enabled,
            "vector_store_ready": self.vector_store is not None,
            "qa_chain_ready": self.qa_chain is not None,
            "chroma_persist_dir": str(self.chroma_persist_dir),
            "embedding_model": "models/embedding-001",
            "llm_model": "gemini-1.5-pro"
        }
        
        if self.vector_store:
            try:
                # Get collection info
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
