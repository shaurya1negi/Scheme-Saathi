#!/usr/bin/env python3

import json
import os
import time
import requests
from datetime import datetime, timedelta
import sys

class PeriodicDatasetExpander:
    """Gradually expand the RAG dataset to avoid rate limits"""
    
    def __init__(self):
        self.full_dataset_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
        self.current_dataset_path = "../data/raw/current_schemes.json"
        self.progress_file = "expansion_progress.json"
        self.batch_size = 500  # Schemes per batch
        self.api_calls_per_scheme = 2  # Estimate
        self.delay_between_batches = 60  # seconds
        
    def load_full_dataset(self):
        """Load the complete dataset"""
        with open(self.full_dataset_path, 'r') as f:
            return json.load(f)
    
    def load_progress(self):
        """Load expansion progress"""
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r') as f:
                return json.load(f)
        return {"processed_count": 0, "last_update": None, "total_schemes": 0}
    
    def save_progress(self, progress):
        """Save expansion progress"""
        progress["last_update"] = datetime.now().isoformat()
        with open(self.progress_file, 'w') as f:
            json.dump(progress, f, indent=2)
    
    def create_incremental_dataset(self, start_index, end_index):
        """Create dataset with schemes from start_index to end_index"""
        
        full_data = self.load_full_dataset()
        all_schemes = full_data.get('schemes', [])
        
        # Get the subset
        subset_schemes = all_schemes[start_index:end_index]
        
        # Create incremental dataset
        incremental_data = {
            "metadata": {
                **full_data.get('metadata', {}),
                "incremental_mode": True,
                "batch_start": start_index,
                "batch_end": end_index,
                "batch_size": len(subset_schemes),
                "total_original": len(all_schemes)
            },
            "schemes": subset_schemes
        }
        
        # Save incremental dataset
        with open(self.current_dataset_path, 'w') as f:
            json.dump(incremental_data, f, indent=2)
        
        return len(subset_schemes)
    
    def test_server_health(self):
        """Check if server is responsive"""
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def setup_incremental_batch(self):
        """Setup vector store with current incremental batch"""
        try:
            print("🔧 Setting up vector store with current batch...")
            response = requests.post("http://localhost:8000/setup", timeout=300)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Batch setup successful: {result.get('status', 'Unknown')}")
                return True
            else:
                print(f"❌ Batch setup failed: {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            print("⏰ Setup timeout - batch might be too large")
            return False
        except Exception as e:
            print(f"❌ Setup error: {e}")
            return False
    
    def expand_dataset_gradually(self, max_batches=None):
        """Main function to expand dataset gradually"""
        
        print("🚀 PERIODIC DATASET EXPANSION")
        print("=" * 50)
        
        if not self.test_server_health():
            print("❌ Server not running. Start with: python3 langchain_api_server.py")
            return False
        
        # Load data
        full_data = self.load_full_dataset()
        all_schemes = full_data.get('schemes', [])
        total_schemes = len(all_schemes)
        
        progress = self.load_progress()
        processed = progress.get("processed_count", 0)
        
        print(f"📊 Total schemes: {total_schemes}")
        print(f"📈 Already processed: {processed}")
        print(f"⏳ Remaining: {total_schemes - processed}")
        print(f"📦 Batch size: {self.batch_size}")
        
        if processed >= total_schemes:
            print("🎉 Dataset expansion already complete!")
            return True
        
        batch_count = 0
        while processed < total_schemes:
            if max_batches and batch_count >= max_batches:
                print(f"🛑 Reached max batches limit ({max_batches})")
                break
            
            batch_count += 1
            end_index = min(processed + self.batch_size, total_schemes)
            
            print(f"\n📦 BATCH {batch_count}")
            print(f"Processing schemes {processed} to {end_index}")
            
            # Create incremental dataset
            batch_size = self.create_incremental_dataset(processed, end_index)
            print(f"✅ Created batch with {batch_size} schemes")
            
            # Setup vector store
            if self.setup_incremental_batch():
                processed = end_index
                progress["processed_count"] = processed
                progress["total_schemes"] = total_schemes
                self.save_progress(progress)
                
                completion_pct = (processed / total_schemes) * 100
                print(f"✅ Batch completed! Progress: {completion_pct:.1f}%")
                
                if processed < total_schemes:
                    print(f"⏸️  Waiting {self.delay_between_batches}s before next batch...")
                    time.sleep(self.delay_between_batches)
            else:
                print("❌ Batch failed - stopping expansion")
                break
        
        if processed >= total_schemes:
            print("\n🎉 DATASET EXPANSION COMPLETE!")
            print(f"✅ All {total_schemes} schemes now available for search")
        else:
            print(f"\n⏸️  Expansion paused at {processed}/{total_schemes} schemes")
            print("💡 Run again later to continue expansion")
        
        return processed >= total_schemes

def main():
    """Main CLI interface"""
    
    expander = PeriodicDatasetExpander()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "status":
            progress = expander.load_progress()
            total = progress.get("total_schemes", 108000)
            processed = progress.get("processed_count", 0)
            last_update = progress.get("last_update", "Never")
            
            print(f"📊 Expansion Status:")
            print(f"  Processed: {processed}/{total} schemes ({processed/total*100:.1f}%)")
            print(f"  Last update: {last_update}")
            return
        
        elif sys.argv[1] == "continue":
            max_batches = int(sys.argv[2]) if len(sys.argv) > 2 else None
            expander.expand_dataset_gradually(max_batches)
            return
    
    # Default: start expansion
    print("🎯 Dataset Expansion Options:")
    print("1. Expand 1 batch (500 schemes)")
    print("2. Expand 5 batches (2500 schemes)")  
    print("3. Expand 10 batches (5000 schemes)")
    print("4. Check status")
    
    choice = input("Choose option (1-4): ")
    
    if choice == "1":
        expander.expand_dataset_gradually(max_batches=1)
    elif choice == "2":
        expander.expand_dataset_gradually(max_batches=5)
    elif choice == "3":
        expander.expand_dataset_gradually(max_batches=10)
    elif choice == "4":
        main()  # Show status via recursive call with status arg
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()
