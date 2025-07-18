import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { IIIFCollectionClient } from '../src/index';

vi.mock('axios');
const mockedAxios = axios as any;

describe('IIIFCollectionClient', () => {
  let client: IIIFCollectionClient;

  beforeEach(() => {
    client = new IIIFCollectionClient();
    vi.clearAllMocks();
  });

  describe('getCollection', () => {
    it('should fetch collection with correct parameters', async () => {
      const mockCollection = {
        "@context": "http://iiif.io/api/presentation/2/context.json",
        "@id": "https://example.org/collection/1",
        "@type": "sc:Collection",
        label: "Test Collection",
        description: "A test collection",
        collections: [
          {
            "@id": "https://example.org/collection/2",
            "@type": "sc:Collection",
            label: "Sub Collection"
          }
        ],
        manifests: [
          {
            "@id": "https://example.org/manifest/1",
            "@type": "sc:Manifest",
            label: "Test Manifest"
          }
        ]
      };

      mockedAxios.get.mockResolvedValue({ data: mockCollection });

      const result = await client.getCollection('https://example.org/collection/1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.org/collection/1',
        {
          headers: {
            'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
          },
          timeout: 10000
        }
      );
      expect(result).toEqual(mockCollection);
    });

    it('should handle errors', async () => {
      const axiosError = new Error('Network error');
      (axiosError as any).isAxiosError = true;
      mockedAxios.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(client.getCollection('https://example.org/collection/1'))
        .rejects.toThrow('Failed to fetch collection: Network error');
    });
  });

  describe('formatCollection', () => {
    it('should format v2 collection', () => {
      const collection = {
        "@id": "https://example.org/collection/1",
        "@type": "sc:Collection",
        label: "Test Collection",
        description: "A test collection",
        collections: [
          {
            "@id": "https://example.org/collection/2",
            "@type": "sc:Collection",
            label: "Sub Collection 1"
          },
          {
            "@id": "https://example.org/collection/3",
            "@type": "sc:Collection",
            label: "Sub Collection 2"
          }
        ],
        manifests: [
          {
            "@id": "https://example.org/manifest/1",
            "@type": "sc:Manifest",
            label: "Manifest 1",
            navDate: "1900-01-01"
          }
        ],
        metadata: [
          { label: "Author", value: "Test Author" },
          { label: "Date", value: "2024" }
        ]
      };

      const formatted = client.formatCollection(collection);

      expect(formatted).toContain('**Label**: Test Collection');
      expect(formatted).toContain('**ID**: https://example.org/collection/1');
      expect(formatted).toContain('**Type**: sc:Collection');
      expect(formatted).toContain('**Description**: A test collection');
      expect(formatted).toContain('Collections: 2');
      expect(formatted).toContain('Manifests: 1');
      expect(formatted).toContain('Total items: 3');
      expect(formatted).toContain('Sub Collection 1');
      expect(formatted).toContain('Sub Collection 2');
      expect(formatted).toContain('Manifest 1');
      expect(formatted).toContain('Date: 1900-01-01');
      expect(formatted).toContain('Author: Test Author');
    });

    it('should format v3 collection', () => {
      const collection = {
        "id": "https://example.org/collection/1",
        "type": "Collection",
        label: { en: ["Modern Collection"] },
        summary: { en: ["A modern IIIF collection"] },
        items: [
          {
            "id": "https://example.org/collection/2",
            "type": "Collection",
            label: { en: ["Nested Collection"] }
          },
          {
            "id": "https://example.org/manifest/1",
            "type": "Manifest",
            label: { en: ["Sample Manifest"] }
          }
        ],
        partOf: [
          {
            id: "https://example.org/collection/parent",
            type: "Collection",
            label: { en: ["Parent Collection"] }
          }
        ]
      };

      const formatted = client.formatCollection(collection);

      expect(formatted).toContain('**Label**: Modern Collection');
      expect(formatted).toContain('**Summary**: A modern IIIF collection');
      expect(formatted).toContain('Collections: 1');
      expect(formatted).toContain('Manifests: 1');
      expect(formatted).toContain('Nested Collection');
      expect(formatted).toContain('Sample Manifest');
      expect(formatted).toContain('**Part of**:');
      expect(formatted).toContain('Parent Collection');
    });

    it('should handle includeItems parameter', () => {
      const collection = {
        "@id": "https://example.org/collection/1",
        "@type": "sc:Collection",
        label: "Test Collection",
        manifests: [
          {
            "@id": "https://example.org/manifest/1",
            "@type": "sc:Manifest",
            label: "Test Manifest"
          }
        ]
      };

      const withItems = client.formatCollection(collection, true);
      const withoutItems = client.formatCollection(collection, false);

      expect(withItems).toContain('Test Manifest');
      expect(withoutItems).not.toContain('Test Manifest');
      expect(withoutItems).toContain('Total items: 1');
    });
  });

  describe('getStructuredCollection', () => {
    it('should return structured data for v2 collection', () => {
      const collection = {
        "@id": "https://example.org/collection/1",
        "@type": "sc:Collection",
        label: "Test Collection",
        collections: [
          {
            "@id": "https://example.org/collection/2",
            "@type": "sc:Collection",
            label: "Sub Collection"
          }
        ],
        manifests: [
          {
            "@id": "https://example.org/manifest/1",
            "@type": "sc:Manifest",
            label: "Test Manifest",
            navDate: "2024-01-01"
          }
        ]
      };

      const structured = client.getStructuredCollection(collection);

      expect(structured.id).toBe('https://example.org/collection/1');
      expect(structured.type).toBe('sc:Collection');
      expect(structured.label).toBe('Test Collection');
      expect(structured.total_items).toBe(2);
      expect(structured.collections).toHaveLength(1);
      expect(structured.collections[0].label).toBe('Sub Collection');
      expect(structured.manifests).toHaveLength(1);
      expect(structured.manifests[0].label).toBe('Test Manifest');
      expect(structured.manifests[0].navDate).toBe('2024-01-01');
    });

    it('should handle v3 items array', () => {
      const collection = {
        "id": "https://example.org/collection/1",
        "type": "Collection",
        label: { en: ["V3 Collection"] },
        items: [
          {
            "id": "https://example.org/collection/2",
            "type": "Collection",
            label: { en: ["Sub"] }
          },
          {
            "id": "https://example.org/manifest/1",
            "type": "Manifest",
            label: { en: ["Doc"] }
          }
        ]
      };

      const structured = client.getStructuredCollection(collection);

      expect(structured.collections).toHaveLength(1);
      expect(structured.manifests).toHaveLength(1);
      expect(structured.total_items).toBe(2);
    });

    it('should handle members array', () => {
      const collection = {
        "@id": "https://example.org/collection/1",
        "@type": "sc:Collection",
        label: "Mixed Collection",
        members: [
          {
            "@id": "https://example.org/collection/2",
            "@type": "sc:Collection",
            label: "Collection Member"
          },
          {
            "@id": "https://example.org/manifest/1",
            "@type": "sc:Manifest",
            label: "Manifest Member"
          }
        ]
      };

      const structured = client.getStructuredCollection(collection);

      expect(structured.collections).toHaveLength(1);
      expect(structured.manifests).toHaveLength(1);
      expect(structured.total_items).toBe(2);
    });
  });
});