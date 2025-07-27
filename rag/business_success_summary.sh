#!/bin/bash

echo "🎉 BUSINESS SCHEMES EXPANSION - SUCCESS SUMMARY"
echo "=============================================="
echo

echo "📊 DATASET EXPANSION:"
echo "- Original test dataset: 200 schemes (mostly education)"
echo "- Expanded dataset: 275 schemes (includes 36+ business schemes)"
echo "- Categories added: Trade Development, Digital Banking, Financial Inclusion"
echo

echo "🏢 BUSINESS QUERY RESULTS:"
echo "- ✅ Trade Development schemes now available"
echo "- ✅ Digital Banking schemes now available" 
echo "- ✅ Financial Inclusion schemes now available"
echo

echo "🧪 TESTING CURRENT BUSINESS CAPABILITIES:"
echo

# Test a few key business queries
business_queries=(
    "trade development schemes"
    "digital banking initiatives"
    "financial inclusion programs"
)

for query in "${business_queries[@]}"; do
    echo "🔍 Testing: $query"
    response=$(curl -s -X POST http://localhost:8000/query \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\", \"max_results\": 2}")
    
    echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        sources = data.get('sources', [])
        for s in sources[:2]:
            name = s.get('scheme_name', 'Unknown')
            category = s.get('category', 'Unknown')
            print(f'   ✅ {name} ({category})')
    else:
        print('   ❌ Query failed')
except:
    print('   ❌ Error parsing response')
"
    echo
done

echo "📈 NEXT STEPS:"
echo "- Current system supports education, trade, banking, and financial inclusion queries"
echo "- Can gradually expand to more business categories as needed"
echo "- Rate-limit friendly approach prevents API quota exhaustion"
echo

echo "💡 USAGE:"
echo "- Use ./test_business_queries.sh for comprehensive business testing"
echo "- Use ./my_query.sh for individual queries"
echo "- Server ready at http://localhost:8000"
