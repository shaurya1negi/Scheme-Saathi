#!/usr/bin/env python3

import json
import os

def create_small_test_dataset():
    """Create a smaller dataset for testing with rate limits"""
    
    # Load the full dataset
    full_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    
    if not os.path.exists(full_path):
        print(f"❌ Dataset not found: {full_path}")
        return False
    
    with open(full_path, 'r') as f:
        data = json.load(f)
    
    full_schemes = data.get('schemes', [])
    print(f"📊 Full dataset: {len(full_schemes)} schemes")
    
    # Select a small sample with education schemes
    test_schemes = []
    categories_added = set()
    
    for scheme in full_schemes:
        category = scheme.get('category', '')
        
        # Always include education schemes
        if 'education' in category.lower():
            test_schemes.append(scheme)
        # Include a few from each category for variety
        elif category not in categories_added and len(categories_added) < 10:
            test_schemes.append(scheme)
            categories_added.add(category)
        
        # Stop at 200 schemes to minimize API usage
        if len(test_schemes) >= 200:
            break
    
    # Count education schemes in test set
    education_count = sum(1 for s in test_schemes if 'education' in s.get('category', '').lower())
    
    print(f"📦 Test dataset: {len(test_schemes)} schemes")
    print(f"🎓 Education schemes: {education_count}")
    print(f"📂 Categories: {len(categories_added)}")
    
    # Create test dataset
    test_data = {
        "metadata": {
            **data.get('metadata', {}),
            "test_mode": True,
            "original_total": len(full_schemes),
            "test_total": len(test_schemes)
        },
        "schemes": test_schemes
    }
    
    # Save test dataset
    test_path = "../data/raw/test_schemes_small.json"
    with open(test_path, 'w') as f:
        json.dump(test_data, f, indent=2)
    
    print(f"✅ Created test dataset: {test_path}")
    print(f"💡 This will use ~{len(test_schemes) * 2} API calls instead of 200,000+")
    
    return test_path

if __name__ == "__main__":
    create_small_test_dataset()
