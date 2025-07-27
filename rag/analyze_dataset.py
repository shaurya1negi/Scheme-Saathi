#!/usr/bin/env python3

import json
import sys

def analyze_dataset():
    """Analyze the dataset to understand education vs agriculture scheme distribution"""
    try:
        # Load the dataset
        data_path = '/home/shaurya/Desktop/Scheme-Saathi/data/raw/mega_3000_state_schemes_20250727_150540.json'
        
        with open(data_path, 'r') as f:
            data = json.load(f)
        
        schemes = data.get('schemes', [])
        metadata = data.get('metadata', {})
        
        print(f"Dataset metadata: {metadata.get('total_schemes', 'Unknown')} total schemes")
        print(f"Actual schemes in data: {len(schemes)}")
        print()
        
        # Analyze categories
        categories = {}
        education_schemes = []
        agriculture_schemes = []
        
        for scheme in schemes:
            # Get category
            category = scheme.get('category', 'Unknown')
            categories[category] = categories.get(category, 0) + 1
            
            # Check for education schemes
            scheme_name = scheme.get('scheme_name', '').lower()
            description = scheme.get('description', '').lower()
            
            if ('education' in category.lower() or 
                'education' in scheme_name or 
                'student' in scheme_name or 
                'scholarship' in scheme_name or
                'school' in scheme_name or
                'college' in scheme_name or
                'university' in scheme_name):
                education_schemes.append({
                    'name': scheme.get('scheme_name', 'No name'),
                    'category': category,
                    'state': scheme.get('state', 'Not specified')
                })
            
            # Check for agriculture schemes  
            if ('agriculture' in category.lower() or
                'agriculture' in scheme_name or
                'farming' in scheme_name or
                'farmer' in scheme_name or
                'crop' in scheme_name):
                agriculture_schemes.append({
                    'name': scheme.get('scheme_name', 'No name'),
                    'category': category,
                    'state': scheme.get('state', 'Not specified')
                })
        
        print("Category distribution (top 15):")
        sorted_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        for cat, count in sorted_categories[:15]:
            print(f"  {cat}: {count}")
        
        print(f"\nEducation schemes found: {len(education_schemes)}")
        if education_schemes:
            print("Sample education schemes:")
            for i, scheme in enumerate(education_schemes[:5]):
                print(f"  {i+1}. {scheme['name']} ({scheme['category']})")
        
        print(f"\nAgriculture schemes found: {len(agriculture_schemes)}")
        if agriculture_schemes:
            print("Sample agriculture schemes:")
            for i, scheme in enumerate(agriculture_schemes[:5]):
                print(f"  {i+1}. {scheme['name']} ({scheme['category']})")
                
        return len(education_schemes), len(agriculture_schemes)
        
    except Exception as e:
        print(f"Error analyzing dataset: {e}")
        return 0, 0

if __name__ == "__main__":
    analyze_dataset()
