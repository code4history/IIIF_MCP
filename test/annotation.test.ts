import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { IIIFAnnotationClient } from '../src/index';

vi.mock('axios');
const mockedAxios = axios as any;

describe('IIIFAnnotationClient', () => {
  let client: IIIFAnnotationClient;

  beforeEach(() => {
    client = new IIIFAnnotationClient();
    vi.clearAllMocks();
  });

  describe('getAnnotations', () => {
    it('should fetch annotations with correct parameters', async () => {
      const mockAnnotations = {
        "@context": "http://iiif.io/api/presentation/2/context.json",
        "@id": "https://example.org/annotations/list1",
        "@type": "sc:AnnotationList",
        resources: [
          {
            "@id": "https://example.org/annotation/1",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: {
              "@type": "cnt:ContentAsText",
              chars: "Test annotation text",
              format: "text/plain",
              language: "en"
            },
            on: "https://example.org/canvas/1#xywh=100,100,500,500"
          }
        ]
      };

      mockedAxios.get.mockResolvedValue({ data: mockAnnotations });

      const result = await client.getAnnotations('https://example.org/annotations/list1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.org/annotations/list1',
        {
          headers: {
            'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
          },
          timeout: 10000
        }
      );
      expect(result).toEqual(mockAnnotations);
    });
  });

  describe('formatAnnotations', () => {
    it('should format v2 text annotations', () => {
      const annotationList = {
        "@id": "https://example.org/annotations/list1",
        "@type": "sc:AnnotationList",
        resources: [
          {
            "@id": "https://example.org/annotation/1",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: {
              "@type": "cnt:ContentAsText",
              chars: "First line of text",
              language: "en"
            },
            on: "https://example.org/canvas/1"
          },
          {
            "@id": "https://example.org/annotation/2",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: {
              "@type": "cnt:ContentAsText",
              chars: "Second line of text",
              language: "en"
            },
            on: "https://example.org/canvas/1"
          }
        ]
      };

      const formatted = client.formatAnnotations(annotationList);

      expect(formatted).toContain('**Total Annotations**: 2');
      expect(formatted).toContain('**Languages**: en');
      expect(formatted).toContain('**Motivations**: painting');
      expect(formatted).toContain('First line of text');
      expect(formatted).toContain('Second line of text');
      expect(formatted).toContain('## Full Text Extract:');
    });

    it('should format v3 annotations', () => {
      const annotationPage = {
        "id": "https://example.org/annotations/page1",
        "type": "AnnotationPage",
        items: [
          {
            "id": "https://example.org/annotation/1",
            "type": "Annotation",
            motivation: "supplementing",
            body: {
              "type": "TextualBody",
              value: "Modern annotation text",
              language: "fr",
              format: "text/plain"
            },
            target: "https://example.org/canvas/1"
          }
        ]
      };

      const formatted = client.formatAnnotations(annotationPage);

      expect(formatted).toContain('**Languages**: fr');
      expect(formatted).toContain('Modern annotation text');
    });

    it('should handle multilingual annotations', () => {
      const annotationList = {
        "@id": "https://example.org/annotations/list1",
        "@type": "sc:AnnotationList",
        resources: [
          {
            "@id": "https://example.org/annotation/1",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: {
              chars: "English text",
              language: "en"
            },
            on: "https://example.org/canvas/1"
          },
          {
            "@id": "https://example.org/annotation/2",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: {
              chars: "Texte français",
              language: "fr"
            },
            on: "https://example.org/canvas/1"
          }
        ]
      };

      const formatted = client.formatAnnotations(annotationList);

      expect(formatted).toContain('**Languages**: en, fr');
      expect(formatted).toContain('### en:');
      expect(formatted).toContain('English text');
      expect(formatted).toContain('### fr:');
      expect(formatted).toContain('Texte français');
    });

    it('should filter by language', () => {
      const annotationList = {
        "@id": "https://example.org/annotations/list1",
        "@type": "sc:AnnotationList",
        resources: [
          {
            "@id": "https://example.org/annotation/1",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: {
              chars: "English text",
              language: "en"
            },
            on: "https://example.org/canvas/1"
          },
          {
            "@id": "https://example.org/annotation/2",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: {
              chars: "Texte français",
              language: "fr"
            },
            on: "https://example.org/canvas/1"
          }
        ]
      };

      const formatted = client.formatAnnotations(annotationList, { language: 'en' });

      expect(formatted).toContain('English text');
      expect(formatted).not.toContain('Texte français');
      expect(formatted).toContain('**Text Annotations Found**: 1');
    });

    it('should group by canvas', () => {
      const annotationList = {
        "@id": "https://example.org/annotations/list1",
        "@type": "sc:AnnotationList",
        resources: [
          {
            "@id": "https://example.org/annotation/1",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: { chars: "Canvas 1 text" },
            on: "https://example.org/canvas/1"
          },
          {
            "@id": "https://example.org/annotation/2",
            "@type": "oa:Annotation",
            motivation: "painting",
            body: { chars: "Canvas 2 text" },
            on: "https://example.org/canvas/2"
          }
        ]
      };

      const formatted = client.formatAnnotations(annotationList, { groupByCanvas: true });

      expect(formatted).toContain('## Annotations by Canvas:');
      expect(formatted).toContain('### Canvas: https://example.org/canvas/1');
      expect(formatted).toContain('### Canvas: https://example.org/canvas/2');
      expect(formatted).toContain('Canvas 1 text');
      expect(formatted).toContain('Canvas 2 text');
    });
  });

  describe('getStructuredAnnotations', () => {
    it('should return structured annotation data', () => {
      const annotationList = {
        "@id": "https://example.org/annotations/list1",
        "@type": "sc:AnnotationList",
        resources: [
          {
            "@id": "https://example.org/annotation/1",
            "@type": "oa:Annotation",
            motivation: ["painting", "transcribing"],
            body: {
              chars: "Test text",
              language: "en",
              format: "text/plain"
            },
            on: "https://example.org/canvas/1#xywh=100,100,500,500"
          }
        ]
      };

      const structured = client.getStructuredAnnotations(annotationList);

      expect(structured.url).toBe('https://example.org/annotations/list1');
      expect(structured.total_annotations).toBe(1);
      expect(structured.languages).toEqual(['en']);
      expect(structured.motivations).toContain('painting');
      expect(structured.motivations).toContain('transcribing');
      expect(structured.annotations[0].text).toBe('Test text');
      expect(structured.annotations[0].target).toBe('https://example.org/canvas/1#xywh=100,100,500,500');
      expect(structured.text_content?.full_text).toBe('Test text');
      expect(structured.text_content?.by_language['en']).toEqual(['Test text']);
    });
  });

  describe('getAnnotationsFromManifest', () => {
    it('should extract annotation URLs from v2 manifest', async () => {
      const mockManifest = {
        "@context": "http://iiif.io/api/presentation/2/context.json",
        "@id": "https://example.org/manifest",
        "@type": "sc:Manifest",
        sequences: [{
          "@type": "sc:Sequence",
          canvases: [
            {
              "@id": "https://example.org/canvas/1",
              "@type": "sc:Canvas",
              otherContent: [
                { "@id": "https://example.org/annotations/list1" },
                { "@id": "https://example.org/annotations/list2" }
              ]
            }
          ]
        }]
      };

      mockedAxios.get.mockResolvedValue({ data: mockManifest });

      const urls = await client.getAnnotationsFromManifest('https://example.org/manifest');

      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.org/annotations/list1');
      expect(urls).toContain('https://example.org/annotations/list2');
    });

    it('should extract annotation URLs from v3 manifest', async () => {
      const mockManifest = {
        "@context": "http://iiif.io/api/presentation/3/context.json",
        "id": "https://example.org/manifest",
        "type": "Manifest",
        items: [
          {
            "id": "https://example.org/canvas/1",
            "type": "Canvas",
            annotations: [
              { "id": "https://example.org/annotations/page1" },
              { "id": "https://example.org/annotations/page2" }
            ]
          }
        ]
      };

      mockedAxios.get.mockResolvedValue({ data: mockManifest });

      const urls = await client.getAnnotationsFromManifest('https://example.org/manifest');

      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.org/annotations/page1');
      expect(urls).toContain('https://example.org/annotations/page2');
    });
  });
});