#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function bundle() {
  console.log('Building IIIF MCP bundle...');
  
  try {
    const result = await esbuild.build({
      entryPoints: [path.join(__dirname, '../dist/index.js')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: path.join(__dirname, '../iiif-mcp-bundle.js'),
      external: [
        'node:*',
        'worker_threads',
        'child_process',
        'fs',
        'path',
        'os',
        'crypto',
        'stream',
        'util',
        'events',
        'buffer',
        'querystring',
        'url',
        'http',
        'https',
        'net',
        'tls',
        'dns',
        'dgram',
        'zlib',
        'vm',
        'assert',
        'readline',
        'tty',
        'cluster',
        'process'
      ],
      minify: true,
      sourcemap: 'inline',
      metafile: true,
      legalComments: 'linked',
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      banner: {
        js: `#!/usr/bin/env node
/*
 * IIIF MCP Server Bundle v1.1.0
 * (c) 2025 Code for History
 * Released under the MIT License
 * 
 * This is a bundled version of @c4h/iiif-mcp
 * No npm install required - just run with Node.js
 */
`
      }
    });
    
    // Write metafile for analysis
    await fs.promises.writeFile(
      path.join(__dirname, '../meta.json'),
      JSON.stringify(result.metafile, null, 2)
    );
    
    // Make bundle executable
    const bundlePath = path.join(__dirname, '../iiif-mcp-bundle.js');
    await fs.promises.chmod(bundlePath, 0o755);
    
    // Calculate bundle size
    const stats = await fs.promises.stat(bundlePath);
    const sizeKB = Math.round(stats.size / 1024);
    
    console.log(`✅ Bundle created successfully!`);
    console.log(`📦 Output: iiif-mcp-bundle.js`);
    console.log(`📏 Size: ${sizeKB}KB`);
    console.log(`\nUsage:`);
    console.log(`  node iiif-mcp-bundle.js`);
    console.log(`\nOr add to Claude Desktop config:`);
    console.log(`  "command": "node",`);
    console.log(`  "args": ["/path/to/iiif-mcp-bundle.js"]`);
    
  } catch (error) {
    console.error('❌ Bundle build failed:', error);
    process.exit(1);
  }
}

// Check if esbuild is installed
try {
  require.resolve('esbuild');
} catch (e) {
  console.error('❌ esbuild not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install --save-dev esbuild', { stdio: 'inherit' });
}

// Run bundling
bundle();