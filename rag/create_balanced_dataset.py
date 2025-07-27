#!/usr/bin/env python3

import json
import os

def create_balanced_test_dataset():
    """Create a more balanced test dataset with multiple categories"""
    
    # Load the full dataset
    full_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    
    with open(full_path, 'r') as f:
        data = json.load(f)
    
    full_schemes = data.get('schemes', [])
    print(f"📊 Full dataset: {len(full_schemes)} schemes")
    
    # Group schemes by category
    categories = {}
    for scheme in full_schemes:
        category = scheme.get('category', 'Unknown')
        if category not in categories:
            categories[category] = []
        categories[category].append(scheme)
    
    print(f"📂 Found {len(categories)} categories")
    
    # Select schemes from each category (more balanced)
    test_schemes = []
    schemes_per_category = 20  # 20 schemes per category
    
    for category, schemes in categories.items():
        # Take up to 20 schemes from each category
        selected = schemes[:schemes_per_category]
        test_schemes.extend(selected)
        print(f"  {category}: {len(selected)} schemes")
    
    print(f"\n📦 Balanced test dataset: {len(test_schemes)} schemes")
    print(f"📂 Categories: {len(categories)}")
    
    # Create test dataset
    test_data = {
        "metadata": {
            **data.get('metadata', {}),
            "test_mode": True,
            "balanced": True,
            "original_total": len(full_schemes),
            "test_total": len(test_schemes),
            "schemes_per_category": schemes_per_category
        },
        "schemes": test_schemes
    }
    
    # Save balanced test dataset
    test_path = "../data/raw/test_schemes_balanced.json"
    with open(test_path, 'w') as f:
        json.dump(test_data, f, indent=2)
    
    print(f"✅ Created balanced test dataset: {test_path}")
    print(f"💡 This will use ~{len(test_schemes) * 2} API calls instead of 200,000+")
    
    return test_path

if __name__ == "__main__":
    create_balanced_test_dataset()
