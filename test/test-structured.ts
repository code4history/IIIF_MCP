#!/usr/bin/env tsx
import { spawn } from 'child_process';
import path from 'path';

async function testStructuredOutput() {
  console.log('Testing structured output...\n');
  
  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  const mcpServer = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  let responseCount = 0;
  let buffer = '';
  
  mcpServer.stdout.on('data', (data) => {
    buffer += data.toString();
    
    const lines = buffer.split('\n');
    for (const line of lines) {
      if (line.trim() && line.startsWith('{')) {
        try {
          const response = JSON.parse(line);
          
          if (response.result?.tools && responseCount === 0) {
            // Test 1: Structured image URL
            const imageRequest = JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'iiif-image',
                arguments: {
                  imageUrl: 'https://iiif.lib.ncsu.edu/iiif/technician-basketballpreview-1997-11-10_0001',
                  region: 'pct:25,25,50,50',
                  size: '500,',
                  quality: 'gray',
                  format: 'png',
                  structured: true
                }
              }
            }) + '\n';
            
            console.log('Test 1: Structured image URL...');
            mcpServer.stdin.write(imageRequest);
            responseCount++;
          } else if (responseCount === 1 && response.result?.content) {
            console.log('\nStructured Image Result:');
            console.log(response.result.content[0].text);
            
            // Test 2: Structured search
            const searchRequest = JSON.stringify({
              jsonrpc: '2.0',
              id: 3,
              method: 'tools/call',
              params: {
                name: 'iiif-search',
                arguments: {
                  searchServiceUrl: 'https://ocr.lib.ncsu.edu/search/technician-basketballpreview-1997-11-10',
                  query: 'basketball',
                  structured: true
                }
              }
            }) + '\n';
            
            console.log('\nTest 2: Structured search...');
            mcpServer.stdin.write(searchRequest);
            responseCount++;
          } else if (responseCount === 2 && response.result?.content) {
            console.log('\nStructured Search Result (truncated):');
            const searchResult = JSON.parse(response.result.content[0].text);
            console.log(JSON.stringify({
              ...searchResult,
              results: searchResult.results.slice(0, 2) // Show only first 2 results
            }, null, 2));
            
            // Test 3: Structured manifest
            const manifestRequest = JSON.stringify({
              jsonrpc: '2.0',
              id: 4,
              method: 'tools/call',
              params: {
                name: 'iiif-manifest',
                arguments: {
                  manifestUrl: 'https://d.lib.ncsu.edu/collections/catalog/technician-basketballpreview-1997-11-10/manifest.json',
                  structured: true
                }
              }
            }) + '\n';
            
            console.log('\nTest 3: Structured manifest...');
            mcpServer.stdin.write(manifestRequest);
            responseCount++;
          } else if (responseCount === 3 && response.result?.content) {
            console.log('\nStructured Manifest Result (truncated):');
            const manifestResult = JSON.parse(response.result.content[0].text);
            console.log(JSON.stringify({
              ...manifestResult,
              images: manifestResult.images.slice(0, 2), // Show only first 2 images
              metadata: manifestResult.metadata?.slice(0, 3) // Show only first 3 metadata items
            }, null, 2));
            
            console.log('\nAll structured output tests completed!');
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

testStructuredOutput().catch(console.error);