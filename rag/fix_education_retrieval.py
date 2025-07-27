#!/usr/bin/env python3

import requests
import time

def rebuild_vector_store():
    """Rebuild the vector store to fix education scheme retrieval"""
    
    try:
        print("🔧 Rebuilding vector store...")
        
        response = requests.post("http://localhost:8000/setup", timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Vector store rebuilt successfully!")
            print(f"Status: {result.get('status', 'Unknown')}")
            print(f"Message: {result.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Setup failed: HTTP {response.status_code}")
            print(response.text)
            return False
            
    except requests.exceptions.Timeout:
        print("⏰ Setup is taking longer than expected...")
        print("This is normal for large datasets. Please wait.")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_education_query():
    """Test if education queries work after rebuild"""
    
    try:
        print("\n🧪 Testing education query...")
        
        response = requests.post(
            "http://localhost:8000/query",
            json={"query": "education schemes for students", "max_results": 3},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            
            education_found = any(
                'education' in source.get('category', '').lower() or 
                'education' in source.get('scheme_name', '').lower()
                for source in data.get('sources', [])
            )
            
            if education_found:
                print("✅ Education schemes now found!")
                print("Sample results:")
                for i, source in enumerate(data['sources'][:3], 1):
                    print(f"  {i}. {source['scheme_name']} ({source['category']})")
                return True
            else:
                print("⚠️  Still not finding education schemes")
                print("Retrieved schemes:")
                for i, source in enumerate(data['sources'][:3], 1):
                    print(f"  {i}. {source['scheme_name']} ({source['category']})")
                return False
        else:
            print(f"❌ Query failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing query: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Fixing education scheme retrieval issue...")
    
    # Try to rebuild
    result = rebuild_vector_store()
    
    if result is True:
        # Test immediately
        test_education_query()
    elif result is None:
        print("⏳ Please wait for setup to complete, then test manually.")
    else:
        print("❌ Failed to rebuild vector store.")
