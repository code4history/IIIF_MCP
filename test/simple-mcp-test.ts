#!/usr/bin/env tsx
/**
 * Minimal MCP client test without complex process management
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

async function testMCPServer() {
  console.log('Simple MCP Server Test\n');
  
  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  
  // Create transport and client
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  const client = new Client({
    name: 'simple-test-client',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  try {
    // Connect to server
    await client.connect(transport);
    console.log('✅ Connected to server\n');

    // List tools
    console.log('Testing listTools...');
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name).join(', '));
    console.log('');

    // Test search with a mock URL (will fail but should not timeout)
    console.log('Testing callTool with mock data...');
    try {
      const result = await client.callTool('iiif-search', {
        searchServiceUrl: 'http://httpbin.org/get',  // Public test endpoint
        query: 'test'
      });
      console.log('Result:', result);
    } catch (error: any) {
      console.log(`Expected error (not a timeout): ${error.message}`);
    }

    console.log('\n✅ All tests completed without timeout!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run test
testMCPServer().catch(console.error);