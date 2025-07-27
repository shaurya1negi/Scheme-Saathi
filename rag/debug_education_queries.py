#!/usr/bin/env python3

import json
import requests
import sys

def test_education_queries():
    """Test various education-related queries and analyze results"""
    
    base_url = "http://localhost:8000"
    
    # Test queries
    test_queries = [
        "education schemes for students",
        "Next-Gen Education Solution",
        "student scholarship programs", 
        "education category schemes",
        "school college university schemes"
    ]
    
    print("=== TESTING EDUCATION QUERIES ===")
    print()
    
    for i, query in enumerate(test_queries, 1):
        print(f"{i}. Testing query: '{query}'")
        print("-" * 50)
        
        try:
            response = requests.post(
                f"{base_url}/query",
                headers={"Content-Type": "application/json"},
                json={"query": query, "max_results": 3}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"Success: {data['success']}")
                print(f"Total sources: {data['total_sources']}")
                
                if data['sources']:
                    print("Retrieved schemes:")
                    for j, source in enumerate(data['sources'][:3], 1):
                        print(f"  {j}. {source['scheme_name']} ({source['category']}) - {source['state']}")
                    
                    # Check if any education schemes were found
                    education_found = any('education' in source['category'].lower() or 
                                        'education' in source['scheme_name'].lower() 
                                        for source in data['sources'])
                    
                    print(f"Education schemes found: {'YES' if education_found else 'NO'}")
                else:
                    print("No sources returned")
                    
                print(f"Answer preview: {data['answer'][:150]}...")
                
            else:
                print(f"Error: HTTP {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"Error: {e}")
            
        print()
        print("=" * 70)
        print()

def test_category_search():
    """Test searching for different categories"""
    
    base_url = "http://localhost:8000"
    
    categories_to_test = [
        "agriculture schemes",
        "housing schemes", 
        "skill development schemes",
        "youth development schemes"
    ]
    
    print("=== TESTING CATEGORY SEARCHES ===")
    print()
    
    for category in categories_to_test:
        print(f"Testing: {category}")
        
        try:
            response = requests.post(
                f"{base_url}/query",
                headers={"Content-Type": "application/json"},
                json={"query": category, "max_results": 3}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data['sources']:
                    print(f"Found {data['total_sources']} schemes:")
                    for source in data['sources'][:3]:
                        print(f"  - {source['scheme_name']} ({source['category']})")
                else:
                    print("No schemes found")
            else:
                print(f"Error: {response.status_code}")
                
        except Exception as e:
            print(f"Error: {e}")
            
        print()

if __name__ == "__main__":
    test_education_queries()
    test_category_search()
