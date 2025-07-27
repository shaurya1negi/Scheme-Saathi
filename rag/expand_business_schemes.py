#!/usr/bin/env python3

import json
import os
import requests
import time

def expand_to_business_schemes():
    """Expand current dataset to include business-related schemes"""
    
    print("🏢 EXPANDING DATASET TO INCLUDE BUSINESS SCHEMES")
    print("=" * 50)
    
    # Load the full dataset to find business schemes
    full_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    
    with open(full_path, 'r') as f:
        data = json.load(f)
    
    full_schemes = data.get('schemes', [])
    print(f"📊 Full dataset: {len(full_schemes)} schemes")
    
    # Find business-related schemes
    business_keywords = [
        'business', 'msme', 'entrepreneur', 'startup', 'industry', 
        'trade', 'commerce', 'manufacturing', 'export', 'import',
        'loan', 'credit', 'finance', 'investment', 'enterprise'
    ]
    
    business_schemes = []
    for scheme in full_schemes:
        category = scheme.get('category', '').lower()
        name = scheme.get('scheme_name', '').lower()
        description = scheme.get('description', '').lower()
        ministry = scheme.get('implementing_ministry', '').lower()
        
        # Check if scheme is business-related
        is_business = any(keyword in category or keyword in name or 
                         keyword in description or keyword in ministry 
                         for keyword in business_keywords)
        
        if is_business:
            business_schemes.append(scheme)
    
    print(f"🏢 Found {len(business_schemes)} business-related schemes")
    
    # Show sample business schemes
    if business_schemes:
        print("\nSample business schemes found:")
        for i, scheme in enumerate(business_schemes[:10], 1):
            print(f"  {i}. {scheme.get('scheme_name', 'No name')} ({scheme.get('category', 'No category')})")
    
    # Load current test dataset
    current_path = "../data/raw/test_schemes_small.json"
    if os.path.exists(current_path):
        with open(current_path, 'r') as f:
            current_data = json.load(f)
        current_schemes = current_data.get('schemes', [])
        print(f"\n📦 Current test dataset: {len(current_schemes)} schemes")
    else:
        print("❌ Current test dataset not found")
        return False
    
    # Combine current schemes with business schemes (limit to avoid too many API calls)
    max_business_schemes = 50  # Add 50 business schemes
    selected_business = business_schemes[:max_business_schemes]
    
    # Remove duplicates and combine
    combined_schemes = current_schemes.copy()
    existing_ids = set(s.get('scheme_id') for s in current_schemes)
    
    for scheme in selected_business:
        if scheme.get('scheme_id') not in existing_ids:
            combined_schemes.append(scheme)
    
    print(f"📈 Expanded dataset: {len(combined_schemes)} schemes")
    print(f"➕ Added {len(combined_schemes) - len(current_schemes)} new business schemes")
    
    # Create expanded dataset
    expanded_data = {
        "metadata": {
            **current_data.get('metadata', {}),
            "expanded_with_business": True,
            "business_schemes_added": len(combined_schemes) - len(current_schemes),
            "total_schemes": len(combined_schemes)
        },
        "schemes": combined_schemes
    }
    
    # Save expanded dataset
    expanded_path = "../data/raw/test_schemes_expanded.json"
    with open(expanded_path, 'w') as f:
        json.dump(expanded_data, f, indent=2)
    
    print(f"✅ Created expanded dataset: {expanded_path}")
    print(f"💡 This will use ~{len(combined_schemes) * 2} API calls to rebuild")
    
    return expanded_path

def rebuild_with_expanded_dataset():
    """Rebuild vector store with expanded dataset"""
    
    print("\n🔄 REBUILDING VECTOR STORE WITH BUSINESS SCHEMES")
    print("=" * 50)
    
    # Backup original dataset
    original_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    backup_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json.backup"
    expanded_path = "../data/raw/test_schemes_expanded.json"
    
    try:
        import shutil
        
        print("📁 Backing up original dataset...")
        if os.path.exists(original_path) and not os.path.exists(backup_path):
            shutil.copy2(original_path, backup_path)
        
        print("🔄 Replacing with expanded dataset...")
        if os.path.exists(expanded_path):
            shutil.copy2(expanded_path, original_path)
            print("✅ Expanded dataset in place")
        else:
            print("❌ Expanded dataset not found")
            return False
        
        print("🚀 Rebuilding vector store...")
        response = requests.post("http://localhost:8000/setup", timeout=120)
        
        if response.status_code == 200:
            print("✅ Vector store rebuilt successfully!")
            
            # Test business query
            print("\n🧪 Testing business query...")
            time.sleep(2)
            
            test_response = requests.post(
                "http://localhost:8000/query",
                json={"query": "business schemes for entrepreneurs", "max_results": 3},
                timeout=15
            )
            
            if test_response.status_code == 200:
                test_data = test_response.json()
                if test_data.get('success'):
                    sources = test_data.get('sources', [])
                    business_found = any('business' in s.get('category', '').lower() or 
                                       'business' in s.get('scheme_name', '').lower() or
                                       'msme' in s.get('category', '').lower() or
                                       'entrepreneur' in s.get('scheme_name', '').lower()
                                       for s in sources)
                    
                    print(f"📊 Found {len(sources)} results")
                    if business_found:
                        print("🏢 ✅ BUSINESS SCHEMES NOW WORKING!")
                        for source in sources[:3]:
                            print(f"  - {source.get('scheme_name', 'Unknown')} ({source.get('category', 'Unknown')})")
                    else:
                        print("⚠️  Still not finding business schemes in results")
                        print("Results:")
                        for source in sources[:3]:
                            print(f"  - {source.get('scheme_name', 'Unknown')} ({source.get('category', 'Unknown')})")
                    
                    return business_found
                else:
                    print("❌ Test query failed")
            else:
                print(f"❌ Test query failed: {test_response.status_code}")
                
        else:
            print(f"❌ Vector store rebuild failed: {response.status_code}")
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

if __name__ == "__main__":
    # Step 1: Create expanded dataset
    expanded_path = expand_to_business_schemes()
    
    if expanded_path:
        print("\n" + "="*50)
        print("🚀 READY TO REBUILD WITH BUSINESS SCHEMES")
        print("="*50)
        
        user_input = input("Rebuild vector store with business schemes? (y/n): ")
        if user_input.lower() == 'y':
            success = rebuild_with_expanded_dataset()
            if success:
                print("\n🎉 SUCCESS! Business schemes now available!")
            else:
                print("\n❌ Rebuild failed - may need to retry later")
        else:
            print("💡 Run 'python3 expand_business_schemes.py' when ready")
    else:
        print("❌ Failed to create expanded dataset")
