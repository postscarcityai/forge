# MCP Server Integration Issue with Cursor

**Status**: Blocked by TypeScript SDK Bug  
**Priority**: High  
**Created**: December 16, 2024  
**Last Updated**: December 16, 2024  

## Overview

This document outlines the comprehensive issue encountered while attempting to integrate the Forge MCP (Model Context Protocol) server with Cursor IDE. Despite successful server implementation and testing, Cursor consistently shows "0 tools enabled" due to a documented bug in the MCP TypeScript SDK.

## Objective

Implement local MCP server integration to provide Cursor with intelligent access to the Forge project database context through 21 specialized tools across 5 categories:

- **Core Project Data** (4 tools): Visual style, master prompts, photographic settings, business context
- **Character & Scene Management** (4 tools): Character queries, scene management, relationship mapping
- **Prompting & Creative Tools** (5 tools): Prompt generation, style queries, creative assistance
- **Technical & Asset Management** (4 tools): LoRA management, environment config, project settings
- **Media & Analytics** (3 tools): Timeline data, image metadata, performance tracking
- **Smart Query Router** (1 tool): Natural language query routing

## Implementation Details

### MCP Server Architecture
- **Location**: `src/mcp/server.ts` with handlers in `src/mcp/handlers/projectHandler.ts`
- **Database**: SQLite (`forge.db`) with automatic current project detection via `.forge-state.json`
- **Transport**: StdioServerTransport for local development compatibility
- **SDK**: `@modelcontextprotocol/sdk` v1.11+ TypeScript implementation

### Configuration Attempts
Multiple configuration approaches were tested:

1. **Project-specific**: `.cursor/mcp.json` with `npx tsx src/mcp/server.ts`
2. **Global installation**: Installed tsx globally, used direct tsx command  
3. **NPM script approach**: Used `npm run mcp:server` wrapper
4. **Global config integration**: Added to `~/.cursor/mcp.json` following user's existing pattern

### Testing & Validation
- ✅ **Manual testing**: `npm run mcp:test` confirms database connectivity
- ✅ **Tool exposure**: `npm run mcp:connection` shows all 21 tools properly registered
- ✅ **Server startup**: Comprehensive logging shows successful initialization
- ✅ **MCP Inspector**: Works perfectly with all tools functional
- ❌ **Cursor integration**: Consistently shows "0 tools enabled"

## Debugging Process

### Phase 1: Configuration Troubleshooting
- Tried multiple MCP config formats (stdio, command paths, npm scripts)
- Examined user's existing global config with 7 other MCP servers
- Added comprehensive timestamped logging throughout server startup

### Phase 2: Deep Protocol Analysis
Enhanced logging revealed the critical issue:
- ✅ Server starts successfully with all components initialized
- ✅ Database connects properly (`/Users/cjohndesign/dev/forge/forge.db`)
- ✅ All 21 tools registered with handlers configured
- ✅ StdioServerTransport initializes and declares "ready for connections"
- ❌ **No incoming MCP protocol messages received**
- ❌ **No JSON-RPC communication occurring**
- ❌ **StdioServerTransport not processing stdin input**

### Phase 3: External Research
Web search revealed this is a **documented bug affecting multiple users**.

## Root Cause: TypeScript SDK Bug

### Confirmed Issues
Research identified two critical GitHub issues in the official MCP TypeScript SDK:

1. **[Issue #509](https://github.com/modelcontextprotocol/typescript-sdk/issues/509)**: "Tool Handlers Not Invoked with StdioServerTransport on macOS"
2. **[Issue #554](https://github.com/modelcontextprotocol/typescript-sdk/issues/554)**: "StdioServerTransport failing to connect on Claude for Macos"

### Bug Characteristics
- Affects **macOS specifically** (our environment: Darwin arm64 24.4.0)
- **StdioServerTransport initialization succeeds** but message routing fails
- **Tool handlers never invoked** despite proper registration
- **Returns generic responses** instead of executing actual tool logic
- **Multiple Node.js versions affected** (we tested v20.18.3)

### Community Impact
Multiple users report identical symptoms:
- Servers work perfectly with MCP Inspector
- Fail silently in Cursor with "0 tools enabled"
- Affects various MCP server implementations, not just ours

## Current Status

### What Works
- ✅ Complete MCP server implementation with 21 functional tools
- ✅ Robust database integration with automatic project detection
- ✅ Comprehensive logging and debugging infrastructure  
- ✅ MCP Inspector compatibility for development/testing
- ✅ All supporting scripts and documentation

### What's Blocked
- ❌ Cursor IDE integration (primary objective)
- ❌ Production use for AI-assisted development workflow
- ❌ Real-world testing of AI context provision features

## Next Steps

### Immediate Actions
1. **Monitor SDK Issues**: Track progress on GitHub issues #509 and #554
2. **Consider Alternative Transport**: Evaluate SSE transport implementation for Cursor compatibility
3. **Python SDK Alternative**: Assess migration to Python MCP SDK (reportedly unaffected by this bug)

### Medium-term Options
1. **Cursor v0.51**: Wait for promised MCP logging improvements
2. **SDK Updates**: Test future TypeScript SDK releases
3. **Alternative MCP Clients**: Evaluate other MCP-compatible development environments

### Long-term Considerations
- Document lessons learned for future MCP integrations
- Consider contributing to MCP TypeScript SDK debugging efforts
- Maintain current implementation for future compatibility

## Files Modified/Created

### Core Implementation
- `src/mcp/server.ts` - Main MCP server with enhanced logging
- `src/mcp/handlers/projectHandler.ts` - Database integration handlers
- `src/mcp/types/mcpTypes.ts` - TypeScript type definitions
- `src/mcp/README.md` - Comprehensive usage documentation
- `src/mcp/TROUBLESHOOTING.md` - Debugging guide

### Scripts & Configuration
- `scripts/start-mcp-server.js` - Enhanced startup wrapper with logging
- `scripts/test-mcp-server.js` - Database connectivity validator
- `.cursor/mcp.json` - Project-specific MCP configuration
- `~/.cursor/mcp.json` - Global MCP configuration (updated)

### Testing & Debug Tools
- `scripts/test-mcp-logging.js` - Protocol message logging
- `scripts/test-mcp-protocol.js` - JSON-RPC communication testing
- `scripts/test-stdin.js` - Direct stdin/stdout testing

## Impact Assessment

This issue blocks a major development workflow enhancement that would provide AI assistants with intelligent, contextual access to project data. The blocked functionality represents significant value:

- **Development Efficiency**: AI context-aware assistance for coding tasks
- **Project Management**: Natural language queries against project database
- **Creative Workflow**: AI-assisted prompt generation and content creation
- **Technical Operations**: Automated project settings and asset management

The comprehensive implementation is ready for immediate use once the underlying SDK bug is resolved.

## References

- [MCP TypeScript SDK Issue #509](https://github.com/modelcontextprotocol/typescript-sdk/issues/509)
- [MCP TypeScript SDK Issue #554](https://github.com/modelcontextprotocol/typescript-sdk/issues/554)
- [MCP Official Debugging Guide](https://modelcontextprotocol.io/docs/tools/debugging)
- [Cursor Community Forum MCP Discussions](https://forum.cursor.com/t/mcp-logging-issue/57577) 