#!/usr/bin/env tsx
import { IIIFSearchClient } from '../src/index';
import express from 'express';

async function runDirectTest() {
  console.log('Starting direct IIIF client test...\n');
  
  // Start mock server
  const app = express();
  const port = 3334;
  
  app.get('/search', (req, res) => {
    const query = req.query.q as string;
    console.log(`Mock server received query: ${query}`);
    
    res.json({
      "@context": "http://iiif.io/api/search/2/context.json",
      "@id": `http://localhost:${port}/search?q=${query}`,
      "@type": "search:AnnotationList",
      within: {
        "@type": "search:Layer",
        total: 1
      },
      hits: [
        {
          "@id": "http://localhost/annotation/1",
          "@type": "search:Hit",
          label: "Direct Test Result",
          hits: [
            {
              "@type": "search:TextQuoteSelector",
              match: query,
              before: "Found ",
              after: " in test"
            }
          ]
        }
      ]
    });
  });
  
  const server = app.listen(port, async () => {
    console.log(`Mock server running on port ${port}\n`);
    
    // Test the client directly
    const client = new IIIFSearchClient();
    
    try {
      console.log('Testing search...');
      const result = await client.search(`http://localhost:${port}/search`, 'test-query');
      console.log('Search result:', JSON.stringify(result, null, 2));
      
      const formatted = client.formatSearchResults(result);
      console.log('\nFormatted result:');
      console.log(formatted);
      
      console.log('\n✅ Direct test passed!');
    } catch (error) {
      console.error('❌ Direct test failed:', error);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runDirectTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});