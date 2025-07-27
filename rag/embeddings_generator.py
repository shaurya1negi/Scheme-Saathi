"""
Embeddings Generator for Government Schemes Dataset
Processes the mega schemes JSON and generates vector embeddings
"""

import json
import numpy as np
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging
from openai import OpenAI
import time
import os
from dotenv import load_dotenv
from vector_store import SchemeDocument, SchemeVectorStore
import tiktoken
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.console import Console

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
console = Console()

class EmbeddingsGenerator:
    """Generates embeddings for government schemes using OpenAI API"""
    
    def __init__(self, openai_api_key: Optional[str] = None, model: str = "text-embedding-3-small"):
        self.api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = model
        self.encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")  # Use GPT-3.5 encoding as fallback
        
        # Embedding model parameters
        self.max_tokens = 8192  # Max tokens for text-embedding-3-small
        self.embedding_dim = 1536  # Dimension for text-embedding-3-small
        
        logger.info(f"Initialized EmbeddingsGenerator with model: {model}")
    
    def _create_scheme_text(self, scheme: Dict[str, Any]) -> str:
        """Create searchable text representation of a scheme"""
        
        # Core information
        text_parts = []
        
        # Basic info
        text_parts.append(f"Scheme: {scheme.get('scheme_name', '')}")
        text_parts.append(f"Category: {scheme.get('category', '')}")
        text_parts.append(f"Ministry: {scheme.get('implementing_ministry', '')}")
        text_parts.append(f"State: {scheme.get('state_name', '')}")
        
        # Description
        if scheme.get('description'):
            text_parts.append(f"Description: {scheme['description']}")
        
        if scheme.get('detailed_description'):
            text_parts.append(f"Details: {scheme['detailed_description']}")
        
        # Objectives
        if scheme.get('objectives') and isinstance(scheme['objectives'], list):
            objectives_text = " ".join(scheme['objectives'])
            text_parts.append(f"Objectives: {objectives_text}")
        
        # Target beneficiaries
        if scheme.get('target_beneficiaries'):
            text_parts.append(f"Beneficiaries: {scheme['target_beneficiaries']}")
        
        # Eligibility
        if scheme.get('eligibility_criteria'):
            text_parts.append(f"Eligibility: {scheme['eligibility_criteria']}")
        
        # Financial assistance
        if scheme.get('financial_assistance'):
            text_parts.append(f"Financial Support: {scheme['financial_assistance']}")
        
        # Application process
        if scheme.get('application_process'):
            text_parts.append(f"Application: {scheme['application_process']}")
        
        # Innovation features
        if scheme.get('innovation_features'):
            text_parts.append(f"Features: {scheme['innovation_features']}")
        
        # State-specific adaptations
        if scheme.get('state_specific_adaptations'):
            text_parts.append(f"State Adaptations: {scheme['state_specific_adaptations']}")
        
        full_text = " | ".join(text_parts)
        
        # Truncate if too long
        tokens = self.encoding.encode(full_text)
        if len(tokens) > self.max_tokens:
            # Truncate and decode back
            truncated_tokens = tokens[:self.max_tokens]
            full_text = self.encoding.decode(truncated_tokens)
        
        return full_text
    
    def _extract_metadata(self, scheme: Dict[str, Any]) -> Dict[str, Any]:
        """Extract metadata for filtering and searching"""
        return {
            'scheme_id': scheme.get('scheme_id', ''),
            'scheme_name': scheme.get('scheme_name', ''),
            'category': scheme.get('category', ''),
            'sub_category': scheme.get('sub_category', ''),
            'implementing_ministry': scheme.get('implementing_ministry', ''),
            'implementing_agency': scheme.get('implementing_agency', ''),
            'state_name': scheme.get('state_name', ''),
            'state_capital': scheme.get('state_capital', ''),
            'launch_year': scheme.get('launch_year', ''),
            'scheme_type': scheme.get('scheme_type', ''),
            'priority_level': scheme.get('priority_level', ''),
            'budget_allocation': scheme.get('budget_allocation', ''),
            'state_budget_allocation': scheme.get('state_budget_allocation', ''),
            'beneficiaries_covered': scheme.get('beneficiaries_covered', ''),
            'state_language': scheme.get('state_language', ''),
            'region': scheme.get('region', ''),
        }
    
    def get_embedding(self, text: str, retries: int = 3) -> Optional[np.ndarray]:
        """Get embedding for a single text with retry logic"""
        for attempt in range(retries):
            try:
                response = self.client.embeddings.create(
                    model=self.model,
                    input=text
                )
                embedding = np.array(response.data[0].embedding)
                return embedding
            
            except Exception as e:
                if attempt < retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Embedding request failed (attempt {attempt + 1}), retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Failed to get embedding after {retries} attempts: {e}")
                    return None
    
    def get_embeddings_batch(self, texts: List[str], batch_size: int = 100) -> List[Optional[np.ndarray]]:
        """Get embeddings for multiple texts in batches"""
        embeddings = []
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console
        ) as progress:
            
            task = progress.add_task("Generating embeddings...", total=len(texts))
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch_embeddings = []
                
                for text in batch:
                    embedding = self.get_embedding(text)
                    batch_embeddings.append(embedding)
                    progress.advance(task)
                    
                    # Rate limiting - be respectful to API
                    time.sleep(0.1)
                
                embeddings.extend(batch_embeddings)
        
        return embeddings
    
    def process_schemes_dataset(self, dataset_path: str, output_dir: str = "data/embeddings",
                               batch_size: int = 50) -> SchemeVectorStore:
        """Process the full schemes dataset and generate embeddings"""
        
        dataset_path = Path(dataset_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        console.print(f"[bold blue]Loading dataset from: {dataset_path}[/bold blue]")
        
        # Load the dataset
        with open(dataset_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        schemes = data.get('schemes', [])
        console.print(f"[green]Loaded {len(schemes)} schemes[/green]")
        
        # Create documents
        console.print("[bold blue]Processing schemes...[/bold blue]")
        documents = []
        texts = []
        
        for scheme in schemes:
            text = self._create_scheme_text(scheme)
            metadata = self._extract_metadata(scheme)
            
            doc = SchemeDocument(
                id=scheme.get('scheme_id', f"scheme_{len(documents)}"),
                content=text,
                metadata=metadata
            )
            
            documents.append(doc)
            texts.append(text)
        
        # Generate embeddings
        console.print("[bold blue]Generating embeddings...[/bold blue]")
        embeddings = self.get_embeddings_batch(texts, batch_size)
        
        # Add embeddings to documents
        valid_documents = []
        for doc, embedding in zip(documents, embeddings):
            if embedding is not None:
                doc.embedding = embedding
                valid_documents.append(doc)
            else:
                logger.warning(f"Skipping document {doc.id} due to embedding failure")
        
        console.print(f"[green]Successfully generated embeddings for {len(valid_documents)} documents[/green]")
        
        # Create vector store
        vector_store = SchemeVectorStore(
            embedding_dim=self.embedding_dim,
            index_path=str(output_dir / "index")
        )
        
        # Add documents to vector store
        console.print("[bold blue]Building vector index...[/bold blue]")
        vector_store.add_documents(valid_documents)
        
        # Save vector store
        vector_store.save(str(output_dir / "scheme_vector_store"))
        
        # Save processing metadata
        metadata = {
            'dataset_path': str(dataset_path),
            'total_schemes': len(schemes),
            'processed_schemes': len(valid_documents),
            'embedding_model': self.model,
            'embedding_dimension': self.embedding_dim,
            'processing_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'vector_store_stats': vector_store.get_stats()
        }
        
        with open(output_dir / "processing_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        console.print(f"[bold green]✅ Vector store created successfully![/bold green]")
        console.print(f"[green]Stats: {vector_store.get_stats()}[/green]")
        
        return vector_store

def main():
    """Main function to process the mega schemes dataset"""
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        console.print("[bold red]❌ Error: OPENAI_API_KEY environment variable not set[/bold red]")
        console.print("[yellow]Please set your OpenAI API key:[/yellow]")
        console.print("[yellow]export OPENAI_API_KEY='your-api-key-here'[/yellow]")
        return
    
    # Dataset path
    dataset_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    
    if not Path(dataset_path).exists():
        console.print(f"[bold red]❌ Error: Dataset not found at {dataset_path}[/bold red]")
        return
    
    try:
        # Initialize generator
        generator = EmbeddingsGenerator()
        
        # Process dataset
        vector_store = generator.process_schemes_dataset(
            dataset_path=dataset_path,
            output_dir="data/embeddings",
            batch_size=50  # Adjust based on API rate limits
        )
        
        console.print("[bold green]🎉 RAG embeddings generation completed successfully![/bold green]")
        console.print(f"[green]Vector store saved with {len(vector_store.documents)} schemes[/green]")
        
    except Exception as e:
        console.print(f"[bold red]❌ Error: {e}[/bold red]")
        logger.exception("Failed to process dataset")

if __name__ == "__main__":
    main()
