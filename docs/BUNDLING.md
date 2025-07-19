# IIIF MCP Server Bundling Guide

## Overview

Starting with v1.1.0, the IIIF MCP Server supports single-file bundling using esbuild. This allows for simplified deployment without requiring `npm install` on the target system.

## Building the Bundle

### Prerequisites
- Node.js 20 or higher
- Built distribution files (`npm run build`)

### Creating the Bundle

```bash
# Build TypeScript and create bundle
npm run bundle

# Or separately:
npm run build
node scripts/bundle.js
```

This creates `iiif-mcp-bundle.js` in the project root.

### Analyzing Bundle Size

```bash
npm run bundle:analyze
```

This opens a visualization of the bundle contents in your browser.

## Deployment Options

### Option 1: Standard Deployment

Traditional method with package.json:

```bash
# Copy files
cp -r dist package.json /path/to/deployment/
cd /path/to/deployment/
npm install --production

# Configure Claude Desktop
{
  "mcpServers": {
    "iiif": {
      "command": "node",
      "args": ["/path/to/deployment/dist/index.js"]
    }
  }
}
```

### Option 2: Bundle Deployment

Single-file method:

```bash
# Copy single file
cp iiif-mcp-bundle.js /path/to/deployment/

# Configure Claude Desktop
{
  "mcpServers": {
    "iiif": {
      "command": "node",
      "args": ["/path/to/deployment/iiif-mcp-bundle.js"]
    }
  }
}
```

## Bundle Contents

The bundle includes:
- All source code from dist/
- Required dependencies (axios, @modelcontextprotocol/sdk)
- Inline source maps for debugging

The bundle excludes:
- Node.js built-in modules
- Development dependencies
- Test files
- Documentation

## Size Optimization

Current bundle size: ~200-300KB (minified)

To reduce bundle size:
1. Ensure production build (`NODE_ENV=production`)
2. Use minification (enabled by default)
3. Exclude unnecessary dependencies

## Troubleshooting

### Bundle Too Large

If the bundle exceeds 500KB:
- Check for accidentally bundled dev dependencies
- Review the meta.json file for large modules
- Consider external dependencies

### Runtime Errors

If the bundle fails at runtime:
- Ensure Node.js version compatibility (20+)
- Check for missing external dependencies
- Verify all TypeScript compiled successfully

### Missing Features

If tools don't work in the bundle:
- Ensure `npm run build` completed successfully
- Check that all files are included in dist/
- Verify no dynamic imports are used

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - run: npm ci
      - run: npm run test
      - run: npm run bundle
      
      - uses: actions/upload-artifact@v3
        with:
          name: iiif-mcp-bundle
          path: iiif-mcp-bundle.js
```

### npm Scripts for Release

```json
{
  "scripts": {
    "release:bundle": "npm run bundle && tar -czf iiif-mcp-bundle.tar.gz iiif-mcp-bundle.js"
  }
}
```

## Best Practices

1. **Version Management**: Include version in bundle header
2. **Testing**: Test bundle in isolation before deployment
3. **Documentation**: Include usage instructions with bundle
4. **Backup**: Keep standard deployment option available

## Security Considerations

- Bundle includes inline source maps (disable for production if needed)
- No credentials or secrets should be bundled
- Validate bundle integrity with checksums

## Future Improvements

- Webpack alternative for more control
- Native executable packaging with pkg
- Docker container with pre-built bundle
- Auto-update mechanism for bundles