// Unified media saving interfaces for provider-agnostic saving

export interface SaveMediaRequest {
  // Media info
  mediaUrl: string
  mediaType: 'image' | 'video' | 'audio'
  concept: string
  index?: number
  
  // Provider info
  provider: string  // 'fal', 'pixverse', 'replicate', 'elevenlabs'
  model: string     // 'flux-lora', 'text-to-video', etc.
  apiRoute: string  // '/api/fal/flux-lora'
  
  // Generation context
  prompt: string
  originalPrompt: string
  userPrompt?: string
  characterName?: string
  sceneName?: string
  
  // Generation parameters (provider-agnostic)
  generationParameters: Record<string, unknown>
  generationResults: Record<string, unknown>
  
  // Request metadata
  requestId: string
  projectId: string
  userAgent?: string
  ipAddress?: string
  
  // Raw provider data (preserved for debugging)
  apiResponse: Record<string, unknown>
  providerSpecificData?: Record<string, unknown>
  
  // Prompt analysis (if available)
  promptComponents?: PromptComponents
  promptMetadata?: PromptMetadata
}

export interface SaveMediaResult {
  success: boolean
  filePath?: string
  metadata?: StandardizedMetadata
  dbSaved?: boolean
  error?: string
}

export interface StandardizedMetadata {
  // Core fields (database-compatible)
  id: string
  filename: string
  title: string
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
  projectId: string
  fileSize: number
  mediaType: 'image' | 'video' | 'audio'
  dimensions?: { width: number, height: number }
  duration?: number  // For video/audio
  thumbnailPath?: string  // Video thumbnail path

  // Provider information
  provider: string
  model: string
  
  // Standardized generation metadata
  generation: {
    prompt: string
    originalPrompt: string
    userPrompt?: string
    characterName?: string
    sceneName?: string
    concept: string
    parameters: Record<string, unknown>
    results: Record<string, unknown>
  }
  
  // Request metadata
  request: {
    id: string
    timestamp: string
    userAgent?: string
    ipAddress?: string
    route: string
  }
  
  // Provider-specific data (preserved)
  providerData: {
    apiResponse: Record<string, unknown>
    [key: string]: unknown
  }
  
  // Prompt analysis (optional)
  promptAnalysis?: {
    components: PromptComponents
    metadata: PromptMetadata
  }
  
  // Legacy metadata field for backward compatibility
  metadata?: Record<string, unknown>
}

// Prompt component interfaces (for existing prompt analysis)
export interface PromptComponents {
  masterPrompt?: string
  userInput?: string
  characterDescription?: string
  sceneFoundation?: string
  technicalPhotography?: string
  visualStyleAesthetic?: string
  atmosphericEnvironmental?: string
  supportingElements?: string
  postProcessingEffects?: string
  triggerWords?: string
}

export interface PromptMetadata {
  charactersUsed?: string[]
  sceneUsed?: string
  wordCount?: number
  budgetCompliant?: boolean
}

// Helper functions for creating save requests
export function createImageSaveRequest(
  imageUrl: string,
  concept: string,
  prompt: string,
  originalPrompt: string,
  provider: string,
  model: string,
  apiRoute: string,
  requestId: string,
  projectId: string,
  generationParams: Record<string, unknown>,
  generationResults: Record<string, unknown>,
  apiResponse: Record<string, unknown>,
  options?: {
    userPrompt?: string
    characterName?: string
    sceneName?: string
    userAgent?: string
    ipAddress?: string
    index?: number
    promptComponents?: PromptComponents
    promptMetadata?: PromptMetadata
    providerSpecificData?: Record<string, unknown>
  }
): SaveMediaRequest {
  return {
    mediaUrl: imageUrl,
    mediaType: 'image',
    concept,
    index: options?.index,
    provider,
    model,
    apiRoute,
    prompt,
    originalPrompt,
    userPrompt: options?.userPrompt,
    characterName: options?.characterName,
    sceneName: options?.sceneName,
    generationParameters: generationParams,
    generationResults,
    requestId,
    projectId,
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
    apiResponse,
    providerSpecificData: options?.providerSpecificData,
    promptComponents: options?.promptComponents,
    promptMetadata: options?.promptMetadata
  }
}

export function createVideoSaveRequest(
  videoUrl: string,
  concept: string,
  prompt: string,
  originalPrompt: string,
  provider: string,
  model: string,
  apiRoute: string,
  requestId: string,
  projectId: string,
  generationParams: Record<string, unknown>,
  generationResults: Record<string, unknown>,
  apiResponse: Record<string, unknown>,
  options?: {
    userPrompt?: string
    characterName?: string
    sceneName?: string
    userAgent?: string
    ipAddress?: string
    promptComponents?: PromptComponents
    promptMetadata?: PromptMetadata
    providerSpecificData?: Record<string, unknown>
  }
): SaveMediaRequest {
  return {
    mediaUrl: videoUrl,
    mediaType: 'video',
    concept,
    provider,
    model,
    apiRoute,
    prompt,
    originalPrompt,
    userPrompt: options?.userPrompt,
    characterName: options?.characterName,
    sceneName: options?.sceneName,
    generationParameters: generationParams,
    generationResults,
    requestId,
    projectId,
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
    apiResponse,
    providerSpecificData: options?.providerSpecificData,
    promptComponents: options?.promptComponents,
    promptMetadata: options?.promptMetadata
  }
}

export function createAudioSaveRequest(
  audioUrl: string,
  concept: string,
  text: string,
  provider: string,
  model: string,
  apiRoute: string,
  requestId: string,
  projectId: string,
  generationParams: Record<string, unknown>,
  generationResults: Record<string, unknown>,
  apiResponse: Record<string, unknown>,
  options?: {
    userAgent?: string
    ipAddress?: string
    providerSpecificData?: Record<string, unknown>
  }
): SaveMediaRequest {
  return {
    mediaUrl: audioUrl,
    mediaType: 'audio',
    concept,
    provider,
    model,
    apiRoute,
    prompt: text,
    originalPrompt: text,
    generationParameters: generationParams,
    generationResults,
    requestId,
    projectId,
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
    apiResponse,
    providerSpecificData: options?.providerSpecificData
  }
} 