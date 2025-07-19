#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IIIFAuthClient = exports.IIIFAVClient = exports.IIIFActivityClient = exports.IIIFAnnotationClient = exports.IIIFCollectionClient = exports.IIIFManifestClient = exports.IIIFImageClient = exports.IIIFSearchClient = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const axios_1 = __importDefault(require("axios"));
const http = __importStar(require("http"));
const child_process_1 = require("child_process");
const os_1 = require("os");
class IIIFSearchClient {
    async search(searchServiceUrl, query) {
        try {
            const response = await axios_1.default.get(searchServiceUrl, {
                params: { q: query },
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Search failed: ${error.message}`);
            }
            throw error;
        }
    }
    formatSearchResults(response) {
        // Determine API version and get results accordingly
        const isV0orV1 = response['@context']?.includes('search/0') || response['@context']?.includes('search/1');
        // v0/v1 uses 'resources', v2 uses 'hits' as primary results
        const results = isV0orV1 ? (response.resources || response.hits || []) : (response.hits || response.resources || []);
        if (results.length === 0) {
            return 'No results found.';
        }
        let output = `Found ${response.within?.total || results.length} results\n`;
        // Add version info for clarity
        if (response['@context']) {
            output += `Search API Version: ${response['@context']}\n`;
        }
        output += '\n';
        results.forEach((result, index) => {
            output += `${index + 1}. ${result.label || result['@id']}\n`;
            output += `   Type: ${result['@type']}\n`;
            output += `   ID: ${result['@id']}\n`;
            if (result.hits && result.hits.length > 0) {
                output += `   Matches:\n`;
                result.hits.forEach(hit => {
                    if (hit.match) {
                        const context = `${hit.before || ''}[${hit.match}]${hit.after || ''}`;
                        output += `     - ${context}\n`;
                    }
                });
            }
            output += '\n';
        });
        return output;
    }
    getStructuredResults(response, serviceUrl, query) {
        const isV0orV1 = response['@context']?.includes('search/0') || response['@context']?.includes('search/1');
        const results = isV0orV1 ? (response.resources || response.hits || []) : (response.hits || response.resources || []);
        return {
            url: response['@id'],
            service_url: serviceUrl,
            query: query,
            total_results: response.within?.total || results.length,
            api_version: response['@context'] || 'unknown',
            results: results.map(result => ({
                id: result['@id'],
                type: result['@type'],
                label: result.label || result['@id'],
                matches: result.hits?.map(hit => ({
                    text: hit.match || '',
                    context: `${hit.before || ''}[${hit.match || ''}]${hit.after || ''}`
                }))
            }))
        };
    }
}
exports.IIIFSearchClient = IIIFSearchClient;
class IIIFImageClient {
    buildImageUrl(baseUrl, options = {}) {
        // Default values based on IIIF Image API spec
        const region = options.region || 'full';
        const size = options.size || 'max';
        const rotation = options.rotation || '0';
        const quality = options.quality || 'default';
        const format = options.format || 'jpg';
        // Clean up base URL (remove trailing slash if present)
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        // Build IIIF Image API URL
        return `${cleanBaseUrl}/${region}/${size}/${rotation}/${quality}.${format}`;
    }
    validateParameters(options) {
        const errors = [];
        // Validate region
        if (options.region) {
            const regionPattern = /^(full|square|\d+,\d+,\d+,\d+|pct:\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?)$/;
            if (!regionPattern.test(options.region)) {
                errors.push(`Invalid region format: ${options.region}`);
            }
        }
        // Validate size
        if (options.size) {
            const sizePattern = /^(max|full|\d+,|\d+,\d+|,\d+|pct:\d+(\.\d+)?|!\d+,\d+)$/;
            if (!sizePattern.test(options.size)) {
                errors.push(`Invalid size format: ${options.size}`);
            }
        }
        // Validate rotation
        if (options.rotation) {
            const rotationPattern = /^!?\d+(\.\d+)?$/;
            if (!rotationPattern.test(options.rotation)) {
                errors.push(`Invalid rotation format: ${options.rotation}`);
            }
            else {
                const degrees = parseFloat(options.rotation.replace('!', ''));
                if (degrees < 0 || degrees > 360) {
                    errors.push(`Rotation must be between 0 and 360 degrees`);
                }
            }
        }
        // Validate quality
        if (options.quality) {
            const validQualities = ['default', 'color', 'gray', 'bitonal'];
            if (!validQualities.includes(options.quality)) {
                errors.push(`Invalid quality: ${options.quality}. Must be one of: ${validQualities.join(', ')}`);
            }
        }
        // Validate format
        if (options.format) {
            const validFormats = ['jpg', 'tif', 'png', 'gif', 'jp2', 'pdf', 'webp'];
            if (!validFormats.includes(options.format)) {
                errors.push(`Invalid format: ${options.format}. Must be one of: ${validFormats.join(', ')}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    async getImageInfo(infoUrl) {
        try {
            const response = await axios_1.default.get(infoUrl, {
                headers: {
                    'Accept': 'application/ld+json;profile="http://iiif.io/api/image/3/context.json", application/json'
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch image info: ${error.message}`);
            }
            throw error;
        }
    }
    formatImageInfo(info) {
        let output = '**IIIF Image Information**\n\n';
        // Basic info
        if (info.id || info['@id']) {
            output += `**ID**: ${info.id || info['@id']}\n`;
        }
        if (info.type || info['@type']) {
            output += `**Type**: ${info.type || info['@type']}\n`;
        }
        if (info.protocol) {
            output += `**Protocol**: ${info.protocol}\n`;
        }
        if (info.width && info.height) {
            output += `**Dimensions**: ${info.width} × ${info.height} pixels\n`;
        }
        // Profile information
        if (info.profile) {
            output += '\n**Profile**:\n';
            if (Array.isArray(info.profile)) {
                info.profile.forEach((p) => {
                    if (typeof p === 'string') {
                        output += `- ${p}\n`;
                    }
                });
            }
            else {
                output += `- ${info.profile}\n`;
            }
        }
        // Sizes
        if (info.sizes && info.sizes.length > 0) {
            output += '\n**Available Sizes**:\n';
            info.sizes.forEach((size) => {
                output += `- ${size.width} × ${size.height}\n`;
            });
        }
        // Tiles
        if (info.tiles && info.tiles.length > 0) {
            output += '\n**Tile Information**:\n';
            info.tiles.forEach((tile) => {
                output += `- Width: ${tile.width}`;
                if (tile.height)
                    output += `, Height: ${tile.height}`;
                if (tile.scaleFactors)
                    output += `, Scale Factors: ${tile.scaleFactors.join(', ')}`;
                output += '\n';
            });
        }
        return output;
    }
    getStructuredImageUrl(baseUrl, options = {}) {
        const region = options.region || 'full';
        const size = options.size || 'max';
        const rotation = options.rotation || '0';
        const quality = options.quality || 'default';
        const format = options.format || 'jpg';
        const url = this.buildImageUrl(baseUrl, options);
        // Extract image ID from base URL
        const imageId = baseUrl.split('/').pop() || 'unknown';
        // Generate suggested filename
        const parts = [];
        if (imageId !== 'unknown')
            parts.push(imageId);
        if (region !== 'full')
            parts.push(region.replace(/[,:]/g, '_'));
        if (size !== 'max')
            parts.push(size.replace(/[,:!]/g, '_'));
        if (rotation !== '0')
            parts.push(`rot${rotation}`);
        if (quality !== 'default')
            parts.push(quality);
        const suggested_filename = `${parts.join('_')}.${format}`;
        return {
            url,
            base_url: baseUrl,
            parameters: {
                region,
                size,
                rotation,
                quality,
                format
            },
            metadata: {
                suggested_filename,
                original_id: imageId
            }
        };
    }
    getStructuredImageInfo(info) {
        return {
            id: info.id || info['@id'],
            type: info.type || info['@type'],
            protocol: info.protocol,
            width: info.width,
            height: info.height,
            profile: info.profile,
            sizes: info.sizes,
            tiles: info.tiles
        };
    }
}
exports.IIIFImageClient = IIIFImageClient;
class IIIFManifestClient {
    async getManifest(manifestUrl) {
        try {
            const response = await axios_1.default.get(manifestUrl, {
                headers: {
                    'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch manifest: ${error.message}`);
            }
            throw error;
        }
    }
    getFirstValue(label, lang = 'en') {
        if (!label)
            return undefined;
        // Handle v2 format (simple string)
        if (typeof label === 'string') {
            return label;
        }
        // Handle v3 format (language map)
        // Try requested language first
        if (label[lang] && label[lang].length > 0) {
            return label[lang][0];
        }
        // Try 'none' for language-agnostic values
        if (label['none'] && label['none'].length > 0) {
            return label['none'][0];
        }
        // Fall back to first available language
        const firstLang = Object.keys(label)[0];
        if (firstLang && label[firstLang].length > 0) {
            return label[firstLang][0];
        }
        return undefined;
    }
    getMetadataValue(item) {
        // Handle v2 format
        if (typeof item.label === 'string') {
            const value = Array.isArray(item.value) ? item.value.join(', ') : (item.value || 'N/A');
            return { label: item.label, value: value.toString() };
        }
        // Handle v3 format
        const metadataV3 = item;
        return {
            label: this.getFirstValue(metadataV3.label) || 'Unknown',
            value: this.getFirstValue(metadataV3.value) || 'N/A'
        };
    }
    formatManifest(manifest, properties) {
        const includeAll = !properties || properties.length === 0;
        let output = '';
        // Basic information
        if (includeAll || properties?.includes('label')) {
            output += `**Label**: ${this.getFirstValue(manifest.label) || 'Untitled'}\n`;
        }
        if (includeAll || properties?.includes('id')) {
            output += `**ID**: ${manifest.id || manifest['@id'] || 'Unknown'}\n`;
        }
        if (includeAll || properties?.includes('type')) {
            output += `**Type**: ${manifest.type || manifest['@type'] || 'Unknown'}\n`;
        }
        // Summary/Description
        if (includeAll || properties?.includes('summary')) {
            if (manifest.summary) {
                output += `**Summary**: ${this.getFirstValue(manifest.summary)}\n`;
            }
            else if (manifest.description) {
                // v2 format
                const desc = Array.isArray(manifest.description) ? manifest.description.join(' ') : manifest.description;
                output += `**Description**: ${desc}\n`;
            }
        }
        // Metadata
        if ((includeAll || properties?.includes('metadata')) && manifest.metadata) {
            output += '\n**Metadata**:\n';
            manifest.metadata.forEach(item => {
                const { label, value } = this.getMetadataValue(item);
                output += `- ${label}: ${value}\n`;
            });
        }
        // Rights
        if (includeAll || properties?.includes('rights')) {
            if (manifest.rights) {
                output += `\n**Rights**: ${manifest.rights}\n`;
            }
            else if (manifest.license) {
                // v2 format
                output += `\n**License**: ${manifest.license}\n`;
            }
            // Attribution (v2)
            if (manifest.attribution) {
                output += `**Attribution**: ${manifest.attribution}\n`;
            }
        }
        // Provider
        if ((includeAll || properties?.includes('provider')) && manifest.provider) {
            output += '\n**Provider**:\n';
            manifest.provider.forEach(prov => {
                const name = this.getFirstValue(prov.label) || 'Unknown Provider';
                output += `- ${name}`;
                if (prov.homepage && prov.homepage.length > 0) {
                    output += ` (${prov.homepage[0].id})`;
                }
                output += '\n';
            });
        }
        // Viewing direction
        if ((includeAll || properties?.includes('viewingDirection')) && manifest.viewingDirection) {
            output += `\n**Viewing Direction**: ${manifest.viewingDirection}\n`;
        }
        // Canvas/Pages information
        if (includeAll || properties?.includes('items')) {
            let canvases = [];
            // v3 format
            if (manifest.items) {
                canvases = manifest.items;
            }
            // v2 format
            else if (manifest.sequences && manifest.sequences.length > 0 && manifest.sequences[0].canvases) {
                canvases = manifest.sequences[0].canvases;
            }
            if (canvases.length > 0) {
                output += `\n**Pages/Canvases**: ${canvases.length} items\n`;
                if (canvases.length <= 10) {
                    canvases.forEach((canvas, idx) => {
                        const label = this.getFirstValue(canvas.label) || `Canvas ${idx + 1}`;
                        output += `  ${idx + 1}. ${label}`;
                        if (canvas.width && canvas.height) {
                            output += ` (${canvas.width}x${canvas.height})`;
                        }
                        output += '\n';
                    });
                }
            }
        }
        // Structure/Table of Contents
        if ((includeAll || properties?.includes('structures')) && manifest.structures) {
            output += `\n**Table of Contents**:\n`;
            manifest.structures.forEach(struct => {
                const label = this.getFirstValue(struct.label) || 'Untitled Section';
                const itemCount = struct.items?.length || struct.canvases?.length || 0;
                output += `- ${label} (${itemCount} items)\n`;
            });
        }
        // Thumbnail
        if ((includeAll || properties?.includes('thumbnail')) && manifest.thumbnail) {
            const thumbnails = Array.isArray(manifest.thumbnail) ? manifest.thumbnail : [manifest.thumbnail];
            if (thumbnails.length > 0) {
                const thumb = thumbnails[0];
                const thumbUrl = thumb.id || thumb['@id'] || 'Unknown';
                output += `\n**Thumbnail**: ${thumbUrl}\n`;
            }
        }
        return output;
    }
    getStructuredManifest(manifest) {
        // Extract basic info
        const id = manifest.id || manifest['@id'] || '';
        const type = manifest.type || manifest['@type'] || '';
        const label = this.getFirstValue(manifest.label) || 'Untitled';
        const description = manifest.summary ? this.getFirstValue(manifest.summary) :
            (Array.isArray(manifest.description) ? manifest.description.join(' ') : manifest.description);
        // Extract thumbnail
        let thumbnail;
        if (manifest.thumbnail) {
            const thumbnails = Array.isArray(manifest.thumbnail) ? manifest.thumbnail : [manifest.thumbnail];
            if (thumbnails.length > 0) {
                thumbnail = thumbnails[0].id || thumbnails[0]['@id'];
            }
        }
        // Extract images from canvases
        const images = [];
        let canvases = [];
        // v3 format
        if (manifest.items) {
            canvases = manifest.items;
        }
        // v2 format
        else if (manifest.sequences && manifest.sequences.length > 0 && manifest.sequences[0].canvases) {
            canvases = manifest.sequences[0].canvases;
        }
        canvases.forEach((canvas, idx) => {
            const canvasLabel = this.getFirstValue(canvas.label) || `Canvas ${idx + 1}`;
            images.push({
                id: canvas.id || canvas['@id'] || '',
                label: canvasLabel,
                width: canvas.width,
                height: canvas.height
            });
        });
        // Extract metadata
        const metadata = manifest.metadata?.map(item => {
            const { label, value } = this.getMetadataValue(item);
            return { label, value };
        });
        // Extract structures
        const structures = manifest.structures?.map(struct => ({
            id: struct.id || struct['@id'] || '',
            label: this.getFirstValue(struct.label) || 'Untitled Section',
            items: struct.items?.length || struct.canvases?.length || 0
        }));
        return {
            url: id,
            id,
            type,
            label,
            description,
            thumbnail,
            images,
            metadata,
            structures
        };
    }
}
exports.IIIFManifestClient = IIIFManifestClient;
class IIIFCollectionClient {
    async getCollection(collectionUrl) {
        try {
            const response = await axios_1.default.get(collectionUrl, {
                headers: {
                    'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch collection: ${error.message}`);
            }
            throw error;
        }
    }
    getFirstValue(label, _lang = 'en') {
        if (!label)
            return undefined;
        // Handle v2 format (simple string)
        if (typeof label === 'string') {
            return label;
        }
        // Handle v3 format (language map)
        // Try requested language first
        if (label[_lang] && label[_lang].length > 0) {
            return label[_lang][0];
        }
        // Try 'none' for language-agnostic values
        if (label['none'] && label['none'].length > 0) {
            return label['none'][0];
        }
        // Fall back to first available language
        const firstLang = Object.keys(label)[0];
        if (firstLang && label[firstLang].length > 0) {
            return label[firstLang][0];
        }
        return undefined;
    }
    getItemInfo(item) {
        const id = item.id || item['@id'] || '';
        const type = item.type || item['@type'] || '';
        const label = this.getFirstValue(item.label) || 'Untitled';
        let thumbnail;
        if (item.thumbnail) {
            const thumbnails = Array.isArray(item.thumbnail) ? item.thumbnail : [item.thumbnail];
            if (thumbnails.length > 0) {
                thumbnail = thumbnails[0].id || thumbnails[0]['@id'];
            }
        }
        return { id, type, label, thumbnail, navDate: item.navDate };
    }
    formatCollection(collection, includeItems = true) {
        let output = '';
        // Basic information
        output += `**Label**: ${this.getFirstValue(collection.label) || 'Untitled'}\n`;
        output += `**ID**: ${collection.id || collection['@id'] || 'Unknown'}\n`;
        output += `**Type**: ${collection.type || collection['@type'] || 'Unknown'}\n`;
        // Summary/Description
        if (collection.summary) {
            output += `**Summary**: ${this.getFirstValue(collection.summary)}\n`;
        }
        else if (collection.description) {
            // v2 format
            const desc = Array.isArray(collection.description) ? collection.description.join(' ') : collection.description;
            output += `**Description**: ${desc}\n`;
        }
        // Count items
        const collections = collection.collections || [];
        const manifests = collection.manifests || [];
        const items = collection.items || [];
        const members = collection.members || [];
        // Merge all items
        const allItems = [...collections, ...manifests, ...items, ...members];
        const collectionCount = collections.length + items.filter(i => (i.type || i['@type'] || '').includes('Collection')).length;
        const manifestCount = manifests.length + items.filter(i => (i.type || i['@type'] || '').includes('Manifest')).length;
        output += `\n**Contents**:\n`;
        output += `- Collections: ${collectionCount}\n`;
        output += `- Manifests: ${manifestCount}\n`;
        output += `- Total items: ${allItems.length}\n`;
        // Metadata
        if (collection.metadata && collection.metadata.length > 0) {
            output += '\n**Metadata**:\n';
            collection.metadata.forEach(item => {
                const label = typeof item.label === 'string' ? item.label : this.getFirstValue(item.label) || 'Unknown';
                const value = typeof item.value === 'string' ? item.value :
                    (Array.isArray(item.value) ? item.value.join(', ') : this.getFirstValue(item.value) || 'N/A');
                output += `- ${label}: ${value}\n`;
            });
        }
        // Rights
        if (collection.rights) {
            output += `\n**Rights**: ${collection.rights}\n`;
        }
        else if (collection.license) {
            output += `\n**License**: ${collection.license}\n`;
        }
        if (collection.attribution) {
            output += `**Attribution**: ${collection.attribution}\n`;
        }
        // Part of
        if (collection.partOf && collection.partOf.length > 0) {
            output += '\n**Part of**:\n';
            collection.partOf.forEach(parent => {
                const label = this.getFirstValue(parent.label) || parent.id || 'Unknown';
                output += `- ${label}`;
                if (parent.id)
                    output += ` (${parent.id})`;
                output += '\n';
            });
        }
        // List items if requested
        if (includeItems && allItems.length > 0) {
            output += '\n**Items**:\n';
            // Group by type
            const groupedItems = {
                collections: [],
                manifests: []
            };
            allItems.forEach(item => {
                const type = item.type || item['@type'] || '';
                if (type.includes('Collection')) {
                    groupedItems.collections.push(item);
                }
                else if (type.includes('Manifest')) {
                    groupedItems.manifests.push(item);
                }
            });
            // List collections
            if (groupedItems.collections.length > 0) {
                output += '\n### Collections:\n';
                groupedItems.collections.forEach((item, idx) => {
                    const info = this.getItemInfo(item);
                    output += `${idx + 1}. ${info.label}\n`;
                    output += `   - ID: ${info.id}\n`;
                    if (item.navDate)
                        output += `   - Date: ${item.navDate}\n`;
                });
            }
            // List manifests
            if (groupedItems.manifests.length > 0) {
                output += '\n### Manifests:\n';
                groupedItems.manifests.forEach((item, idx) => {
                    const info = this.getItemInfo(item);
                    output += `${idx + 1}. ${info.label}\n`;
                    output += `   - ID: ${info.id}\n`;
                    if (item.navDate)
                        output += `   - Date: ${item.navDate}\n`;
                });
            }
        }
        // Thumbnail
        if (collection.thumbnail) {
            const thumbnails = Array.isArray(collection.thumbnail) ? collection.thumbnail : [collection.thumbnail];
            if (thumbnails.length > 0) {
                const thumb = thumbnails[0];
                const thumbUrl = thumb.id || thumb['@id'] || 'Unknown';
                output += `\n**Thumbnail**: ${thumbUrl}\n`;
            }
        }
        return output;
    }
    getStructuredCollection(collection) {
        // Extract basic info
        const id = collection.id || collection['@id'] || '';
        const type = collection.type || collection['@type'] || '';
        const label = this.getFirstValue(collection.label) || 'Untitled';
        const description = collection.summary ? this.getFirstValue(collection.summary) :
            (Array.isArray(collection.description) ? collection.description.join(' ') : collection.description);
        // Extract thumbnail
        let thumbnail;
        if (collection.thumbnail) {
            const thumbnails = Array.isArray(collection.thumbnail) ? collection.thumbnail : [collection.thumbnail];
            if (thumbnails.length > 0) {
                thumbnail = thumbnails[0].id || thumbnails[0]['@id'];
            }
        }
        // Process items
        const structuredCollections = [];
        const structuredManifests = [];
        // Process v2 format
        if (collection.collections) {
            collection.collections.forEach(item => {
                const info = this.getItemInfo(item);
                structuredCollections.push({
                    id: info.id,
                    type: info.type,
                    label: info.label,
                    thumbnail: info.thumbnail
                });
            });
        }
        if (collection.manifests) {
            collection.manifests.forEach(item => {
                const info = this.getItemInfo(item);
                structuredManifests.push({
                    id: info.id,
                    type: info.type,
                    label: info.label,
                    thumbnail: info.thumbnail,
                    navDate: info.navDate
                });
            });
        }
        // Process v3 format (items array)
        if (collection.items) {
            collection.items.forEach(item => {
                const info = this.getItemInfo(item);
                const type = info.type;
                if (type.includes('Collection')) {
                    structuredCollections.push({
                        id: info.id,
                        type: info.type,
                        label: info.label,
                        thumbnail: info.thumbnail
                    });
                }
                else if (type.includes('Manifest')) {
                    structuredManifests.push({
                        id: info.id,
                        type: info.type,
                        label: info.label,
                        thumbnail: info.thumbnail,
                        navDate: info.navDate
                    });
                }
            });
        }
        // Process members (v2 mixed format)
        if (collection.members) {
            collection.members.forEach(item => {
                const info = this.getItemInfo(item);
                const type = info.type;
                if (type.includes('Collection')) {
                    structuredCollections.push({
                        id: info.id,
                        type: info.type,
                        label: info.label,
                        thumbnail: info.thumbnail
                    });
                }
                else if (type.includes('Manifest')) {
                    structuredManifests.push({
                        id: info.id,
                        type: info.type,
                        label: info.label,
                        thumbnail: info.thumbnail,
                        navDate: info.navDate
                    });
                }
            });
        }
        // Extract metadata
        const metadata = collection.metadata?.map(item => {
            const label = typeof item.label === 'string' ? item.label : this.getFirstValue(item.label) || 'Unknown';
            const value = typeof item.value === 'string' ? item.value :
                (Array.isArray(item.value) ? item.value.join(', ') : this.getFirstValue(item.value) || 'N/A');
            return { label, value };
        });
        // Extract partOf
        const partOf = collection.partOf?.map(parent => ({
            id: parent.id || '',
            type: parent.type,
            label: this.getFirstValue(parent.label) || 'Unknown'
        }));
        return {
            url: id,
            id,
            type,
            label,
            description,
            thumbnail,
            total_items: structuredCollections.length + structuredManifests.length,
            collections: structuredCollections,
            manifests: structuredManifests,
            metadata,
            partOf
        };
    }
}
exports.IIIFCollectionClient = IIIFCollectionClient;
class IIIFAnnotationClient {
    async getAnnotations(annotationUrl) {
        try {
            const response = await axios_1.default.get(annotationUrl, {
                headers: {
                    'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch annotations: ${error.message}`);
            }
            throw error;
        }
    }
    getFirstValue(label, _lang = 'en') {
        if (!label)
            return undefined;
        if (typeof label === 'string') {
            return label;
        }
        if (label[_lang] && label[_lang].length > 0) {
            return label[_lang][0];
        }
        if (label['none'] && label['none'].length > 0) {
            return label['none'][0];
        }
        const firstLang = Object.keys(label)[0];
        if (firstLang && label[firstLang].length > 0) {
            return label[firstLang][0];
        }
        return undefined;
    }
    extractTextFromAnnotation(annotation) {
        // Check if this is a text annotation
        const motivation = annotation.motivation;
        const motivations = Array.isArray(motivation) ? motivation : [motivation];
        const textMotivations = ['painting', 'commenting', 'tagging', 'describing', 'transcribing', 'supplementing'];
        const hasTextMotivation = motivations.some(m => textMotivations.includes(m || ''));
        if (!hasTextMotivation && !annotation.body) {
            return null;
        }
        // Extract text from body
        const bodies = Array.isArray(annotation.body) ? annotation.body : [annotation.body];
        for (const body of bodies) {
            if (!body)
                continue;
            // v2 format
            if (body.chars) {
                return {
                    text: body.chars,
                    language: body.language,
                    format: body.format || 'text/plain'
                };
            }
            // v3 format
            if (body.value) {
                return {
                    text: body.value,
                    language: body.language,
                    format: body.format || 'text/plain'
                };
            }
            // Body might be a string directly
            if (typeof body === 'string') {
                return { text: body, format: 'text/plain' };
            }
        }
        return null;
    }
    getAnnotationTarget(annotation) {
        if (annotation.on) {
            return annotation.on;
        }
        if (annotation.target) {
            if (typeof annotation.target === 'string') {
                return annotation.target;
            }
            return annotation.target.id || annotation.target['@id'] || '';
        }
        return '';
    }
    formatAnnotations(annotationData, options = {}) {
        let output = '';
        // Extract annotations
        const annotations = [];
        // v2 format
        if ('resources' in annotationData && annotationData.resources) {
            annotations.push(...annotationData.resources);
        }
        // v3 format
        if ('items' in annotationData && annotationData.items) {
            // Could be annotations directly or annotation pages
            for (const item of annotationData.items) {
                if ('items' in item || 'resources' in item) {
                    // It's an annotation page
                    const page = item;
                    if (page.items)
                        annotations.push(...page.items);
                    if (page.resources)
                        annotations.push(...page.resources);
                }
                else {
                    // It's an annotation
                    annotations.push(item);
                }
            }
        }
        // Basic info
        const id = annotationData.id || annotationData['@id'] || 'Unknown';
        const type = annotationData.type || annotationData['@type'] || 'Unknown';
        output += `**Annotation Source**: ${id}\n`;
        output += `**Type**: ${type}\n`;
        output += `**Total Annotations**: ${annotations.length}\n`;
        // Extract text annotations
        const textAnnotations = [];
        // Collect languages and motivations
        const languages = new Set();
        const motivations = new Set();
        for (const annotation of annotations) {
            const textData = this.extractTextFromAnnotation(annotation);
            if (textData || options.includeNonText) {
                const motives = Array.isArray(annotation.motivation) ?
                    annotation.motivation : [annotation.motivation];
                motives.forEach(m => { if (m)
                    motivations.add(m); });
                if (textData) {
                    if (textData.language)
                        languages.add(textData.language);
                    // Filter by language if specified
                    if (!options.language || textData.language === options.language) {
                        textAnnotations.push({
                            annotation,
                            text: textData.text,
                            language: textData.language,
                            format: textData.format,
                            target: this.getAnnotationTarget(annotation)
                        });
                    }
                }
            }
        }
        output += `**Languages**: ${Array.from(languages).join(', ') || 'Not specified'}\n`;
        output += `**Motivations**: ${Array.from(motivations).join(', ')}\n`;
        if (textAnnotations.length === 0) {
            output += '\nNo text annotations found';
            if (options.language) {
                output += ` for language "${options.language}"`;
            }
            output += '.\n';
            return output;
        }
        output += `\n**Text Annotations Found**: ${textAnnotations.length}\n`;
        // Group by canvas if requested
        if (options.groupByCanvas) {
            const byCanvas = new Map();
            for (const item of textAnnotations) {
                const canvas = item.target.split('#')[0];
                if (!byCanvas.has(canvas)) {
                    byCanvas.set(canvas, []);
                }
                byCanvas.get(canvas).push(item);
            }
            output += '\n## Annotations by Canvas:\n';
            byCanvas.forEach((items, canvas) => {
                output += `\n### Canvas: ${canvas}\n`;
                output += `Annotations: ${items.length}\n\n`;
                items.forEach((item, idx) => {
                    output += `**[${idx + 1}]** `;
                    if (item.language)
                        output += `(${item.language}) `;
                    output += `${item.text}\n`;
                    if (idx < items.length - 1)
                        output += '\n';
                });
            });
        }
        else {
            // List all annotations
            output += '\n## Text Content:\n';
            textAnnotations.forEach((item, idx) => {
                output += `\n**[${idx + 1}]**\n`;
                if (item.language)
                    output += `Language: ${item.language}\n`;
                output += `Target: ${item.target}\n`;
                output += `Text: ${item.text}\n`;
            });
        }
        // Full text extraction
        if (textAnnotations.length > 0) {
            output += '\n## Full Text Extract:\n';
            if (languages.size > 1 && !options.language) {
                // Group by language
                const byLang = new Map();
                textAnnotations.forEach(item => {
                    const lang = item.language || 'unknown';
                    if (!byLang.has(lang)) {
                        byLang.set(lang, []);
                    }
                    byLang.get(lang).push(item.text);
                });
                byLang.forEach((texts, lang) => {
                    output += `\n### ${lang}:\n`;
                    output += texts.join(' ');
                    output += '\n';
                });
            }
            else {
                // Single language or filtered
                const allText = textAnnotations.map(item => item.text).join(' ');
                output += allText + '\n';
            }
        }
        return output;
    }
    getStructuredAnnotations(annotationData, options = {}) {
        // Extract annotations
        const annotations = [];
        // v2 format
        if ('resources' in annotationData && annotationData.resources) {
            annotations.push(...annotationData.resources);
        }
        // v3 format
        if ('items' in annotationData && annotationData.items) {
            for (const item of annotationData.items) {
                if ('items' in item || 'resources' in item) {
                    const page = item;
                    if (page.items)
                        annotations.push(...page.items);
                    if (page.resources)
                        annotations.push(...page.resources);
                }
                else {
                    annotations.push(item);
                }
            }
        }
        const id = annotationData.id || annotationData['@id'] || '';
        const languages = new Set();
        const motivations = new Set();
        const structuredAnnotations = [];
        const textByLanguage = {};
        for (const annotation of annotations) {
            const textData = this.extractTextFromAnnotation(annotation);
            const annId = annotation.id || annotation['@id'] || '';
            const annType = annotation.type || annotation['@type'] || '';
            const motives = Array.isArray(annotation.motivation) ?
                annotation.motivation : [annotation.motivation || ''];
            motives.forEach(m => { if (m)
                motivations.add(m); });
            if (textData || options.includeNonText) {
                if (textData && textData.language) {
                    languages.add(textData.language);
                }
                // Filter by language if specified
                if (!options.language || !textData || textData.language === options.language) {
                    const target = this.getAnnotationTarget(annotation);
                    let selector;
                    if (annotation.target && typeof annotation.target !== 'string' && annotation.target.selector) {
                        selector = annotation.target.selector.value || annotation.target.selector.conformsTo;
                    }
                    structuredAnnotations.push({
                        id: annId,
                        type: Array.isArray(annType) ? annType.join(', ') : annType,
                        motivation: motives,
                        text: textData?.text,
                        language: textData?.language,
                        format: textData?.format,
                        target,
                        selector
                    });
                    // Collect text by language
                    if (textData?.text) {
                        const lang = textData.language || 'unknown';
                        if (!textByLanguage[lang]) {
                            textByLanguage[lang] = [];
                        }
                        textByLanguage[lang].push(textData.text);
                    }
                }
            }
        }
        // Create full text
        const allTexts = structuredAnnotations
            .filter(a => a.text)
            .map(a => a.text);
        return {
            url: id,
            total_annotations: structuredAnnotations.length,
            languages: Array.from(languages),
            motivations: Array.from(motivations),
            annotations: structuredAnnotations,
            text_content: allTexts.length > 0 ? {
                full_text: allTexts.join(' '),
                by_language: textByLanguage
            } : undefined
        };
    }
    async getAnnotationsFromManifest(manifestUrl) {
        try {
            const response = await axios_1.default.get(manifestUrl, {
                headers: {
                    'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
                },
                timeout: 10000
            });
            const manifest = response.data;
            const annotationUrls = [];
            // Extract annotation URLs from canvases
            let canvases = [];
            // v3 format
            if (manifest.items) {
                canvases = manifest.items;
            }
            // v2 format
            else if (manifest.sequences && manifest.sequences.length > 0 && manifest.sequences[0].canvases) {
                canvases = manifest.sequences[0].canvases;
            }
            for (const canvas of canvases) {
                // v3 format - annotations in items
                if (canvas.annotations) {
                    for (const annotationPage of canvas.annotations) {
                        const pageId = annotationPage.id || annotationPage['@id'];
                        if (pageId) {
                            annotationUrls.push(pageId);
                        }
                    }
                }
                // v2 format - otherContent
                if (canvas.otherContent) {
                    for (const annotationList of canvas.otherContent) {
                        const listId = annotationList['@id'];
                        if (listId) {
                            annotationUrls.push(listId);
                        }
                    }
                }
                // Some v3 manifests use supplementing annotation pattern
                if (canvas.items) {
                    for (const page of canvas.items) {
                        if (page.items) {
                            for (const item of page.items) {
                                if (item.body && item.body.service) {
                                    // Check for text annotation services
                                    const services = Array.isArray(item.body.service) ?
                                        item.body.service : [item.body.service];
                                    for (const service of services) {
                                        if (service['@id'] || service.id) {
                                            const serviceId = service.id || service['@id'];
                                            if (serviceId.includes('annotation')) {
                                                annotationUrls.push(serviceId);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // Remove duplicates
            return [...new Set(annotationUrls)];
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch manifest: ${error.message}`);
            }
            throw error;
        }
    }
}
exports.IIIFAnnotationClient = IIIFAnnotationClient;
class IIIFActivityClient {
    async getActivityStream(activityStreamUrl) {
        try {
            const response = await axios_1.default.get(activityStreamUrl, {
                headers: {
                    'Accept': 'application/ld+json;profile="https://www.w3.org/ns/activitystreams", application/json'
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch activity stream: ${error.message}`);
            }
            throw error;
        }
    }
    async getActivityPage(pageUrl) {
        try {
            const response = await axios_1.default.get(pageUrl, {
                headers: {
                    'Accept': 'application/ld+json;profile="https://www.w3.org/ns/activitystreams", application/json'
                },
                timeout: 10000
            });
            const page = response.data;
            if (page.type !== 'OrderedCollectionPage') {
                throw new Error('Response is not an Activity Page');
            }
            return page;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch activity page: ${error.message}`);
            }
            throw error;
        }
    }
    processActivityStream(data) {
        let output = '';
        if (data.type === 'OrderedCollection') {
            // This is the main collection
            const collection = data;
            output += `## Activity Stream Collection\n\n`;
            output += `**ID**: ${collection.id}\n`;
            output += `**Type**: ${collection.type}\n`;
            if (collection.totalItems !== undefined) {
                output += `**Total Activities**: ${collection.totalItems}\n`;
            }
            if (collection.first) {
                output += `\n**First Page**: ${collection.first.id}\n`;
            }
            if (collection.last) {
                output += `**Last Page**: ${collection.last.id}\n`;
            }
            output += `\n*Fetch the first page to see activities.*\n`;
        }
        else if (data.type === 'OrderedCollectionPage') {
            // This is a page of activities
            const page = data;
            output += `## Activity Stream Page\n\n`;
            output += `**ID**: ${page.id}\n`;
            output += `**Type**: ${page.type}\n`;
            if (page.partOf) {
                output += `**Part of**: ${page.partOf.id}\n`;
            }
            if (page.startIndex !== undefined) {
                output += `**Start Index**: ${page.startIndex}\n`;
            }
            output += `\n### Navigation:\n`;
            if (page.prev) {
                output += `- **Previous**: ${page.prev.id}\n`;
            }
            if (page.next) {
                output += `- **Next**: ${page.next.id}\n`;
            }
            output += `\n### Activities (${page.orderedItems.length}):\n\n`;
            page.orderedItems.forEach((activity, idx) => {
                output += `**[${idx + 1}] ${activity.type}**\n`;
                output += `- ID: ${activity.id}\n`;
                if (activity.object) {
                    output += `- Object: ${activity.object.type} - ${activity.object.id}\n`;
                    if (activity.object.canonical) {
                        output += `- Canonical: ${activity.object.canonical}\n`;
                    }
                }
                if (activity.endTime) {
                    output += `- Time: ${activity.endTime}\n`;
                }
                else if (activity.startTime) {
                    output += `- Time: ${activity.startTime}\n`;
                }
                if (activity.summary) {
                    output += `- Summary: ${activity.summary}\n`;
                }
                output += '\n';
            });
        }
        return output;
    }
    getStructuredActivities(data) {
        const result = {
            url: data.id,
            type: data.type,
            activities: []
        };
        if (data.type === 'OrderedCollection') {
            const collection = data;
            result.total_activities = collection.totalItems;
            // For collections, we don't have activities yet
            return result;
        }
        else if (data.type === 'OrderedCollectionPage') {
            const page = data;
            // Page info
            result.page_info = {
                current_page: page.id
            };
            if (page.next) {
                result.page_info.next_page = page.next.id;
            }
            if (page.prev) {
                result.page_info.prev_page = page.prev.id;
            }
            if (page.partOf) {
                result.page_info.part_of = page.partOf.id;
            }
            if (page.startIndex !== undefined) {
                result.page_info.start_index = page.startIndex;
            }
            // Process activities
            result.activities = page.orderedItems.map(activity => {
                const processed = {
                    id: activity.id,
                    type: activity.type,
                    object_id: activity.object?.id || '',
                    object_type: activity.object?.type || '',
                    timestamp: activity.endTime || activity.startTime || ''
                };
                if (activity.object?.canonical) {
                    processed.canonical_uri = activity.object.canonical;
                }
                if (activity.summary) {
                    processed.summary = activity.summary;
                }
                return processed;
            });
        }
        return result;
    }
}
exports.IIIFActivityClient = IIIFActivityClient;
class IIIFAVClient {
    async getAVManifest(manifestUrl) {
        try {
            const response = await axios_1.default.get(manifestUrl, {
                headers: {
                    'Accept': 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json", application/json'
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch AV manifest: ${error.message}`);
            }
            throw error;
        }
    }
    extractAVContent(manifest) {
        const mediaItems = [];
        // Extract canvases
        let canvases = [];
        // v3 format
        if (manifest.items) {
            canvases = manifest.items;
        }
        // v2 format
        else if (manifest.sequences && manifest.sequences.length > 0 && manifest.sequences[0].canvases) {
            canvases = manifest.sequences[0].canvases;
        }
        // Process each canvas
        for (const canvas of canvases) {
            // v3 format
            if (canvas.items) {
                for (const page of canvas.items) {
                    if (page.items) {
                        for (const item of page.items) {
                            if (item.body && this.isAVResource(item.body)) {
                                mediaItems.push({
                                    id: item.body.id,
                                    type: item.body.type,
                                    format: item.body.format,
                                    duration: item.body.duration || canvas.duration,
                                    width: item.body.width,
                                    height: item.body.height,
                                    label: canvas.label
                                });
                            }
                        }
                    }
                }
            }
            // v2 format
            if (canvas.content) {
                for (const item of canvas.content) {
                    if (this.isAVResource(item)) {
                        mediaItems.push(item);
                    }
                }
            }
        }
        return mediaItems;
    }
    isAVResource(resource) {
        const format = resource.format || resource['@type'] || resource.type || '';
        const avFormats = [
            'video/', 'audio/', 'Sound', 'Video', 'dctypes:Sound', 'dctypes:MovingImage'
        ];
        return avFormats.some(avFormat => format.includes(avFormat));
    }
    formatAVContent(manifest, options = {}) {
        let output = '';
        // Basic manifest info
        const label = this.getFirstValue(manifest.label) || 'Untitled';
        const id = manifest.id || manifest['@id'] || '';
        const type = manifest.type || manifest['@type'] || '';
        output += `## Audio/Video Manifest\n\n`;
        output += `**Label**: ${label}\n`;
        output += `**ID**: ${id}\n`;
        output += `**Type**: ${type}\n`;
        // Extract media items
        const mediaItems = this.extractAVContent(manifest);
        if (mediaItems.length === 0) {
            output += `\n*No audio/video content found in this manifest.*\n`;
            return output;
        }
        // Calculate total duration if available
        let totalDuration = 0;
        const canvases = manifest.items || (manifest.sequences?.[0]?.canvases) || [];
        for (const canvas of canvases) {
            if (canvas.duration) {
                totalDuration += canvas.duration || 0;
            }
        }
        if (totalDuration > 0) {
            output += `**Total Duration**: ${this.formatDuration(totalDuration)}\n`;
        }
        // List media items
        output += `\n### Media Items (${mediaItems.length}):\n\n`;
        mediaItems.forEach((item, idx) => {
            const itemId = item.id || item['@id'] || '';
            const itemType = item.type || item['@type'] || '';
            const itemLabel = this.getFirstValue(item.label) || `Media ${idx + 1}`;
            output += `**[${idx + 1}] ${itemLabel}**\n`;
            output += `- ID: ${itemId}\n`;
            output += `- Type: ${itemType}\n`;
            if (item.format) {
                output += `- Format: ${item.format}\n`;
            }
            if (item.duration) {
                output += `- Duration: ${this.formatDuration(item.duration)}\n`;
            }
            if (item.width && item.height) {
                output += `- Dimensions: ${item.width}x${item.height}\n`;
            }
            output += '\n';
        });
        // Include ranges if requested
        if (options.includeRanges && manifest.structures && manifest.structures.length > 0) {
            output += `### Structure/Chapters:\n\n`;
            for (const range of manifest.structures) {
                const rangeLabel = this.getFirstValue(range.label) || 'Untitled Range';
                // const rangeId = range.id || range['@id'] || '';  // Kept for future use
                output += `- **${rangeLabel}**\n`;
                // Try to extract time information from range
                const timeRange = this.extractTimeRange(range, manifest);
                if (timeRange) {
                    output += `  - Time: ${this.formatDuration(timeRange.start)} - ${this.formatDuration(timeRange.end)}\n`;
                }
            }
        }
        return output;
    }
    getStructuredAVContent(manifest) {
        const label = this.getFirstValue(manifest.label) || 'Untitled';
        const id = manifest.id || manifest['@id'] || '';
        const type = manifest.type || manifest['@type'] || '';
        const result = {
            url: id,
            id: id,
            type: type,
            label: label,
            media_items: []
        };
        // Calculate total duration
        let totalDuration = 0;
        const canvases = manifest.items || (manifest.sequences?.[0]?.canvases) || [];
        // Map canvas IDs to their properties
        const canvasMap = new Map();
        for (const canvas of canvases) {
            const canvasId = canvas.id || canvas['@id'] || '';
            canvasMap.set(canvasId, canvas);
            if (canvas.duration) {
                totalDuration += canvas.duration || 0;
            }
        }
        if (totalDuration > 0) {
            result.total_duration = totalDuration;
        }
        // Extract media items with their canvas associations
        for (const [canvasId, canvas] of canvasMap) {
            const canvasLabel = this.getFirstValue(canvas.label);
            // v3 format
            if (canvas.items) {
                for (const page of canvas.items) {
                    if (page.items) {
                        for (const item of page.items) {
                            if (item.body && this.isAVResource(item.body)) {
                                const mediaItem = {
                                    id: item.body.id,
                                    type: item.body.type,
                                    format: item.body.format || '',
                                    canvas_id: canvasId
                                };
                                if (canvasLabel) {
                                    mediaItem.label = canvasLabel;
                                }
                                if (item.body.duration || canvas.duration) {
                                    mediaItem.duration = item.body.duration || canvas.duration;
                                }
                                if (item.body.width && item.body.height) {
                                    mediaItem.dimensions = {
                                        width: item.body.width,
                                        height: item.body.height
                                    };
                                }
                                result.media_items.push(mediaItem);
                            }
                        }
                    }
                }
            }
            // v2 format
            if (canvas.content) {
                for (const item of canvas.content) {
                    if (this.isAVResource(item)) {
                        const mediaItem = {
                            id: item.id || item['@id'] || '',
                            type: item.type || item['@type'] || '',
                            format: item.format || '',
                            canvas_id: canvasId
                        };
                        if (canvasLabel) {
                            mediaItem.label = canvasLabel;
                        }
                        if (item.duration || canvas.duration) {
                            mediaItem.duration = item.duration || canvas.duration;
                        }
                        if (item.width && item.height) {
                            mediaItem.dimensions = {
                                width: item.width,
                                height: item.height
                            };
                        }
                        result.media_items.push(mediaItem);
                    }
                }
            }
        }
        // Extract ranges/chapters
        if (manifest.structures && manifest.structures.length > 0) {
            result.ranges = [];
            for (const range of manifest.structures) {
                const rangeLabel = this.getFirstValue(range.label) || 'Untitled';
                const rangeId = range.id || range['@id'] || '';
                const timeRange = this.extractTimeRange(range, manifest);
                if (timeRange) {
                    result.ranges.push({
                        id: rangeId,
                        label: rangeLabel,
                        start_time: timeRange.start,
                        end_time: timeRange.end,
                        items: range.items?.map(item => item.id) || range.canvases || []
                    });
                }
            }
        }
        return result;
    }
    extractTimeRange(_range, _manifest) {
        // This is a simplified extraction - real implementation would need to
        // parse fragment identifiers and calculate times from canvas durations
        // For now, return null as this requires complex parsing
        return null;
    }
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    getFirstValue(label) {
        if (!label)
            return '';
        if (typeof label === 'string') {
            return label;
        }
        // Handle language map
        const values = Object.values(label);
        if (values.length > 0 && Array.isArray(values[0])) {
            return values[0][0] || '';
        }
        return '';
    }
}
exports.IIIFAVClient = IIIFAVClient;
// Helper function to open URL in browser
function openBrowser(url) {
    return new Promise((resolve) => {
        let command;
        const os = (0, os_1.platform)();
        switch (os) {
            case 'win32':
                // Windows: use cmd /c start to ensure proper execution
                command = `cmd /c start "" "${url.replace(/&/g, '^&')}"`;
                break;
            case 'darwin':
                // macOS
                command = `open "${url}"`;
                break;
            default:
                // Linux and others
                command = `xdg-open "${url}"`;
                break;
        }
        (0, child_process_1.exec)(command, (error) => {
            if (error) {
                console.error(`Failed to open browser: ${error.message}`);
                console.error(`Command attempted: ${command}`);
                console.error(`Please manually open: ${url}`);
                // Don't reject, just log the error
                resolve();
            }
            else {
                resolve();
            }
        });
    });
}
class IIIFAuthClient {
    sessions = new Map();
    cookieStore = new Map();
    // Get authentication info without performing authentication
    async getAuthInfo(resourceUrl) {
        try {
            // First, try to fetch the resource to check for auth requirements
            const response = await axios_1.default.get(resourceUrl, {
                headers: {
                    'Accept': 'application/ld+json, application/json'
                },
                timeout: 10000,
                validateStatus: (status) => status < 500 // Don't throw on 401/403
            });
            // Check if we got an auth error
            if (response.status === 401 || response.status === 403) {
                // Try to get auth info from headers or response body
                const authInfo = this.extractAuthFromError(response);
                if (authInfo) {
                    return authInfo;
                }
            }
            // If successful or no auth info in error, check the resource itself
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    const authInfo = this.extractAuthFromError(error.response);
                    if (authInfo) {
                        return authInfo;
                    }
                }
                throw new Error(`Failed to fetch resource: ${error.message}`);
            }
            throw error;
        }
    }
    extractAuthFromError(response) {
        // Check for auth service info in WWW-Authenticate header
        const authHeader = response.headers['www-authenticate'];
        if (authHeader) {
            // Parse IIIF auth info from header
            return { authHeader };
        }
        // Check response body for auth service
        if (response.data && response.data.service) {
            return response.data;
        }
        return null;
    }
    extractAuthServices(resource) {
        const services = [];
        // Check for service property (could be array or single object)
        let serviceList = [];
        if (resource.service) {
            serviceList = Array.isArray(resource.service) ? resource.service : [resource.service];
        }
        // Also check in specific properties for v2 manifests
        if (resource['@context'] && resource.service) {
            const v2Services = Array.isArray(resource.service) ? resource.service : [resource.service];
            serviceList = [...serviceList, ...v2Services];
        }
        // Filter for auth services
        for (const service of serviceList) {
            if (this.isAuthService(service)) {
                services.push(service);
                // Check for nested services
                if (service.service) {
                    const nestedServices = Array.isArray(service.service) ? service.service : [service.service];
                    for (const nested of nestedServices) {
                        if (this.isAuthService(nested)) {
                            services.push(nested);
                        }
                    }
                }
            }
        }
        // Check canvases for image services with auth
        if (resource.items || (resource.sequences && resource.sequences[0]?.canvases)) {
            const canvases = resource.items || resource.sequences[0].canvases || [];
            for (const canvas of canvases) {
                const canvasServices = this.extractAuthServicesFromCanvas(canvas);
                services.push(...canvasServices);
            }
        }
        // Remove duplicates based on service id
        const uniqueServices = services.reduce((acc, service) => {
            const serviceId = service.id || service['@id'];
            const exists = acc.find(s => (s.id || s['@id']) === serviceId);
            if (!exists && serviceId) {
                acc.push(service);
            }
            return acc;
        }, []);
        return uniqueServices;
    }
    extractAuthServicesFromCanvas(canvas) {
        const services = [];
        // v3 format
        if (canvas.items) {
            for (const page of canvas.items) {
                if (page.items) {
                    for (const annotation of page.items) {
                        if (annotation.body && annotation.body.service) {
                            const bodyServices = Array.isArray(annotation.body.service) ?
                                annotation.body.service : [annotation.body.service];
                            for (const service of bodyServices) {
                                if (this.isAuthService(service)) {
                                    services.push(service);
                                }
                            }
                        }
                    }
                }
            }
        }
        // v2 format - check images
        if (canvas.images) {
            for (const image of canvas.images) {
                if (image.resource && image.resource.service) {
                    const imageServices = Array.isArray(image.resource.service) ?
                        image.resource.service : [image.resource.service];
                    for (const service of imageServices) {
                        if (this.isAuthService(service)) {
                            services.push(service);
                        }
                    }
                }
            }
        }
        return services;
    }
    isAuthService(service) {
        if (!service.profile)
            return false;
        const authProfiles = [
            'http://iiif.io/api/auth/1/login',
            'http://iiif.io/api/auth/1/logout',
            'http://iiif.io/api/auth/1/token',
            'http://iiif.io/api/auth/1/probe',
            'http://iiif.io/api/auth/1/cookie',
            'http://iiif.io/api/auth/1/external',
            'http://iiif.io/api/auth/2/login',
            'http://iiif.io/api/auth/2/logout',
            'http://iiif.io/api/auth/2/token',
            'http://iiif.io/api/auth/2/probe',
            'http://iiif.io/api/auth/2/cookie',
            'http://iiif.io/api/auth/2/external'
        ];
        return authProfiles.includes(service.profile);
    }
    formatAuthInfo(resource, authServices) {
        let output = `## Authentication Information\n\n`;
        const resourceUrl = resource.id || resource['@id'] || 'Unknown';
        output += `**Resource**: ${resourceUrl}\n`;
        if (authServices.length === 0) {
            output += `\n*No authentication required for this resource.*\n`;
            return output;
        }
        output += `**Authentication Required**: Yes\n`;
        output += `**Total Auth Services**: ${authServices.length}\n\n`;
        // Group services by type
        const loginServices = authServices.filter(s => s.profile.includes('/login'));
        const tokenServices = authServices.filter(s => s.profile.includes('/token'));
        const logoutServices = authServices.filter(s => s.profile.includes('/logout'));
        const probeServices = authServices.filter(s => s.profile.includes('/probe'));
        if (loginServices.length > 0) {
            output += `### Login Services (${loginServices.length}):\n\n`;
            loginServices.forEach((service, idx) => {
                output += this.formatAuthService(service, idx + 1);
            });
        }
        if (tokenServices.length > 0) {
            output += `### Token Services (${tokenServices.length}):\n\n`;
            tokenServices.forEach((service, idx) => {
                output += this.formatAuthService(service, idx + 1);
            });
        }
        if (logoutServices.length > 0) {
            output += `### Logout Services (${logoutServices.length}):\n\n`;
            logoutServices.forEach((service, idx) => {
                output += this.formatAuthService(service, idx + 1);
            });
        }
        if (probeServices.length > 0) {
            output += `### Probe Services (${probeServices.length}):\n\n`;
            probeServices.forEach((service, idx) => {
                output += this.formatAuthService(service, idx + 1);
            });
        }
        output += `\n### Authentication Flow:\n`;
        output += `1. **Login**: Direct user to login service URL\n`;
        output += `2. **Token**: Exchange auth code for access token\n`;
        output += `3. **Access**: Include token in requests to protected resources\n`;
        output += `4. **Probe**: (Optional) Check access before full resource request\n`;
        output += `5. **Logout**: (Optional) Invalidate session\n`;
        return output;
    }
    formatAuthService(service, index) {
        let output = `**[${index}] ${this.getServiceType(service.profile)}**\n`;
        const serviceId = service.id || service['@id'] || '';
        output += `- URL: ${serviceId}\n`;
        output += `- Profile: ${service.profile}\n`;
        const apiVersion = service.profile.includes('auth/2/') ? 'v2' : 'v1';
        output += `- API Version: ${apiVersion}\n`;
        if (service.label) {
            output += `- Label: ${this.getFirstValue(service.label)}\n`;
        }
        if (service.header) {
            output += `- Header: ${this.getFirstValue(service.header)}\n`;
        }
        if (service.description) {
            output += `- Description: ${this.getFirstValue(service.description)}\n`;
        }
        if (service.confirmLabel) {
            output += `- Confirm Label: ${this.getFirstValue(service.confirmLabel)}\n`;
        }
        if (service.failureHeader) {
            output += `- Failure Header: ${this.getFirstValue(service.failureHeader)}\n`;
        }
        if (service.failureDescription) {
            output += `- Failure Description: ${this.getFirstValue(service.failureDescription)}\n`;
        }
        output += '\n';
        return output;
    }
    getServiceType(profile) {
        if (profile.includes('/login'))
            return 'Login Service';
        if (profile.includes('/logout'))
            return 'Logout Service';
        if (profile.includes('/token'))
            return 'Token Service';
        if (profile.includes('/probe'))
            return 'Probe Service';
        return 'Unknown Service';
    }
    getStructuredAuthInfo(resource, authServices) {
        const resourceUrl = resource.id || resource['@id'] || '';
        const result = {
            resource_url: resourceUrl,
            requires_auth: authServices.length > 0,
            auth_services: [],
            login_services: [],
            token_services: [],
            logout_services: [],
            probe_services: []
        };
        // Determine auth API version from services
        if (authServices.length > 0) {
            const hasV2 = authServices.some(s => s.profile.includes('auth/2/'));
            const hasV1 = authServices.some(s => s.profile.includes('auth/1/'));
            if (hasV2 && !hasV1) {
                result.auth_api_version = 'v2';
            }
            else if (hasV1 && !hasV2) {
                result.auth_api_version = 'v1';
            }
            else if (hasV1 && hasV2) {
                result.auth_api_version = 'mixed';
            }
        }
        // Process all auth services
        for (const service of authServices) {
            const serviceId = service.id || service['@id'] || '';
            const apiVersion = service.profile.includes('auth/2/') ? 'v2' : 'v1';
            const serviceInfo = {
                id: serviceId,
                type: this.getServiceType(service.profile),
                profile: service.profile,
                label: service.label ? this.getFirstValue(service.label) : undefined,
                header: service.header ? this.getFirstValue(service.header) : undefined,
                description: service.description ? this.getFirstValue(service.description) : undefined,
                confirm_label: service.confirmLabel ? this.getFirstValue(service.confirmLabel) : undefined,
                failure_header: service.failureHeader ? this.getFirstValue(service.failureHeader) : undefined,
                failure_description: service.failureDescription ? this.getFirstValue(service.failureDescription) : undefined
            };
            // Remove undefined properties
            Object.keys(serviceInfo).forEach(key => {
                if (serviceInfo[key] === undefined) {
                    delete serviceInfo[key];
                }
            });
            result.auth_services.push(serviceInfo);
            // Categorize by type
            if (service.profile.includes('/login')) {
                result.login_services.push({
                    id: serviceId,
                    label: service.label ? this.getFirstValue(service.label) : undefined,
                    auth_api_version: apiVersion
                });
            }
            else if (service.profile.includes('/token')) {
                result.token_services.push({
                    id: serviceId,
                    auth_api_version: apiVersion
                });
            }
            else if (service.profile.includes('/logout')) {
                result.logout_services.push({
                    id: serviceId,
                    label: service.label ? this.getFirstValue(service.label) : undefined,
                    auth_api_version: apiVersion
                });
            }
            else if (service.profile.includes('/probe')) {
                result.probe_services.push({
                    id: serviceId,
                    auth_api_version: apiVersion
                });
            }
        }
        return result;
    }
    getFirstValue(label) {
        if (!label)
            return '';
        if (typeof label === 'string') {
            return label;
        }
        // Handle language map
        const values = Object.values(label);
        if (values.length > 0 && Array.isArray(values[0])) {
            return values[0][0] || '';
        }
        return '';
    }
    // Full authentication methods
    /**
     * Authenticate with a IIIF resource using the appropriate auth flow
     * @param resourceUrl The protected resource URL
     * @param credentials Optional credentials for login
     * @param options Optional authentication options
     * @returns The authenticated session or throws error
     */
    async authenticate(resourceUrl, credentials, options) {
        // Check if we already have a valid session
        const existingSession = this.sessions.get(resourceUrl);
        if (existingSession && this.isSessionValid(existingSession)) {
            return existingSession;
        }
        // If token or sessionId is provided directly, create a session
        if (options?.token || options?.sessionId) {
            const session = {
                resourceUrl,
                authType: options.token ? 'token' : 'cookie',
                token: options.token,
                cookie: options.sessionId ? `session=${options.sessionId}` : undefined,
                expiresAt: new Date(Date.now() + 3600000) // 1 hour default
            };
            this.sessions.set(resourceUrl, session);
            return session;
        }
        // Get auth info for the resource
        const authInfo = await this.getAuthInfo(resourceUrl);
        const authServices = this.extractAuthServices(authInfo);
        if (authServices.length === 0) {
            throw new Error('No authentication services found for this resource');
        }
        // Find login service (including cookie, token, external types)
        const loginService = authServices.find(s => s.profile.includes('/login') ||
            s.profile.includes('/cookie') ||
            s.profile.includes('/token') ||
            s.profile.includes('/external'));
        if (!loginService) {
            throw new Error('No login service found');
        }
        // Determine auth type
        const authType = this.determineAuthType(loginService.profile);
        // Perform authentication based on type
        let session;
        switch (authType) {
            case 'cookie':
                session = await this.performCookieAuth(resourceUrl, loginService, credentials, options);
                break;
            case 'token':
                session = await this.performTokenAuth(resourceUrl, loginService, credentials);
                break;
            case 'external':
                session = await this.performExternalAuth(resourceUrl, loginService, options?.interactive);
                break;
            default:
                throw new Error(`Unsupported auth type: ${authType}`);
        }
        // Store session
        this.sessions.set(resourceUrl, session);
        return session;
    }
    /**
     * Perform cookie-based authentication
     */
    async performCookieAuth(resourceUrl, loginService, credentials, options) {
        const loginUrl = loginService.id || loginService['@id'];
        if (!loginUrl) {
            throw new Error('No login URL found');
        }
        // If credentials are provided and not interactive, try direct POST first
        if (credentials && credentials.username && credentials.password && !options?.interactive) {
            try {
                // Try direct login
                const loginResponse = await axios_1.default.post(loginUrl, credentials, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    withCredentials: true,
                    maxRedirects: 0,
                    validateStatus: (status) => status < 500
                });
                // Extract cookies from response
                const cookies = loginResponse.headers['set-cookie'];
                if (cookies) {
                    // Store cookies
                    const cookieString = cookies.join('; ');
                    this.cookieStore.set(resourceUrl, cookieString);
                    return {
                        resourceUrl,
                        cookie: cookieString,
                        authType: 'cookie',
                        expiresAt: new Date(Date.now() + 3600000) // 1 hour default
                    };
                }
            }
            catch (error) {
                // If direct POST fails, fall back to browser-based auth
                console.error('Direct login failed, falling back to browser-based authentication');
            }
        }
        // Find token service if available
        const tokenService = loginService.service?.find((s) => s.profile?.includes('/token') || s['@profile']?.includes('/token'));
        const tokenUrl = tokenService ? (tokenService.id || tokenService['@id']) : null;
        // Use browser-based authentication flow
        const callbackPort = await this.findAvailablePort(8080, 8180);
        const callbackUrl = `http://localhost:${callbackPort}/callback`;
        return new Promise((resolve, reject) => {
            let server;
            let authCheckInterval = null;
            const handler = async (req, res) => {
                const url = new URL(req.url || '', `http://localhost:${callbackPort}`);
                if (url.pathname === '/callback') {
                    // Extract cookies from the request
                    const cookieHeader = req.headers.cookie;
                    // Send success response to browser
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
            <html>
              <body>
                <h1>Authentication Successful!</h1>
                <p>You can now close this window and return to the application.</p>
                <script>
                  // Try to get session info from the page if available
                  const sessionInfo = document.cookie;
                  if (sessionInfo) {
                    fetch('/callback/cookies', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ cookies: sessionInfo })
                    });
                  }
                  setTimeout(() => window.close(), 1000);
                </script>
              </body>
            </html>
          `);
                    // Also try to get the auth cookie by making a request to the resource
                    try {
                        const testResponse = await axios_1.default.get(resourceUrl, {
                            withCredentials: true,
                            validateStatus: () => true,
                            headers: cookieHeader ? { 'Cookie': cookieHeader } : {}
                        });
                        const authCookie = testResponse.headers['set-cookie'] || cookieHeader;
                        if (authCookie) {
                            const cookieString = Array.isArray(authCookie) ? authCookie.join('; ') : authCookie;
                            this.cookieStore.set(resourceUrl, cookieString);
                            server.close();
                            resolve({
                                resourceUrl,
                                cookie: cookieString,
                                authType: 'cookie',
                                expiresAt: new Date(Date.now() + 3600000) // 1 hour default
                            });
                            return;
                        }
                    }
                    catch (error) {
                        console.error('Failed to verify authentication:', error);
                    }
                    server.close();
                    reject(new Error('Authentication completed but no valid session cookie received'));
                }
                else if (url.pathname === '/callback/cookies' && req.method === 'POST') {
                    // Handle cookie data from client
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', () => {
                        try {
                            const { cookies } = JSON.parse(body);
                            if (cookies) {
                                this.cookieStore.set(resourceUrl, cookies);
                                res.writeHead(200);
                                res.end('OK');
                            }
                        }
                        catch (error) {
                            res.writeHead(400);
                            res.end('Bad Request');
                        }
                    });
                }
                else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            };
            // Start server
            server = http.createServer(handler);
            server.listen(callbackPort, async () => {
                console.error(`\n🔐 Cookie-based Authentication Required`);
                console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.error(`Service: ${this.getFirstValue(loginService.label) || 'Cookie Authentication'}`);
                console.error(`Description: ${this.getFirstValue(loginService.description) || 'Please log in using your browser'}`);
                if (credentials) {
                    console.error(`\nCredentials provided: ${credentials.username}`);
                }
                console.error(`\nOpening browser for authentication...`);
                console.error(`If the browser doesn't open automatically, please visit:`);
                console.error(`👉 ${loginUrl}`);
                console.error(`\nFor IIIF Auth Demonstrator:`);
                console.error(`- Username: username`);
                console.error(`- Password: password`);
                console.error(`\nWaiting for authentication to complete...`);
                console.error(`\nAfter login:`);
                console.error(`1. The authentication window should close automatically`);
                console.error(`2. If it doesn't close, please close it manually`);
                console.error(`3. We'll then request the access token`);
                console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
                try {
                    // For cookie auth, we might need to handle the login form submission
                    // Some services might accept a return_url or callback parameter
                    const authUrl = new URL(loginUrl);
                    // Add origin for IIIF Auth Demonstrator
                    const origin = `http://localhost:${callbackPort}`;
                    authUrl.searchParams.set('origin', origin);
                    // Try common parameter names for callback
                    const callbackParams = ['return_url', 'redirect_uri', 'callback', 'returnTo', 'next'];
                    for (const param of callbackParams) {
                        if (!authUrl.searchParams.has(param)) {
                            authUrl.searchParams.set(param, callbackUrl);
                            break;
                        }
                    }
                    // Open browser (skip in test environment)
                    if (process.env.NODE_ENV !== 'test') {
                        await openBrowser(authUrl.toString());
                    }
                }
                catch (error) {
                    console.error(`Failed to open browser: ${error}`);
                    console.error(`Please manually open the URL above`);
                }
            });
            // Set up polling to check if window has closed and then get token
            if (tokenUrl) {
                let checkCount = 0;
                const maxChecks = 120; // 2 minutes with 1 second intervals
                authCheckInterval = setInterval(async () => {
                    checkCount++;
                    // After a reasonable time, try to get the token
                    if (checkCount > 5) { // Wait 5 seconds before first attempt
                        try {
                            const token = await this.getTokenFromService(tokenUrl, callbackPort, checkCount - 5);
                            if (token) {
                                if (authCheckInterval)
                                    clearInterval(authCheckInterval);
                                server.close();
                                const session = {
                                    resourceUrl,
                                    authType: 'cookie',
                                    token: token,
                                    expiresAt: new Date(Date.now() + 3600000) // 1 hour default
                                };
                                console.error(`\n✅ Authentication successful! Token received.`);
                                resolve(session);
                                return;
                            }
                        }
                        catch (error) {
                            // Token not ready yet, continue polling
                            if (checkCount % 10 === 0) {
                                console.error(`Still waiting for authentication... (${checkCount}s)`);
                            }
                        }
                    }
                    if (checkCount >= maxChecks) {
                        if (authCheckInterval)
                            clearInterval(authCheckInterval);
                        server.close();
                        console.error(`\n⏱️ Authentication timeout after 2 minutes`);
                        console.error(`\n❗ Browser-based authentication has limitations in CLI environments.`);
                        console.error(`The browser's authentication session cannot be shared with the CLI process.`);
                        console.error(`\nRecommended alternatives:`);
                        console.error(`1. Use direct authentication (without 'interactive: true'):`);
                        console.error(`   Example: action: 'authenticate', username: 'username', password: 'password'`);
                        console.error(`2. Use manual token authentication if you have obtained a token`);
                        console.error(`3. Consider using a IIIF viewer application instead of CLI for full auth support`);
                        console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
                        reject(new Error('Browser-based authentication not fully supported in CLI. Please use direct authentication or manual token entry.'));
                    }
                }, 1000); // Check every second
            }
            else {
                // No token service, just use timeout
                setTimeout(() => {
                    server.close();
                    console.error(`\n⏱️ Authentication timeout after 2 minutes`);
                    console.error(`No token service available for automatic token retrieval.`);
                    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
                    reject(new Error('Authentication timeout - no token service available'));
                }, 120000); // 2 minutes
            }
        });
    }
    /**
     * Perform token-based authentication
     */
    async performTokenAuth(resourceUrl, loginService, credentials) {
        // Find token service
        const tokenService = loginService.service?.find((s) => s.profile?.includes('/token')) ||
            loginService.service?.find((s) => s['@profile']?.includes('/token'));
        if (!tokenService) {
            throw new Error('No token service found');
        }
        const tokenUrl = tokenService.id || tokenService['@id'];
        if (!tokenUrl) {
            throw new Error('No token URL found');
        }
        try {
            // First, perform login if credentials provided
            if (credentials) {
                const loginUrl = loginService.id || loginService['@id'];
                if (loginUrl) {
                    await axios_1.default.post(loginUrl, credentials, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        withCredentials: true
                    });
                }
            }
            // Get access token
            const tokenResponse = await axios_1.default.get(tokenUrl, {
                headers: {
                    'Accept': 'application/json'
                },
                withCredentials: true
            });
            const token = tokenResponse.data.accessToken || tokenResponse.data.token;
            if (!token) {
                throw new Error('No token received from token service');
            }
            return {
                resourceUrl,
                token,
                authType: 'token',
                expiresAt: tokenResponse.data.expiresIn
                    ? new Date(Date.now() + tokenResponse.data.expiresIn * 1000)
                    : new Date(Date.now() + 3600000) // 1 hour default
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Token auth failed: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Perform external authentication
     */
    async performExternalAuth(resourceUrl, loginService, _interactive) {
        const loginUrl = loginService.id || loginService['@id'];
        if (!loginUrl) {
            throw new Error('No login URL found for external auth');
        }
        // Start local callback server
        const callbackPort = await this.findAvailablePort(8080, 8180);
        const callbackUrl = `http://localhost:${callbackPort}/callback`;
        return new Promise((resolve, reject) => {
            let server;
            const handler = (req, res) => {
                const url = new URL(req.url || '', `http://localhost:${callbackPort}`);
                if (url.pathname === '/callback') {
                    // Extract auth info from callback
                    const token = url.searchParams.get('token') || url.searchParams.get('access_token');
                    const sessionId = url.searchParams.get('session') || url.searchParams.get('sessionId');
                    // Send success response to browser
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
            <html>
              <head>
                <title>Authentication Callback</title>
              </head>
              <body>
                <h1>Authentication Successful!</h1>
                <p>You can now close this window and return to the application.</p>
                <script>
                  // Handle IIIF Auth Demonstrator postMessage
                  if (window.opener && window.opener.postMessage) {
                    window.opener.postMessage({
                      type: 'iiif-auth-callback',
                      token: '${token || ''}',
                      sessionId: '${sessionId || ''}'
                    }, '*');
                  }
                  
                  // Try to close the window
                  setTimeout(() => {
                    window.close();
                  }, 1000);
                </script>
              </body>
            </html>
          `);
                    // Clean up server
                    server.close();
                    if (token || sessionId) {
                        // Create session based on received data
                        const session = {
                            resourceUrl,
                            authType: 'external',
                            token: token || undefined,
                            cookie: sessionId ? `session=${sessionId}` : undefined,
                            expiresAt: new Date(Date.now() + 3600000) // 1 hour default
                        };
                        console.error(`\n✅ Authentication callback received!`);
                        console.error(`Session established with ${token ? 'token' : 'session ID'}`);
                        resolve(session);
                    }
                    else {
                        // Even without explicit token/session, consider it successful if callback was reached
                        console.error(`\n⚠️ Callback reached but no explicit token/session in URL`);
                        console.error(`IIIF Auth Demonstrator may not provide tokens in callback`);
                        console.error(`Please use manual token authentication if you have a token`);
                        reject(new Error('No authentication data received from callback - please use manual token authentication'));
                    }
                }
                else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            };
            // Start server
            server = http.createServer(handler);
            server.listen(callbackPort, async () => {
                console.error(`\n🔐 Authentication Required`);
                console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.error(`Service: ${this.getFirstValue(loginService.label) || 'External Authentication'}`);
                console.error(`Description: ${this.getFirstValue(loginService.description) || 'Please authenticate in your browser'}`);
                console.error(`\nOpening browser for authentication...`);
                console.error(`If the browser doesn't open automatically, please visit:`);
                console.error(`👉 ${loginUrl}`);
                console.error(`\nWaiting for callback at: ${callbackUrl}`);
                console.error(`\nNote: If authentication completes but nothing happens:`);
                console.error(`1. Check if you see a token or session ID after login`);
                console.error(`2. Manually navigate to: ${callbackUrl}?token=YOUR_TOKEN`);
                console.error(`3. Or use manual token authentication instead`);
                console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
                try {
                    // Append callback URL to login URL if possible
                    const authUrl = new URL(loginUrl);
                    // IIIF Auth Demonstrator requires origin parameter
                    const origin = `http://localhost:${callbackPort}`;
                    authUrl.searchParams.set('origin', origin);
                    authUrl.searchParams.set('callback', callbackUrl);
                    authUrl.searchParams.set('redirect_uri', callbackUrl);
                    // Open browser (skip in test environment)
                    if (process.env.NODE_ENV !== 'test') {
                        await openBrowser(authUrl.toString());
                    }
                }
                catch (error) {
                    console.error(`Failed to open browser: ${error}`);
                    console.error(`Please manually open the URL above`);
                }
            });
            // Timeout after 2 minutes (Claude Desktop may timeout earlier)
            setTimeout(() => {
                server.close();
                console.error(`\n⏱️ Authentication timeout after 2 minutes`);
                console.error(`If authentication is still in progress:`);
                console.error(`1. Complete the authentication in your browser`);
                console.error(`2. Then use manual token authentication with any token/session received`);
                console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
                reject(new Error('Authentication timeout - please use manual token authentication if you received a token'));
            }, 120000); // 2 minutes
        });
    }
    /**
     * Find an available port
     */
    async findAvailablePort(startPort, endPort) {
        for (let port = startPort; port <= endPort; port++) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
        }
        throw new Error(`No available ports found between ${startPort} and ${endPort}`);
    }
    /**
     * Check if a port is available
     */
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = http.createServer();
            server.once('error', () => resolve(false));
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port);
        });
    }
    /**
     * Get token from IIIF token service
     * In a browser environment, this would use iframe/postMessage.
     * In Node.js, we make a direct HTTP request with cookies.
     */
    async getTokenFromService(tokenUrl, callbackPort, attemptNumber) {
        try {
            // Generate a unique message ID
            const messageId = Math.random().toString(36).substring(2, 15);
            const origin = `http://localhost:${callbackPort}`;
            // Make request to token service
            const tokenServiceUrl = `${tokenUrl}?messageId=${messageId}&origin=${encodeURIComponent(origin)}`;
            // Get cookies for this resource if available
            const cookies = this.cookieStore.get(tokenUrl) || this.cookieStore.get(tokenUrl.split('/token')[0]);
            const response = await axios_1.default.get(tokenServiceUrl, {
                headers: {
                    'Accept': 'text/html, application/json',
                    ...(cookies ? { 'Cookie': cookies } : {})
                },
                withCredentials: true,
                validateStatus: () => true
            });
            // Parse the response to extract token
            // The token service returns HTML with postMessage script
            if (response.status === 200 && response.data) {
                const htmlContent = response.data.toString();
                // Try to extract accessToken from postMessage script
                const tokenMatch = htmlContent.match(/["']accessToken["']\s*:\s*["']([^"']+)["']/);
                if (tokenMatch && tokenMatch[1]) {
                    return tokenMatch[1];
                }
                // Try to extract from JSON if response is JSON
                if (typeof response.data === 'object' && response.data.accessToken) {
                    return response.data.accessToken;
                }
                // Check for error in response
                const errorMatch = htmlContent.match(/["']error["']\s*:\s*["']([^"']+)["']/);
                if (errorMatch) {
                    if (errorMatch[1] === 'missingCredentials') {
                        // Don't log every attempt, just once
                        if (attemptNumber === 1) { // First attempt
                            console.error(`\n⚠️ Authentication session not detected by token service.`);
                            console.error(`This is a known limitation when using browser-based authentication in CLI.`);
                            console.error(`\nPlease ensure you:`);
                            console.error(`1. Have completed login in the browser`);
                            console.error(`2. Close the authentication window/tab`);
                            console.error(`\nAlternative options:`);
                            console.error(`• Use direct authentication with username/password (without 'interactive: true')`);
                            console.error(`• Use manual token authentication if you can obtain a token`);
                        }
                    }
                    else {
                        console.error(`Token service returned error: ${errorMatch[1]}`);
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error(`Failed to get token from service: ${error}`);
            return null;
        }
    }
    /**
     * Make an authenticated request to a protected resource
     */
    async getProtectedResource(resourceUrl, session) {
        // Use provided session or get existing one
        const authSession = session || this.sessions.get(resourceUrl);
        if (!authSession) {
            throw new Error('No authentication session found. Please authenticate first.');
        }
        if (!this.isSessionValid(authSession)) {
            throw new Error('Authentication session expired. Please re-authenticate.');
        }
        try {
            const headers = {
                'Accept': 'application/ld+json, application/json'
            };
            // Add auth headers based on type
            if (authSession.authType === 'token' && authSession.token) {
                headers['Authorization'] = `Bearer ${authSession.token}`;
            }
            else if (authSession.authType === 'cookie' && authSession.cookie) {
                headers['Cookie'] = authSession.cookie;
            }
            const response = await axios_1.default.get(resourceUrl, {
                headers,
                timeout: 10000,
                withCredentials: authSession.authType === 'cookie'
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    // Clear invalid session
                    this.sessions.delete(resourceUrl);
                    throw new Error('Authentication failed. Session may have expired.');
                }
                throw new Error(`Failed to fetch protected resource: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Probe access to a resource
     */
    async probeAccess(resourceUrl, session) {
        const authSession = session || this.sessions.get(resourceUrl);
        // Get auth services
        const authInfo = await this.getAuthInfo(resourceUrl);
        const authServices = this.extractAuthServices(authInfo);
        // Find probe service
        const probeService = authServices.find(s => s.profile.includes('/probe'));
        if (!probeService) {
            // No probe service, try direct access
            try {
                await this.getProtectedResource(resourceUrl, authSession);
                return true;
            }
            catch {
                return false;
            }
        }
        const probeUrl = probeService.id || probeService['@id'];
        if (!probeUrl) {
            return false;
        }
        try {
            const headers = {
                'Accept': 'application/json'
            };
            if (authSession) {
                if (authSession.authType === 'token' && authSession.token) {
                    headers['Authorization'] = `Bearer ${authSession.token}`;
                }
                else if (authSession.authType === 'cookie' && authSession.cookie) {
                    headers['Cookie'] = authSession.cookie;
                }
            }
            const response = await axios_1.default.get(probeUrl, {
                headers,
                withCredentials: authSession?.authType === 'cookie'
            });
            // Check probe response
            return response.status === 200 || response.data.status === 200;
        }
        catch {
            return false;
        }
    }
    /**
     * Logout from a resource
     */
    async logout(resourceUrl) {
        const session = this.sessions.get(resourceUrl);
        if (!session) {
            return;
        }
        // Get auth services
        const authInfo = await this.getAuthInfo(resourceUrl);
        const authServices = this.extractAuthServices(authInfo);
        // Find logout service
        const logoutService = authServices.find(s => s.profile.includes('/logout'));
        if (logoutService) {
            const logoutUrl = logoutService.id || logoutService['@id'];
            if (logoutUrl) {
                try {
                    await axios_1.default.get(logoutUrl, {
                        withCredentials: session.authType === 'cookie'
                    });
                }
                catch {
                    // Ignore logout errors
                }
            }
        }
        // Clear session
        this.sessions.delete(resourceUrl);
        this.cookieStore.delete(resourceUrl);
    }
    /**
     * Check if a session is still valid
     */
    isSessionValid(session) {
        if (!session.expiresAt) {
            return true; // No expiry, assume valid
        }
        return session.expiresAt > new Date();
    }
    /**
     * Determine authentication type from profile
     */
    determineAuthType(profile) {
        if (profile.includes('/external'))
            return 'external';
        if (profile.includes('/token'))
            return 'token';
        if (profile.includes('/cookie'))
            return 'cookie';
        if (profile.includes('/login'))
            return 'cookie'; // Standard login is cookie-based
        return 'unknown';
    }
}
exports.IIIFAuthClient = IIIFAuthClient;
const server = new index_js_1.Server({
    name: 'iiif-mcp',
    version: '1.0.1',
}, {
    capabilities: {
        tools: {},
    },
});
const searchClient = new IIIFSearchClient();
const manifestClient = new IIIFManifestClient();
const imageClient = new IIIFImageClient();
const collectionClient = new IIIFCollectionClient();
const annotationClient = new IIIFAnnotationClient();
const activityClient = new IIIFActivityClient();
const avClient = new IIIFAVClient();
const authClient = new IIIFAuthClient();
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'iiif-search',
                description: 'Search IIIF content using Content Search API',
                inputSchema: {
                    type: 'object',
                    properties: {
                        searchServiceUrl: {
                            type: 'string',
                            description: 'The URL of the IIIF Content Search service endpoint',
                        },
                        query: {
                            type: 'string',
                            description: 'The search query string',
                        },
                        structured: {
                            type: 'boolean',
                            description: 'Return structured JSON data instead of formatted text',
                        },
                    },
                    required: ['searchServiceUrl', 'query'],
                },
            },
            {
                name: 'iiif-manifest',
                description: 'Retrieve and parse IIIF manifest metadata',
                inputSchema: {
                    type: 'object',
                    properties: {
                        manifestUrl: {
                            type: 'string',
                            description: 'The URL of the IIIF manifest',
                        },
                        properties: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['label', 'id', 'type', 'summary', 'metadata', 'rights', 'provider', 'viewingDirection', 'items', 'structures', 'thumbnail'],
                            },
                            description: 'Specific properties to retrieve (if not specified, all properties are returned)',
                        },
                        structured: {
                            type: 'boolean',
                            description: 'Return structured JSON data instead of formatted text',
                        },
                    },
                    required: ['manifestUrl'],
                },
            },
            {
                name: 'iiif-image',
                description: 'Build IIIF Image API URLs and retrieve image information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        imageUrl: {
                            type: 'string',
                            description: 'Base URL of the IIIF image (without parameters)',
                        },
                        region: {
                            type: 'string',
                            description: 'Image region (full, square, x,y,w,h, or pct:x,y,w,h)',
                        },
                        size: {
                            type: 'string',
                            description: 'Image size (max, w,h, w,, ,h, pct:n, or !w,h)',
                        },
                        rotation: {
                            type: 'string',
                            description: 'Rotation in degrees (0-360, optionally prefixed with ! for mirroring)',
                        },
                        quality: {
                            type: 'string',
                            enum: ['default', 'color', 'gray', 'bitonal'],
                            description: 'Image quality',
                        },
                        format: {
                            type: 'string',
                            enum: ['jpg', 'tif', 'png', 'gif', 'jp2', 'pdf', 'webp'],
                            description: 'Image format',
                        },
                        info: {
                            type: 'boolean',
                            description: 'If true, retrieve image information instead of building URL',
                        },
                        structured: {
                            type: 'boolean',
                            description: 'Return structured JSON data instead of formatted text',
                        },
                    },
                    required: ['imageUrl'],
                },
            },
            {
                name: 'iiif-collection',
                description: 'Retrieve and navigate IIIF collections',
                inputSchema: {
                    type: 'object',
                    properties: {
                        collectionUrl: {
                            type: 'string',
                            description: 'The URL of the IIIF collection',
                        },
                        includeItems: {
                            type: 'boolean',
                            description: 'Include detailed list of collection items (default: true)',
                        },
                        structured: {
                            type: 'boolean',
                            description: 'Return structured JSON data instead of formatted text',
                        },
                    },
                    required: ['collectionUrl'],
                },
            },
            {
                name: 'iiif-annotation',
                description: 'Extract and analyze annotations from IIIF resources',
                inputSchema: {
                    type: 'object',
                    properties: {
                        source: {
                            type: 'string',
                            description: 'Either an annotation URL or a manifest URL to extract annotations from',
                        },
                        language: {
                            type: 'string',
                            description: 'Filter annotations by language code (e.g., "en", "fr")',
                        },
                        groupByCanvas: {
                            type: 'boolean',
                            description: 'Group annotations by their target canvas',
                        },
                        includeNonText: {
                            type: 'boolean',
                            description: 'Include non-text annotations in the results',
                        },
                        structured: {
                            type: 'boolean',
                            description: 'Return structured JSON data instead of formatted text',
                        },
                    },
                    required: ['source'],
                },
            },
            {
                name: 'iiif-activity',
                description: 'Retrieve and process IIIF Change Discovery API activity streams',
                inputSchema: {
                    type: 'object',
                    properties: {
                        activityStreamUrl: {
                            type: 'string',
                            description: 'The URL of the IIIF Activity Stream (OrderedCollection)',
                        },
                        pageUrl: {
                            type: 'string',
                            description: 'The URL of a specific activity page (OrderedCollectionPage)',
                        },
                        structured: {
                            type: 'boolean',
                            description: 'Return structured JSON data instead of formatted text',
                        },
                    },
                    oneOf: [
                        { required: ['activityStreamUrl'] },
                        { required: ['pageUrl'] }
                    ],
                },
            },
            {
                name: 'iiif-av',
                description: 'Extract and analyze audio/video content from IIIF manifests',
                inputSchema: {
                    type: 'object',
                    properties: {
                        manifestUrl: {
                            type: 'string',
                            description: 'The URL of the IIIF manifest containing A/V content',
                        },
                        includeRanges: {
                            type: 'boolean',
                            description: 'Include structural ranges/chapters in the output',
                        },
                        structured: {
                            type: 'boolean',
                            description: 'Return structured JSON data instead of formatted text',
                        },
                    },
                    required: ['manifestUrl'],
                },
            },
            {
                name: 'test-echo',
                description: 'Simple test tool that echoes input',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Message to echo',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'iiif-auth',
                description: 'Authenticate with IIIF resources and access protected content',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['info', 'authenticate', 'probe', 'logout', 'get-protected'],
                            description: 'The authentication action to perform',
                        },
                        resourceUrl: {
                            type: 'string',
                            description: 'The URL of the IIIF resource',
                        },
                        username: {
                            type: 'string',
                            description: 'Username for authentication (when action is authenticate)',
                        },
                        password: {
                            type: 'string',
                            description: 'Password for authentication (when action is authenticate)',
                        },
                        token: {
                            type: 'string',
                            description: 'Manually provide an access token (when action is authenticate)',
                        },
                        sessionId: {
                            type: 'string',
                            description: 'Manually provide a session ID (when action is authenticate)',
                        },
                        interactive: {
                            type: 'boolean',
                            description: 'Use interactive browser-based authentication (when action is authenticate)',
                        },
                        structured: {
                            type: 'boolean',
                            description: 'Return structured JSON data instead of formatted text',
                        },
                    },
                    required: ['action', 'resourceUrl'],
                },
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    // Get arguments from the standard location
    const args = request.params.arguments || {};
    switch (request.params.name) {
        case 'test-echo': {
            const { message } = args;
            return {
                content: [{
                        type: "text",
                        text: `Echo test - Received arguments: ${JSON.stringify(args)}. Message: ${message || 'no message provided'}`
                    }]
            };
        }
        case 'iiif-search': {
            const { searchServiceUrl, query, structured } = args;
            if (!searchServiceUrl || !query) {
                return {
                    content: [{
                            type: "text",
                            text: "Error: searchServiceUrl and query are required parameters"
                        }]
                };
            }
            if (!searchServiceUrl || !query) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Both searchServiceUrl and query are required');
            }
            try {
                const searchResponse = await searchClient.search(searchServiceUrl, query);
                if (structured) {
                    const structuredResults = searchClient.getStructuredResults(searchResponse, searchServiceUrl, query);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(structuredResults, null, 2),
                            },
                        ],
                    };
                }
                else {
                    const formattedResults = searchClient.formatSearchResults(searchResponse);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: formattedResults,
                            },
                        ],
                    };
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        case 'iiif-manifest': {
            const args = request.params.arguments || {};
            const { manifestUrl, properties, structured } = args;
            if (!manifestUrl) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'manifestUrl is required');
            }
            try {
                const manifest = await manifestClient.getManifest(manifestUrl);
                if (structured) {
                    const structuredManifest = manifestClient.getStructuredManifest(manifest);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(structuredManifest, null, 2),
                            },
                        ],
                    };
                }
                else {
                    const formattedManifest = manifestClient.formatManifest(manifest, properties);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: formattedManifest,
                            },
                        ],
                    };
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to retrieve manifest: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        case 'iiif-image': {
            const args = request.params.arguments || {};
            const { imageUrl, region, size, rotation, quality, format, info, structured } = args;
            if (!imageUrl) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'imageUrl is required');
            }
            try {
                if (info) {
                    // Get image information
                    const infoUrl = imageUrl.endsWith('/info.json') ? imageUrl : `${imageUrl}/info.json`;
                    const imageInfo = await imageClient.getImageInfo(infoUrl);
                    if (structured) {
                        const structuredInfo = imageClient.getStructuredImageInfo(imageInfo);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(structuredInfo, null, 2),
                                },
                            ],
                        };
                    }
                    else {
                        const formattedInfo = imageClient.formatImageInfo(imageInfo);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: formattedInfo,
                                },
                            ],
                        };
                    }
                }
                else {
                    // Validate parameters
                    const validation = imageClient.validateParameters({ region, size, rotation, quality, format });
                    if (!validation.valid) {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `Invalid parameters: ${validation.errors.join('; ')}`);
                    }
                    if (structured) {
                        const structuredResult = imageClient.getStructuredImageUrl(imageUrl, {
                            region,
                            size,
                            rotation,
                            quality,
                            format,
                        });
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(structuredResult, null, 2),
                                },
                            ],
                        };
                    }
                    else {
                        // Build image URL
                        const fullImageUrl = imageClient.buildImageUrl(imageUrl, {
                            region,
                            size,
                            rotation,
                            quality,
                            format,
                        });
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `**IIIF Image URL Generated**\n\n${fullImageUrl}\n\n**Parameters:**\n- Region: ${region || 'full'}\n- Size: ${size || 'max'}\n- Rotation: ${rotation || '0'}\n- Quality: ${quality || 'default'}\n- Format: ${format || 'jpg'}`,
                                },
                            ],
                        };
                    }
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Image operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        case 'iiif-collection': {
            const args = request.params.arguments || {};
            const { collectionUrl, includeItems, structured } = args;
            if (!collectionUrl) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'collectionUrl is required');
            }
            try {
                const collection = await collectionClient.getCollection(collectionUrl);
                if (structured) {
                    const structuredCollection = collectionClient.getStructuredCollection(collection);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(structuredCollection, null, 2),
                            },
                        ],
                    };
                }
                else {
                    const formattedCollection = collectionClient.formatCollection(collection, includeItems !== false);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: formattedCollection,
                            },
                        ],
                    };
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to retrieve collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        case 'iiif-annotation': {
            const args = request.params.arguments || {};
            const { source, language, groupByCanvas, includeNonText, structured } = args;
            if (!source) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'source is required');
            }
            try {
                let annotationData;
                // Check if source is a manifest URL or annotation URL
                if (source.includes('/manifest') || source.endsWith('.json') && !source.includes('/list/') && !source.includes('/page/')) {
                    // It's likely a manifest, extract annotation URLs
                    const annotationUrls = await annotationClient.getAnnotationsFromManifest(source);
                    if (annotationUrls.length === 0) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: 'No annotations found in the manifest.',
                                },
                            ],
                        };
                    }
                    // For now, process the first annotation URL
                    // In the future, we could aggregate multiple annotation lists
                    annotationData = await annotationClient.getAnnotations(annotationUrls[0]);
                    if (annotationUrls.length > 1) {
                        console.error(`Note: Found ${annotationUrls.length} annotation sources, processing only the first one.`);
                    }
                }
                else {
                    // Direct annotation URL
                    annotationData = await annotationClient.getAnnotations(source);
                }
                const options = {
                    language,
                    groupByCanvas,
                    includeNonText
                };
                if (structured) {
                    const structuredAnnotations = annotationClient.getStructuredAnnotations(annotationData, options);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(structuredAnnotations, null, 2),
                            },
                        ],
                    };
                }
                else {
                    const formattedAnnotations = annotationClient.formatAnnotations(annotationData, options);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: formattedAnnotations,
                            },
                        ],
                    };
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to process annotations: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        case 'iiif-activity': {
            const args = request.params.arguments || {};
            const { activityStreamUrl, pageUrl, structured } = args;
            if (!activityStreamUrl && !pageUrl) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Either activityStreamUrl or pageUrl is required');
            }
            try {
                let activityData;
                if (pageUrl) {
                    // Fetch a specific page
                    activityData = await activityClient.getActivityPage(pageUrl);
                }
                else {
                    // Fetch the main activity stream
                    activityData = await activityClient.getActivityStream(activityStreamUrl);
                }
                if (structured) {
                    const structuredActivities = activityClient.getStructuredActivities(activityData);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(structuredActivities, null, 2),
                            },
                        ],
                    };
                }
                else {
                    const formattedActivities = activityClient.processActivityStream(activityData);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: formattedActivities,
                            },
                        ],
                    };
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to retrieve activity stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        case 'iiif-av': {
            const args = request.params.arguments || {};
            const { manifestUrl, includeRanges, structured } = args;
            if (!manifestUrl) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'manifestUrl is required');
            }
            try {
                const manifest = await avClient.getAVManifest(manifestUrl);
                if (structured) {
                    const structuredAV = avClient.getStructuredAVContent(manifest);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(structuredAV, null, 2),
                            },
                        ],
                    };
                }
                else {
                    const formattedAV = avClient.formatAVContent(manifest, { includeRanges });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: formattedAV,
                            },
                        ],
                    };
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to process A/V manifest: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        case 'iiif-auth': {
            const args = request.params.arguments || {};
            const { action, resourceUrl, username, password, token, sessionId, interactive, structured } = args;
            if (!resourceUrl) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'resourceUrl is required');
            }
            if (!action) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'action is required');
            }
            try {
                switch (action) {
                    case 'info': {
                        const resource = await authClient.getAuthInfo(resourceUrl);
                        const authServices = authClient.extractAuthServices(resource);
                        if (structured) {
                            const structuredAuth = authClient.getStructuredAuthInfo(resource, authServices);
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(structuredAuth, null, 2),
                                    },
                                ],
                            };
                        }
                        else {
                            const formattedAuth = authClient.formatAuthInfo(resource, authServices);
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: formattedAuth,
                                    },
                                ],
                            };
                        }
                    }
                    case 'authenticate': {
                        const credentials = username && password ? { username, password } : undefined;
                        const options = { token, sessionId, interactive };
                        const session = await authClient.authenticate(resourceUrl, credentials, options);
                        if (structured) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify({
                                            success: true,
                                            session: {
                                                resourceUrl: session.resourceUrl,
                                                authType: session.authType,
                                                expiresAt: session.expiresAt,
                                                hasToken: !!session.token,
                                                hasCookie: !!session.cookie
                                            }
                                        }, null, 2),
                                    },
                                ],
                            };
                        }
                        else {
                            let output = `## Authentication Successful\n\n`;
                            output += `**Resource**: ${session.resourceUrl}\n`;
                            output += `**Auth Type**: ${session.authType}\n`;
                            output += `**Expires**: ${session.expiresAt || 'No expiry'}\n`;
                            output += `**Session**: ${session.token ? 'Token obtained' : session.cookie ? 'Cookie obtained' : 'Session established'}\n`;
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: output,
                                    },
                                ],
                            };
                        }
                    }
                    case 'probe': {
                        const hasAccess = await authClient.probeAccess(resourceUrl);
                        if (structured) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify({
                                            resourceUrl,
                                            hasAccess
                                        }, null, 2),
                                    },
                                ],
                            };
                        }
                        else {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: `Access to ${resourceUrl}: ${hasAccess ? '✅ Granted' : '❌ Denied'}`,
                                    },
                                ],
                            };
                        }
                    }
                    case 'logout': {
                        await authClient.logout(resourceUrl);
                        if (structured) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify({
                                            success: true,
                                            message: 'Logged out successfully'
                                        }, null, 2),
                                    },
                                ],
                            };
                        }
                        else {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: `Successfully logged out from ${resourceUrl}`,
                                    },
                                ],
                            };
                        }
                    }
                    case 'get-protected': {
                        const data = await authClient.getProtectedResource(resourceUrl);
                        if (structured) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(data, null, 2),
                                    },
                                ],
                            };
                        }
                        else {
                            // Format based on data type
                            let output = `## Protected Resource\n\n`;
                            output += `**URL**: ${resourceUrl}\n\n`;
                            if (data.label) {
                                output += `**Label**: ${authClient.getFirstValue(data.label)}\n`;
                            }
                            if (data.type || data['@type']) {
                                output += `**Type**: ${data.type || data['@type']}\n`;
                            }
                            output += '\n### Raw Data:\n```json\n';
                            output += JSON.stringify(data, null, 2);
                            output += '\n```';
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: output,
                                    },
                                ],
                            };
                        }
                    }
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `Unknown action: ${action}`);
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Authentication operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        default:
            throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('IIIF MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map