/**
 * MCP Server Type Definitions
 * Types specific to the Model Context Protocol server for project data access
 */

import { Project, Character, Scene, ImagePrompting } from '@/contexts/ProjectContext';

// Core project context response types
export interface ProjectContextResponse {
  projectId: string;
  projectName: string;
  lastUpdated?: string;
}

export interface VisualStyleResponse extends ProjectContextResponse {
  visualStyle: {
    overallStyle?: string;
    aestheticDirection?: string;
    mood?: string;
    colorPalette?: string;
    colorTemperature?: string;
    saturation?: string;
    contrast?: string;
  };
}

export interface MasterPromptResponse extends ProjectContextResponse {
  masterPrompt: string;
  wordCount: number;
  isEmpty: boolean;
}

export interface PhotographicStyleResponse extends ProjectContextResponse {
  photographicStyle: {
    cameraAngle?: string;
    shotType?: string;
    lensType?: string;
    focalLength?: string;
    cameraMovement?: string;
    lightingStyle?: string;
    lightDirection?: string;
    lightQuality?: string;
    shadowStyle?: string;
    timeOfDay?: string;
  };
}

export interface CharacterListResponse extends ProjectContextResponse {
  characters: Array<{
    id: string;
    name: string;
    age: number;
    gender: string;
    race: string;
    height: string;
    hairColor: string;
    eyeColor: string;
    physicalAppearance: string;
    background: string;
    profession?: string;
    outfits: Array<{ name: string }>;
    defaultOutfit: number;
    tags?: string[];
  }>;
  totalCount: number;
}

export interface SceneListResponse extends ProjectContextResponse {
  scenes: Array<{
    id: string;
    name: string;
    setting: string;
    timeOfDay: string;
    lighting: string;
    mood: string;
    cameraAngle: string;
    description: string;
    props?: string[];
    atmosphere?: string;
    characterIds: string[];
    tags?: string[];
  }>;
  totalCount: number;
}

export interface PromptingConfigResponse extends ProjectContextResponse {
  promptingConfig: {
    masterPrompt?: string;
    technicalSettings: {
      cameraAngle?: string;
      shotType?: string;
      lensType?: string;
      focalLength?: string;
      lightingStyle?: string;
      lightDirection?: string;
      lightQuality?: string;
      shadowStyle?: string;
    };
    visualStyle: {
      overallStyle?: string;
      aestheticDirection?: string;
      mood?: string;
      colorPalette?: string;
      colorTemperature?: string;
      saturation?: string;
      contrast?: string;
    };
    atmospheric: {
      timeOfDay?: string;
      atmosphericEffects?: string[];
    };
    creative: {
      artisticReferences?: string[];
      cinematicReferences?: string[];
      promptingStyles?: string[];
    };
    technical: {
      aspectRatio?: string;
      resolution?: string;
      frameRate?: string;
    };
  };
}

export interface BusinessContextResponse extends ProjectContextResponse {
  businessContext: {
    overview?: {
      companyName?: string;
      industry?: string;
      targetAudience?: string;
      uniqueValueProposition?: string;
      missionStatement?: string;
      visionStatement?: string;
      coreValues?: string[];
      businessModel?: string;
      keyServices?: string[];
      competitiveAdvantages?: string[];
    };
    brandStory?: {
      brandPersonality?: string;
      brandVoice?: string;
      brandTone?: string;
      brandValues?: string[];
      brandPromise?: string;
      brandDifferentiators?: string[];
      targetEmotions?: string[];
      brandArchetype?: string;
      keyMessages?: string[];
      storytellingThemes?: string[];
    };
  };
}

export interface ProjectSummaryResponse extends ProjectContextResponse {
  summary: {
    description?: string;
    status: 'active' | 'archived' | 'completed';
    imageCount?: number;
    lastActivity?: string;
    characterCount: number;
    sceneCount: number;
    hasVisualStyle: boolean;
    hasMasterPrompt: boolean;
    hasBusinessContext: boolean;
    hasBrandStory: boolean;
  };
}

// MCP Types for Forge Project Context Server
export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: string;
  updatedAt: string;
  stats: {
    imageCount: number;
    videoCount: number;
    characterCount: number;
    sceneCount: number;
    loraCount: number;
  };
  lastActivity?: string;
}

export interface BusinessOverviewResponse {
  companyDescription?: string;
  missionStatement?: string;
  visionStatement?: string;
  coreValues?: string[];
  targetAudience?: string;
  offerings?: string[];
  keyDifferentiators?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
      instagram?: string;
    };
  };
  keyMetrics?: {
    revenue?: string;
    customers?: string;
    marketShare?: string;
    growthRate?: string;
  };
  industryContext?: string;
  geographicScope?: string;
}

export interface BrandStoryResponse {
  brandNarrative?: string;
  brandPersonality?: string;
  voiceAndTone?: string;
  messagingPillars?: string[];
  visualIdentity?: {
    primaryColors?: string[];
    secondaryColors?: string[];
    typography?: string[];
    imageryStyle?: string;
    logoGuidelines?: string;
  };
  contentThemes?: string[];
  brandGuidelines?: string;
  storytellingApproach?: string;
  audienceConnection?: string;
}

export interface ImagePromptingResponse {
  masterPrompt?: string;
  wordBudget?: number;
  technicalSettings?: {
    aspectRatio?: string;
    resolution?: string;
    focalLength?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
    whiteBalance?: string;
  };
  visualStyles?: {
    overallStyle?: string;
    colorPalette?: string[];
    surfaceTextures?: string[];
    materialProperties?: string[];
    visualEffects?: string[];
    artisticReferences?: string[];
    cinematicReferences?: string[];
  };
  atmosphericEffects?: {
    lightingConditions?: string;
    weatherConditions?: string;
    atmosphericEffects?: string[];
    environmentalContext?: string;
    timeOfDay?: string;
    seasonalContext?: string;
  };
  postProcessing?: {
    colorGrading?: string;
    filters?: string[];
    postProcessing?: string[];
    videoTransitions?: string[];
  };
}

export interface CharacterResponse {
  id: string;
  name: string;
  projectId: string;
  age: number;
  gender: string;
  race: string;
  height: string;
  hairColor: string;
  eyeColor: string;
  physicalAppearance: string;
  outfits: Array<{ name: string }>;
  defaultOutfit: number;
  background: string;
  profession?: string;
  caseDetails?: string;
  sceneOfCrime?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Active flags for prompting
  activeFields?: {
    age?: boolean;
    gender?: boolean;
    race?: boolean;
    height?: boolean;
    hairColor?: boolean;
    eyeColor?: boolean;
    physicalAppearance?: boolean;
    profession?: boolean;
    background?: boolean;
    caseDetails?: boolean;
    sceneOfCrime?: boolean;
    outfits?: boolean;
  };
}

export interface SceneResponse {
  id: string;
  name: string;
  projectId: string;
  setting: string;
  timeOfDay: string;
  lighting: string;
  mood: string;
  cameraAngle: string;
  description: string;
  props?: string[];
  atmosphere?: string;
  characterIds: string[];
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Active flags for prompting
  activeFields?: {
    setting?: boolean;
    timeOfDay?: boolean;
    lighting?: boolean;
    mood?: boolean;
    cameraAngle?: boolean;
    props?: boolean;
    atmosphere?: boolean;
  };
  // Associated characters for context
  characters?: CharacterResponse[];
}

export interface LoRAResponse {
  id: string;
  name: string;
  link?: string;
  triggerWords?: string[];
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoRASettingsResponse {
  lora1?: {
    enabled?: boolean;
    name?: string;
    triggerWords?: string[];
    strength?: number;
    modelPath?: string;
  };
  lora2?: {
    enabled?: boolean;
    name?: string;
    triggerWords?: string[];
    strength?: number;
    modelPath?: string;
  };
}

export interface ImageMetadataResponse {
  id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: Record<string, unknown>;
  hidden: boolean;
  timelineOrder?: number;
}

export interface VideoMetadataResponse {
  id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fileSize: number;
  metadata?: Record<string, unknown>;
  hidden: boolean;
  timelineOrder?: number;
}

export interface TimelineConfigResponse {
  projectId: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PromptDefaultResponse {
  category: string;
  fieldName: string;
  defaultValue: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStatsResponse {
  images: number;
  videos: number;
  characters: number;
  scenes: number;
  projects: number;
  loras: number;
  cacheEntries: number;
  lastActivity?: string;
  totalFileSize?: number;
  hiddenItems?: {
    images: number;
    videos: number;
  };
}

export interface EnvironmentVariablesResponse {
  [key: string]: string;
}

// Query routing for natural language interface
export interface QueryRouteResult {
  matchedTool: string;
  confidence: number;
  reasoning: string;
  suggestedParams?: Record<string, unknown>;
}

// Error response interface
export interface MCPErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// Tool request/response types
export interface MCPToolRequest {
  query: string;
  context?: 'visual-style' | 'master-prompt' | 'photographic-style' | 'characters' | 'scenes' | 'prompting-config' | 'business-context' | 'project-summary';
}

export interface MCPToolResponse {
  success: boolean;
  data?: ProjectContextResponse | MCPErrorResponse;
  message?: string;
} 