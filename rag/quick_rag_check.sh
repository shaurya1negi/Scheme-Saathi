#!/bin/bash
# Simple RAG System Checker

echo "🔍 Checking RAG System Status..."
echo "================================"

echo ""
echo "1. Health Check:"
curl -s http://localhost:8000/health | python3 -m json.tool

echo ""
echo "2. System Stats:"
curl -s http://localhost:8000/stats | python3 -m json.tool

echo ""
echo "3. Sample Query Test:"
echo "Query: 'agriculture schemes in Tamil Nadu'"

# Simple query test
curl -s -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "agriculture schemes in Tamil Nadu", "include_sources": false}' \
  | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ Success: {data.get(\"success\", False)}')
    print(f'Answer Preview: {data.get(\"answer\", \"No answer\")[:150]}...')
    print(f'Total Sources: {data.get(\"total_sources\", 0)}')
except:
    print('❌ Query failed or invalid response')
"

echo ""
echo "================================"
echo "🎉 RAG System Check Complete!"
