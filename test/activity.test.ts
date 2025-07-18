import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { IIIFActivityClient } from '../src/index.js';

// Mock axios
vi.mock('axios');

describe('IIIFActivityClient', () => {
  let client: IIIFActivityClient;
  const mockedAxios = axios as any;

  beforeEach(() => {
    client = new IIIFActivityClient();
    vi.clearAllMocks();
  });

  describe('getActivityStream', () => {
    it('should fetch an activity stream collection', async () => {
      const mockCollection = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": "https://example.org/activity-stream",
        "type": "OrderedCollection",
        "totalItems": 150,
        "first": {
          "id": "https://example.org/activity-stream/page/1",
          "type": "OrderedCollectionPage"
        },
        "last": {
          "id": "https://example.org/activity-stream/page/15",
          "type": "OrderedCollectionPage"
        }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockCollection });

      const result = await client.getActivityStream('https://example.org/activity-stream');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.org/activity-stream',
        {
          headers: {
            'Accept': 'application/ld+json;profile="https://www.w3.org/ns/activitystreams", application/json'
          },
          timeout: 10000
        }
      );
      expect(result).toEqual(mockCollection);
    });

    it('should handle errors properly', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(client.getActivityStream('https://example.org/activity-stream'))
        .rejects.toThrow('Failed to fetch activity stream: Network error');
    });
  });

  describe('getActivityPage', () => {
    it('should fetch an activity page', async () => {
      const mockPage = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": "https://example.org/activity-stream/page/1",
        "type": "OrderedCollectionPage",
        "partOf": {
          "id": "https://example.org/activity-stream",
          "type": "OrderedCollection"
        },
        "startIndex": 0,
        "next": {
          "id": "https://example.org/activity-stream/page/2",
          "type": "OrderedCollectionPage"
        },
        "orderedItems": [
          {
            "id": "https://example.org/activity/1",
            "type": "Update",
            "object": {
              "id": "https://example.org/manifest/1",
              "type": "Manifest",
              "canonical": "https://example.org/iiif/manifest/1"
            },
            "endTime": "2024-01-15T10:00:00Z",
            "summary": "Manifest metadata updated"
          },
          {
            "id": "https://example.org/activity/2",
            "type": "Create",
            "object": {
              "id": "https://example.org/collection/1",
              "type": "Collection"
            },
            "endTime": "2024-01-14T15:30:00Z"
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockPage });

      const result = await client.getActivityPage('https://example.org/activity-stream/page/1');

      expect(result).toEqual(mockPage);
    });

    it('should throw error if response is not an OrderedCollectionPage', async () => {
      const mockInvalidData = {
        "type": "Collection",
        "id": "https://example.org/collection"
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockInvalidData });

      await expect(client.getActivityPage('https://example.org/activity-stream/page/1'))
        .rejects.toThrow('Response is not an Activity Page');
    });
  });

  describe('processActivityStream', () => {
    it('should format an OrderedCollection', () => {
      const mockCollection = {
        "id": "https://example.org/activity-stream",
        "type": "OrderedCollection",
        "totalItems": 150,
        "first": {
          "id": "https://example.org/activity-stream/page/1",
          "type": "OrderedCollectionPage"
        },
        "last": {
          "id": "https://example.org/activity-stream/page/15",
          "type": "OrderedCollectionPage"
        }
      };

      const result = client.processActivityStream(mockCollection);

      expect(result).toContain('Activity Stream Collection');
      expect(result).toContain('**Total Activities**: 150');
      expect(result).toContain('**First Page**: https://example.org/activity-stream/page/1');
      expect(result).toContain('**Last Page**: https://example.org/activity-stream/page/15');
    });

    it('should format an OrderedCollectionPage with activities', () => {
      const mockPage = {
        "id": "https://example.org/activity-stream/page/1",
        "type": "OrderedCollectionPage",
        "partOf": {
          "id": "https://example.org/activity-stream",
          "type": "OrderedCollection"
        },
        "startIndex": 0,
        "next": {
          "id": "https://example.org/activity-stream/page/2",
          "type": "OrderedCollectionPage"
        },
        "orderedItems": [
          {
            "id": "https://example.org/activity/1",
            "type": "Update",
            "object": {
              "id": "https://example.org/manifest/1",
              "type": "Manifest",
              "canonical": "https://example.org/iiif/manifest/1"
            },
            "endTime": "2024-01-15T10:00:00Z",
            "summary": "Manifest metadata updated"
          }
        ]
      };

      const result = client.processActivityStream(mockPage);

      expect(result).toContain('Activity Stream Page');
      expect(result).toContain('**Part of**: https://example.org/activity-stream');
      expect(result).toContain('[1] Update');
      expect(result).toContain('Object: Manifest - https://example.org/manifest/1');
      expect(result).toContain('Canonical: https://example.org/iiif/manifest/1');
      expect(result).toContain('Time: 2024-01-15T10:00:00Z');
      expect(result).toContain('Summary: Manifest metadata updated');
    });
  });

  describe('getStructuredActivities', () => {
    it('should return structured data for OrderedCollection', () => {
      const mockCollection = {
        "id": "https://example.org/activity-stream",
        "type": "OrderedCollection",
        "totalItems": 150
      };

      const result = client.getStructuredActivities(mockCollection);

      expect(result).toEqual({
        url: "https://example.org/activity-stream",
        type: "OrderedCollection",
        total_activities: 150,
        activities: []
      });
    });

    it('should return structured data for OrderedCollectionPage', () => {
      const mockPage = {
        "id": "https://example.org/activity-stream/page/1",
        "type": "OrderedCollectionPage",
        "partOf": {
          "id": "https://example.org/activity-stream",
          "type": "OrderedCollection"
        },
        "startIndex": 0,
        "next": {
          "id": "https://example.org/activity-stream/page/2",
          "type": "OrderedCollectionPage"
        },
        "prev": {
          "id": "https://example.org/activity-stream/page/0",
          "type": "OrderedCollectionPage"
        },
        "orderedItems": [
          {
            "id": "https://example.org/activity/1",
            "type": "Update",
            "object": {
              "id": "https://example.org/manifest/1",
              "type": "Manifest",
              "canonical": "https://example.org/iiif/manifest/1"
            },
            "endTime": "2024-01-15T10:00:00Z",
            "summary": "Manifest metadata updated"
          },
          {
            "id": "https://example.org/activity/2",
            "type": "Create",
            "object": {
              "id": "https://example.org/collection/1",
              "type": "Collection"
            },
            "startTime": "2024-01-14T15:30:00Z"
          }
        ]
      };

      const result = client.getStructuredActivities(mockPage);

      expect(result.url).toBe("https://example.org/activity-stream/page/1");
      expect(result.type).toBe("OrderedCollectionPage");
      expect(result.page_info).toEqual({
        current_page: "https://example.org/activity-stream/page/1",
        next_page: "https://example.org/activity-stream/page/2",
        prev_page: "https://example.org/activity-stream/page/0",
        part_of: "https://example.org/activity-stream",
        start_index: 0
      });
      expect(result.activities).toHaveLength(2);
      expect(result.activities[0]).toEqual({
        id: "https://example.org/activity/1",
        type: "Update",
        object_id: "https://example.org/manifest/1",
        object_type: "Manifest",
        canonical_uri: "https://example.org/iiif/manifest/1",
        timestamp: "2024-01-15T10:00:00Z",
        summary: "Manifest metadata updated"
      });
      expect(result.activities[1].timestamp).toBe("2024-01-14T15:30:00Z");
    });
  });
});