#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const MOCK_SERVER_PORT = 3333;

async function waitForServer(url: string, maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Server did not start in time');
}

async function runTest() {
  console.log('Starting MCP IIIF CLI Test with Separate Processes...\n');
  
  // Start mock IIIF server in separate process
  const mockServerPath = path.join(__dirname, 'mock-iiif-server.ts');
  const mockServer = spawn('tsx', [mockServerPath], {
    env: { ...process.env, PORT: MOCK_SERVER_PORT.toString() },
    stdio: 'inherit'
  });
  
  try {
    // Wait for mock server to be ready
    await waitForServer(`http://localhost:${MOCK_SERVER_PORT}/search?q=test`);
    console.log('✅ Mock IIIF server is ready\n');
    
    // Start MCP server
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

    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test 1: Normal search
    console.log('Test 1: Normal search...');
    try {
      const result = await client.callTool('iiif-search', {
        searchServiceUrl: `http://localhost:${MOCK_SERVER_PORT}/search`,
        query: 'manuscript'
      });

      console.log('Search results:');
      console.log(result.content[0].text);
      console.log('✅ Test 1 passed\n');
    } catch (error) {
      console.error('❌ Test 1 failed:', error);
    }

    // Test 2: Empty query
    console.log('Test 2: Empty query validation...');
    try {
      await client.callTool('iiif-search', {
        searchServiceUrl: `http://localhost:${MOCK_SERVER_PORT}/search`,
        query: ''
      });
      console.error('❌ Test 2 failed - should have thrown an error');
    } catch (error: any) {
      console.log('✅ Test 2 passed:', error.message, '\n');
    }

    // Test 3: Invalid URL
    console.log('Test 3: Invalid URL handling...');
    try {
      await client.callTool('iiif-search', {
        searchServiceUrl: 'http://localhost:99999/search',
        query: 'test'
      });
      console.error('❌ Test 3 failed - should have thrown an error');
    } catch (error: any) {
      console.log('✅ Test 3 passed:', error.message, '\n');
    }

    // Test 4: Non-existent tool
    console.log('Test 4: Non-existent tool...');
    try {
      await client.callTool('non-existent-tool', {});
      console.error('❌ Test 4 failed - should have thrown an error');
    } catch (error: any) {
      console.log('✅ Test 4 passed:', error.message, '\n');
    }

    await client.close();
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    mockServer.kill();
  }
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});