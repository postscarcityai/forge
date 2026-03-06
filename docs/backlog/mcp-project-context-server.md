# MCP Project Context Server Implementation

## Overview
Implement a Model Context Protocol (MCP) server that provides intelligent access to the current project's database context, enabling AI assistants to query and understand project-specific prompting configurations, visual styles, characters, scenes, and other contextual data.

## User Story
**As a user working with an AI assistant**
**I want the AI to understand my current project's context** 
**So that I can ask natural language questions about my project's visual style, prompting configuration, characters, and scenes without manually providing context each time.**

## Acceptance Criteria

### Core Functionality
- [x] MCP server integrates with existing SQLite database service
- [x] Server automatically detects and accesses the "current project" context
- [x] Provides natural language query interface for project data
- [x] Returns structured responses about project configuration
- [x] Starts automatically when `npm run dev:with-mcp` is executed

### Query Capabilities
- [x] **Visual Style Queries**: "What's the visual style of this project?"
- [x] **Master Prompt Access**: "Show me the master prompt for this project"
- [x] **Photographic Style**: "What photographic style does this project use?"
- [x] **Character Information**: "List the characters in this project"
- [x] **Scene Details**: "What scenes are configured for this project?"
- [x] **Prompting Configuration**: "What are the prompting settings?"
- [x] **Business Context**: "Tell me about the business overview for this project"

### Technical Requirements
- [x] Uses `@modelcontextprotocol/sdk` as dependency
- [x] Integrates with existing `DatabaseService`
- [x] STDIO transport for MCP standard compatibility
- [x] Project-scoped access (only current project data)
- [x] Structured JSON responses with relevant metadata

## Implementation Details

### File Structure ✅ COMPLETED
```
src/
  mcp/
    server.ts                 # Main MCP server setup
    handlers/
      projectHandler.ts       # Project data access
    types/
      mcpTypes.ts            # MCP-specific type definitions
    README.md                # Documentation
scripts/
  start-mcp-server.js        # Server startup script
  test-mcp-server.js         # Database connectivity test
```

### Integration Points ✅ COMPLETED
- **Database Service**: `src/services/databaseService.ts` ✅
- **Project Context**: `src/contexts/ProjectContext.tsx` ✅
- **Prompting System**: `src/services/PromptService.ts` ✅
- **Character/Scene Data**: Existing database schema ✅

### Implementation Notes

#### Current Project Detection ✅
- Uses `getCurrentProjectFromServerSync()` from server state utils
- Reads from `.forge-state.json` file maintained by frontend
- Fallback to 'default' project when no current project set
- Fully integrated with existing project switching mechanism

#### Available Tools ✅
1. **`get_visual_style`** - Visual style configuration
2. **`get_master_prompt`** - Master prompt with word count
3. **`get_photographic_style`** - Camera and lighting settings
4. **`get_characters`** - Character list with details
5. **`get_scenes`** - Scene configurations
6. **`get_prompting_config`** - Complete prompting setup
7. **`get_business_context`** - Business and brand information
8. **`get_project_summary`** - Project overview with statistics
9. **`query_project_context`** - Natural language query routing

#### Natural Language Processing ✅
- Intelligent query parsing based on keywords
- Routes to appropriate handlers automatically
- Supports variations like "visual style", "aesthetic", "mood", "color"
- Fallback to project summary for general queries

#### Error Handling ✅
- Structured error responses with details
- Graceful handling of missing projects
- Database connection error management
- Tool execution error recovery

### Package.json Scripts Added ✅
```bash
npm run dev:with-mcp     # Start Next.js + MCP server together
npm run mcp:server       # Start MCP server only
npm run mcp:test         # Test database connectivity
```

### Dependencies Added ✅
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `tsx` - TypeScript execution for server
- `concurrently` - Run multiple commands simultaneously

### Example Interactions ✅

#### Query: "What's the visual style of this project?"
**Response:**
```json
{
  "projectId": "amc",
  "projectName": "AMC Defense Law",
  "visualStyle": {
    "overallStyle": "Cinematic Neo-Noir x Graphic Novel Realism",
    "aestheticDirection": "Clean intentional framing with heavy shadows...",
    "mood": "Elite shadowed tactical serious urgent credible...",
    "colorPalette": "Charcoal black gunmetal gray steel blue federal navy..."
  }
}
```

#### Query: "List characters in this project"
**Response:**
```json
{
  "projectId": "amc",
  "characters": [
    {
      "id": "char_001",
      "name": "Sarah Mitchell",
      "age": 42,
      "gender": "female",
      "profession": "Defense Attorney",
      "physicalAppearance": "Professional woman in her 40s...",
      "outfits": [{"name": "Navy blue power suit"}],
      "defaultOutfit": 0
    }
  ],
  "totalCount": 1
}
```

## Benefits ✅ ACHIEVED
1. **Enhanced AI Collaboration**: AI assistants understand project context automatically
2. **Faster Workflow**: No need to manually provide project details in conversations
3. **Consistent Responses**: Standardized access to project configuration
4. **Future Extensibility**: Foundation for more advanced AI integrations

## Technical Considerations ✅ ADDRESSED
- **Current Project Detection**: ✅ Implemented via server state file
- **Performance**: ✅ Optimized database queries through existing service
- **Security**: ✅ Project-scoped access only, no cross-project data leakage
- **Error Handling**: ✅ Graceful failures with descriptive error messages

## Documentation ✅ COMPLETED
- [x] MCP server README with usage instructions
- [x] Updated main README with MCP section
- [x] Backlog story with implementation details
- [x] Test script for validating setup

---

**Status**: ✅ **COMPLETED**
**Priority**: High
**Effort**: Medium (2-3 days) - **ACTUAL: 1 day**
**Dependencies**: None (uses existing infrastructure)
**Risk Level**: Low (additive feature, no breaking changes)

## Next Steps for Users

1. **Test the implementation**: `npm run mcp:test`
2. **Start with MCP**: `npm run dev:with-mcp`
3. **Connect AI assistant** using MCP protocol
4. **Ask natural language questions** about your current project

The MCP server is now ready for use and provides comprehensive access to all project context data through a standardized, AI-friendly interface. 