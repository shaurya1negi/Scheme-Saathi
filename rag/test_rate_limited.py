#!/usr/bin/env python3

import os
import time
import requests
import json

def check_api_key():
    """Check if API key is set and test it with a simple call"""
    
    # Check if API key is in environment
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key or api_key == 'your-google-gemini-api-key-here':
        print("❌ API key not set in .env file")
        return False
    
    print("✅ API key found in environment")
    return True

def test_server_minimal():
    """Test server with minimal API calls due to rate limits"""
    
    print("🧪 Testing server with rate limit considerations...")
    print()
    
    try:
        # 1. Check health (no API calls)
        print("1. Checking server health...")
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is healthy")
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
            
        time.sleep(1)  # Rate limit protection
        
        # 2. Check stats (no API calls)
        print("2. Checking vector store stats...")
        response = requests.get("http://localhost:8000/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Vector store ready: {stats.get('vector_store_ready', False)}")
            print(f"📊 Documents: {stats.get('total_documents', 0)}")
            
            if stats.get('total_documents', 0) < 50000:
                print("⚠️  Low document count - vector store may be incomplete")
                print("💡 You may need to run setup, but this will use many API calls")
                return False
        else:
            print(f"❌ Stats check failed: {response.status_code}")
            return False
            
        time.sleep(2)  # Rate limit protection
        
        # 3. Test ONE simple query
        print("3. Testing one education query (uses API calls)...")
        print("⏳ This will use your API quota...")
        
        response = requests.post(
            "http://localhost:8000/query",
            json={"query": "education", "max_results": 2},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            sources = data.get('sources', [])
            
            print(f"✅ Query successful, got {len(sources)} results")
            
            # Check if we got education schemes
            education_found = any(
                'education' in source.get('category', '').lower() 
                for source in sources
            )
            
            if education_found:
                print("🎓 ✅ EDUCATION SCHEMES FOUND!")
                print("Sample results:")
                for source in sources[:2]:
                    print(f"  - {source.get('scheme_name', 'Unknown')} ({source.get('category', 'Unknown')})")
            else:
                print("❌ No education schemes returned")
                print("Retrieved categories:")
                for source in sources[:2]:
                    print(f"  - {source.get('scheme_name', 'Unknown')} ({source.get('category', 'Unknown')})")
                print("\n💡 Vector store may need rebuilding (will use lots of API calls)")
                
        else:
            print(f"❌ Query failed: {response.status_code}")
            if response.status_code == 429:
                print("🚫 Rate limit hit!")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def rate_limit_advice():
    """Provide advice for working with rate limits"""
    
    print("\n" + "="*60)
    print("📋 RATE LIMIT CONSIDERATIONS")
    print("="*60)
    print("""
⚠️  IMPORTANT: Vector store rebuild uses ~200,000+ API calls

CURRENT OPTIONS:
1. 🧪 Test current state (minimal API usage)
   - Check if education schemes work now
   - Use existing vector store if available

2. 🔄 Partial rebuild (moderate API usage)
   - Rebuild only if absolutely necessary
   - Monitor rate limits carefully

3. ⏳ Wait for rate limit reset
   - Google Gemini free tier resets daily
   - Full rebuild when limits refresh

RECOMMENDATION:
- First test with current vector store
- Only rebuild if education queries completely fail
- Consider using smaller dataset for testing

COMMANDS:
# Test current state
./test_education_fix.sh

# If broken, wait for rate limit reset, then:
curl -X POST http://localhost:8000/setup
    """)

if __name__ == "__main__":
    print("🔄 RATE-LIMITED TESTING MODE")
    print("="*40)
    
    if not check_api_key():
        print("\n💡 Please add your API key to .env file first")
        exit(1)
    
    success = test_server_minimal()
    rate_limit_advice()
    
    if success:
        print("\n✅ Test completed - check results above")
    else:
        print("\n❌ Issues found - see recommendations above")
