import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { IIIFImageClient } from '../src/index';

vi.mock('axios');
const mockedAxios = axios as any;

describe('IIIFImageClient', () => {
  let client: IIIFImageClient;

  beforeEach(() => {
    client = new IIIFImageClient();
    vi.clearAllMocks();
  });

  describe('buildImageUrl', () => {
    it('should build URL with default parameters', () => {
      const url = client.buildImageUrl('https://example.org/image-service/abcd1234');
      expect(url).toBe('https://example.org/image-service/abcd1234/full/max/0/default.jpg');
    });

    it('should build URL with custom parameters', () => {
      const url = client.buildImageUrl('https://example.org/image-service/abcd1234', {
        region: '100,100,300,400',
        size: '500,',
        rotation: '90',
        quality: 'gray',
        format: 'png'
      });
      expect(url).toBe('https://example.org/image-service/abcd1234/100,100,300,400/500,/90/gray.png');
    });

    it('should handle trailing slash in base URL', () => {
      const url = client.buildImageUrl('https://example.org/image-service/abcd1234/', {
        region: 'square'
      });
      expect(url).toBe('https://example.org/image-service/abcd1234/square/max/0/default.jpg');
    });
  });

  describe('validateParameters', () => {
    it('should validate correct parameters', () => {
      const result = client.validateParameters({
        region: 'full',
        size: 'max',
        rotation: '0',
        quality: 'default',
        format: 'jpg'
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate region formats', () => {
      const validRegions = ['full', 'square', '0,0,100,100', 'pct:10,10,80,80'];
      validRegions.forEach(region => {
        const result = client.validateParameters({ region });
        expect(result.valid).toBe(true);
      });

      const invalidRegions = ['invalid', '100,100', 'pct:invalid'];
      invalidRegions.forEach(region => {
        const result = client.validateParameters({ region });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid region format');
      });
    });

    it('should validate size formats', () => {
      const validSizes = ['max', 'full', '100,', ',100', '100,100', 'pct:50', '!100,100'];
      validSizes.forEach(size => {
        const result = client.validateParameters({ size });
        expect(result.valid).toBe(true);
      });

      const invalidSizes = ['invalid', '100,100,100', 'pct:invalid'];
      invalidSizes.forEach(size => {
        const result = client.validateParameters({ size });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid size format');
      });
    });

    it('should validate rotation', () => {
      const validRotations = ['0', '90', '180', '270', '!90', '45.5'];
      validRotations.forEach(rotation => {
        const result = client.validateParameters({ rotation });
        expect(result.valid).toBe(true);
      });

      const result = client.validateParameters({ rotation: '400' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Rotation must be between 0 and 360 degrees');
    });

    it('should validate quality', () => {
      const validQualities = ['default', 'color', 'gray', 'bitonal'];
      validQualities.forEach(quality => {
        const result = client.validateParameters({ quality });
        expect(result.valid).toBe(true);
      });

      const result = client.validateParameters({ quality: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid quality');
    });

    it('should validate format', () => {
      const validFormats = ['jpg', 'png', 'tif', 'gif', 'jp2', 'pdf', 'webp'];
      validFormats.forEach(format => {
        const result = client.validateParameters({ format });
        expect(result.valid).toBe(true);
      });

      const result = client.validateParameters({ format: 'bmp' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid format');
    });
  });

  describe('getImageInfo', () => {
    it('should fetch image info', async () => {
      const mockInfo = {
        '@context': 'http://iiif.io/api/image/3/context.json',
        id: 'https://example.org/image-service/abcd1234',
        type: 'ImageService3',
        protocol: 'http://iiif.io/api/image',
        width: 6000,
        height: 4000,
        profile: 'level2',
        sizes: [
          { width: 150, height: 100 },
          { width: 600, height: 400 },
          { width: 3000, height: 2000 }
        ]
      };

      mockedAxios.get.mockResolvedValue({ data: mockInfo });

      const result = await client.getImageInfo('https://example.org/image-service/abcd1234/info.json');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.org/image-service/abcd1234/info.json',
        {
          headers: {
            'Accept': 'application/ld+json;profile="http://iiif.io/api/image/3/context.json", application/json'
          },
          timeout: 10000
        }
      );
      expect(result).toEqual(mockInfo);
    });
  });

  describe('formatImageInfo', () => {
    it('should format v3 image info', () => {
      const info = {
        id: 'https://example.org/image-service/abcd1234',
        type: 'ImageService3',
        protocol: 'http://iiif.io/api/image',
        width: 6000,
        height: 4000,
        profile: 'level2',
        sizes: [
          { width: 150, height: 100 },
          { width: 600, height: 400 }
        ],
        tiles: [
          { width: 512, height: 512, scaleFactors: [1, 2, 4, 8] }
        ]
      };

      const formatted = client.formatImageInfo(info);

      expect(formatted).toContain('**IIIF Image Information**');
      expect(formatted).toContain('**ID**: https://example.org/image-service/abcd1234');
      expect(formatted).toContain('**Type**: ImageService3');
      expect(formatted).toContain('**Protocol**: http://iiif.io/api/image');
      expect(formatted).toContain('**Dimensions**: 6000 × 4000 pixels');
      expect(formatted).toContain('**Profile**:');
      expect(formatted).toContain('- level2');
      expect(formatted).toContain('**Available Sizes**:');
      expect(formatted).toContain('- 150 × 100');
      expect(formatted).toContain('- 600 × 400');
      expect(formatted).toContain('**Tile Information**:');
      expect(formatted).toContain('- Width: 512, Height: 512, Scale Factors: 1, 2, 4, 8');
    });

    it('should handle v2 format with @id and @type', () => {
      const info = {
        '@id': 'https://example.org/image-service/abcd1234',
        '@type': 'iiif:Image',
        width: 3000,
        height: 2000,
        profile: ['http://iiif.io/api/image/2/level2.json']
      };

      const formatted = client.formatImageInfo(info);

      expect(formatted).toContain('**ID**: https://example.org/image-service/abcd1234');
      expect(formatted).toContain('**Type**: iiif:Image');
      expect(formatted).toContain('**Dimensions**: 3000 × 2000 pixels');
      expect(formatted).toContain('- http://iiif.io/api/image/2/level2.json');
    });
  });
});