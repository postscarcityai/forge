/**
 * Forge MCP Server
 * Model Context Protocol server for accessing current project database context
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  InitializeRequestSchema,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { ProjectHandler } from './handlers/projectHandler.js';

/**
 * Forge MCP Server
 * Provides intelligent access to current project database context
 */

class ForgeMCPServer {
  private server: Server;
  private projectHandler: ProjectHandler;

  constructor() {
    this.server = new Server(
      {
        name: 'forge-project-context',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.projectHandler = new ProjectHandler();
    console.error(`[${new Date().toISOString()}] 🏗️ Initializing MCP server components...`);
    this.setupToolHandlers();
    this.setupErrorHandler();
    console.error(`[${new Date().toISOString()}] ✅ MCP server components initialized`);
    
  }

  private setupToolHandlers() {
    console.error(`[${new Date().toISOString()}] 🔧 Setting up tool handlers...`);
    
    // CRITICAL: Handle initialization request first
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      console.error(`[${new Date().toISOString()}] 🚀 Initialize request received`);
      console.error(`[${new Date().toISOString()}] 🔍 Initialize params:`, JSON.stringify(request.params));
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: { listChanged: true },
          resources: {},
          prompts: {}
        },
        serverInfo: {
          name: "forge-project-context",
          version: "1.0.0"
        }
      };
    });
    
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      console.error(`[${new Date().toISOString()}] 📋 Tools list requested by client`);
      console.error(`[${new Date().toISOString()}] 🔍 Request details:`, JSON.stringify(request));
      const tools = [
          // ===== CORE PROJECT DATA TOOLS =====
          {
            name: 'get_project_summary',
            description: 'Get comprehensive overview of current project including stats, status, and basic info',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_project_settings',
            description: 'Get complete project settings (all sections: general, business, brand, prompting, loras, env)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_business_overview',
            description: 'Get business context including company info, mission, values, offerings, and contact details',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_brand_story',
            description: 'Get brand narrative, visual identity, messaging pillars, and content themes',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },

          // ===== CHARACTER & SCENE TOOLS =====
          {
            name: 'get_characters',
            description: 'Get all characters with full details including appearance, outfits, background, and active prompting fields',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_character_details',
            description: 'Get detailed information for a specific character including active fields and prompting configuration',
            inputSchema: {
              type: 'object',
              properties: {
                characterId: {
                  type: 'string',
                  description: 'ID of the character to retrieve',
                },
              },
              required: ['characterId'],
            },
          },
          {
            name: 'get_scenes',
            description: 'Get all scenes with settings, lighting, mood, props, atmosphere, and associated characters',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_scene_details',
            description: 'Get detailed information for a specific scene including character associations and active fields',
            inputSchema: {
              type: 'object',
              properties: {
                sceneId: {
                  type: 'string',
                  description: 'ID of the scene to retrieve',
                },
              },
              required: ['sceneId'],
            },
          },

          // ===== PROMPTING & CREATIVE TOOLS =====
          {
            name: 'get_master_prompt',
            description: 'Get master prompt configuration including prompt text and word budget settings',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_visual_style',
            description: 'Get visual styles, artistic references, cinematic references, and aesthetic configuration',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_photographic_style',
            description: 'Get camera settings, lighting, composition, and technical photography parameters',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_atmospheric_effects',
            description: 'Get weather, ambiance, mood, and environmental effects configuration',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_prompt_defaults',
            description: 'Get database-stored prompt defaults by category (master, technical, style, atmospheric, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Optional category to filter defaults (master, technical, style, atmospheric, postProcessing)',
                },
              },
            },
          },

          // ===== TECHNICAL & ASSET TOOLS =====
          {
            name: 'get_loras',
            description: 'Get LoRA library with trigger words, descriptions, and links to models',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_lora_settings',
            description: 'Get project-specific LoRA configurations including strength and enabled status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_timeline_config',
            description: 'Get timeline visibility and organization settings for current project',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_environment_variables',
            description: 'Get API keys and environment configuration for current project',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },

          // ===== MEDIA & ANALYTICS TOOLS =====
          {
            name: 'get_image_library',
            description: 'Get image metadata, tags, hidden status, and timeline organization',
            inputSchema: {
              type: 'object',
              properties: {
                hidden: {
                  type: 'boolean',
                  description: 'Filter by hidden status (true for hidden only, false for visible only)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of images to return',
                },
              },
            },
          },
          {
            name: 'get_video_library',
            description: 'Get video metadata, file info, and timeline organization',
            inputSchema: {
              type: 'object',
              properties: {
                hidden: {
                  type: 'boolean',
                  description: 'Filter by hidden status (true for hidden only, false for visible only)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of videos to return',
                },
              },
            },
          },
          {
            name: 'get_project_stats',
            description: 'Get project analytics including counts, activity metrics, and storage usage',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },

          // ===== SMART QUERY TOOL =====
          {
            name: 'query_project_context',
            description: 'Natural language interface that intelligently routes queries to appropriate project data tools',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language query about the project (e.g., "show me the characters", "what are the visual styles", "project summary")',
                },
              },
              required: ['query'],
            },
          },
        ];
        console.error(`[${new Date().toISOString()}] ✅ Returning ${tools.length} tools`);
        const response = { tools };
        console.error(`[${new Date().toISOString()}] 📤 Sending tools response:`, JSON.stringify(response).substring(0, 200) + '...');
        return response;
      });

    console.error(`[${new Date().toISOString()}] 🔧 Setting up tool call handler...`);
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.error(`[${new Date().toISOString()}] 🔧 Tool call requested: ${name}`);
      console.error(`[${new Date().toISOString()}] 📊 Tool arguments:`, JSON.stringify(args));

      try {
        switch (name) {
          // ===== CORE PROJECT DATA =====
          case 'get_project_summary':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getProjectSummary(), null, 2),
                },
              ],
            };

          case 'get_project_settings':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getProjectSettings(), null, 2),
                },
              ],
            };

          case 'get_business_overview':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getBusinessOverview(), null, 2),
                },
              ],
            };

          case 'get_brand_story':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getBrandStory(), null, 2),
                },
              ],
            };

          // ===== CHARACTER & SCENE DATA =====
          case 'get_characters':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getCharacters(), null, 2),
                },
              ],
            };

          case 'get_character_details':
            if (!args?.characterId) {
              throw new McpError(ErrorCode.InvalidParams, 'characterId is required');
            }
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getCharacterDetails(args.characterId as string), null, 2),
                },
              ],
            };

          case 'get_scenes':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getScenes(), null, 2),
                },
              ],
            };

          case 'get_scene_details':
            if (!args?.sceneId) {
              throw new McpError(ErrorCode.InvalidParams, 'sceneId is required');
            }
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getSceneDetails(args.sceneId as string), null, 2),
                },
              ],
            };

          // ===== PROMPTING & CREATIVE DATA =====
          case 'get_master_prompt':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getMasterPrompt(), null, 2),
                },
              ],
            };

          case 'get_visual_style':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getVisualStyle(), null, 2),
                },
              ],
            };

          case 'get_photographic_style':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getPhotographicStyle(), null, 2),
                },
              ],
            };

          case 'get_atmospheric_effects':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getAtmosphericEffects(), null, 2),
                },
              ],
            };

          case 'get_prompt_defaults':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getPromptDefaults(args?.category as string), null, 2),
                },
              ],
            };

          // ===== TECHNICAL & ASSET DATA =====
          case 'get_loras':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getLoRAs(), null, 2),
                },
              ],
            };

          case 'get_lora_settings':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getLoRASettings(), null, 2),
                },
              ],
            };

          case 'get_timeline_config':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getTimelineConfig(), null, 2),
                },
              ],
            };

          case 'get_environment_variables':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getEnvironmentVariables(), null, 2),
                },
              ],
            };

          // ===== MEDIA & ANALYTICS =====
          case 'get_image_library':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getImageLibrary({
                    hidden: args?.hidden as boolean,
                    limit: args?.limit as number,
                  }), null, 2),
                },
              ],
            };

          case 'get_video_library':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getVideoLibrary({
                    hidden: args?.hidden as boolean,
                    limit: args?.limit as number,
                  }), null, 2),
                },
              ],
            };

          case 'get_project_stats':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.projectHandler.getProjectStats(), null, 2),
                },
              ],
            };

          // ===== SMART QUERY =====
          case 'query_project_context':
            if (!args?.query) {
              throw new McpError(ErrorCode.InvalidParams, 'query is required');
            }
            const result = await this.projectHandler.queryProjectContext(args.query as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    query: args.query,
                    routing: result.routing,
                    result: result.result,
                  }, null, 2),
                },
              ],
            };

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Error executing tool ${name}:`, error);
        console.error(`[${new Date().toISOString()}] 🔍 Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private setupErrorHandler() {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };
  }

  async run() {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 🚀 Forge MCP Server starting...`);
    console.error(`[${timestamp}] 📋 Available tools: 21`);
    console.error(`[${timestamp}] 🔗 Connecting to project database...`);
    
    try {
      const transport = new StdioServerTransport();
      console.error(`[${new Date().toISOString()}] 🔌 Created stdio transport`);
      
      await this.server.connect(transport);
      console.error(`[${new Date().toISOString()}] 🔗 Transport connected successfully`);
      console.error(`[${new Date().toISOString()}] ✅ Server connected to transport`);
      console.error(`[${new Date().toISOString()}] 🎯 Server name: forge-project-context`);
      console.error(`[${new Date().toISOString()}] 📝 Server version: 1.0.0`);
      console.error(`[${new Date().toISOString()}] ✅ Forge MCP Server running and ready for connections`);
      
      // Add debugging for all server events  
      console.error(`[${new Date().toISOString()}] 🎧 Setting up request monitoring...`);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to start MCP server:`, error);
      throw error;
    }
  }
}

// Create and start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ForgeMCPServer();
  server.run().catch((error) => {
    console.error('❌ Failed to start Forge MCP Server:', error);
    process.exit(1);
  });
}

export { ForgeMCPServer }; 