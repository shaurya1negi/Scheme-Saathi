#!/usr/bin/env python3
"""
Simple test script to check RAG system functionality
"""

import requests
import json
import sys

def test_rag_system():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing RAG System...")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Health Check:")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Server is healthy")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False
    
    # Test 2: System Stats
    print("\n2. System Statistics:")
    try:
        response = requests.get(f"{base_url}/stats")
        if response.status_code == 200:
            stats = response.json()
            print("✅ System stats retrieved")
            print(f"   Gemini Enabled: {stats.get('gemini_enabled')}")
            print(f"   Vector Store Ready: {stats.get('vector_store_ready')}")
            print(f"   QA Chain Ready: {stats.get('qa_chain_ready')}")
            print(f"   Total Documents: {stats.get('total_documents')}")
            print(f"   Status: {stats.get('status')}")
            print(f"   Embedding Model: {stats.get('embedding_model')}")
            print(f"   LLM Model: {stats.get('llm_model')}")
        else:
            print(f"❌ Stats check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot get stats: {e}")
    
    # Test 3: Simple Query
    print("\n3. Test Query:")
    try:
        query_data = {
            "query": "agriculture schemes in Tamil Nadu",
            "include_sources": True
        }
        response = requests.post(
            f"{base_url}/query",
            json=query_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Query successful!")
            print(f"   Answer: {result.get('answer', 'No answer')[:200]}...")
            print(f"   Total Sources: {result.get('total_sources', 0)}")
            if result.get('sources'):
                print(f"   First Source: {result['sources'][0].get('scheme_name', 'Unknown')}")
        else:
            print(f"❌ Query failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Query error: {e}")
    
    # Test 4: Filtered Search
    print("\n4. Test Filtered Search:")
    try:
        search_data = {
            "query": "employment schemes",
            "state": "Tamil Nadu",
            "category": "Employment"
        }
        response = requests.post(
            f"{base_url}/search",
            json=search_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Filtered search successful!")
            print(f"   Total Found: {result.get('total_found', 0)}")
            if result.get('results'):
                print(f"   First Result: {result['results'][0].get('scheme_name', 'Unknown')}")
        else:
            print(f"❌ Filtered search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Filtered search error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 RAG System Test Complete!")
    return True

if __name__ == "__main__":
    test_rag_system()
