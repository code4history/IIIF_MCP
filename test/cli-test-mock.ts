#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import express from 'express';
import path from 'path';
import { Server } from 'http';

// Mock IIIF server
function createMockServer(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const app = express();
    
    app.get('/search', (req, res) => {
      const query = req.query.q as string;
      
      if (!query) {
        res.status(400).json({ error: 'Missing query parameter' });
        return;
      }
      
      res.json({
        "@context": "http://iiif.io/api/search/2/context.json",
        "@id": `http://localhost:${port}/search?q=${query}`,
        "@type": "search:AnnotationList",
        within: {
          "@type": "search:Layer",
          total: 2
        },
        hits: [
          {
            "@id": "http://localhost/annotation/1",
            "@type": "search:Hit",
            label: "Test Page 1",
            hits: [
              {
                "@type": "search:TextQuoteSelector",
                match: query,
                before: "This is a test with ",
                after: " in the content"
              }
            ]
          },
          {
            "@id": "http://localhost/annotation/2",
            "@type": "search:Hit",
            label: "Test Page 2",
            hits: [
              {
                "@type": "search:TextQuoteSelector",
                match: query,
                before: "Another occurrence of ",
                after: " here"
              }
            ]
          }
        ]
      });
    });
    
    const server = app.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' ? address.port : 0;
      resolve({ server, port });
    });
  });
}

async function runTest() {
  console.log('Starting MCP IIIF CLI Test with Mock Server...\n');
  
  // Start mock server
  const { server, port } = await createMockServer();
  console.log(`✅ Mock IIIF server running on port ${port}\n`);

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
    
    try {
      const result = await client.callTool('iiif-search', {
        searchServiceUrl: `http://localhost:${port}/search`,
        query: 'manuscript'
      });

      console.log('Search results:');
      console.log(result.content[0].text);
      console.log('\n✅ Search test passed\n');
    } catch (error) {
      console.error('❌ Search test failed:', error);
    }

    // Test with empty query
    console.log('Testing with empty query...');
    try {
      await client.callTool('iiif-search', {
        searchServiceUrl: `http://localhost:${port}/search`,
        query: ''
      });
      console.error('❌ Empty query test failed - should have thrown an error');
    } catch (error: any) {
      console.log('✅ Empty query test passed:', error.message);
    }

    // Test with invalid URL
    console.log('\nTesting with invalid URL...');
    try {
      const result = await client.callTool('iiif-search', {
        searchServiceUrl: 'http://localhost:99999/search',
        query: 'test'
      });
      console.error('❌ Invalid URL test failed - should have thrown an error');
    } catch (error: any) {
      console.log('✅ Invalid URL test passed:', error.message);
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
    server.close();
    console.log('\n✅ All tests completed!');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});