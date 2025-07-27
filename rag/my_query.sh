#!/bin/bash
# Personal Query Template for RAG System
# Usage: Edit the QUERY variable below and run this script

# 🔧 EDIT YOUR QUERY HERE:
QUERY="Tell me about agriculture schemes for farmers in Punjab"

# 🚀 Run the query
echo "🔍 Searching for: $QUERY"
echo "================================"

curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$QUERY\", \"include_sources\": true}" \
  | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ Query Successful!')
        print(f'📝 Answer:\n{data.get(\"answer\", \"No answer\")}')
        print(f'\n📊 Total Sources: {data.get(\"total_sources\", 0)}')
        
        if data.get('sources'):
            print('\n📚 Relevant Schemes:')
            for i, source in enumerate(data.get('sources', [])[:3], 1):
                print(f'   {i}. {source.get(\"scheme_name\", \"Unknown\")} ({source.get(\"state\", \"Unknown state\")})')
    else:
        print('❌ Query failed')
        print(f'Error: {data.get(\"error\", \"Unknown error\")}')
except Exception as e:
    print(f'❌ Error processing response: {e}')
"

echo ""
echo "================================"
