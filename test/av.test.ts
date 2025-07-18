import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { IIIFAVClient } from '../src/index.js';

// Mock axios
vi.mock('axios');

describe('IIIFAVClient', () => {
  let client: IIIFAVClient;
  const mockedAxios = axios as any;

  beforeEach(() => {
    client = new IIIFAVClient();
    vi.clearAllMocks();
  });

  describe('getAVManifest', () => {
    it('should fetch an A/V manifest', async () => {
      const mockManifest = {
        "@context": "http://iiif.io/api/presentation/3/context.json",
        "id": "https://example.org/av-manifest",
        "type": "Manifest",
        "label": { "en": ["Example Video"] },
        "items": [
          {
            "id": "https://example.org/canvas/1",
            "type": "Canvas",
            "duration": 120.5,
            "items": [
              {
                "id": "https://example.org/page/1",
                "type": "AnnotationPage",
                "items": [
                  {
                    "id": "https://example.org/annotation/1",
                    "type": "Annotation",
                    "motivation": "painting",
                    "body": {
                      "id": "https://example.org/video.mp4",
                      "type": "Video",
                      "format": "video/mp4",
                      "duration": 120.5,
                      "width": 1920,
                      "height": 1080
                    },
                    "target": "https://example.org/canvas/1"
                  }
                ]
              }
            ]
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockManifest });

      const result = await client.getAVManifest('https://example.org/av-manifest');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.org/av-manifest',
        {
          headers: {
            'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
          },
          timeout: 10000
        }
      );
      expect(result).toEqual(mockManifest);
    });

    it('should handle errors properly', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(client.getAVManifest('https://example.org/av-manifest'))
        .rejects.toThrow('Failed to fetch AV manifest: Network error');
    });
  });

  describe('extractAVContent', () => {
    it('should extract A/V content from v3 manifest', () => {
      const manifest = {
        "id": "https://example.org/av-manifest",
        "type": "Manifest",
        "label": { "en": ["Example Video"] },
        "items": [
          {
            "id": "https://example.org/canvas/1",
            "type": "Canvas",
            "label": { "en": ["Video 1"] },
            "duration": 120.5,
            "items": [
              {
                "id": "https://example.org/page/1",
                "type": "AnnotationPage",
                "items": [
                  {
                    "id": "https://example.org/annotation/1",
                    "type": "Annotation",
                    "body": {
                      "id": "https://example.org/video.mp4",
                      "type": "Video",
                      "format": "video/mp4",
                      "duration": 120.5,
                      "width": 1920,
                      "height": 1080
                    }
                  }
                ]
              }
            ]
          },
          {
            "id": "https://example.org/canvas/2",
            "type": "Canvas",
            "label": { "en": ["Audio 1"] },
            "duration": 180,
            "items": [
              {
                "id": "https://example.org/page/2",
                "type": "AnnotationPage",
                "items": [
                  {
                    "id": "https://example.org/annotation/2",
                    "type": "Annotation",
                    "body": {
                      "id": "https://example.org/audio.mp3",
                      "type": "Sound",
                      "format": "audio/mp3",
                      "duration": 180
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = client.extractAVContent(manifest as any);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "https://example.org/video.mp4",
        type: "Video",
        format: "video/mp4",
        duration: 120.5,
        width: 1920,
        height: 1080
      });
      expect(result[1]).toMatchObject({
        id: "https://example.org/audio.mp3",
        type: "Sound",
        format: "audio/mp3",
        duration: 180
      });
    });

    it('should extract A/V content from v2 manifest', () => {
      const manifest = {
        "@id": "https://example.org/av-manifest",
        "@type": "sc:Manifest",
        "sequences": [
          {
            "@type": "sc:Sequence",
            "canvases": [
              {
                "@id": "https://example.org/canvas/1",
                "@type": "sc:Canvas",
                "duration": 120,
                "content": [
                  {
                    "@id": "https://example.org/video.mp4",
                    "@type": "dctypes:MovingImage",
                    "format": "video/mp4"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = client.extractAVContent(manifest as any);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        "@id": "https://example.org/video.mp4",
        "@type": "dctypes:MovingImage",
        "format": "video/mp4"
      });
    });
  });

  describe('formatAVContent', () => {
    it('should format A/V manifest with media items', () => {
      const manifest = {
        "id": "https://example.org/av-manifest",
        "type": "Manifest",
        "label": { "en": ["Example Video Collection"] },
        "items": [
          {
            "id": "https://example.org/canvas/1",
            "type": "Canvas",
            "label": { "en": ["Introduction"] },
            "duration": 120.5,
            "items": [
              {
                "id": "https://example.org/page/1",
                "type": "AnnotationPage",
                "items": [
                  {
                    "id": "https://example.org/annotation/1",
                    "type": "Annotation",
                    "body": {
                      "id": "https://example.org/intro.mp4",
                      "type": "Video",
                      "format": "video/mp4",
                      "duration": 120.5,
                      "width": 1920,
                      "height": 1080
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = client.formatAVContent(manifest as any);

      expect(result).toContain('Audio/Video Manifest');
      expect(result).toContain('Example Video Collection');
      expect(result).toContain('**Total Duration**: 2:00');
      expect(result).toContain('Media Items (1)');
      expect(result).toContain('Introduction');
      expect(result).toContain('video/mp4');
      expect(result).toContain('1920x1080');
    });

    it('should handle manifest without A/V content', () => {
      const manifest = {
        "id": "https://example.org/manifest",
        "type": "Manifest",
        "label": "Regular Manifest",
        "items": []
      };

      const result = client.formatAVContent(manifest as any);

      expect(result).toContain('No audio/video content found');
    });

    it('should include ranges when requested', () => {
      const manifest = {
        "id": "https://example.org/av-manifest",
        "type": "Manifest",
        "label": "Video with Chapters",
        "items": [
          {
            "id": "https://example.org/canvas/1",
            "type": "Canvas",
            "duration": 300,
            "items": [
              {
                "id": "https://example.org/page/1",
                "type": "AnnotationPage",
                "items": [
                  {
                    "id": "https://example.org/annotation/1",
                    "type": "Annotation",
                    "body": {
                      "id": "https://example.org/video.mp4",
                      "type": "Video",
                      "format": "video/mp4"
                    }
                  }
                ]
              }
            ]
          }
        ],
        "structures": [
          {
            "id": "https://example.org/range/1",
            "type": "Range",
            "label": { "en": ["Chapter 1: Introduction"] }
          },
          {
            "id": "https://example.org/range/2",
            "type": "Range",
            "label": { "en": ["Chapter 2: Main Content"] }
          }
        ]
      };

      const result = client.formatAVContent(manifest as any, { includeRanges: true });

      expect(result).toContain('Structure/Chapters');
      expect(result).toContain('Chapter 1: Introduction');
      expect(result).toContain('Chapter 2: Main Content');
    });
  });

  describe('getStructuredAVContent', () => {
    it('should return structured A/V data', () => {
      const manifest = {
        "id": "https://example.org/av-manifest",
        "type": "Manifest",
        "label": { "en": ["Structured Video"] },
        "items": [
          {
            "id": "https://example.org/canvas/1",
            "type": "Canvas",
            "label": { "en": ["Part 1"] },
            "duration": 120,
            "items": [
              {
                "id": "https://example.org/page/1",
                "type": "AnnotationPage",
                "items": [
                  {
                    "id": "https://example.org/annotation/1",
                    "type": "Annotation",
                    "body": {
                      "id": "https://example.org/part1.mp4",
                      "type": "Video",
                      "format": "video/mp4",
                      "width": 1280,
                      "height": 720
                    }
                  }
                ]
              }
            ]
          },
          {
            "id": "https://example.org/canvas/2",
            "type": "Canvas",
            "label": { "en": ["Part 2"] },
            "duration": 180,
            "items": [
              {
                "id": "https://example.org/page/2",
                "type": "AnnotationPage",
                "items": [
                  {
                    "id": "https://example.org/annotation/2",
                    "type": "Annotation",
                    "body": {
                      "id": "https://example.org/part2.mp4",
                      "type": "Video",
                      "format": "video/mp4",
                      "width": 1280,
                      "height": 720
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = client.getStructuredAVContent(manifest as any);

      expect(result.url).toBe("https://example.org/av-manifest");
      expect(result.label).toBe("Structured Video");
      expect(result.total_duration).toBe(300);
      expect(result.media_items).toHaveLength(2);
      expect(result.media_items[0]).toMatchObject({
        id: "https://example.org/part1.mp4",
        type: "Video",
        format: "video/mp4",
        label: "Part 1",
        duration: 120,
        canvas_id: "https://example.org/canvas/1",
        dimensions: {
          width: 1280,
          height: 720
        }
      });
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect((client as any).formatDuration(65)).toBe('1:05');
      expect((client as any).formatDuration(3665)).toBe('1:01:05');
      expect((client as any).formatDuration(30)).toBe('0:30');
    });
  });
});