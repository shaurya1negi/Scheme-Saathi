#!/bin/bash

echo "🧪 Testing Education Scheme Retrieval Fix"
echo "========================================="
echo

# 1. Check if server is running
echo "1. Checking if API server is running..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server not running. Start it with:"
    echo "   python3 langchain_api_server.py"
    exit 1
fi

echo

# 2. Check vector store stats
echo "2. Checking vector store status..."
curl -s http://localhost:8000/stats | jq '.'
echo

# 3. Test education query
echo "3. Testing education scheme query..."
echo "Query: 'What education schemes are available for students?'"
echo

curl -X POST "http://localhost:8000/query" \
     -H "Content-Type: application/json" \
     -d '{"query": "What education schemes are available for students?", "max_results": 3}' \
     | jq '.sources[] | {scheme_name, category, state}'

echo
echo "========================================="
echo

# 4. Test specific education scheme
echo "4. Testing specific education scheme name..."
echo "Query: 'Next-Gen Education Solution'"
echo

curl -X POST "http://localhost:8000/query" \
     -H "Content-Type: application/json" \
     -d '{"query": "Next-Gen Education Solution", "max_results": 3}' \
     | jq '.sources[] | {scheme_name, category, state}'

echo
echo "========================================="
echo

# 5. Test category search
echo "5. Testing education category search..."
echo "Query: 'education category schemes'"
echo

curl -X POST "http://localhost:8000/query" \
     -H "Content-Type: application/json" \
     -d '{"query": "education category schemes", "max_results": 3}' \
     | jq '.sources[] | {scheme_name, category, state}'

echo
echo "========================================="
echo "🎯 Test Results Summary:"
echo "- If you see 'Education' category schemes above: ✅ FIXED"
echo "- If you still see only Agriculture/other schemes: ❌ STILL BROKEN"
echo "========================================="
