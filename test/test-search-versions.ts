#!/usr/bin/env tsx
import { spawn } from 'child_process';
import path from 'path';

async function testSearchVersions() {
  console.log('Testing IIIF Search API version handling...\n');
  
  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  const mcpServer = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Handle responses
  let responseCount = 0;
  let buffer = '';
  
  mcpServer.stdout.on('data', (data) => {
    buffer += data.toString();
    
    // Try to extract JSON responses
    const lines = buffer.split('\n');
    for (const line of lines) {
      if (line.trim() && line.startsWith('{')) {
        try {
          const response = JSON.parse(line);
          
          if (response.result?.tools && responseCount === 0) {
            // Got tools list, now send search request
            const searchRequest = JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'iiif-search',
                arguments: {
                  searchServiceUrl: 'https://ocr.lib.ncsu.edu/search/technician-basketballpreview-1997-11-10',
                  query: 'basketball'
                }
              }
            }) + '\n';
            
            console.log('Test 1: Search API v0 (NC State)...');
            mcpServer.stdin.write(searchRequest);
            responseCount++;
          } else if (response.result?.content) {
            console.log('\nResponse received:');
            if (response.result.content[0]?.text) {
              // Extract first few lines to show version info
              const lines = response.result.content[0].text.split('\n');
              console.log(lines.slice(0, 5).join('\n'));
              console.log('...\n');
            }
            
            mcpServer.kill();
            process.exit(0);
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }
  });

  // Send initial request
  const listRequest = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }) + '\n';
  
  mcpServer.stdin.write(listRequest);
}

testSearchVersions().catch(console.error);