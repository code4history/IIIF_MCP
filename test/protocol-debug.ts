#!/usr/bin/env tsx
import { spawn } from 'child_process';
import path from 'path';
import { createInterface } from 'readline';

async function debugProtocol() {
  console.log('MCP Protocol Debug Test\n');
  
  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Create readline interface for server stdout
  const rl = createInterface({
    input: server.stdout,
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    console.log('[SERVER STDOUT]:', line);
  });

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 500));

  // Send initialize request (minimal MCP handshake)
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'debug-client',
        version: '1.0.0'
      }
    }
  };
  
  console.log('Sending initialize request...');
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send initialized notification
  const initializedNotif = {
    jsonrpc: '2.0',
    method: 'initialized'
  };
  
  console.log('\nSending initialized notification...');
  server.stdin.write(JSON.stringify(initializedNotif) + '\n');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Now try tools/list
  const listRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  };
  
  console.log('\nSending tools/list request...');
  server.stdin.write(JSON.stringify(listRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Try tools/call
  const callRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'iiif-search',
      arguments: {
        searchServiceUrl: 'http://httpbin.org/get',
        query: 'test'
      }
    }
  };
  
  console.log('\nSending tools/call request...');
  server.stdin.write(JSON.stringify(callRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\nClosing server...');
  server.kill();
}

debugProtocol().catch(console.error);