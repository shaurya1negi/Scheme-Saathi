"""
Quick Setup Script for Gemini-based LangChain RAG System
Handles installation and initialization
"""

import subprocess
import sys
import os
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

console = Console()

def install_packages():
    """Install required packages"""
    
    console.print(Panel.fit("📦 Installing Gemini RAG Dependencies", style="bold blue"))
    
    packages = [
        "langchain",
        "langchain-google-genai", 
        "langchain-community",
        "langchain-chroma",
        "chromadb",
        "google-generativeai",
        "fastapi",
        "uvicorn",
        "python-dotenv",
        "rich"
    ]
    
    for package in packages:
        try:
            console.print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            console.print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            console.print(f"❌ Failed to install {package}: {e}")
            return False
    
    console.print("[bold green]✅ All packages installed successfully![/bold green]")
    return True

def check_dataset():
    """Check if the dataset exists"""
    
    dataset_path = "../data/raw/mega_3000_state_schemes_20250727_150540.json"
    
    if Path(dataset_path).exists():
        console.print(f"✅ Dataset found: {dataset_path}")
        return True
    else:
        console.print(f"❌ Dataset not found: {dataset_path}")
        console.print("Please ensure the mega schemes dataset has been generated first.")
        return False

def create_env_file():
    """Create .env file template"""
    
    env_content = """# Gemini-based RAG Configuration

# Google Gemini API Key (required for embeddings and chat)
# Get your key from: https://ai.google.dev/
GOOGLE_API_KEY=your-google-gemini-api-key-here

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Gemini Models
EMBEDDING_MODEL=models/embedding-001
CHAT_MODEL=gemini-2.0-flash-exp

# ChromaDB Configuration
CHROMA_PERSIST_DIR=data/chroma_db
"""
    
    with open(".env", "w") as f:
        f.write(env_content)
    
    console.print("✅ Created .env configuration file")
    console.print("📝 Please edit .env and add your Google Gemini API key")

def display_usage_instructions():
    """Display usage instructions"""
    
    instructions = Text()
    instructions.append("🚀 Gemini RAG System Setup Complete!\n\n", style="bold green")
    instructions.append("Next Steps:\n", style="bold blue")
    instructions.append("1. Edit .env file and add your Google Gemini API key\n")
    instructions.append("2. Start the server: python langchain_api_server.py\n")
    instructions.append("3. Setup the system: POST http://localhost:8000/setup\n")
    instructions.append("4. Start querying: POST http://localhost:8000/query\n\n")
    instructions.append("API Documentation: http://localhost:8000/docs\n", style="bold yellow")
    instructions.append("\nExample Query:\n", style="bold blue")
    instructions.append('curl -X POST "http://localhost:8000/query" \\\n')
    instructions.append('  -H "Content-Type: application/json" \\\n')
    instructions.append('  -d \'{"query": "agriculture schemes in Tamil Nadu"}\'\n')
    
    console.print(Panel(instructions, title="Setup Instructions", border_style="green"))

def main():
    """Main setup function"""
    
    console.print(Panel.fit("🎯 Gemini-based RAG System Setup", style="bold blue"))
    
    # Check if dataset exists
    if not check_dataset():
        console.print("[red]Setup aborted: Dataset not found[/red]")
        return
    
    # Install packages
    console.print("\n📦 Installing packages...")
    if not install_packages():
        console.print("[red]Setup failed: Package installation error[/red]")
        return
    
    # Create environment file
    console.print("\n📝 Creating configuration...")
    create_env_file()
    
    # Display instructions
    console.print("\n")
    display_usage_instructions()
    
    console.print("[bold green]🎉 Setup completed successfully![/bold green]")

if __name__ == "__main__":
    main()
