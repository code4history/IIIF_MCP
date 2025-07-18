#!/usr/bin/env tsx
import { spawn } from 'child_process';
import path from 'path';

async function testManifest() {
  console.log('Testing IIIF Manifest functionality...\n');
  
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
  
  console.log('Listing tools...');
  mcpServer.stdin.write(listRequest);

  // Handle responses
  let responseCount = 0;
  mcpServer.stdout.on('data', (data) => {
    console.log('Response:', data.toString());
    responseCount++;
    
    if (responseCount === 1) {
      // Test 1: Get full manifest
      const manifestRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'iiif-manifest',
          arguments: {
            manifestUrl: 'https://d.lib.ncsu.edu/collections/catalog/technician-basketballpreview-1997-11-10/manifest.json'
          }
        }
      }) + '\n';
      
      console.log('\nTest 1: Getting full manifest from NC State...');
      mcpServer.stdin.write(manifestRequest);
    } else if (responseCount === 2) {
      // Test 2: Get specific properties
      const specificRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'iiif-manifest',
          arguments: {
            manifestUrl: 'https://d.lib.ncsu.edu/collections/catalog/technician-basketballpreview-1997-11-10/manifest.json',
            properties: ['label', 'metadata', 'items']
          }
        }
      }) + '\n';
      
      console.log('\nTest 2: Getting specific properties...');
      mcpServer.stdin.write(specificRequest);
    } else if (responseCount === 3) {
      // Test 3: Invalid URL
      const invalidRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'iiif-manifest',
          arguments: {
            manifestUrl: 'https://invalid.example.org/manifest.json'
          }
        }
      }) + '\n';
      
      console.log('\nTest 3: Testing error handling with invalid URL...');
      mcpServer.stdin.write(invalidRequest);
    } else if (responseCount === 4) {
      console.log('\nAll tests completed!');
      mcpServer.kill();
      process.exit(0);
    }
  });

  mcpServer.on('error', (err) => {
    console.error('MCP Server error:', err);
  });
}

testManifest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});