#!/usr/bin/env tsx
import { spawn } from 'child_process';
import path from 'path';

// Start mock server first
const mockServerPath = path.join(__dirname, 'mock-iiif-server.ts');
const mockServer = spawn('npx', ['tsx', mockServerPath], {
  env: { ...process.env, PORT: '3333' },
  stdio: 'inherit'
});

// Wait a bit for server to start
setTimeout(() => {
  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  const mcpServer = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Send list tools request
  const listRequest = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }) + '\n';
  
  console.log('Sending list tools request...');
  mcpServer.stdin.write(listRequest);

  // Handle responses
  let responseCount = 0;
  mcpServer.stdout.on('data', (data) => {
    console.log('Response:', data.toString());
    responseCount++;
    
    // After getting tools list, send a search request (only once)
    if (responseCount === 1) {
      const searchRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'iiif-search',
          arguments: {
            searchServiceUrl: 'http://localhost:3333/search',
            query: 'test'
          }
        }
      }) + '\n';
      
      console.log('\nSending search request...');
      mcpServer.stdin.write(searchRequest);
    }
    
    // After receiving both responses, exit
    if (responseCount === 2) {
      setTimeout(() => {
        console.log('\nTest completed successfully!');
        mcpServer.kill();
        mockServer.kill();
        process.exit(0);
      }, 500);
    }
  });

  mcpServer.on('error', (err) => {
    console.error('MCP Server error:', err);
  });

}, 2000);

process.on('exit', () => {
  mockServer.kill();
});