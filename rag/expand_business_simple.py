#!/usr/bin/env python3

import json
import os

def expand_business_schemes():
    """Expand current test dataset with business schemes"""
    
    print("🏢 EXPANDING DATASET WITH BUSINESS SCHEMES")
    print("=" * 50)
    
    # Load the full dataset
    full_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    with open(full_path, 'r') as f:
        data = json.load(f)
    
    full_schemes = data.get('schemes', [])
    print(f"📊 Full dataset: {len(full_schemes)} schemes")
    
    # Business keywords
    business_keywords = [
        'business', 'msme', 'entrepreneur', 'startup', 'industry', 
        'trade', 'commerce', 'manufacturing', 'export', 'import',
        'loan', 'credit', 'finance', 'investment', 'enterprise',
        'micro', 'small', 'medium'
    ]
    
    # Find business schemes
    business_schemes = []
    for scheme in full_schemes:
        category = scheme.get('category', '').lower()
        name = scheme.get('scheme_name', '').lower()
        description = scheme.get('description', '').lower()
        ministry = scheme.get('implementing_ministry', '').lower()
        
        is_business = any(keyword in text for keyword in business_keywords 
                         for text in [category, name, description, ministry])
        
        if is_business:
            business_schemes.append(scheme)
    
    print(f"🏢 Found {len(business_schemes)} business schemes")
    
    # Show samples
    print("\nSample business schemes:")
    for i, scheme in enumerate(business_schemes[:5], 1):
        print(f"  {i}. {scheme.get('scheme_name', 'No name')}")
        print(f"     Category: {scheme.get('category', 'No category')}")
    
    # Load current test dataset
    current_path = "../data/raw/test_schemes_small.json"
    with open(current_path, 'r') as f:
        current_data = json.load(f)
    
    current_schemes = current_data.get('schemes', [])
    print(f"\n📦 Current test dataset: {len(current_schemes)} schemes")
    
    # Add business schemes (limit to 75 to keep total manageable)
    max_business = 75
    selected_business = business_schemes[:max_business]
    
    # Combine schemes
    combined_schemes = current_schemes.copy()
    existing_ids = set(s.get('scheme_id') for s in current_schemes)
    
    added_count = 0
    for scheme in selected_business:
        if scheme.get('scheme_id') not in existing_ids:
            combined_schemes.append(scheme)
            added_count += 1
    
    print(f"📈 Expanded dataset: {len(combined_schemes)} schemes")
    print(f"➕ Added {added_count} new business schemes")
    
    # Create expanded dataset
    expanded_data = {
        "metadata": {
            "created_from": "test_schemes_small.json + business schemes",
            "total_schemes": len(combined_schemes),
            "education_schemes": len([s for s in combined_schemes if 'education' in s.get('category', '').lower()]),
            "business_schemes": len([s for s in combined_schemes if any(kw in s.get('category', '').lower() or kw in s.get('scheme_name', '').lower() for kw in business_keywords)]),
            "source": "mega_3000_state_schemes_20250727_150540.json"
        },
        "schemes": combined_schemes
    }
    
    # Save expanded dataset
    expanded_path = "../data/raw/test_schemes_expanded.json"
    with open(expanded_path, 'w') as f:
        json.dump(expanded_data, f, indent=2)
    
    print(f"✅ Created: {expanded_path}")
    print(f"💡 Ready to rebuild vector store with {len(combined_schemes)} schemes")
    
    return len(combined_schemes)

if __name__ == "__main__":
    total_schemes = expand_business_schemes()
    print(f"\n🎯 Next step: Run setup to rebuild vector store with {total_schemes} schemes")
    print("   This will use approximately", total_schemes * 2, "API calls")
