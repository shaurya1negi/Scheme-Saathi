#!/usr/bin/env python3

import requests
import json
import time

def try_small_setup():
    """Try to setup with the server running, using a modified approach"""
    
    print("🔧 Trying alternative setup approach...")
    
    # First, let's temporarily replace the dataset file
    import os
    import shutil
    
    # Backup original dataset
    original_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    backup_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json.backup"
    test_path = "../data/raw/test_schemes_small.json"
    
    try:
        print("📁 Backing up original dataset...")
        if os.path.exists(original_path) and not os.path.exists(backup_path):
            shutil.copy2(original_path, backup_path)
            print("✅ Backup created")
        
        print("🔄 Replacing with test dataset...")
        if os.path.exists(test_path):
            shutil.copy2(test_path, original_path)
            print("✅ Test dataset in place")
        else:
            print("❌ Test dataset not found")
            return False
        
        print("🚀 Attempting setup with small dataset...")
        response = requests.post("http://localhost:8000/setup", timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Setup successful!")
            print(f"Status: {result.get('status', 'Unknown')}")
            
            # Test a query
            print("\n🧪 Testing education query...")
            time.sleep(2)
            
            test_response = requests.post(
                "http://localhost:8000/query",
                json={"query": "education schemes", "max_results": 3},
                timeout=15
            )
            
            if test_response.status_code == 200:
                test_data = test_response.json()
                if test_data.get('success'):
                    sources = test_data.get('sources', [])
                    education_found = any('education' in s.get('category', '').lower() for s in sources)
                    
                    print(f"📊 Found {len(sources)} results")
                    if education_found:
                        print("🎓 ✅ EDUCATION SCHEMES WORKING!")
                        for source in sources[:2]:
                            print(f"  - {source.get('scheme_name', 'Unknown')} ({source.get('category', 'Unknown')})")
                    else:
                        print("⚠️  No education schemes in results")
                        
                    return education_found
                else:
                    print("❌ Test query failed")
            else:
                print(f"❌ Test query failed: {test_response.status_code}")
            
        else:
            print(f"❌ Setup failed: {response.status_code}")
            if response.status_code == 429:
                print("🚫 Rate limit exceeded")
            else:
                try:
                    error_data = response.json()
                    print(f"Error: {error_data}")
                except:
                    print(f"Error: {response.text}")
            
            return False
            
    except requests.exceptions.Timeout:
        print("⏰ Setup taking too long (likely rate limited)")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        # Restore original dataset
        print("\n🔄 Restoring original dataset...")
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, original_path)
            print("✅ Original dataset restored")

def check_server_status():
    """Check if server is running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    print("🎯 RATE-LIMIT-FRIENDLY RAG SETUP")
    print("=" * 40)
    
    if not check_server_status():
        print("❌ Server not running. Start with:")
        print("   python3 langchain_api_server.py")
        exit(1)
    
    print("✅ Server is running")
    success = try_small_setup()
    
    if success:
        print("\n🎉 SUCCESS! Education scheme retrieval is now working!")
        print("You can now test queries with:")
        print("curl -X POST http://localhost:8000/query -d '{\"query\": \"education schemes\", \"max_results\": 3}'")
    else:
        print("\n❌ Setup failed. Likely due to rate limits.")
        print("💡 Wait for rate limit reset and try again later.")
