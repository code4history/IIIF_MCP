import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { IIIFSearchClient } from '../src/index';

vi.mock('axios');
const mockedAxios = axios as any;

describe('IIIFSearchClient', () => {
  let client: IIIFSearchClient;

  beforeEach(() => {
    client = new IIIFSearchClient();
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should search with correct parameters', async () => {
      const mockResponse = {
        data: {
          "@context": "http://iiif.io/api/search/2/context.json",
          "@id": "https://example.org/search?q=test",
          "@type": "search:AnnotationList",
          within: {
            "@type": "search:Layer",
            total: 2
          },
          hits: [
            {
              "@id": "https://example.org/annotation/1",
              "@type": "search:Hit",
              label: "Page 1"
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.search('https://example.org/search', 'test');

      expect(mockedAxios.get).toHaveBeenCalledWith('https://example.org/search', {
        params: { q: 'test' },
        headers: { 'Accept': 'application/json' },
        timeout: 10000
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle search errors', async () => {
      const axiosError = new Error('Network error');
      (axiosError as any).isAxiosError = true;
      mockedAxios.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(client.search('https://example.org/search', 'test'))
        .rejects.toThrow('Search failed: Network error');
    });
  });

  describe('formatSearchResults', () => {
    it('should format search results with hits', () => {
      const response = {
        "@context": "http://iiif.io/api/search/2/context.json",
        "@id": "https://example.org/search?q=manuscript",
        "@type": "search:AnnotationList",
        within: {
          "@type": "search:Layer",
          total: 2
        },
        hits: [
          {
            "@id": "https://example.org/annotation/1",
            "@type": "search:Hit",
            label: "Page 1",
            hits: [
              {
                "@type": "search:TextQuoteSelector",
                match: "manuscript",
                before: "This is a ",
                after: " from the 15th century"
              }
            ]
          },
          {
            "@id": "https://example.org/annotation/2",
            "@type": "search:Hit",
            label: "Page 5",
            hits: [
              {
                "@type": "search:TextQuoteSelector",
                match: "manuscript",
                before: "Another ",
                after: " reference"
              }
            ]
          }
        ]
      };

      const formatted = client.formatSearchResults(response);

      expect(formatted).toContain('Found 2 results');
      expect(formatted).toContain('Page 1');
      expect(formatted).toContain('This is a [manuscript] from the 15th century');
      expect(formatted).toContain('Page 5');
      expect(formatted).toContain('Another [manuscript] reference');
    });

    it('should handle results without hits array', () => {
      const response = {
        "@context": "http://iiif.io/api/search/2/context.json",
        "@id": "https://example.org/search?q=test",
        "@type": "search:AnnotationList",
        resources: [
          {
            "@id": "https://example.org/annotation/1",
            "@type": "search:Hit",
            label: "Resource 1"
          }
        ]
      };

      const formatted = client.formatSearchResults(response);

      expect(formatted).toContain('Found 1 results');
      expect(formatted).toContain('Resource 1');
    });

    it('should handle empty results', () => {
      const response = {
        "@context": "http://iiif.io/api/search/2/context.json",
        "@id": "https://example.org/search?q=notfound",
        "@type": "search:AnnotationList",
        hits: []
      };

      const formatted = client.formatSearchResults(response);

      expect(formatted).toBe('No results found.');
    });
  });
});