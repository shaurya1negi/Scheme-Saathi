#!/usr/bin/env python3

import json
import os
import sys
from pathlib import Path

def diagnose_issue():
    """Diagnose why education schemes aren't being retrieved properly"""
    
    print("🔍 DIAGNOSING EDUCATION SCHEME RETRIEVAL ISSUE")
    print("=" * 60)
    
    # Check dataset
    dataset_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found: {dataset_path}")
        return False
    
    print(f"✅ Dataset found: {dataset_path}")
    
    # Load and analyze dataset
    with open(dataset_path, 'r') as f:
        data = json.load(f)
    
    schemes = data.get('schemes', [])
    print(f"📊 Total schemes in dataset: {len(schemes)}")
    
    # Count education schemes
    education_schemes = []
    for scheme in schemes:
        category = scheme.get('category', '').lower()
        name = scheme.get('scheme_name', '').lower()
        
        if 'education' in category or 'education' in name:
            education_schemes.append(scheme)
    
    print(f"🎓 Education schemes found: {len(education_schemes)}")
    
    if education_schemes:
        print("\nSample education schemes:")
        for i, scheme in enumerate(education_schemes[:5], 1):
            print(f"  {i}. {scheme.get('scheme_name', 'No name')}")
            print(f"     Category: {scheme.get('category', 'No category')}")
            print(f"     State: {scheme.get('state', 'No state')}")
            print()
    
    # Check vector store
    vector_store_path = "data/chroma_db"
    if os.path.exists(vector_store_path):
        print(f"📁 Vector store exists: {vector_store_path}")
        
        # Check size
        total_size = 0
        for root, dirs, files in os.walk(vector_store_path):
            for file in files:
                total_size += os.path.getsize(os.path.join(root, file))
        
        print(f"📏 Vector store size: {total_size / (1024*1024):.1f} MB")
        
        if total_size < 1024*1024:  # Less than 1MB
            print("⚠️  Vector store seems too small - may not contain all data")
            return False
        else:
            print("✅ Vector store size looks reasonable")
            
    else:
        print(f"❌ Vector store not found: {vector_store_path}")
        return False
    
    return True

def create_fix_summary():
    """Create a summary of the issue and potential fixes"""
    
    print("\n" + "=" * 60)
    print("🛠️  ISSUE SUMMARY AND FIXES")
    print("=" * 60)
    
    print("""
ISSUE IDENTIFIED:
- Education schemes exist in dataset (1008+ schemes)
- Vector search is not returning education schemes
- Likely cause: Vector store indexing/embedding issue

POTENTIAL FIXES:
1. Rebuild vector store completely (current approach)
2. Check document chunking strategy
3. Verify embedding model consistency
4. Test with different query variations

NEXT STEPS:
1. Restart API server fresh
2. Rebuild vector store step by step
3. Test with specific education scheme names
4. Verify document content in vector store
    """)

def restart_server():
    """Restart the API server fresh"""
    print("\n🚀 RESTARTING API SERVER")
    print("=" * 30)
    
    print("To restart manually:")
    print("1. cd /home/shaurya/Desktop/Scheme-Saathi/rag")
    print("2. python3 langchain_api_server.py")
    print("3. Wait for startup, then test queries")

if __name__ == "__main__":
    success = diagnose_issue()
    create_fix_summary()
    
    if success:
        print("\n✅ Diagnosis complete - ready to fix")
        restart_server()
    else:
        print("\n❌ Issues found - check dataset and vector store")
