// Core provider interfaces for multi-provider AI architecture
export enum AIServiceType {
  IMAGE_GENERATION = 'image_generation',
  VIDEO_GENERATION = 'video_generation', 
  AUDIO_GENERATION = 'audio_generation',
  IMAGE_ENHANCEMENT = 'image_enhancement',
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech'
}

export interface ProviderCredentials {
  apiKey?: string
  apiSecret?: string
  baseUrl?: string
  [key: string]: unknown
}

export interface UsageMetrics {
  tokensUsed?: number
  creditsUsed?: number
  inferenceTime?: number
  requestId?: string
}

export interface AIResponse<T> {
  success: boolean
  data?: T
  error?: string
  provider: string
  model: string
  usage?: UsageMetrics
}

// Request interfaces for different AI services
export interface ImageGenerationRequest {
  prompt: string
  originalPrompt?: string
  userPrompt?: string
  characterName?: string
  sceneName?: string
  model: string
  imageSize?: string
  numInferenceSteps?: number
  guidanceScale?: number
  numImages?: number
  enableSafetyChecker?: boolean
  outputFormat?: string
  loras?: Array<{ path: string; scale: number }>
  seed?: number
  projectId?: string
  saveToDisk?: boolean
  concept?: string
  [key: string]: unknown
}

export interface VideoGenerationRequest {
  prompt: string
  originalPrompt?: string
  userPrompt?: string
  characterName?: string
  sceneName?: string
  model: string
  imageUrl?: string
  duration?: string | number
  aspectRatio?: string
  projectId?: string
  saveToDisk?: boolean
  concept?: string
  [key: string]: unknown
}

export interface AudioGenerationRequest {
  text: string
  model: string
  voiceId?: string
  voiceSettings?: {
    stability?: number
    similarityBoost?: number
    style?: number
    useSpeakerBoost?: boolean
  }
  outputFormat?: string
  languageCode?: string
  projectId?: string
  saveToDisk?: boolean
  concept?: string
  scriptTitle?: string
  [key: string]: unknown
}

// Result interfaces
export interface ImageResult {
  images: Array<{
    url: string
    width?: number
    height?: number
  }>
  seed?: number
  timings?: Record<string, number>
  hasNsfwConcepts?: boolean[]
  [key: string]: unknown
}

export interface VideoResult {
  video: {
    url: string
    duration?: number
    width?: number
    height?: number
  }
  seed?: number
  timings?: Record<string, number>
  [key: string]: unknown
}

export interface AudioResult {
  audio: {
    url: string
    duration?: number
  }
  [key: string]: unknown
}

// Core provider interface
export interface AIProvider {
  name: string
  supportedServices: AIServiceType[]
  
  // Authentication
  authenticate(credentials: ProviderCredentials): Promise<boolean>
  
  // Generation methods
  generateImage?(request: ImageGenerationRequest): Promise<AIResponse<ImageResult>>
  generateVideo?(request: VideoGenerationRequest): Promise<AIResponse<VideoResult>>
  generateAudio?(request: AudioGenerationRequest): Promise<AIResponse<AudioResult>>
  
  // Enhancement methods
  enhanceImage?(request: ImageGenerationRequest): Promise<AIResponse<ImageResult>>
  
  // Utility methods
  getModels(serviceType: AIServiceType): string[]
  isModelSupported(model: string, serviceType: AIServiceType): boolean
}

// Provider selection criteria
export interface SelectionCriteria {
  provider?: string
  budget?: 'lowest' | 'balanced' | 'premium'
  speed?: 'fastest' | 'normal' | 'quality'
  quality?: 'draft' | 'normal' | 'high' | 'premium'
  fallback?: boolean
}

// Provider status and health
export interface ProviderStatus {
  provider: string
  available: boolean
  responseTime?: number
  errorRate?: number
  lastChecked: Date
}

export interface ProviderConfig {
  name: string
  displayName: string
  models: Record<string, {
    service: AIServiceType
    endpoint?: string
    model?: string
    pricing?: number
  }>
  pricing: Record<string, number>
  rateLimit: {
    rpm: number  // requests per minute
    rph: number  // requests per hour
  }
  authentication: {
    type: 'api_key' | 'bearer_token' | 'oauth'
    keyName?: string
  }
} 