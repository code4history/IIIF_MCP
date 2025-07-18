#!/usr/bin/env tsx
import { spawn } from 'child_process';
import path from 'path';

async function testCollection() {
  console.log('Testing IIIF Collection functionality...\n');
  
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
            // Test 1: Get formatted collection
            const collectionRequest = JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'iiif-collection',
                arguments: {
                  collectionUrl: 'https://iiif.bodleian.ox.ac.uk/iiif/collection/top'
                }
              }
            }) + '\n';
            
            console.log('Test 1: Get formatted collection from Bodleian...');
            mcpServer.stdin.write(collectionRequest);
            responseCount++;
          } else if (responseCount === 1 && response.result?.content) {
            console.log('\nFormatted Collection (truncated):');
            const content = response.result.content[0].text;
            const lines = content.split('\n');
            console.log(lines.slice(0, 15).join('\n'));
            console.log('...\n');
            
            // Test 2: Get structured collection
            const structuredRequest = JSON.stringify({
              jsonrpc: '2.0',
              id: 3,
              method: 'tools/call',
              params: {
                name: 'iiif-collection',
                arguments: {
                  collectionUrl: 'https://iiif.bodleian.ox.ac.uk/iiif/collection/top',
                  structured: true
                }
              }
            }) + '\n';
            
            console.log('Test 2: Get structured collection...');
            mcpServer.stdin.write(structuredRequest);
            responseCount++;
          } else if (responseCount === 2 && response.result?.content) {
            console.log('\nStructured Collection (truncated):');
            const structured = JSON.parse(response.result.content[0].text);
            console.log(JSON.stringify({
              ...structured,
              collections: structured.collections.slice(0, 2),
              manifests: structured.manifests.slice(0, 2)
            }, null, 2));
            
            // Test 3: Without items
            const withoutItemsRequest = JSON.stringify({
              jsonrpc: '2.0',
              id: 4,
              method: 'tools/call',
              params: {
                name: 'iiif-collection',
                arguments: {
                  collectionUrl: 'https://iiif.bodleian.ox.ac.uk/iiif/collection/top',
                  includeItems: false
                }
              }
            }) + '\n';
            
            console.log('\nTest 3: Get collection without items list...');
            mcpServer.stdin.write(withoutItemsRequest);
            responseCount++;
          } else if (responseCount === 3 && response.result?.content) {
            console.log('\nCollection without items (summary only):');
            const content = response.result.content[0].text;
            const lines = content.split('\n');
            console.log(lines.slice(0, 10).join('\n'));
            
            console.log('\nAll collection tests completed!');
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

testCollection().catch(console.error);