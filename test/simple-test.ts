#!/usr/bin/env tsx
import { spawn } from 'child_process';
import path from 'path';

async function runSimpleTest() {
  console.log('Starting simple MCP server test...\n');
  
  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  
  // Spawn the MCP server
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  server.stderr.on('data', (data) => {
    console.log('Server log:', data.toString());
  });
  
  // Send a list tools request
  const listToolsRequest = {
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  };
  
  console.log('Sending list tools request...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Read response
  server.stdout.on('data', (data) => {
    console.log('Response:', data.toString());
    
    // Send a tool call request
    const toolCallRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'iiif-search',
        arguments: {
          searchServiceUrl: 'https://example.org/search',
          query: 'test'
        }
      },
      id: 2
    };
    
    console.log('\nSending tool call request...');
    server.stdin.write(JSON.stringify(toolCallRequest) + '\n');
  });
  
  // Give it some time to respond
  setTimeout(() => {
    console.log('\nClosing server...');
    server.kill();
    process.exit(0);
  }, 5000);
}

runSimpleTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});