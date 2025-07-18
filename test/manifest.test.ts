import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { IIIFManifestClient } from '../src/index';

vi.mock('axios');
const mockedAxios = axios as any;

describe('IIIFManifestClient', () => {
  let client: IIIFManifestClient;

  beforeEach(() => {
    client = new IIIFManifestClient();
    vi.clearAllMocks();
  });

  describe('getManifest', () => {
    it('should fetch manifest with correct headers', async () => {
      const mockManifest = {
        id: 'https://example.org/manifest.json',
        type: 'Manifest',
        label: { en: ['Test Manifest'] },
        metadata: [
          {
            label: { en: ['Author'] },
            value: { en: ['John Doe'] }
          }
        ],
        items: [
          {
            id: 'https://example.org/canvas/1',
            type: 'Canvas',
            label: { en: ['Page 1'] },
            width: 1000,
            height: 1500
          }
        ]
      };

      mockedAxios.get.mockResolvedValue({ data: mockManifest });

      const result = await client.getManifest('https://example.org/manifest.json');

      expect(mockedAxios.get).toHaveBeenCalledWith('https://example.org/manifest.json', {
        headers: {
          'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
        },
        timeout: 10000
      });
      expect(result).toEqual(mockManifest);
    });

    it('should handle fetch errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(client.getManifest('https://example.org/manifest.json'))
        .rejects.toThrow('Failed to fetch manifest: Network error');
    });
  });

  describe('formatManifest', () => {
    const mockManifest = {
      id: 'https://example.org/manifest.json',
      type: 'Manifest',
      label: { en: ['Test Manifest'] },
      summary: { en: ['A test IIIF manifest'] },
      metadata: [
        {
          label: { en: ['Author'] },
          value: { en: ['John Doe'] }
        },
        {
          label: { en: ['Date'] },
          value: { en: ['2024'] }
        }
      ],
      rights: 'https://creativecommons.org/licenses/by/4.0/',
      provider: [
        {
          id: 'https://example.org',
          type: 'Agent',
          label: { en: ['Example Library'] },
          homepage: [
            {
              id: 'https://example.org',
              type: 'Text',
              label: { en: ['Home'] }
            }
          ]
        }
      ],
      items: [
        {
          id: 'https://example.org/canvas/1',
          type: 'Canvas',
          label: { en: ['Page 1'] },
          width: 1000,
          height: 1500
        },
        {
          id: 'https://example.org/canvas/2',
          type: 'Canvas',
          label: { en: ['Page 2'] },
          width: 1000,
          height: 1500
        }
      ],
      structures: [
        {
          id: 'https://example.org/range/1',
          type: 'Range',
          label: { en: ['Chapter 1'] },
          items: [
            { id: 'https://example.org/canvas/1', type: 'Canvas' }
          ]
        }
      ],
      thumbnail: [
        {
          id: 'https://example.org/thumb.jpg',
          type: 'Image',
          format: 'image/jpeg',
          width: 200,
          height: 300
        }
      ]
    };

    it('should format all manifest properties by default', () => {
      const formatted = client.formatManifest(mockManifest);

      expect(formatted).toContain('**Label**: Test Manifest');
      expect(formatted).toContain('**ID**: https://example.org/manifest.json');
      expect(formatted).toContain('**Type**: Manifest');
      expect(formatted).toContain('**Summary**: A test IIIF manifest');
      expect(formatted).toContain('**Metadata**:');
      expect(formatted).toContain('- Author: John Doe');
      expect(formatted).toContain('- Date: 2024');
      expect(formatted).toContain('**Rights**: https://creativecommons.org/licenses/by/4.0/');
      expect(formatted).toContain('**Provider**:');
      expect(formatted).toContain('- Example Library (https://example.org)');
      expect(formatted).toContain('**Pages/Canvases**: 2 items');
      expect(formatted).toContain('1. Page 1 (1000x1500)');
      expect(formatted).toContain('2. Page 2 (1000x1500)');
      expect(formatted).toContain('**Table of Contents**:');
      expect(formatted).toContain('- Chapter 1 (1 items)');
      expect(formatted).toContain('**Thumbnail**: https://example.org/thumb.jpg');
    });

    it('should format only specified properties', () => {
      const formatted = client.formatManifest(mockManifest, ['label', 'metadata']);

      expect(formatted).toContain('**Label**: Test Manifest');
      expect(formatted).toContain('**Metadata**:');
      expect(formatted).not.toContain('**Summary**');
      expect(formatted).not.toContain('**Rights**');
      expect(formatted).not.toContain('**Pages/Canvases**');
    });

    it('should handle missing labels gracefully', () => {
      const manifestWithNoLabels = {
        id: 'https://example.org/manifest.json',
        type: 'Manifest',
        label: {},
        items: []
      };

      const formatted = client.formatManifest(manifestWithNoLabels);
      expect(formatted).toContain('**Label**: Untitled');
    });

    it('should handle multilingual labels', () => {
      const multilingualManifest = {
        id: 'https://example.org/manifest.json',
        type: 'Manifest',
        label: { 
          en: ['English Title'],
          fr: ['Titre Français'],
          none: ['Default Title']
        },
        items: []
      };

      const formatted = client.formatManifest(multilingualManifest);
      expect(formatted).toContain('**Label**: English Title');
    });
  });
});