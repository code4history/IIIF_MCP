# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-19 (Planned)

### Added
- **iiif-image-fetch**: New tool to fetch actual IIIF image data
  - Full IIIF Image API parameter support (region, size, rotation, quality, format)
  - Automatic size constraints (max 1500px dimension, max 1M pixels)
  - Returns Base64-encoded image data for LLM consumption
  - Support for both full images and specific regions

- **iiif-manifest-canvases**: New tool to list all canvases in a manifest
  - Filter canvases by image presence, annotations, or label patterns
  - Optional metadata and thumbnail inclusion
  - Structured output for programmatic processing

- **iiif-canvas-info**: New tool for detailed canvas information
  - Retrieve specific canvas by ID or index
  - Include associated images, annotations, and structural information
  - Support for multi-image canvases
  - Optional Image API info.json fetching

- **Single-file bundling**: New distribution method using esbuild
  - Create `iiif-mcp-bundle.js` with all dependencies included
  - No `npm install` required for deployment
  - Reduces deployment complexity

### Changed
- Updated README with v1.1.0 features and examples
- Enhanced documentation for new tools and bundling options

### Technical Details
- Bundle size: Approximately 200-300KB (estimated)
- Compatible with all existing tools and features
- Maintains backward compatibility with v1.0.x

## [1.0.1] - 2025-01-19

### Fixed
- Fixed parameter passing issue in MCP tool handlers
  - Corrected parameter access from `request.params.arguments` to proper MCP structure
  - Resolved "Tool not found" errors in Claude Desktop
  - Fixed destructuring errors for undefined arguments

### Changed
- Improved error handling for missing parameters
- Enhanced parameter validation

## [1.0.0] - 2025-01-18

### Initial Release
- **Core IIIF Tools**:
  - iiif-search: Content Search API integration
  - iiif-manifest: Manifest metadata retrieval
  - iiif-collection: Collection navigation
  - iiif-image: Image API URL building and info retrieval
  - iiif-annotation: Annotation extraction and text processing
  - iiif-activity: Change Discovery API support
  - iiif-auth: Full authentication flow implementation
  - iiif-av: Audio/video content extraction

- **Features**:
  - Support for IIIF Presentation API v2 and v3
  - Structured JSON output option for all tools
  - Multilingual content support
  - Browser-based authentication flow
  - Session management with automatic expiry
  - Comprehensive error handling

- **Testing**:
  - Tested with major IIIF providers (Harvard, Bodleian, NC State)
  - Compatible with IIIF Auth Demonstrator
  - Validated against IIIF API specifications