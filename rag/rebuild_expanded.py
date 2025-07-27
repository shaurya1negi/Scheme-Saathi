#!/usr/bin/env python3

import shutil
import os
import requests
import time

def rebuild_with_expanded():
    """Rebuild vector store with expanded dataset"""
    
    print("🔄 REBUILDING WITH EXPANDED BUSINESS DATASET")
    print("=" * 50)
    
    # Paths
    original_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    backup_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json.backup"
    expanded_path = "../data/raw/test_schemes_expanded.json"
    
    try:
        # Backup original if not already backed up
        if not os.path.exists(backup_path):
            print("📁 Backing up original dataset...")
            shutil.copy2(original_path, backup_path)
        
        # Replace with expanded dataset
        print("🔄 Switching to expanded dataset...")
        shutil.copy2(expanded_path, original_path)
        
        # Rebuild vector store
        print("🚀 Rebuilding vector store (this may take a few minutes)...")
        response = requests.post("http://localhost:8000/setup", timeout=300)
        
        if response.status_code == 200:
            print("✅ Vector store rebuilt successfully!")
            
            # Test business query
            print("\n🧪 Testing business query...")
            time.sleep(2)
            
            test_response = requests.post(
                "http://localhost:8000/query",
                json={"query": "MSME schemes for small business entrepreneurs", "max_results": 5},
                timeout=15
            )
            
            if test_response.status_code == 200:
                result = test_response.json()
                if result.get('success'):
                    sources = result.get('sources', [])
                    print(f"📊 Found {len(sources)} results")
                    
                    business_found = False
                    for i, source in enumerate(sources, 1):
                        name = source.get('scheme_name', 'Unknown')
                        category = source.get('category', 'Unknown')
                        print(f"  {i}. {name}")
                        print(f"     Category: {category}")
                        
                        # Check if it's business-related
                        if any(kw in name.lower() or kw in category.lower() 
                               for kw in ['business', 'msme', 'entrepreneur', 'industry', 'enterprise']):
                            business_found = True
                    
                    if business_found:
                        print("\n🎉 SUCCESS! Business schemes are now working!")
                    else:
                        print("\n⚠️  Business schemes still not found in results")
                else:
                    print("❌ Test query failed")
            else:
                print(f"❌ Test query failed: {test_response.status_code}")
        else:
            print(f"❌ Vector store rebuild failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error during rebuild: {e}")
    
    finally:
        # Restore original dataset
        print("\n🔄 Restoring original dataset...")
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, original_path)
            print("✅ Original dataset restored")

if __name__ == "__main__":
    rebuild_with_expanded()
