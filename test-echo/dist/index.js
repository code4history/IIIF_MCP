"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
// Create server instance
const server = new index_js_1.Server({
    name: 'test-echo-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Handle list tools request
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'echo',
                description: 'Simple echo tool that returns the input message',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Message to echo back',
                        },
                    },
                    required: ['message'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    console.error('=== Tool Call Request ===');
    console.error('Full request:', JSON.stringify(request, null, 2));
    console.error('=========================');
    if (request.params.name !== 'echo') {
        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool ${request.params.name} not found`);
    }
    // Try different ways to access arguments
    const params = request.params;
    console.error('params:', JSON.stringify(params, null, 2));
    console.error('params.arguments:', JSON.stringify(params.arguments, null, 2));
    // Get message from wherever it is
    const message = params.arguments?.message || params.message;
    if (!message) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'message is required');
    }
    return {
        content: [
            {
                type: 'text',
                text: `Echo: ${message}`,
            },
        ],
    };
});
// Create transport and connect
const transport = new stdio_js_1.StdioServerTransport();
server.connect(transport);
console.error('Test Echo MCP Server running on stdio');
