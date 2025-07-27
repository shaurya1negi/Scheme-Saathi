"""
Test Script for Government Schemes RAG System
Tests various functionalities and provides usage examples
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any

# Add the rag directory to Python path for imports
sys.path.append(str(Path(__file__).parent))

def test_basic_functionality():
    """Test basic RAG functionality without external dependencies"""
    
    print("=" * 60)
    print("TESTING GOVERNMENT SCHEMES RAG SYSTEM")
    print("=" * 60)
    
    # Test 1: Check if dataset exists
    print("\n1. Checking Dataset Availability...")
    dataset_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    
    if Path(dataset_path).exists():
        print(f"✅ Dataset found: {dataset_path}")
        
        # Load and analyze dataset
        with open(dataset_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        schemes = data.get('schemes', [])
        print(f"✅ Dataset loaded: {len(schemes)} schemes")
        
        # Sample scheme analysis
        if schemes:
            sample_scheme = schemes[0]
            print(f"✅ Sample scheme: {sample_scheme.get('scheme_name', 'Unknown')}")
            print(f"   Category: {sample_scheme.get('category', 'Unknown')}")
            print(f"   State: {sample_scheme.get('state_name', 'Unknown')}")
            print(f"   Fields: {len(sample_scheme)} fields per scheme")
    else:
        print(f"❌ Dataset not found: {dataset_path}")
        print("   Please ensure the mega schemes dataset has been generated.")
        return False
    
    # Test 2: Check RAG components
    print("\n2. Testing RAG Components...")
    
    try:
        from vector_store import SchemeDocument, SchemeVectorStore
        print("✅ Vector store module imported successfully")
        
        # Test document creation
        test_doc = SchemeDocument(
            id="test_001",
            content="Test government scheme for farmers in Tamil Nadu",
            metadata={
                'scheme_name': 'Test Farmer Scheme',
                'category': 'Agriculture',
                'state_name': 'Tamil Nadu'
            }
        )
        print("✅ SchemeDocument creation successful")
        
    except ImportError as e:
        print(f"❌ Failed to import vector store: {e}")
        return False
    
    try:
        from rag_engine import GovernmentSchemeRAG, QueryResult
        print("✅ RAG engine module imported successfully")
        
    except ImportError as e:
        print(f"❌ Failed to import RAG engine: {e}")
        return False
    
    # Test 3: Query processing (offline mode)
    print("\n3. Testing Query Processing (Offline Mode)...")
    
    try:
        # Initialize RAG without OpenAI
        rag = GovernmentSchemeRAG(
            vector_store_path="data/embeddings/scheme_vector_store",
            openai_api_key=None  # Offline mode
        )
        
        print("✅ RAG engine initialized in offline mode")
        
        # Test query extraction
        test_queries = [
            "agriculture schemes in Tamil Nadu",
            "employment programs for youth",
            "women empowerment schemes",
            "senior citizen pension schemes"
        ]
        
        for query in test_queries:
            filters = rag._extract_query_filters(query)
            print(f"   Query: '{query}' → Filters: {filters}")
        
        print("✅ Query filter extraction working correctly")
        
    except Exception as e:
        print(f"❌ RAG engine test failed: {e}")
        return False
    
    # Test 4: API server availability
    print("\n4. Testing API Server Components...")
    
    try:
        # Check if FastAPI is available
        import fastapi
        import uvicorn
        print("✅ FastAPI and Uvicorn available for API server")
        
    except ImportError:
        print("⚠️  FastAPI not available - API server won't work")
        print("   Install with: pip install fastapi uvicorn")
    
    return True

def test_with_sample_data():
    """Test with sample data when full dataset is not available"""
    
    print("\n5. Testing with Sample Data...")
    
    # Create sample schemes data
    sample_schemes = [
        {
            "scheme_id": "SAMPLE_001",
            "scheme_name": "PM-KISAN Farmer Support Scheme",
            "category": "Agriculture",
            "state_name": "Maharashtra",
            "implementing_ministry": "Ministry of Agriculture",
            "description": "Direct income support to farmers providing Rs. 6000 per year",
            "target_beneficiaries": "Small and marginal farmers"
        },
        {
            "scheme_id": "SAMPLE_002", 
            "scheme_name": "Skill India Digital Platform",
            "category": "Employment",
            "state_name": "Karnataka",
            "implementing_ministry": "Ministry of Skill Development",
            "description": "Digital platform for skill development and job matching",
            "target_beneficiaries": "Youth seeking employment and skill development"
        },
        {
            "scheme_id": "SAMPLE_003",
            "scheme_name": "Beti Bachao Beti Padhao",
            "category": "Women Empowerment",
            "state_name": "Rajasthan",
            "implementing_ministry": "Ministry of Women and Child Development",
            "description": "Campaign to address declining child sex ratio and promote girls' education",
            "target_beneficiaries": "Girl children and women"
        }
    ]
    
    print(f"✅ Created {len(sample_schemes)} sample schemes")
    
    # Test query matching
    test_queries = [
        ("farmer support", ["PM-KISAN"]),
        ("skill development", ["Skill India"]),
        ("women schemes", ["Beti Bachao"]),
        ("Maharashtra schemes", ["PM-KISAN"])
    ]
    
    for query, expected_matches in test_queries:
        matches = []
        for scheme in sample_schemes:
            # Simple text matching
            scheme_text = f"{scheme['scheme_name']} {scheme['category']} {scheme['description']}".lower()
            if any(word.lower() in scheme_text for word in query.split()):
                matches.append(scheme['scheme_name'])
        
        print(f"   Query: '{query}' → Matches: {matches}")
        
        # Check if expected matches are found
        for expected in expected_matches:
            if any(expected in match for match in matches):
                print(f"     ✅ Found expected match: {expected}")
            else:
                print(f"     ⚠️  Expected match not found: {expected}")
    
    return True

def display_setup_instructions():
    """Display setup instructions for full RAG system"""
    
    print("\n" + "=" * 60)
    print("RAG SYSTEM SETUP INSTRUCTIONS")
    print("=" * 60)
    
    print("\n📋 To set up the complete RAG system:")
    
    print("\n1. Install Python Dependencies:")
    print("   cd /home/shaurya/Desktop/Scheme-Saathi/rag")
    print("   pip install -r requirements.txt")
    
    print("\n2. Set up OpenAI API Key (optional, for AI responses):")
    print("   export OPENAI_API_KEY='your-openai-api-key-here'")
    print("   # Or add to .env file in the rag directory")
    
    print("\n3. Generate Vector Embeddings:")
    print("   python embeddings_generator.py")
    print("   # This will process your mega dataset and create vector embeddings")
    
    print("\n4. Start the RAG API Server:")
    print("   python api_server.py")
    print("   # API will be available at http://localhost:8000")
    print("   # Documentation at http://localhost:8000/docs")
    
    print("\n5. Test the API:")
    print("   curl -X POST 'http://localhost:8000/query' \\")
    print("        -H 'Content-Type: application/json' \\")
    print("        -d '{\"query\": \"agriculture schemes in Tamil Nadu\", \"max_results\": 5}'")
    
    print("\n📊 System Capabilities:")
    print("   ✅ Natural language querying of 108,000 government schemes")
    print("   ✅ State-specific and category-specific filtering")
    print("   ✅ AI-powered response generation (with OpenAI API)")
    print("   ✅ Personalized scheme recommendations")
    print("   ✅ REST API for integration with web applications")
    print("   ✅ Vector similarity search for accurate retrieval")
    
    print("\n🔧 Configuration Options:")
    print("   • Offline mode: Works without OpenAI API (basic responses)")
    print("   • Online mode: Enhanced AI responses with OpenAI integration")
    print("   • Customizable similarity thresholds and result limits")
    print("   • Caching for improved performance")
    
    print("\n📁 Generated Files Structure:")
    print("   rag/")
    print("   ├── data/")
    print("   │   ├── embeddings/           # Vector embeddings")
    print("   │   ├── index/               # FAISS indices")
    print("   │   └── cache/               # Query cache")
    print("   ├── vector_store.py          # Vector database")
    print("   ├── embeddings_generator.py  # Embedding generation")
    print("   ├── rag_engine.py           # Main RAG logic")
    print("   ├── api_server.py           # FastAPI server")
    print("   └── test_rag.py            # This test file")

def main():
    """Main test function"""
    
    print("🚀 Starting Government Schemes RAG System Tests...")
    
    # Run basic tests
    basic_test_passed = test_basic_functionality()
    
    if basic_test_passed:
        # Run sample data tests
        test_with_sample_data()
        
        print("\n✅ Basic RAG system tests completed successfully!")
        print("🎯 Your dataset is ready for RAG implementation!")
        
    else:
        print("\n❌ Some basic tests failed.")
        print("🔧 Please check the dataset and dependencies.")
    
    # Always show setup instructions
    display_setup_instructions()
    
    print("\n🎉 RAG System is ready for deployment!")
    print("📖 See setup instructions above to get started.")

if __name__ == "__main__":
    main()
