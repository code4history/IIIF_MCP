#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Read package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

console.log(`Syncing version ${version} across all files...`);

// Files to update
const filesToUpdate = [
  {
    path: path.join(rootDir, 'README.md'),
    type: 'markdown',
    patterns: [
      { regex: /npm install @c4h\/iiif-mcp@[\d.]+/g, replacement: `npm install @c4h/iiif-mcp@${version}` },
      { regex: /pnpm add @c4h\/iiif-mcp@[\d.]+/g, replacement: `pnpm add @c4h/iiif-mcp@${version}` }
    ]
  },
  {
    path: path.join(rootDir, 'README.ja.md'),
    type: 'markdown',
    patterns: [
      { regex: /npm install @c4h\/iiif-mcp@[\d.]+/g, replacement: `npm install @c4h/iiif-mcp@${version}` },
      { regex: /pnpm add @c4h\/iiif-mcp@[\d.]+/g, replacement: `pnpm add @c4h/iiif-mcp@${version}` }
    ]
  }
];

// Update each file
filesToUpdate.forEach(file => {
  if (fs.existsSync(file.path)) {
    let content = fs.readFileSync(file.path, 'utf8');
    let modified = false;
    
    file.patterns.forEach(pattern => {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file.path, content);
      console.log(`Updated ${path.relative(rootDir, file.path)}`);
    }
  }
});

console.log('Version sync complete.');