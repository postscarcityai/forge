# Forge Model Context Protocol (MCP) Server

> 🎯 **Intelligent AI Assistant Access to Current Project Database Context**

The Forge MCP Server provides AI assistants with comprehensive, real-time access to your current project's database context through 21 specialized tools. It automatically detects your current project and provides natural language query routing for seamless integration.

## 🚀 Quick Start

### Start MCP Server with Next.js
```bash
npm run dev:with-mcp
```

### Start MCP Server Only
```bash
npm run mcp:server
```

### Test Database Connectivity
```bash
npm run mcp:test
```

## 🔧 Tools Overview (21 Total)

### 📊 Core Project Data Tools (4)
- **`get_project_summary`** - Comprehensive project overview with stats, status, and activity
- **`get_project_settings`** - Complete settings (general, business, brand, prompting, loras, env)
- **`get_business_overview`** - Company info, mission, values, offerings, contact details
- **`get_brand_story`** - Brand narrative, visual identity, messaging pillars, content themes

### 🎭 Character & Scene Tools (4)
- **`get_characters`** - All characters with appearance, outfits, background, active prompting fields
- **`get_character_details`** - Single character with detailed configuration and active fields
- **`get_scenes`** - All scenes with settings, lighting, mood, props, atmosphere, character associations
- **`get_scene_details`** - Single scene with character associations and active fields

### 🎨 Prompting & Creative Tools (5)
- **`get_master_prompt`** - Master prompt configuration with word budget settings
- **`get_visual_style`** - Visual styles, artistic references, cinematic references
- **`get_photographic_style`** - Camera settings, lighting, composition, technical parameters
- **`get_atmospheric_effects`** - Weather, ambiance, mood, environmental effects
- **`get_prompt_defaults`** - Database-stored prompt defaults by category

### 🔧 Technical & Asset Tools (4)
- **`get_loras`** - LoRA library with trigger words, descriptions, links
- **`get_lora_settings`** - Project-specific LoRA configurations (strength, enabled status)
- **`get_timeline_config`** - Timeline visibility and organization settings
- **`get_environment_variables`** - API keys and environment configuration

### 📈 Media & Analytics Tools (3)
- **`get_image_library`** - Image metadata, tags, hidden status, timeline order
- **`get_video_library`** - Video metadata, file info, timeline organization
- **`get_project_stats`** - Analytics including counts, activity metrics, storage usage

### 🔍 Smart Query Tool (1)
- **`query_project_context`** - Natural language interface with intelligent routing

## 💡 Usage Examples

### AI Assistant Queries

#### Project Overview
```
"What's the current project about?"
→ Uses: get_project_summary
→ Returns: PostScarcity AI project with 45 images, 3 characters, 3 scenes
```

#### Character Information
```
"Show me all the characters"
→ Uses: get_characters
→ Returns: Ernest Hemingway (writer, active), Isaac Newton (scientist, active)
```

#### Prompting Configuration
```
"What's the master prompt and visual style?"
→ Uses: get_master_prompt, get_visual_style
→ Returns: 10-word master prompt + artistic references
```

#### Natural Language Routing
```
"Tell me about the brand story and business context"
→ Routes to: get_brand_story + get_business_overview
→ Returns: Complete brand narrative and company information
```

### Direct Tool Usage

#### Get Character with Active Fields
```json
{
  "tool": "get_character_details",
  "params": { "characterId": "char_hemingway_001" }
}
```

#### Get Scene with Character Associations
```json
{
  "tool": "get_scene_details", 
  "params": { "sceneId": "scene_cafe_vienna_001" }
}
```

#### Get Image Library (Limited)
```json
{
  "tool": "get_image_library",
  "params": { "limit": 10, "hidden": false }
}
```

## 🎯 Key Features

### Automatic Project Detection
- Reads current project from `.forge-state.json`
- Automatically scopes all queries to current project
- Seamless project switching support

### Active Field Intelligence
- Characters have active/inactive prompting fields
- Scenes have configurable active elements
- Returns only relevant prompting data

### Natural Language Query Routing
- Intelligent keyword matching with confidence scoring
- Routes queries to appropriate specialized tools
- Fallback to project summary for general queries

### Rich Database Context
- Full character details (appearance, outfits, background, profession)
- Complete scene information (setting, lighting, mood, props, atmosphere)
- Comprehensive prompting configuration (master prompt, styles, technical settings)
- Business context (company info, brand story, values, contact)

## 🏗️ Architecture

### Database Integration
- Uses existing `DatabaseService` singleton
- Accesses all Forge database tables:
  - `projects` - Project metadata and settings
  - `characters` - Character database with active fields
  - `scenes` - Scene configurations with active elements
  - `images` - Image library with metadata
  - `videos` - Video library with file info
  - `loras` - LoRA model library
  - `prompt_defaults` - Database-driven prompt defaults

### Project Context Management
- Integrates with existing server state system
- Respects project switching in main application
- Maintains consistency with UI state

### Error Handling
- Graceful error handling with descriptive messages
- Fallback behaviors for missing data
- Proper MCP error code integration

## 🔌 Integration

### Cursor/Claude Integration
Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "forge-project-context": {
      "command": "npx",
      "args": ["tsx", "/path/to/forge/src/mcp/server.ts"],
      "cwd": "/path/to/forge"
    }
  }
}
```

### Claude Desktop Integration
Add to Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "forge-project-context": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/forge/src/mcp/server.ts"],
      "cwd": "/absolute/path/to/forge"
    }
  }
}
```

## 📚 Tool Definitions

### Core Project Tools

#### `get_project_summary`
Returns comprehensive project overview including:
- Project metadata (name, description, status)
- Statistics (image count, video count, character count, scene count)
- Last activity timestamp
- Project creation and update times

#### `get_project_settings`
Returns complete project settings object containing:
- General settings (name, slug, color, status)
- Business overview (company info, mission, values)
- Brand story (narrative, visual identity, messaging)
- Image prompting (master prompt, styles, technical settings)
- LoRA configurations
- Environment variables

### Character & Scene Tools

#### `get_characters`
Returns array of all project characters with:
- Basic info (name, age, gender, race, height)
- Physical appearance (hair color, eye color, description)
- Outfits array with default outfit index
- Background and profession
- Case details and scene of crime (if applicable)
- Active field flags for prompting

#### `get_scenes` 
Returns array of all project scenes with:
- Scene metadata (name, description)
- Settings (location, time of day, lighting, mood)
- Camera and composition (angle, props, atmosphere)
- Associated character IDs and populated character objects
- Active field flags for prompting

### Prompting Tools

#### `get_master_prompt`
Returns master prompt configuration:
- Master prompt text
- Word budget settings
- Current word count

#### `get_visual_style`
Returns visual style configuration:
- Overall style and aesthetic direction
- Color palette and temperature settings
- Surface textures and material properties
- Visual effects and artistic references
- Cinematic references

#### `get_photographic_style`
Returns technical photography settings:
- Camera settings (angle, shot type, lens, focal length)
- Lighting configuration (style, direction, quality, shadows)
- Technical parameters (aperture, shutter speed, ISO)
- Time of day and environmental context

## 🧪 Testing

### Database Connectivity Test
```bash
npm run mcp:test
```

Validates:
- ✅ Current project detection from server state
- ✅ Database connection and schema
- ✅ Character and scene data access
- ✅ Project settings retrieval

### Manual Server Test
```bash
# Terminal 1: Start server
npm run mcp:server

# Terminal 2: Test with MCP client
# (Connect from Claude Desktop or other MCP client)
```

## 🔧 Development

### Adding New Tools
1. Define response types in `src/mcp/types/mcpTypes.ts`
2. Implement handler methods in `src/mcp/handlers/projectHandler.ts`
3. Register tool in `src/mcp/server.ts` with schema and handler
4. Add to natural language routing in `routeQuery` method
5. Update documentation

### Database Schema Access
The MCP server accesses these database tables:
- **projects** - Project metadata and JSON settings
- **characters** - Character database with active field flags
- **scenes** - Scene configurations with active elements
- **images** - Image library with metadata and timeline order
- **videos** - Video library with file information
- **loras** - LoRA model library with trigger words
- **prompt_defaults** - Database-driven prompt defaults
- **timeline_configs** - Timeline visibility settings
- **user_settings** - Global user preferences

### Active Field System
Characters and scenes use active field flags to control prompting:
- Database stores `field_name_active` boolean columns
- Handler extracts and returns as `activeFields` object
- AI assistants can use this to generate context-aware prompts

## 🎉 Success Indicators

When working correctly, you should see:
- ✅ **Server starts**: `Forge MCP Server running and ready for connections`
- ✅ **Tools available**: `Available tools: 21`
- ✅ **Database connected**: SQLite database connected message
- ✅ **Project detected**: Current project ID logged during queries
- ✅ **Data returns**: JSON responses with actual project data

## 🛠️ Troubleshooting

### Common Issues

**Server won't start**
- Check that you're in the Forge project directory
- Ensure dependencies are installed: `npm install`
- Verify database file exists: `ls -la forge.db`

**No current project**
- Check `.forge-state.json` exists with valid project ID
- Ensure project exists in database
- Try switching projects in the main Forge app

**Empty data responses**
- Verify project has characters/scenes/settings configured
- Check database integrity with: `npm run mcp:test`
- Confirm you're querying the correct project

**MCP client can't connect**
- Verify absolute paths in MCP configuration
- Check that `tsx` is available: `npx tsx --version`
- Ensure working directory is set correctly

### Debug Mode
Enable verbose logging by setting environment variable:
```bash
DEBUG=mcp:* npm run mcp:server
```

This will show detailed MCP protocol messages and database queries for debugging.

---

## 📈 Roadmap

Future enhancements planned:
- [ ] Real-time project change notifications
- [ ] Cached response optimization
- [ ] Advanced query parsing with intent recognition
- [ ] Project comparison tools
- [ ] Bulk data export capabilities
- [ ] Integration with AI image generation workflows

The Forge MCP Server bridges the gap between your creative project database and AI assistants, enabling intelligent, context-aware conversations about your work. 