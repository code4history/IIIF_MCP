// Test MCP parameter handling
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const server = new Server(
  {
    name: 'test-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Add a test tool
server.addTool({
  name: 'test-tool',
  description: 'Test tool for parameter debugging',
  inputSchema: {
    type: 'object',
    properties: {
      testParam: {
        type: 'string',
        description: 'Test parameter'
      }
    },
    required: ['testParam']
  }
}, async (request) => {
  console.error('Full request:', JSON.stringify(request, null, 2));
  console.error('request.params:', JSON.stringify(request.params, null, 2));
  console.error('request.params.arguments:', JSON.stringify(request.params.arguments, null, 2));
  
  return {
    content: [{
      type: 'text',
      text: 'Test completed'
    }]
  };
});

const transport = new StdioServerTransport();
server.connect(transport);
console.error('Test MCP Server running...');