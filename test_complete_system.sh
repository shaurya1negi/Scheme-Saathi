#!/bin/bash

echo "🧪 Testing the complete Scheme Saathi system with @google/generative-ai"
echo "=================================================================="

# Test 1: Check Node.js RAG server health
echo ""
echo "1️⃣ Testing Node.js RAG server health..."
curl -s http://localhost:8001/health | jq '.'

# Test 2: Check Next.js frontend
echo ""
echo "2️⃣ Testing Next.js frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js frontend is running on http://localhost:3000"
else
    echo "❌ Next.js frontend is not accessible"
fi

# Test 3: Test education query through API
echo ""
echo "3️⃣ Testing education query through RAG API..."
curl -s -X POST http://localhost:8001/query \
    -H "Content-Type: application/json" \
    -d '{"query": "What schemes help with digital education?"}' | jq '.answer'

# Test 4: Test business query
echo ""
echo "4️⃣ Testing business query..."
curl -s -X POST http://localhost:8001/query \
    -H "Content-Type: application/json" \
    -d '{"query": "Help me find business startup schemes"}' | jq '.answer'

# Test 5: Test agriculture query
echo ""
echo "5️⃣ Testing agriculture query..."
curl -s -X POST http://localhost:8001/query \
    -H "Content-Type: application/json" \
    -d '{"query": "What farmer support schemes are available?"}' | jq '.answer'

echo ""
echo "✅ System test completed!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Chat page: http://localhost:3000/chat"
echo "🛠️ RAG API: http://localhost:8001"
echo ""
echo "✨ Your rate-limit-optimized @google/generative-ai RAG system is ready!"
