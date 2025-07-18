#!/bin/bash

echo "Starting manual MCP server test with debug output..."
echo ""

# Start mock server in background
echo "Starting mock IIIF server..."
npx tsx test/mock-iiif-server.ts &
MOCK_PID=$!
sleep 3

# Test the mock server directly
echo "Testing mock server directly..."
curl -s "http://localhost:3333/search?q=test" | jq .

echo ""
echo "Now testing MCP server..."
echo ""

# Create a temporary file for the request
cat > /tmp/mcp-request.json << EOF
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"iiif-search","arguments":{"searchServiceUrl":"http://localhost:3333/search","query":"test"}}}
EOF

# Run the MCP server and capture all output
cat /tmp/mcp-request.json | node dist/index.js

# Clean up
kill $MOCK_PID 2>/dev/null
rm -f /tmp/mcp-request.json

echo ""
echo "Test completed."