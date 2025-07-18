#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';

async function runTest() {
  console.log('Starting MCP IIIF CLI Test...\n');

  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  const client = new Client({
    name: 'iiif-test-client',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test search functionality
    console.log('Testing iiif-search tool...');
    
    // Test with a real IIIF endpoint (Harvard Library)
    try {
      const result = await client.callTool('iiif-search', {
        searchServiceUrl: 'https://iiif.lib.harvard.edu/manifests/drs:48309543/svc/searchwithin',
        query: 'Paris'
      });

      console.log('Search results:');
      console.log(result.content[0].text);
      console.log('\n✅ Search test passed\n');
    } catch (error) {
      console.error('❌ Search test failed:', error);
    }

    // Test with invalid parameters
    console.log('Testing error handling...');
    try {
      await client.callTool('iiif-search', {
        searchServiceUrl: '',
        query: ''
      });
      console.error('❌ Error handling test failed - should have thrown an error');
    } catch (error: any) {
      console.log('✅ Error handling test passed:', error.message);
    }

    // Test with non-existent tool
    console.log('\nTesting non-existent tool...');
    try {
      await client.callTool('non-existent-tool', {});
      console.error('❌ Non-existent tool test failed - should have thrown an error');
    } catch (error: any) {
      console.log('✅ Non-existent tool test passed:', error.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ All tests completed!');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});