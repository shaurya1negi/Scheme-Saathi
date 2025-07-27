#!/usr/bin/env python3
"""
Test script for Gemini-based RAG system
Tests basic functionality without requiring API keys
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from rich.console import Console
from rich.panel import Panel

console = Console()

def test_imports():
    """Test that all required imports work"""
    console.print("[blue]Testing imports...[/blue]")
    
    try:
        from langchain_rag import SchemeRAGSystem, load_schemes_dataset
        console.print("✅ Main RAG system imports successful")
    except ImportError as e:
        console.print(f"❌ Failed to import RAG system: {e}")
        return False
    
    try:
        from langchain_api_server import app
        console.print("✅ API server imports successful")
    except ImportError as e:
        console.print(f"❌ Failed to import API server: {e}")
        return False
    
    return True

def test_rag_system_init():
    """Test RAG system initialization (without API key)"""
    console.print("[blue]Testing RAG system initialization...[/blue]")
    
    try:
        from langchain_rag import SchemeRAGSystem
        
        # Test initialization without API key
        rag_system = SchemeRAGSystem(google_api_key=None)
        
        if not rag_system.gemini_enabled:
            console.print("✅ RAG system correctly detects missing API key")
        else:
            console.print("⚠️ RAG system found API key in environment")
        
        # Test initialization with environment API key
        rag_system_env = SchemeRAGSystem()
        
        if rag_system_env.gemini_enabled:
            console.print("✅ RAG system successfully initialized with API key")
        else:
            console.print("❌ RAG system failed to initialize with API key")
            return False
        
        stats = rag_system.get_stats()
        expected_keys = ["gemini_enabled", "vector_store_ready", "qa_chain_ready", "embedding_model", "llm_model"]
        
        for key in expected_keys:
            if key not in stats:
                console.print(f"❌ Missing key in stats: {key}")
                return False
        
        console.print("✅ RAG system stats structure correct")
        return True
        
    except Exception as e:
        console.print(f"❌ RAG system initialization failed: {e}")
        return False

def test_dataset_loading():
    """Test dataset loading functionality"""
    console.print("[blue]Testing dataset loading...[/blue]")
    
    try:
        from langchain_rag import load_schemes_dataset
        
        dataset_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
        
        if not Path(dataset_path).exists():
            console.print(f"⚠️ Dataset not found at {dataset_path}")
            console.print("This is expected if the dataset hasn't been generated yet")
            return True
        
        schemes = load_schemes_dataset(dataset_path)
        
        if len(schemes) > 0:
            console.print(f"✅ Successfully loaded {len(schemes)} schemes")
            
            # Test document creation
            from langchain_rag import SchemeRAGSystem
            rag_system = SchemeRAGSystem(google_api_key=None)
            
            # Take just first 5 schemes for testing
            test_schemes = schemes[:5]
            documents = rag_system.create_documents_from_schemes(test_schemes)
            
            if len(documents) == len(test_schemes):
                console.print(f"✅ Successfully created {len(documents)} documents")
            else:
                console.print(f"❌ Document count mismatch: {len(documents)} vs {len(test_schemes)}")
                return False
        else:
            console.print("❌ No schemes loaded from dataset")
            return False
        
        return True
        
    except Exception as e:
        console.print(f"❌ Dataset loading failed: {e}")
        return False

def test_api_server():
    """Test API server startup (without actually running it)"""
    console.print("[blue]Testing API server configuration...[/blue]")
    
    try:
        from langchain_api_server import app
        
        # Check that FastAPI app was created
        if app is not None:
            console.print("✅ FastAPI app created successfully")
        else:
            console.print("❌ FastAPI app is None")
            return False
        
        # Check some key attributes
        if hasattr(app, 'title') and "Gemini" in app.title:
            console.print("✅ App title correctly mentions Gemini")
        else:
            console.print("❌ App title doesn't mention Gemini")
            return False
        
        return True
        
    except Exception as e:
        console.print(f"❌ API server test failed: {e}")
        return False

def main():
    """Run all tests"""
    console.print(Panel.fit("🧪 Testing Gemini RAG System", style="bold blue"))
    
    tests = [
        ("Import Tests", test_imports),
        ("RAG System Initialization", test_rag_system_init),
        ("Dataset Loading", test_dataset_loading),
        ("API Server Configuration", test_api_server),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        console.print(f"\n[bold yellow]Running: {test_name}[/bold yellow]")
        try:
            if test_func():
                passed += 1
                console.print(f"[green]✅ {test_name} PASSED[/green]")
            else:
                console.print(f"[red]❌ {test_name} FAILED[/red]")
        except Exception as e:
            console.print(f"[red]❌ {test_name} ERROR: {e}[/red]")
    
    console.print(f"\n[bold]Results: {passed}/{total} tests passed[/bold]")
    
    if passed == total:
        console.print(Panel("🎉 All tests passed! Gemini RAG system is ready.", style="bold green"))
        console.print("\n[bold blue]Next steps:[/bold blue]")
        console.print("1. Get your Google Gemini API key from: https://ai.google.dev/")
        console.print("2. Copy .env.example to .env and add your API key")
        console.print("3. Run: python langchain_api_server.py")
        console.print("4. Visit: http://localhost:8000/docs")
    else:
        console.print(Panel("❌ Some tests failed. Please check the errors above.", style="bold red"))

if __name__ == "__main__":
    main()
