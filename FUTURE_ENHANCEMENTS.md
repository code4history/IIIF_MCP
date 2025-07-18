# Future Enhancements for IIIF MCP Server

This document outlines potential future improvements and architectural changes that could enhance the functionality of the IIIF MCP Server.

## Full Browser-Based Authentication Support via Local Proxy Server

### Overview
Implement a local proxy server architecture to enable complete IIIF-compliant browser-based authentication flow in CLI environments.

### Problem Statement
The current implementation has limitations due to the fundamental incompatibility between browser-based authentication (which relies on cookies and postMessage) and CLI/Node.js environments. The browser's authentication session cannot be shared with the Node.js process due to security isolation.

### Proposed Solution
Create a temporary local web server that acts as an intermediary between the browser authentication flow and the CLI application.

### Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   CLI App   │────▶│  Local Proxy    │────▶│   User Browser   │
│  (Node.js)  │◀────│  (Express.js)   │◀────│    (Chrome)      │
└─────────────┘     └─────────────────┘     └──────────────────┘
                             │                        │
                             │                        ▼
                             │               ┌──────────────────┐
                             └──────────────▶│  IIIF Auth       │
                                            │  Service         │
                                            └──────────────────┘
```

### Implementation Details

1. **Local Server Setup**
   - Start Express.js server on available port (e.g., `localhost:8888`)
   - Serve authentication orchestration pages
   - Handle postMessage relay between browser and CLI

2. **Authentication Flow**
   ```
   1. CLI starts local Express server
   2. CLI opens browser to http://localhost:8888/auth/start
   3. Local server serves page with:
      - iframe pointing to IIIF auth service
      - postMessage listener for token reception
   4. User completes authentication in iframe
   5. IIIF service sends token via postMessage
   6. Local page captures token and relays to Express backend
   7. Express notifies CLI process with token
   8. Local server shuts down
   ```

3. **Key Components**
   - `express`: Web server framework
   - `cors`: Handle cross-origin requests
   - `body-parser`: Parse POST requests
   - HTML/JS templates for authentication pages
   - Inter-process communication (IPC) or event system

### Benefits
- Full IIIF Authentication API compliance
- Seamless user experience
- Works with all IIIF-compliant authentication services
- No manual token copying required

### Drawbacks
- Increased complexity
- Additional dependencies (Express.js ecosystem)
- Requires available local port
- More code to maintain

### Alternative Approaches Considered
1. **Electron Shell**: Wrap CLI in Electron for native browser context
   - Pro: Full browser API access
   - Con: Heavy dependency, changes deployment model

2. **Browser Extension**: Create companion browser extension
   - Pro: Direct access to browser cookies
   - Con: Requires user to install extension

3. **Cookie File Import**: Have user export cookies from browser
   - Pro: No additional server needed
   - Con: Technical complexity for users

### Implementation Priority
**Medium-Low**: Current direct authentication and manual token methods provide adequate functionality for most use cases. This enhancement would primarily benefit:
- Users working with many different IIIF services
- Services that only support browser-based authentication
- Integration scenarios requiring automated authentication

### References
- [IIIF Authentication API 2.0](https://iiif.io/api/auth/2.0/)
- [Express.js Documentation](https://expressjs.com/)
- [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

---

## Contributing
If you're interested in implementing this enhancement, please:
1. Open an issue to discuss the approach
2. Consider creating a proof-of-concept
3. Ensure backward compatibility with existing authentication methods