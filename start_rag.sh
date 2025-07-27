#!/bin/bash

# RAG System Startup Script
echo "🚀 Starting RAG System..."

# Navigate to project
cd /home/shaurya/Desktop/Scheme-Saathi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source .venv/bin/activate

# Start RAG server
echo "🔥 Starting RAG API server..."
cd rag
python3 langchain_api_server.py
