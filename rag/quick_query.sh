#!/bin/bash
# Quick Query Function - No Web Interface Needed
# Usage: ./quick_query.sh "your question here"

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 \"your question here\""
    echo "Example: $0 \"agriculture schemes in Tamil Nadu\""
    exit 1
fi

QUERY="$1"

echo "🔍 Asking: $QUERY"
echo "================================"

curl -s -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$QUERY\", \"include_sources\": true}" \
  | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ Answer:')
        print(data.get('answer', 'No answer'))
        print(f'\n📊 Found {data.get(\"total_sources\", 0)} relevant schemes')
        
        if data.get('sources'):
            print('\n📚 Top Schemes:')
            for i, source in enumerate(data.get('sources', [])[:3], 1):
                print(f'   {i}. {source.get(\"scheme_name\", \"Unknown\")} ({source.get(\"state\", \"N/A\")})')
    else:
        print('❌ Query failed')
        print(f'Error: {data.get(\"error\", \"Unknown error\")}')
except Exception as e:
    print(f'❌ Error: {e}')
"
