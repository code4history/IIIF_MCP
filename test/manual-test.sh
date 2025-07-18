#!/bin/bash

echo "Starting manual MCP server test..."
echo ""
echo "Step 1: Starting mock IIIF server..."
tsx test/mock-iiif-server.ts &
MOCK_PID=$!
sleep 2

echo ""
echo "Step 2: Testing MCP server with direct JSON-RPC input..."
echo ""

# Test 1: List tools
echo "Test 1: Listing tools..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js 2>&1 | grep -A 20 "jsonrpc"

echo ""
echo "Test 2: Calling iiif-search tool..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"iiif-search","arguments":{"searchServiceUrl":"http://localhost:3333/search","query":"test"}}}' | node dist/index.js 2>&1 | grep -A 50 "jsonrpc"

# Clean up
kill $MOCK_PID 2>/dev/null

echo ""
echo "Test completed."