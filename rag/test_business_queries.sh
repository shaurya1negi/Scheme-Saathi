#!/bin/bash

echo "🏢 Testing Business Queries"
echo "========================="

# Test business-related queries
queries=(
    "MSME schemes for entrepreneurs"
    "business development schemes"
    "startup funding schemes"
    "small industry schemes"
    "manufacturing sector schemes"
)

for query in "${queries[@]}"; do
    echo
    echo "🔍 Query: $query"
    echo "-------------------"
    
    response=$(curl -s -X POST http://localhost:8000/query \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\", \"max_results\": 3}")
    
    if [ $? -eq 0 ]; then
        echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        sources = data.get('sources', [])
        print(f'✅ Found {len(sources)} results:')
        for i, s in enumerate(sources, 1):
            name = s.get('scheme_name', 'Unknown')
            category = s.get('category', 'Unknown')
            print(f'  {i}. {name}')
            print(f'     Category: {category}')
    else:
        print('❌ Query failed')
except:
    print('❌ Error parsing response')
"
    else
        echo "❌ Connection failed"
    fi
done
