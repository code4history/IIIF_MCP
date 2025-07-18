# IIIF MCP Server

MCP (Model Context Protocol) server for IIIF (International Image Interoperability Framework) integration.

## Implementation Status

### Core Features
- [x] **Search**: Content Search API integration for searching within IIIF resources
  - ✅ Full-text search within IIIF documents
  - ✅ Support for Search API v0, v1, and v2
  - ✅ Tested with NC State University's IIIF collections
  - ✅ Successfully deployed to Claude Desktop
- [x] **Metadata Retrieval**: Get manifest and collection metadata via Presentation API
  - ✅ Support for both IIIF Presentation API v2 and v3 formats
  - ✅ Flexible property selection
  - ✅ Multilingual label support
  - ✅ Handles complex metadata structures (HTML, nested properties)
- [x] **Image Operations**: Retrieve images with specified regions, sizes, and rotations via Image API
  - ✅ URL building with all IIIF Image API parameters
  - ✅ Parameter validation (region, size, rotation, quality, format)
  - ✅ Image info retrieval with v2/v3 support
  - ✅ Comprehensive error handling

### Extended Features (Planned)

#### Collection Management
- [x] **List Collections**: Retrieve all available collections
  - ✅ Support for both IIIF Presentation API v2 and v3 formats
  - ✅ Hierarchical navigation of nested collections
  - ✅ Detailed listing of sub-collections and manifests
- [x] **Collection Contents**: List manifests within a collection
  - ✅ Separate grouping of collections and manifests
  - ✅ Optional detailed item listing
  - ✅ Navigation date support for temporal organization
- [x] **Hierarchical Navigation**: Navigate nested collection structures
  - ✅ Part-of relationships for parent collections
  - ✅ Support for v2 collections/manifests/members arrays
  - ✅ Support for v3 items array with type detection

#### Annotation Operations
- [x] **Search Annotations**: Find annotations by content or type
  - ✅ Support for IIIF v2 AnnotationLists and v3 AnnotationPages
  - ✅ Filter by motivation (painting, commenting, transcribing, etc.)
  - ✅ Direct annotation URL or manifest-based extraction
- [x] **Extract Text**: Get all text annotations from a resource
  - ✅ Automatic text extraction from annotation bodies
  - ✅ Support for various text formats (ContentAsText, TextualBody)
  - ✅ Full text aggregation with proper spacing
- [x] **Multilingual Support**: Handle annotations in multiple languages
  - ✅ Language detection and filtering
  - ✅ Group annotations by language
  - ✅ Separate text extraction per language

#### Structure Navigation
- [ ] **Get Ranges**: Retrieve chapter/section structures
- [ ] **Page Sequences**: Navigate page order and sequences
- [ ] **Generate TOC**: Create table of contents from range structures

#### Content State Management
- [ ] **Save Views**: Store specific resource views using Content State API
- [ ] **Bookmarks**: Create and manage bookmarks
- [ ] **Citation Links**: Generate shareable reference links

#### Change Tracking
- [x] **Monitor Updates**: Track resource changes via Change Discovery API
  - ✅ Support for IIIF Change Discovery API 1.0
  - ✅ Process OrderedCollection and OrderedCollectionPage types
  - ✅ Navigate paginated activity streams
- [x] **Activity Stream Navigation**: Navigate through change activities
  - ✅ Fetch main activity stream collections
  - ✅ Retrieve specific activity pages
  - ✅ Support for next/previous page navigation
- [x] **Activity Processing**: Extract and format change information
  - ✅ Parse Create, Update, Delete, and other activity types
  - ✅ Extract object references and canonical URIs
  - ✅ Display timestamps and summaries

#### Access Control
- [x] **Full Authentication Support**: Complete IIIF Authorization Flow API implementation
  - ✅ Cookie-based authentication flow
  - ✅ Token-based authentication flow
  - ✅ External authentication detection
  - ✅ Session management with automatic expiry handling
  - ✅ Probe service for access verification
  - ✅ Protected resource access with auth headers
  - ✅ Logout functionality with session cleanup
  - ✅ Support for both Auth API v1 and v2 formats
  - ✅ Compatible with IIIF Auth Demonstrator for testing

#### Media Processing
- [x] **AV Content**: Support audio/video resources
  - ✅ Extract audio and video items from IIIF manifests
  - ✅ Support for both IIIF v2 and v3 A/V content
  - ✅ Duration calculation and formatting
- [x] **Media Information**: Extract technical metadata
  - ✅ Video dimensions (width/height)
  - ✅ Audio/video formats and codecs
  - ✅ Duration for individual items and total runtime
- [x] **Chapter Navigation**: Support for time-based ranges
  - ✅ Extract structural ranges from manifests
  - ✅ Chapter/segment identification
  - ✅ Time-based navigation support
- [ ] **3D Models**: Handle 3D content types
- [ ] **PDF Export**: Generate PDF from IIIF resources

## Installation

```bash
npm install
npm run build
```

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "iiif": {
      "command": "node",
      "args": ["/path/to/mcp_iiif/dist/index.js"]
    }
  }
}
```

## Structured Output Support

All tools now support a `structured` parameter that returns JSON data instead of formatted text. This enables better integration with other MCP servers and programmatic processing.

### Benefits of Structured Output

1. **Integration with Download Tools**: Structured URLs and metadata can be easily passed to file download MCP servers
2. **Batch Processing**: Extract multiple image URLs or search results for automated workflows
3. **Data Analysis**: Parse and analyze IIIF metadata programmatically
4. **Custom Formatting**: Build your own presentation layer using the raw data

### Example: Image Download Workflow

```typescript
// 1. Get structured image URL from IIIF MCP Server
const imageResult = await iiifServer.callTool('iiif-image', {
  imageUrl: 'https://iiif.lib.ncsu.edu/iiif/technician-basketballpreview-1997-11-10_0001',
  region: 'pct:25,25,50,50',
  size: '500,',
  quality: 'gray',
  format: 'png',
  structured: true
});

// 2. Parse the structured result
const imageData = JSON.parse(imageResult);
// {
//   "url": "https://iiif.lib.ncsu.edu/iiif/.../pct:25,25,50,50/500,/0/gray.png",
//   "metadata": {
//     "suggested_filename": "technician_preview_crop_gray.png",
//     "original_id": "technician-basketballpreview-1997-11-10_0001"
//   }
// }

// 3. Pass to download MCP server
const downloadResult = await downloadServer.callTool('download_image', {
  url: imageData.url,
  filename: imageData.metadata.suggested_filename
});
```

## Available Tools

### ✅ iiif-search

Search within IIIF resources using the Content Search API.

**Parameters:**
- `searchServiceUrl` (string, required): The URL of the IIIF Content Search service endpoint
- `query` (string, required): The search query string
- `structured` (boolean, optional): Return structured JSON data instead of formatted text

**Example:**
```json
{
  "tool": "iiif-search",
  "arguments": {
    "searchServiceUrl": "https://iiif.lib.harvard.edu/manifests/drs:48309543/svc/searchwithin",
    "query": "Paris"
  }
}
```

**Response:**
Returns formatted search results including:
- Total number of hits
- Resource labels and IDs
- Match contexts with surrounding text
- Annotation references

### ✅ iiif-manifest

Retrieve manifest metadata from IIIF Presentation API.

**Parameters:**
- `manifestUrl` (string, required): The URL of the IIIF manifest
- `properties` (array, optional): Specific properties to retrieve. Options include:
  - `label`: Title of the resource
  - `id`: Unique identifier
  - `type`: Resource type
  - `summary`: Description (v3) or description (v2)
  - `metadata`: Descriptive metadata pairs
  - `rights`: Rights/license information
  - `provider`: Provider information
  - `viewingDirection`: Reading direction
  - `items`: Canvas/page information
  - `structures`: Table of contents
  - `thumbnail`: Thumbnail image URL
- `structured` (boolean, optional): Return structured JSON data instead of formatted text

### ✅ iiif-collection

Retrieve and navigate IIIF collections with support for hierarchical structures.

**Parameters:**
- `collectionUrl` (string, required): The URL of the IIIF collection
- `includeItems` (boolean, optional): Include detailed list of collection items (default: true)
- `structured` (boolean, optional): Return structured JSON data instead of formatted text

**Example:**
```json
{
  "tool": "iiif-collection",
  "arguments": {
    "collectionUrl": "https://iiif.bodleian.ox.ac.uk/iiif/collection/top",
    "includeItems": true
  }
}
```

**Response:**
- Formatted view includes collection metadata, item counts, and hierarchical listing
- Structured output provides arrays of sub-collections and manifests with metadata

### ✅ iiif-image

Build IIIF Image API URLs and retrieve image information.

**Parameters:**
- `imageUrl` (string, required): Base URL of the IIIF image (without parameters)
- `region` (string, optional): Image region (full, square, x,y,w,h, or pct:x,y,w,h)
- `size` (string, optional): Image size (max, w,h, w,, ,h, pct:n, or !w,h)
- `rotation` (string, optional): Rotation in degrees (0-360, optionally prefixed with ! for mirroring)
- `quality` (string, optional): Image quality (default, color, gray, bitonal)
- `format` (string, optional): Image format (jpg, tif, png, gif, jp2, pdf, webp)
- `info` (boolean, optional): If true, retrieve image information instead of building URL
- `structured` (boolean, optional): Return structured JSON data instead of formatted text

**Example:**
```json
{
  "tool": "iiif-image",
  "arguments": {
    "imageUrl": "https://ids.lib.harvard.edu/ids/iiif/47174896",
    "region": "1000,2000,3000,4000",
    "size": "500,",
    "rotation": "90",
    "quality": "gray",
    "format": "jpg"
  }
}
```

**Response:**
- When building URLs: Returns the complete IIIF Image API URL with parameters
- When `info: true`: Returns formatted image information including dimensions, available sizes, tile information, and supported features

### ✅ iiif-annotation

Extract and analyze annotations from IIIF resources, including text transcriptions, translations, and commentary.

**Parameters:**
- `source` (string, required): Either an annotation URL or a manifest URL to extract annotations from
- `language` (string, optional): Filter annotations by language code (e.g., "en", "fr")
- `groupByCanvas` (boolean, optional): Group annotations by their target canvas
- `includeNonText` (boolean, optional): Include non-text annotations in the results
- `structured` (boolean, optional): Return structured JSON data instead of formatted text

**Example:**
```json
{
  "tool": "iiif-annotation",
  "arguments": {
    "source": "https://example.org/manifest.json",
    "language": "en",
    "groupByCanvas": true
  }
}
```

**Response:**
- Formatted view includes annotation counts, languages, motivations, and full text extraction
- Structured output provides detailed annotation data with text content organized by language
- Automatically detects and extracts text from various annotation formats (v2/v3)

### ✅ iiif-activity

Track changes and updates to IIIF resources using the Change Discovery API.

**Parameters:**
- `activityStreamUrl` (string): The URL of the IIIF Activity Stream (OrderedCollection)
- `pageUrl` (string): The URL of a specific activity page (OrderedCollectionPage)
- `structured` (boolean, optional): Return structured JSON data instead of formatted text

Note: Either `activityStreamUrl` or `pageUrl` must be provided.

**Example:**
```json
{
  "tool": "iiif-activity",
  "arguments": {
    "activityStreamUrl": "https://example.org/activity-stream"
  }
}
```

**Response:**
- For OrderedCollection: Shows total activities and links to first/last pages
- For OrderedCollectionPage: Displays activities with type, object references, timestamps, and summaries
- Structured output provides detailed activity data with pagination info

### ✅ iiif-av

Extract and analyze audio/video content from IIIF manifests.

**Parameters:**
- `manifestUrl` (string, required): The URL of the IIIF manifest containing A/V content
- `includeRanges` (boolean, optional): Include structural ranges/chapters in the output
- `structured` (boolean, optional): Return structured JSON data instead of formatted text

**Example:**
```json
{
  "tool": "iiif-av",
  "arguments": {
    "manifestUrl": "https://example.org/av-manifest.json",
    "includeRanges": true
  }
}
```

**Response:**
- Lists all audio/video items with format, duration, and dimensions
- Calculates total runtime for multi-part content
- Shows chapter/range information when available
- Structured output provides detailed media metadata and canvas associations

### ✅ iiif-auth

Full authentication support for IIIF resources with session management and protected content access.

**Parameters:**
- `action` (string, required): The authentication action to perform
  - `info`: Get authentication requirements without logging in
  - `authenticate`: Perform authentication with credentials
  - `probe`: Check access to a resource
  - `logout`: End authentication session
  - `get-protected`: Fetch protected resource with active session
- `resourceUrl` (string, required): The URL of the IIIF resource
- `username` (string, optional): Username for authentication (when action is `authenticate`)
- `password` (string, optional): Password for authentication (when action is `authenticate`)
- `token` (string, optional): Manually provide an access token (when action is `authenticate`)
- `sessionId` (string, optional): Manually provide a session ID (when action is `authenticate`)
- `interactive` (boolean, optional): Use interactive browser-based authentication (when action is `authenticate`)
- `structured` (boolean, optional): Return structured JSON data instead of formatted text

**Examples:**

1. Check authentication requirements:
```json
{
  "tool": "iiif-auth",
  "arguments": {
    "action": "info",
    "resourceUrl": "https://example.org/protected-manifest.json"
  }
}
```

2. Authenticate with credentials:
```json
{
  "tool": "iiif-auth",
  "arguments": {
    "action": "authenticate",
    "resourceUrl": "https://example.org/protected-manifest.json",
    "username": "testuser",
    "password": "testpass"
  }
}
```

3. Authenticate with browser (interactive):
```json
{
  "tool": "iiif-auth",
  "arguments": {
    "action": "authenticate",
    "resourceUrl": "https://example.org/protected-manifest.json",
    "interactive": true
  }
}
```

4. Authenticate with manual token/session:
```json
{
  "tool": "iiif-auth",
  "arguments": {
    "action": "authenticate",
    "resourceUrl": "https://example.org/protected-manifest.json",
    "token": "your-access-token-here"
  }
}
```

5. Check access to resource:
```json
{
  "tool": "iiif-auth",
  "arguments": {
    "action": "probe",
    "resourceUrl": "https://example.org/protected-manifest.json"
  }
}
```

6. Get protected content:
```json
{
  "tool": "iiif-auth",
  "arguments": {
    "action": "get-protected",
    "resourceUrl": "https://example.org/protected-manifest.json"
  }
}
```

**Features:**
- Cookie-based authentication with session management
- Token-based authentication with Bearer token support
- External authentication with browser-based flow
- Interactive authentication via local callback server
- Automatic browser opening for login pages
- Automatic session expiry handling
- Probe service integration for access verification
- Secure credential handling
- Support for both IIIF Auth API v1 and v2

**⚠️ CLI Authentication Limitations:**

Due to the nature of command-line environments, browser-based authentication has inherent limitations:

1. **Cookie Isolation**: Browser authentication sessions cannot be shared with the CLI process
   - When you log in via browser, cookies are stored in the browser's context
   - The CLI (Node.js) process cannot access these browser cookies
   - This is a security feature of modern browsers and operating systems

2. **IIIF Authentication Design**: The IIIF Auth API was designed for browser-based viewers
   - Relies on postMessage API and iframes for secure token exchange
   - These browser APIs are not available in Node.js CLI environments

**Recommended Authentication Methods for CLI:**

1. **Direct Authentication** (Preferred for CLI):
   ```json
   {
     "action": "authenticate",
     "resourceUrl": "https://example.org/protected-manifest.json",
     "username": "your-username",
     "password": "your-password"
   }
   ```

2. **Manual Token Authentication**:
   ```json
   {
     "action": "authenticate",
     "resourceUrl": "https://example.org/protected-manifest.json",
     "token": "your-access-token"
   }
   ```

3. **Interactive Browser Authentication** (Limited Support):
   - Opens browser for login
   - ⚠️ Cannot automatically capture the session
   - Suitable only for services that provide visible tokens after login

**Testing with IIIF Auth Demonstrator:**
- Base URL: `https://iiifauth.digtest.co.uk/`
- Test credentials: `username=username, password=password`
- Example protected manifest: `https://iiifauth.digtest.co.uk/manifestcookie.json`

**For Full Authentication Support:**
Consider using browser-based IIIF viewers (Mirador, Universal Viewer) which can properly handle the complete IIIF authentication flow with cookies and postMessage.

### 🚧 iiif-range (Coming Soon)

Navigate structural ranges (chapters, sections) within IIIF resources.

**Planned Parameters:**
- `manifestUrl` (string, required): URL of the manifest
- `rangeId` (string, optional): Specific range to retrieve

## Development

```bash
npm run dev  # Run in development mode
npm test     # Run tests
```

### Authentication and Protected Resources

```typescript
// Check if a resource requires authentication
const authInfo = await client.callTool('iiif-auth', {
  action: 'info',
  resourceUrl: 'https://iiifauth.digtest.co.uk/manifestcookie.json'
});

// Authenticate with credentials
const session = await client.callTool('iiif-auth', {
  action: 'authenticate',
  resourceUrl: 'https://iiifauth.digtest.co.uk/manifestcookie.json',
  username: 'username',
  password: 'password'
});

// Check access to protected resource
const access = await client.callTool('iiif-auth', {
  action: 'probe',
  resourceUrl: 'https://iiifauth.digtest.co.uk/manifestcookie.json'
});

// Get protected content after authentication
const protectedData = await client.callTool('iiif-auth', {
  action: 'get-protected',
  resourceUrl: 'https://iiifauth.digtest.co.uk/manifestcookie.json'
});

// Logout when done
await client.callTool('iiif-auth', {
  action: 'logout',
  resourceUrl: 'https://iiifauth.digtest.co.uk/manifestcookie.json'
});
```

## Usage Examples

### Search within a IIIF resource

```typescript
// Search for "Paris" in a Harvard manuscript
const result = await client.callTool('iiif-search', {
  searchServiceUrl: 'https://iiif.lib.harvard.edu/manifests/drs:48309543/svc/searchwithin',
  query: 'Paris'
});

// Search in NC State University collections
const result = await client.callTool('iiif-search', {
  searchServiceUrl: 'https://ocr.lib.ncsu.edu/search/technician-basketballpreview-1997-11-10',
  query: 'basketball'
});

// Get structured search results for processing
const structuredResult = await client.callTool('iiif-search', {
  searchServiceUrl: 'https://ocr.lib.ncsu.edu/search/technician-basketballpreview-1997-11-10',
  query: 'basketball',
  structured: true
});
// Returns JSON with results array, total count, etc.
```

### Get manifest metadata

```typescript
// Retrieve all metadata for a specific manifest
const manifest = await client.callTool('iiif-manifest', {
  manifestUrl: 'https://d.lib.ncsu.edu/collections/catalog/technician-basketballpreview-1997-11-10/manifest.json'
});

// Retrieve specific properties only
const manifest = await client.callTool('iiif-manifest', {
  manifestUrl: 'https://iiif.bodleian.ox.ac.uk/iiif/manifest/e32a277e-91e2-4a6d-8ba6-cc4bad230410.json',
  properties: ['label', 'metadata', 'items']
});

// Get structured manifest data for processing
const structuredManifest = await client.callTool('iiif-manifest', {
  manifestUrl: 'https://d.lib.ncsu.edu/collections/catalog/technician-basketballpreview-1997-11-10/manifest.json',
  structured: true
});
// Returns JSON with images array, metadata, thumbnail URL, etc.
```

### Retrieve a specific image region

```typescript
// Get a 500px wide crop of a specific region
const image = await client.callTool('iiif-image', {
  imageUrl: 'https://ids.lib.harvard.edu/ids/iiif/47174896',
  region: '1000,2000,3000,4000',
  size: '500,',
  format: 'jpg'
});

// Get image information
const info = await client.callTool('iiif-image', {
  imageUrl: 'https://ids.lib.harvard.edu/ids/iiif/47174896',
  info: true
});

// Get structured image URL with metadata
const structuredImage = await client.callTool('iiif-image', {
  imageUrl: 'https://ids.lib.harvard.edu/ids/iiif/47174896',
  region: '1000,2000,3000,4000',
  size: '500,',
  format: 'jpg',
  structured: true
});
// Returns JSON with URL, suggested filename, parameters, etc.
```

### Navigate IIIF collections

```typescript
// Get top-level collection
const collection = await client.callTool('iiif-collection', {
  collectionUrl: 'https://iiif.bodleian.ox.ac.uk/iiif/collection/top'
});

// Get collection without detailed item listing
const summary = await client.callTool('iiif-collection', {
  collectionUrl: 'https://iiif.bodleian.ox.ac.uk/iiif/collection/top',
  includeItems: false
});

// Get structured collection data for processing
const structuredCollection = await client.callTool('iiif-collection', {
  collectionUrl: 'https://digital.library.yale.edu/collections/iiif',
  structured: true
});
// Returns JSON with sub-collections and manifests arrays
```

### Extract text annotations

```typescript
// Extract all text annotations from a manifest
const annotations = await client.callTool('iiif-annotation', {
  source: 'https://example.org/manifest-with-transcriptions.json'
});

// Filter annotations by language
const frenchAnnotations = await client.callTool('iiif-annotation', {
  source: 'https://gallica.bnf.fr/iiif/ark:/12148/btv1b8449691v/manifest.json',
  language: 'fr'
});

// Get structured annotation data for processing
const structuredAnnotations = await client.callTool('iiif-annotation', {
  source: 'https://example.org/annotations/list1.json',
  structured: true
});
// Returns JSON with full text, language breakdown, and annotation metadata
```

### Track resource changes

```typescript
// Get activity stream overview
const activities = await client.callTool('iiif-activity', {
  activityStreamUrl: 'https://example.org/activity-stream'
});

// Fetch a specific page of activities
const page = await client.callTool('iiif-activity', {
  pageUrl: 'https://example.org/activity-stream/page/1'
});

// Get structured activity data for processing
const structuredActivities = await client.callTool('iiif-activity', {
  pageUrl: 'https://example.org/activity-stream/page/1',
  structured: true
});
// Returns JSON with activities array, pagination info, etc.
```

### Process audio/video content

```typescript
// Extract A/V content from a manifest
const avContent = await client.callTool('iiif-av', {
  manifestUrl: 'https://example.org/av-manifest.json'
});

// Include chapter/range information
const avWithChapters = await client.callTool('iiif-av', {
  manifestUrl: 'https://example.org/lecture-recording.json',
  includeRanges: true
});

// Get structured A/V data for processing
const structuredAV = await client.callTool('iiif-av', {
  manifestUrl: 'https://example.org/video-collection.json',
  structured: true
});
// Returns JSON with media items, durations, dimensions, etc.
```

## API Specifications

This server implements tools based on the following IIIF specifications:
- [IIIF Image API 3.0](https://iiif.io/api/image/3.0/)
- [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/)
- [IIIF Content Search API 2.0](https://iiif.io/api/search/2.0/)
- [IIIF Change Discovery API 1.0](https://iiif.io/api/discovery/1.0/)
- [IIIF Authorization Flow API 2.0](https://iiif.io/api/auth/2.0/)
- [IIIF Content State API 1.0](https://iiif.io/api/content-state/1.0/)

## Structured Output Examples

### Search Results
```json
{
  "url": "https://ocr.lib.ncsu.edu/search/...",
  "service_url": "https://ocr.lib.ncsu.edu/search/...",
  "query": "basketball",
  "total_results": 24,
  "api_version": "http://iiif.io/api/search/0/context.json",
  "results": [
    {
      "id": "urn:ocracoke:...",
      "type": "oa:Annotation",
      "label": "Page 1",
      "matches": [
        {
          "text": "basketball",
          "context": "NC State [basketball] team..."
        }
      ]
    }
  ]
}
```

### Manifest Structure
```json
{
  "url": "https://d.lib.ncsu.edu/.../manifest",
  "id": "https://d.lib.ncsu.edu/.../manifest",
  "type": "sc:Manifest",
  "label": "Technician Basketball Preview",
  "thumbnail": "https://iiif.lib.ncsu.edu/.../thumbnail.jpg",
  "images": [
    {
      "id": "https://d.lib.ncsu.edu/.../canvas/page_0001",
      "label": "[1]",
      "width": 3573,
      "height": 4425
    }
  ],
  "metadata": [
    {
      "label": "Creator",
      "value": "Technician (Raleigh, N.C.)"
    }
  ]
}
```

### Image URL Structure
```json
{
  "url": "https://iiif.lib.ncsu.edu/.../pct:25,25,50,50/500,/0/gray.png",
  "base_url": "https://iiif.lib.ncsu.edu/.../image_0001",
  "parameters": {
    "region": "pct:25,25,50,50",
    "size": "500,",
    "rotation": "0",
    "quality": "gray",
    "format": "png"
  },
  "metadata": {
    "suggested_filename": "image_0001_crop_gray.png",
    "original_id": "image_0001"
  }
}
```

### Collection Structure
```json
{
  "url": "https://iiif.bodleian.ox.ac.uk/iiif/collection/top",
  "id": "https://iiif.bodleian.ox.ac.uk/iiif/collection/top",
  "type": "Collection",
  "label": "Bodleian Libraries: Top Collection",
  "total_items": 25,
  "collections": [
    {
      "id": "https://iiif.bodleian.ox.ac.uk/.../medieval",
      "type": "Collection",
      "label": "Medieval Manuscripts"
    }
  ],
  "manifests": [
    {
      "id": "https://iiif.bodleian.ox.ac.uk/.../ms-canon-misc-213",
      "type": "Manifest",
      "label": "MS. Canon. Misc. 213",
      "navDate": "1450-01-01"
    }
  ],
  "partOf": [
    {
      "id": "https://iiif.bodleian.ox.ac.uk/.../parent",
      "label": "Parent Collection"
    }
  ]
}
```

### Annotation Structure
```json
{
  "url": "https://example.org/annotations/list1",
  "total_annotations": 15,
  "languages": ["en", "fr"],
  "motivations": ["painting", "commenting", "transcribing"],
  "annotations": [
    {
      "id": "https://example.org/annotation/1",
      "type": "Annotation",
      "motivation": ["transcribing"],
      "text": "This is the transcribed text from the manuscript",
      "language": "en",
      "format": "text/plain",
      "target": "https://example.org/canvas/1#xywh=100,100,500,300"
    }
  ],
  "text_content": {
    "full_text": "This is the transcribed text from the manuscript...",
    "by_language": {
      "en": ["This is the transcribed text..."],
      "fr": ["Ceci est le texte transcrit..."]
    }
  }
}
```

### Activity Stream Structure
```json
{
  "url": "https://example.org/activity-stream/page/1",
  "type": "OrderedCollectionPage",
  "page_info": {
    "current_page": "https://example.org/activity-stream/page/1",
    "next_page": "https://example.org/activity-stream/page/2",
    "prev_page": "https://example.org/activity-stream/page/0",
    "part_of": "https://example.org/activity-stream",
    "start_index": 0
  },
  "activities": [
    {
      "id": "https://example.org/activity/1",
      "type": "Update",
      "object_id": "https://example.org/manifest/1",
      "object_type": "Manifest",
      "canonical_uri": "https://example.org/iiif/manifest/1",
      "timestamp": "2024-01-15T10:00:00Z",
      "summary": "Manifest metadata updated"
    },
    {
      "id": "https://example.org/activity/2",
      "type": "Create",
      "object_id": "https://example.org/collection/1",
      "object_type": "Collection",
      "timestamp": "2024-01-14T15:30:00Z"
    }
  ]
}
```

### A/V Content Structure
```json
{
  "url": "https://example.org/av-manifest",
  "id": "https://example.org/av-manifest",
  "type": "Manifest",
  "label": "Lecture Recording",
  "total_duration": 3600,
  "media_items": [
    {
      "id": "https://example.org/lecture-part1.mp4",
      "type": "Video",
      "format": "video/mp4",
      "label": "Part 1: Introduction",
      "duration": 1200,
      "dimensions": {
        "width": 1920,
        "height": 1080
      },
      "canvas_id": "https://example.org/canvas/1"
    },
    {
      "id": "https://example.org/lecture-part2.mp4",
      "type": "Video",
      "format": "video/mp4",
      "label": "Part 2: Main Content",
      "duration": 2400,
      "dimensions": {
        "width": 1920,
        "height": 1080
      },
      "canvas_id": "https://example.org/canvas/2"
    }
  ],
  "ranges": [
    {
      "id": "https://example.org/range/intro",
      "label": "Introduction",
      "start_time": 0,
      "end_time": 300,
      "items": ["https://example.org/canvas/1"]
    },
    {
      "id": "https://example.org/range/main",
      "label": "Main Presentation",
      "start_time": 300,
      "end_time": 3600,
      "items": ["https://example.org/canvas/1", "https://example.org/canvas/2"]
    }
  ]
}
```

### Authentication Structure

#### Auth Info Response
```json
{
  "resource_url": "https://example.org/protected-manifest.json",
  "requires_auth": true,
  "auth_api_version": "v2",
  "login_services": [
    {
      "id": "https://example.org/auth/login",
      "profile": "http://iiif.io/api/auth/2/login",
      "label": "Login to Example Library",
      "header": "Please authenticate",
      "description": "Access requires institutional login",
      "confirm_label": "Login",
      "auth_api_version": "v2"
    }
  ],
  "token_services": [
    {
      "id": "https://example.org/auth/token",
      "profile": "http://iiif.io/api/auth/2/token",
      "auth_api_version": "v2"
    }
  ],
  "logout_services": [
    {
      "id": "https://example.org/auth/logout",
      "profile": "http://iiif.io/api/auth/2/logout",
      "label": "Logout",
      "auth_api_version": "v2"
    }
  ],
  "probe_services": [],
  "auth_services": [
    // Complete list of all auth-related services
  ]
}
```

#### Authentication Session Response
```json
{
  "success": true,
  "session": {
    "resourceUrl": "https://example.org/protected-manifest.json",
    "authType": "cookie",
    "expiresAt": "2024-01-15T11:00:00Z",
    "hasToken": false,
    "hasCookie": true
  }
}
```

#### Probe Access Response
```json
{
  "resourceUrl": "https://example.org/protected-manifest.json",
  "hasAccess": true
}
```

## Contributing

When implementing new features:
1. Update the implementation status in this README
2. Add detailed parameter documentation
3. Include usage examples
4. Write tests for the new functionality
5. Support both formatted text and structured JSON output

## Future Enhancements

For detailed information about planned improvements and architectural enhancements, see [FUTURE_ENHANCEMENTS.md](./FUTURE_ENHANCEMENTS.md).

Key areas under consideration:
- Full browser-based authentication support via local proxy server
- Enhanced cookie management for CLI environments
- Additional IIIF API features

## License

ISC