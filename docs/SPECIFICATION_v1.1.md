# IIIF MCP Server v1.1 Specification

## 1. Overview

This document defines the specifications for version 1.1 of the IIIF MCP Server, including new image data fetching capabilities and single-file bundling support.

## 2. New Tools Specification

### 2.1 iiif-image-fetch

**Purpose**: Retrieve actual IIIF image data with automatic size constraints for LLM consumption.

**Interface**:
```typescript
interface IIIFImageFetchParams {
  // Required
  imageUrl: string;        // Image API base URL (e.g., "https://example.org/iiif/image123")
  
  // Optional - IIIF Image API Parameters
  region?: string;         // Default: "full"
                          // Options: "full" | "square" | "x,y,w,h" | "pct:x,y,w,h"
  
  size?: string;          // Default: "max"
                          // Options: "max" | "w," | ",h" | "pct:n" | "w,h" | "!w,h"
  
  rotation?: string;      // Default: "0"
                          // Options: "n" (0-359) | "!n" (mirrored)
  
  quality?: string;       // Default: "default"
                          // Options: "default" | "color" | "gray" | "bitonal"
  
  format?: string;        // Default: "jpg"
                          // Options: "jpg" | "png" | "webp" | "tif" | "gif" | "pdf"
  
  // Size Constraints
  maxDimension?: number;  // Maximum dimension in pixels (default: 1500)
  maxPixels?: number;     // Maximum total pixels (default: 1000000)
}

interface IIIFImageFetchResult {
  content: [{
    type: "resource";
    resource: {
      uri: string;        // Original IIIF image URL
      mimeType: string;   // MIME type (e.g., "image/jpeg")
      blob: string;       // Base64-encoded image data
    };
  }];
}
```

**Implementation Notes**:
- Fetches info.json first to validate parameters
- Automatically scales images to meet size constraints
- Preserves aspect ratio during scaling
- Uses MCP standard resource format for image data

### 2.2 iiif-manifest-canvases

**Purpose**: List all canvases within a IIIF manifest with filtering capabilities.

**Interface**:
```typescript
interface IIIFManifestCanvasesParams {
  manifestUrl: string;    // Required: Manifest URL
  
  filter?: {
    hasImage?: boolean;       // Only canvases with images
    hasAnnotation?: boolean;  // Only canvases with annotations
    labelPattern?: string;    // Regex pattern for labels
  };
  
  includeMetadata?: boolean;  // Include metadata (default: false)
  includeThumbnail?: boolean; // Include thumbnails (default: true)
  structured?: boolean;       // Return JSON (default: false)
}

interface CanvasInfo {
  id: string;             // Canvas identifier
  label: string;          // Display label
  width: number;          // Width in pixels
  height: number;         // Height in pixels
  images: string[];       // Array of image URLs
  imageCount: number;     // Number of images
  thumbnail?: string;     // Thumbnail URL
  metadata?: Record<string, any>;
  annotationCount: number;
  annotationTypes: string[]; // Motivation types
}

interface IIIFManifestCanvasesResult {
  content: [{
    type: "text";
    text: string;         // Markdown formatted list
  }];
  
  structured?: {
    manifestId: string;
    manifestLabel: string;
    totalCanvases: number;
    canvases: CanvasInfo[];
  };
}
```

### 2.3 iiif-canvas-info

**Purpose**: Retrieve detailed information about a specific canvas.

**Interface**:
```typescript
interface IIIFCanvasInfoParams {
  manifestUrl: string;    // Required: Manifest URL
  canvasId?: string;      // Canvas ID (optional)
  canvasIndex?: number;   // Canvas index (0-based)
  
  includeAnnotations?: boolean;  // Default: true
  includeImageInfo?: boolean;    // Default: false
  includeStructures?: boolean;   // Default: false
  structured?: boolean;          // Default: false
}

interface DetailedCanvasInfo {
  // Basic Information
  id: string;
  label: string;
  width: number;
  height: number;
  
  // Images (can be multiple)
  images: Array<{
    id: string;
    motivation: string;    // Usually "painting"
    body: {
      id: string;         // Image API URL
      type: string;       // "Image"
      format: string;     // MIME type
      width?: number;
      height?: number;
      service?: {         // Image API service
        id: string;
        type: string;
        profile: string;
      };
    };
    target: string;       // Position on canvas
  }>;
  
  // Annotations
  annotations?: Array<{
    id: string;
    type: string;
    motivation: string;
    body: {
      type: string;
      value: string;
      format?: string;
      language?: string;
    };
    target: string;
  }>;
  
  // Additional Information
  metadata?: Record<string, any>;
  thumbnail?: {
    id: string;
    type: string;
    format: string;
  };
  structures?: Array<{
    id: string;
    type: string;
    label: string;
  }>;
}
```

## 3. Bundling Specification

### 3.1 Build Configuration

**esbuild Configuration**:
```javascript
// build.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['dist/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'iiif-mcp-bundle.js',
  external: ['node:*'],  // Exclude Node.js built-ins
  minify: true,
  sourcemap: 'inline',
  metafile: true,
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).then(result => {
  // Output bundle analysis
  require('fs').writeFileSync('meta.json', 
    JSON.stringify(result.metafile));
});
```

### 3.2 Package Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "bundle": "npm run build && node build.js",
    "bundle:analyze": "npm run bundle && npx esbuild-visualizer meta.json"
  }
}
```

### 3.3 Distribution Structure

```
dist/
├── index.js              # Standard distribution
├── index.d.ts            # TypeScript definitions
└── iiif-mcp-bundle.js    # Single-file bundle
```

## 4. Implementation Guidelines

### 4.1 Error Handling

All new tools must implement consistent error handling:

```typescript
try {
  // Tool implementation
} catch (error) {
  if (axios.isAxiosError(error)) {
    throw new Error(`Network error: ${error.message}`);
  }
  throw new Error(`Unexpected error: ${error.message}`);
}
```

### 4.2 Size Constraint Algorithm

```typescript
function applyImageConstraints(
  width: number, 
  height: number, 
  maxDimension: number, 
  maxPixels: number
): { width: number; height: number } {
  let scale = 1;
  
  // Check dimension constraint
  if (width > maxDimension || height > maxDimension) {
    scale = maxDimension / Math.max(width, height);
  }
  
  // Check pixel constraint
  const pixels = width * height * scale * scale;
  if (pixels > maxPixels) {
    scale *= Math.sqrt(maxPixels / pixels);
  }
  
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale)
  };
}
```

### 4.3 IIIF Version Compatibility

All tools must support both IIIF Presentation API v2 and v3:

```typescript
function detectIIIFVersion(manifest: any): 'v2' | 'v3' {
  if (manifest['@context']) {
    if (Array.isArray(manifest['@context'])) {
      return manifest['@context'].includes('http://iiif.io/api/presentation/3/context.json') ? 'v3' : 'v2';
    }
    return manifest['@context'].includes('presentation/3') ? 'v3' : 'v2';
  }
  return manifest.type ? 'v3' : 'v2';
}
```

## 5. Testing Requirements

### 5.1 Unit Tests

Each new tool requires:
- Parameter validation tests
- IIIF version compatibility tests
- Error handling tests
- Size constraint tests (for iiif-image-fetch)

### 5.2 Integration Tests

- Test with real IIIF endpoints
- Verify Base64 encoding/decoding
- Test bundle functionality

### 5.3 Test Coverage

Maintain minimum 80% code coverage for new features.

## 6. Performance Considerations

### 6.1 Image Processing

- Stream large images when possible
- Implement request timeout (30 seconds default)
- Cache info.json responses (15 minutes)

### 6.2 Bundle Optimization

- Target bundle size: < 300KB
- Use tree-shaking to remove unused code
- Minimize external dependencies

## 7. Security Considerations

### 7.1 URL Validation

- Validate all URLs before making requests
- Prevent SSRF attacks by checking URL schemes
- Limit redirect following (max 3 redirects)

### 7.2 Size Limits

- Enforce maximum response size (50MB)
- Validate image dimensions before processing
- Implement memory usage monitoring

## 8. Documentation Requirements

### 8.1 Tool Documentation

Each tool must include:
- Purpose statement
- Complete parameter documentation
- Usage examples
- Error scenarios

### 8.2 API Documentation

- TypeScript interfaces for all parameters
- JSDoc comments for all public methods
- Example requests and responses

## 9. Deployment Guide

### 9.1 Standard Deployment

```bash
# Clone repository
git clone https://github.com/your-org/iiif-mcp.git
cd iiif-mcp

# Install and build
npm install
npm run build

# Configure MCP client
# Add to claude_desktop_config.json
```

### 9.2 Bundle Deployment

```bash
# Download single file
wget https://github.com/your-org/iiif-mcp/releases/download/v1.1.0/iiif-mcp-bundle.js

# Configure MCP client
# Add to claude_desktop_config.json with bundle path
```

## 10. Future Considerations

### 10.1 Potential Enhancements

- WebP format optimization
- Progressive image loading
- Batch image fetching
- Image comparison tools

### 10.2 API Extensions

- Support for IIIF Image API 3.0 features
- Integration with IIIF Auth API 2.0
- Content State API support