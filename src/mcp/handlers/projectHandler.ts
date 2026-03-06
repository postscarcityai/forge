/**
 * Project Data Handler for MCP Server
 * Provides access to current project data from the SQLite database
 */

import { databaseService } from '@/services/databaseService';
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils';
import {
  ProjectSummary,
  BusinessOverviewResponse,
  BrandStoryResponse,
  ImagePromptingResponse,
  CharacterResponse,
  SceneResponse,
  LoRAResponse,
  LoRASettingsResponse,
  ImageMetadataResponse,
  VideoMetadataResponse,
  TimelineConfigResponse,
  PromptDefaultResponse,
  ProjectStatsResponse,
  EnvironmentVariablesResponse,
  QueryRouteResult,
  MCPErrorResponse
} from '../types/mcpTypes';

export class ProjectHandler {
  constructor() {
    // Database service is a singleton instance, not a class to instantiate
  }

  private async getCurrentProject(): Promise<string> {
    try {
      const projectId = getCurrentProjectFromServerSync();
      if (!projectId) {
        throw new Error('No current project set');
      }
      return projectId;
    } catch (error) {
      console.error('Error getting current project:', error);
      throw new Error('Failed to determine current project');
    }
  }

  // ===== CORE PROJECT DATA =====

  async getProjectSummary(): Promise<ProjectSummary> {
    const projectId = await this.getCurrentProject();
    const project = await databaseService.getProject(projectId);
    
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const stats = await databaseService.getStats();
    const characters = await databaseService.getCharacters(projectId);
    const scenes = await databaseService.getScenes(projectId);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: (project.settings as any)?.general?.status || 'active',
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      stats: {
        imageCount: stats.images,
        videoCount: stats.videos,
        characterCount: characters.length,
        sceneCount: scenes.length,
        loraCount: stats.loras
      },
      lastActivity: project.updated_at
    };
  }

  async getProjectSettings(): Promise<Record<string, unknown>> {
    const projectId = await this.getCurrentProject();
    const project = await databaseService.getProject(projectId);
    
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    return project.settings || {};
  }

  async getBusinessOverview(): Promise<BusinessOverviewResponse> {
    const settings = await this.getProjectSettings();
    return (settings as any)?.businessOverview || {};
  }

  async getBrandStory(): Promise<BrandStoryResponse> {
    const settings = await this.getProjectSettings();
    return (settings as any)?.brandStory || {};
  }

  async getImagePrompting(): Promise<ImagePromptingResponse> {
    const settings = await this.getProjectSettings();
    return (settings as any)?.imagePrompting || {};
  }

  async getEnvironmentVariables(): Promise<EnvironmentVariablesResponse> {
    const settings = await this.getProjectSettings();
    return (settings as any)?.environmentVariables || {};
  }

  // ===== CHARACTER & SCENE DATA =====

  async getCharacters(): Promise<CharacterResponse[]> {
    const projectId = await this.getCurrentProject();
    const characters = await databaseService.getCharacters(projectId);
    
    return characters.map(char => ({
      ...char,
      // Add active fields if they exist in database
      activeFields: this.extractActiveFields(char, 'character')
    }));
  }

  async getCharacterDetails(characterId: string): Promise<CharacterResponse> {
    const character = await databaseService.getCharacter(characterId);
    
    if (!character) {
      throw new Error(`Character not found: ${characterId}`);
    }

    return {
      ...character,
      activeFields: this.extractActiveFields(character, 'character')
    };
  }

  async getScenes(): Promise<SceneResponse[]> {
    const projectId = await this.getCurrentProject();
    const scenes = await databaseService.getScenes(projectId);
    
    // Enrich scenes with character data
    const enrichedScenes = await Promise.all(
      scenes.map(async scene => {
        const characters = await Promise.all(
          scene.characterIds.map(id => databaseService.getCharacter(id))
        );
        
        return {
          ...scene,
          activeFields: this.extractActiveFields(scene, 'scene'),
          characters: characters.filter(Boolean) as CharacterResponse[]
        };
      })
    );

    return enrichedScenes;
  }

  async getSceneDetails(sceneId: string): Promise<SceneResponse> {
    const scene = await databaseService.getScene(sceneId);
    
    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    // Get associated characters
    const characters = await Promise.all(
      scene.characterIds.map(id => databaseService.getCharacter(id))
    );

    return {
      ...scene,
      activeFields: this.extractActiveFields(scene, 'scene'),
      characters: characters.filter(Boolean) as CharacterResponse[]
    };
  }

  // ===== PROMPTING & CREATIVE DATA =====

  async getMasterPrompt(): Promise<{ masterPrompt?: string; wordBudget?: number }> {
    const imagePrompting = await this.getImagePrompting();
    return {
      masterPrompt: imagePrompting.masterPrompt,
      wordBudget: imagePrompting.wordBudget
    };
  }

  async getVisualStyle(): Promise<ImagePromptingResponse['visualStyles']> {
    const imagePrompting = await this.getImagePrompting();
    return imagePrompting.visualStyles || {};
  }

  async getPhotographicStyle(): Promise<ImagePromptingResponse['technicalSettings']> {
    const imagePrompting = await this.getImagePrompting();
    return imagePrompting.technicalSettings || {};
  }

  async getAtmosphericEffects(): Promise<ImagePromptingResponse['atmosphericEffects']> {
    const imagePrompting = await this.getImagePrompting();
    return imagePrompting.atmosphericEffects || {};
  }

  async getPromptDefaults(category?: string): Promise<PromptDefaultResponse[]> {
    if (category) {
      const defaults = await databaseService.getPromptDefaults(category);
      return Object.entries(defaults).map(([fieldName, defaultValue]) => ({
        category,
        fieldName,
        defaultValue,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }

    // Get all categories - this would need a new database method
    const categories = ['master', 'technical', 'style', 'atmospheric', 'postProcessing'];
    const allDefaults: PromptDefaultResponse[] = [];
    
    for (const cat of categories) {
      const catDefaults = await this.getPromptDefaults(cat);
      allDefaults.push(...catDefaults);
    }
    
    return allDefaults;
  }

  // ===== TECHNICAL & ASSET DATA =====

  async getLoRAs(): Promise<LoRAResponse[]> {
    return await databaseService.getLoRAs();
  }

  async getLoRASettings(): Promise<LoRASettingsResponse> {
    const settings = await this.getProjectSettings();
    return (settings as any)?.loras || {};
  }

  async getTimelineConfig(): Promise<TimelineConfigResponse | null> {
    const projectId = await this.getCurrentProject();
    const config = await databaseService.getTimelineConfig(projectId);
    
    if (!config) {
      return null;
    }

    return {
      projectId,
      config,
      createdAt: new Date().toISOString(), // Timeline configs don't store timestamps
      updatedAt: new Date().toISOString()
    };
  }

  // ===== MEDIA & ANALYTICS =====

  async getImageLibrary(options?: { hidden?: boolean; limit?: number }): Promise<ImageMetadataResponse[]> {
    const projectId = await this.getCurrentProject();
    const images = await databaseService.getImages(projectId);
    
    let filteredImages = images;
    
    if (options?.hidden !== undefined) {
      // Would need to add this filter to database service
    }
    
    if (options?.limit) {
      filteredImages = filteredImages.slice(0, options.limit);
    }

    return filteredImages as ImageMetadataResponse[];
  }

  async getVideoLibrary(options?: { hidden?: boolean; limit?: number }): Promise<VideoMetadataResponse[]> {
    const projectId = await this.getCurrentProject();
    const videos = await databaseService.getVideos(projectId);
    
    let filteredVideos = videos;
    
    if (options?.limit) {
      filteredVideos = filteredVideos.slice(0, options.limit);
    }

    return filteredVideos as VideoMetadataResponse[];
  }

  async getProjectStats(): Promise<ProjectStatsResponse> {
    const stats = await databaseService.getStats();
    const projectId = await this.getCurrentProject();
    const project = await databaseService.getProject(projectId);
    
    return {
      ...stats,
      lastActivity: project?.updated_at,
      // These would need additional database queries for more detailed stats
      totalFileSize: undefined,
      hiddenItems: {
        images: 0,
        videos: 0
      }
    };
  }

  // ===== SMART QUERY ROUTING =====

  async queryProjectContext(query: string): Promise<{
    result: unknown;
    routing: QueryRouteResult;
  }> {
    const routing = this.routeQuery(query);
    let result: unknown;

    try {
      switch (routing.matchedTool) {
        case 'get_project_summary':
          result = await this.getProjectSummary();
          break;
        case 'get_business_overview':
          result = await this.getBusinessOverview();
          break;
        case 'get_brand_story':
          result = await this.getBrandStory();
          break;
        case 'get_characters':
          result = await this.getCharacters();
          break;
        case 'get_scenes':
          result = await this.getScenes();
          break;
        case 'get_master_prompt':
          result = await this.getMasterPrompt();
          break;
        case 'get_visual_style':
          result = await this.getVisualStyle();
          break;
        case 'get_photographic_style':
          result = await this.getPhotographicStyle();
          break;
        case 'get_loras':
          result = await this.getLoRAs();
          break;
        case 'get_image_library':
          result = await this.getImageLibrary();
          break;
        case 'get_project_stats':
          result = await this.getProjectStats();
          break;
        default:
          result = await this.getProjectSummary(); // Fallback
      }
    } catch (error) {
      throw new Error(`Failed to execute ${routing.matchedTool}: ${error}`);
    }

    return { result, routing };
  }

  // ===== HELPER METHODS =====

  private extractActiveFields(item: any, type: 'character' | 'scene'): Record<string, boolean> {
    const activeFields: Record<string, boolean> = {};
    
    if (type === 'character') {
      const fields = [
        'age', 'gender', 'race', 'height', 'hairColor', 'eyeColor',
        'physicalAppearance', 'profession', 'background', 'caseDetails',
        'sceneOfCrime', 'outfits'
      ];
      
      fields.forEach(field => {
        const activeField = `${field}_active`;
        if (activeField in item) {
          activeFields[field] = Boolean(item[activeField]);
        }
      });
    } else if (type === 'scene') {
      const fields = [
        'setting', 'timeOfDay', 'lighting', 'mood', 'cameraAngle',
        'props', 'atmosphere'
      ];
      
      fields.forEach(field => {
        const activeField = `${field}_active`;
        if (activeField in item) {
          activeFields[field] = Boolean(item[activeField]);
        }
      });
    }
    
    return activeFields;
  }

  private routeQuery(query: string): QueryRouteResult {
    const lowerQuery = query.toLowerCase();
    
    // Define routing rules with confidence scoring
    const routes = [
      {
        tool: 'get_project_summary',
        keywords: ['project', 'summary', 'overview', 'general', 'info', 'details'],
        confidence: 0.8
      },
      {
        tool: 'get_characters',
        keywords: ['character', 'characters', 'people', 'person', 'cast'],
        confidence: 0.9
      },
      {
        tool: 'get_scenes',
        keywords: ['scene', 'scenes', 'setting', 'location', 'environment'],
        confidence: 0.9
      },
      {
        tool: 'get_business_overview',
        keywords: ['business', 'company', 'mission', 'values', 'contact'],
        confidence: 0.8
      },
      {
        tool: 'get_brand_story',
        keywords: ['brand', 'story', 'narrative', 'identity', 'messaging'],
        confidence: 0.8
      },
      {
        tool: 'get_master_prompt',
        keywords: ['master prompt', 'prompt', 'prompting', 'word budget'],
        confidence: 0.8
      },
      {
        tool: 'get_visual_style',
        keywords: ['visual', 'style', 'artistic', 'aesthetic', 'look'],
        confidence: 0.7
      },
      {
        tool: 'get_photographic_style',
        keywords: ['photo', 'camera', 'technical', 'aperture', 'lighting'],
        confidence: 0.7
      },
      {
        tool: 'get_loras',
        keywords: ['lora', 'loras', 'model', 'trigger words'],
        confidence: 0.9
      },
      {
        tool: 'get_image_library',
        keywords: ['image', 'images', 'gallery', 'photos', 'media'],
        confidence: 0.8
      },
      {
        tool: 'get_project_stats',
        keywords: ['stats', 'statistics', 'count', 'analytics', 'metrics'],
        confidence: 0.8
      }
    ];

    // Calculate match scores
    let bestMatch = {
      tool: 'get_project_summary',
      confidence: 0.3,
      reasoning: 'Default fallback to project summary'
    };

    for (const route of routes) {
      const matches = route.keywords.filter(keyword => 
        lowerQuery.includes(keyword)
      ).length;
      
      if (matches > 0) {
        const confidence = (matches / route.keywords.length) * route.confidence;
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            tool: route.tool,
            confidence,
            reasoning: `Matched ${matches} keywords: ${route.keywords.filter(k => lowerQuery.includes(k)).join(', ')}`
          };
        }
      }
    }

    return {
      matchedTool: bestMatch.tool,
      confidence: bestMatch.confidence,
      reasoning: bestMatch.reasoning
    };
  }
} 