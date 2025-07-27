#!/usr/bin/env python3

import os
import sys
import json
from pathlib import Path

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langchain_rag import RAGEngine

def setup_with_small_dataset():
    """Setup RAG system with small test dataset to avoid rate limits"""
    
    print("🧪 Setting up RAG with small test dataset")
    print("=" * 50)
    
    # Use test dataset
    test_dataset_path = "../data/raw/test_schemes_small.json"
    
    if not os.path.exists(test_dataset_path):
        print("❌ Test dataset not found. Run create_test_dataset.py first")
        return False
    
    try:
        print("🔧 Initializing RAG engine...")
        rag = RAGEngine(data_file=test_dataset_path)
        
        print("📊 Setting up vector store...")
        success = rag.setup_vector_store()
        
        if success:
            print("✅ RAG system setup complete!")
            print("🎓 Education schemes included in test dataset")
            print("💡 You can now test education queries")
            return True
        else:
            print("❌ Vector store setup failed")
            return False
            
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return False

def test_setup():
    """Test the setup with a simple query"""
    
    print("\n🧪 Testing setup...")
    
    try:
        rag = RAGEngine()
        rag.load_vector_store()
        
        # Test query
        result = rag.query("education schemes")
        
        if result and result.get('success'):
            print("✅ Test query successful!")
            sources = result.get('sources', [])
            education_found = any('education' in s.get('category', '').lower() for s in sources)
            
            if education_found:
                print("🎓 ✅ Education schemes found in results!")
            else:
                print("⚠️  No education schemes in test results")
                
            return True
        else:
            print("❌ Test query failed")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = setup_with_small_dataset()
    
    if success:
        print("\n" + "=" * 50)
        print("🎉 SETUP COMPLETE!")
        print("=" * 50)
        print("Next steps:")
        print("1. Test with: curl -X POST http://localhost:8000/query \\")
        print("   -d '{\"query\": \"education schemes\", \"max_results\": 3}'")
        print("2. If working, you can expand to full dataset later")
        print("=" * 50)
    else:
        print("\n❌ Setup failed - check API key and rate limits")
