#!/usr/bin/env tsx
import express from 'express';

const app = express();
const port = process.env.PORT || 3333;

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

app.listen(port, () => {
  console.log(`Mock IIIF server running on http://localhost:${port}`);
});