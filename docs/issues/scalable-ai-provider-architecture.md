# Scalable AI Provider Architecture

## Problem Statement

Currently, Forge is **tightly coupled to Fal.ai** with hardcoded routes for each service. To scale and support multiple AI providers (PixVerse, Replicate, ElevenLabs, etc.), we need a **provider-agnostic architecture** that allows easy addition/removal of AI platforms.

## Current State Analysis

### Existing Structure (Needs Provider Abstraction)
```
/api/flux-lora/          → Fal.ai only (hardcoded)
/api/framepack/          → Fal.ai only (hardcoded)
/api/ideogram/           → Fal.ai only (hardcoded)
/api/kling-video/        → Fal.ai only (hardcoded)
/api/pika-scenes/        → Fal.ai only (hardcoded)
```

### Proposed Structure (Provider-Agnostic)
```
/api/fal/flux-lora       → Fal.ai via provider abstraction
/api/fal/framepack       → Fal.ai via provider abstraction  
/api/fal/ideogram        → Fal.ai via provider abstraction
/api/pixverse/text-to-video     → PixVerse provider
/api/replicate/flux-schnell     → Replicate provider
/api/elevenlabs/text-to-speech  → ElevenLabs provider
```

### Problems with Current Approach
- ❌ **Hardcoded provider coupling** - Logic baked into route files
- ❌ **Duplicate boilerplate** - Same auth/validation logic in every route  
- ❌ **No multi-provider support** - Can't use alternatives
- ❌ **Difficult to add providers** - Need to rewrite route logic
- ❌ **No fallback support** - If Fal.ai is down, everything breaks

## Proposed Architecture

### 1. Provider-Based Routing Structure
```typescript
// Provider-specific routes (clean & intuitive):
/api/fal/flux-lora       → Existing Fal.ai routes (keep working)
/api/fal/ideogram        → Existing Fal.ai routes  
/api/fal/framepack       → Existing Fal.ai routes
/api/pixverse/text-to-video     → New PixVerse routes
/api/pixverse/image-to-video    → New PixVerse routes
/api/replicate/flux-schnell     → New Replicate routes
/api/elevenlabs/text-to-speech  → New ElevenLabs routes

// Smart routing (optional - for convenience):
/api/smart/image?model=flux-lora&budget=lowest    → Auto-select best provider
/api/smart/video?style=anime&speed=fastest        → Auto-select best provider
```

### 2. Provider Abstraction Layer

#### Base Provider Interface
```typescript
// src/lib/providers/types.ts
export interface AIProvider {
  name: string
  supportedServices: AIServiceType[]
  authenticate(credentials: ProviderCredentials): Promise<boolean>
  generateImage(request: ImageGenerationRequest): Promise<AIResponse<ImageResult>>
  generateVideo(request: VideoGenerationRequest): Promise<AIResponse<VideoResult>>
  generateAudio?(request: AudioGenerationRequest): Promise<AIResponse<AudioResult>>
  enhanceImage?(request: ImageEnhancementRequest): Promise<AIResponse<ImageResult>>
}

export enum AIServiceType {
  IMAGE_GENERATION = 'image_generation',
  VIDEO_GENERATION = 'video_generation', 
  AUDIO_GENERATION = 'audio_generation',
  IMAGE_ENHANCEMENT = 'image_enhancement',
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech'
}

export interface AIResponse<T> {
  success: boolean
  data?: T
  error?: string
  provider: string
  model: string
  usage?: UsageMetrics
}
```

#### Provider Registry
```typescript
// src/lib/providers/registry.ts
export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map()
  
  register(provider: AIProvider): void
  getProvider(name: string): AIProvider | null
  getProvidersForService(service: AIServiceType): AIProvider[]
  getBestProvider(service: AIServiceType, criteria?: SelectionCriteria): AIProvider
}
```

### 3. Specific Provider Implementations

#### Fal.ai Provider
```typescript
// src/lib/providers/fal.ts
export class FalProvider implements AIProvider {
  name = 'fal'
  supportedServices = [
    AIServiceType.IMAGE_GENERATION,
    AIServiceType.VIDEO_GENERATION,
    AIServiceType.IMAGE_ENHANCEMENT
  ]

  async generateImage(request: ImageGenerationRequest): Promise<AIResponse<ImageResult>> {
    // Existing flux-lora, ideogram logic here
    const result = await fal.subscribe(this.getModelEndpoint(request.model), {
      input: this.transformRequest(request)
    })
    
    return {
      success: true,
      data: this.transformResponse(result),
      provider: 'fal',
      model: request.model
    }
  }
}
```

#### PixVerse Provider  
```typescript
// src/lib/providers/pixverse.ts
export class PixVerseProvider implements AIProvider {
  name = 'pixverse'
  supportedServices = [AIServiceType.VIDEO_GENERATION]

  async generateVideo(request: VideoGenerationRequest): Promise<AIResponse<VideoResult>> {
    // PixVerse API integration
    const response = await fetch('https://api.pixverse.ai/v1/video/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.transformRequest(request))
    })
    
    return {
      success: response.ok,
      data: this.transformResponse(await response.json()),
      provider: 'pixverse',
      model: request.model
    }
  }
}
```

#### Replicate Provider
```typescript
// src/lib/providers/replicate.ts
export class ReplicateProvider implements AIProvider {
  name = 'replicate'
  supportedServices = [
    AIServiceType.IMAGE_GENERATION,
    AIServiceType.VIDEO_GENERATION,
    AIServiceType.AUDIO_GENERATION
  ]

  async generateImage(request: ImageGenerationRequest): Promise<AIResponse<ImageResult>> {
    const model = this.getReplicateModel(request.model)
    const prediction = await replicate.predictions.create({
      version: model.version,
      input: this.transformRequest(request)
    })
    
    return {
      success: true,
      data: this.transformResponse(prediction),
      provider: 'replicate',
      model: request.model
    }
  }
}
```

#### ElevenLabs Provider
```typescript
// src/lib/providers/elevenlabs.ts
export class ElevenLabsProvider implements AIProvider {
  name = 'elevenlabs'
  supportedServices = [
    AIServiceType.TEXT_TO_SPEECH,
    AIServiceType.SPEECH_TO_TEXT,
    AIServiceType.AUDIO_GENERATION
  ]

  async generateAudio(request: AudioGenerationRequest): Promise<AIResponse<AudioResult>> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${request.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text: request.text,
        model_id: request.model,
        voice_settings: request.voiceSettings
      })
    })
    
    return {
      success: response.ok,
      data: this.transformResponse(response),
      provider: 'elevenlabs',
      model: request.model
    }
  }
}
```

### 4. Configuration-Driven Setup

#### Provider Configuration
```typescript
// src/config/providers.ts
export const PROVIDER_CONFIG = {
  fal: {
    name: 'Fal.ai',
    models: {
      'flux-lora': { service: 'image_generation', endpoint: 'fal-ai/flux-lora' },
      'flux-schnell': { service: 'image_generation', endpoint: 'fal-ai/flux/schnell' },
      'ideogram-v2': { service: 'image_generation', endpoint: 'fal-ai/ideogram/v2' },
      'kling-video': { service: 'video_generation', endpoint: 'fal-ai/kling-video/v1/standard/text-to-video' }
    },
    pricing: { image: 0.05, video: 0.25 },
    rateLimit: { rpm: 60, rph: 3600 }
  },
  
  pixverse: {
    name: 'PixVerse',
    models: {
      'text-to-video': { service: 'video_generation', endpoint: '/v1/video/generate' },
      'image-to-video': { service: 'video_generation', endpoint: '/v1/video/animate' }
    },
    pricing: { video: 0.15 },
    rateLimit: { rpm: 30, rph: 1800 }
  },
  
  replicate: {
    name: 'Replicate',
    models: {
      'flux-schnell': { service: 'image_generation', model: 'black-forest-labs/flux-schnell' },
      'stable-video': { service: 'video_generation', model: 'stability-ai/stable-video-diffusion' }
    },
    pricing: { image: 0.003, video: 0.01 },
    rateLimit: { rpm: 50, rph: 3000 }
  },
  
  elevenlabs: {
    name: 'ElevenLabs',
    models: {
      'multilingual-v2': { service: 'text_to_speech', model: 'eleven_multilingual_v2' },
      'turbo-v2': { service: 'text_to_speech', model: 'eleven_turbo_v2_5' }
    },
    pricing: { audio: 0.24 }, // per 1k characters
    rateLimit: { rpm: 120, rph: 7200 }
  }
} as const
```

### 5. Smart Provider Selection

#### Provider Selection Logic
```typescript
// src/lib/providers/selector.ts
export class ProviderSelector {
  
  selectProvider(
    service: AIServiceType,
    criteria: SelectionCriteria = {}
  ): AIProvider {
    const providers = this.registry.getProvidersForService(service)
    
    if (criteria.provider) {
      return this.registry.getProvider(criteria.provider)!
    }
    
    // Smart selection based on:
    return this.rankProviders(providers, {
      pricing: criteria.budget || 'balanced',
      speed: criteria.speed || 'normal', 
      quality: criteria.quality || 'high',
      availability: await this.checkAvailability(providers)
    })[0]
  }
  
  private async checkAvailability(providers: AIProvider[]): Promise<ProviderStatus[]> {
    // Check provider health/status
  }
}

export interface SelectionCriteria {
  provider?: string
  budget?: 'lowest' | 'balanced' | 'premium'
  speed?: 'fastest' | 'normal' | 'quality'
  quality?: 'draft' | 'normal' | 'high' | 'premium'
  fallback?: boolean
}
```

### 6. Provider-Specific API Routes

#### Provider Route Structure
```typescript
// src/app/api/[provider]/[endpoint]/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string, endpoint: string } }
) {
  try {
    const providerName = params.provider
    const endpoint = params.endpoint
    const body = await request.json()
    
    // Get provider from registry
    const provider = providerRegistry.getProvider(providerName)
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: `Provider '${providerName}' not found`,
        provider: providerName
      }, { status: 404 })
    }
    
    // Route to appropriate endpoint method
    let result: AIResponse<any>
    switch (endpoint) {
      case 'flux-lora':
      case 'ideogram':
      case 'flux-schnell':
        result = await provider.generateImage(body)
        break
      case 'text-to-video':
      case 'image-to-video':
      case 'framepack':
        result = await provider.generateVideo(body)
        break
      case 'text-to-speech':
      case 'voice-clone':
        result = await provider.generateAudio?.(body)
        break
      default:
        throw new Error(`Unsupported endpoint: ${endpoint}`)
    }
    
         // Save to database using unified MediaSaverService (provider-agnostic)
     // See: unified-media-saving-architecture.md
     await mediaSaverService.saveMedia(createSaveRequest(result, body, providerName, endpoint))
    
    return NextResponse.json(result)
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      provider: params.provider
    }, { status: 500 })
  }
}
```

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Create provider abstraction interfaces (`AIProvider`, `ProviderRegistry`)
- [ ] Implement provider registry system
- [ ] Create unified MediaSaverService (see [unified-media-saving-architecture.md](./unified-media-saving-architecture.md))
- [ ] Create Fal.ai provider (wrap existing `/api/flux-lora`, `/api/framepack` logic)
- [ ] Update 2-3 existing routes to use provider abstraction + unified saving (keep same URLs)

### Phase 2: New Provider Routes (Week 3-4)  
- [ ] Create `/api/pixverse/` routes (text-to-video, image-to-video)
- [ ] Create `/api/replicate/` routes (flux-schnell, stable-video)
- [ ] Create `/api/elevenlabs/` routes (text-to-speech, voice-clone)
- [ ] Implement provider-specific authentication and error handling

### Phase 3: Smart Routing (Week 5-6)
- [ ] Create optional `/api/smart/` routes for auto-provider selection
- [ ] Add provider selection logic (cost, speed, quality criteria)
- [ ] Implement provider health monitoring
- [ ] Add fallback/retry logic

### Phase 4: Advanced Features (Week 7-8)
- [ ] Provider performance analytics dashboard
- [ ] Cost tracking and optimization
- [ ] A/B testing framework
- [ ] Configuration management UI

## Benefits

### ✅ Easy Provider Management
- **Add new provider**: Create class implementing `AIProvider` interface
- **Remove provider**: Remove from registry, routes auto-adapt
- **Switch providers**: Change configuration, no code changes

### ✅ Resilience & Reliability
- **Automatic failover**: If one provider fails, switch to backup
- **Load balancing**: Distribute requests across providers
- **Health monitoring**: Proactive provider status checking

### ✅ Cost Optimization
- **Smart routing**: Choose cheapest provider for each request
- **Budget controls**: Enforce spending limits per provider
- **Usage analytics**: Track costs and optimize automatically

### ✅ Developer Experience
- **Consistent API**: Same interface regardless of provider
- **Type safety**: Full TypeScript support across all providers
- **Easy testing**: Mock providers for development

### ✅ Business Flexibility
- **Vendor independence**: Not locked into single platform
- **Feature completeness**: Use best provider for each use case
- **Scalability**: Add capacity by adding providers

## Future Extensibility

### Easy to Add New Providers
```typescript
// Adding a new provider requires:
1. Create provider class implementing AIProvider interface
2. Create provider-specific routes
3. Add to provider config - that's it!

// Example: Adding Stability AI
export class StabilityProvider implements AIProvider {
  name = 'stability'
  supportedServices = [AIServiceType.IMAGE_GENERATION]
  // Implementation...
}

// Create routes:
// src/app/api/stability/text-to-image/route.ts
// src/app/api/stability/image-to-image/route.ts

// Register
providerRegistry.register(new StabilityProvider())
```

### Easy to Add New Services
```typescript
// Adding new service types:
export enum AIServiceType {
  // Existing...
  THREE_D_GENERATION = '3d_generation',    // New!
  MUSIC_GENERATION = 'music_generation',   // New!
  CODE_GENERATION = 'code_generation'      // New!
}
```

## Migration Example

### Before: Hardcoded Fal.ai Logic
```typescript
// src/app/api/flux-lora/route.ts (current)
export async function POST(request: NextRequest) {
  // Hardcoded fal.ai logic
  const falKey = await getEnvVar('FAL_KEY', currentProjectId)
  fal.config({ credentials: falKey })
  
  const result = await fal.subscribe('fal-ai/flux-lora', { input })
  // ... save logic, response formatting
}
```

### After: Provider Abstraction (Same URL!)
```typescript
// src/app/api/flux-lora/route.ts (updated)
export async function POST(request: NextRequest) {
  // Use provider abstraction
  const provider = providerRegistry.getProvider('fal')
  const body = await request.json()
  
  const result = await provider.generateImage({
    model: 'flux-lora',
    ...body
  })
  
  return NextResponse.json(result) // Standardized response
}
```

### Benefits of This Approach
- ✅ **Existing URLs keep working** - No breaking changes
- ✅ **Easy to add new providers** - Just create new `/api/{provider}/` routes
- ✅ **Consistent patterns** - All providers use same abstraction
- ✅ **Gradual migration** - Can update routes one at a time

This architecture makes Forge **truly production-ready** for the multi-provider AI ecosystem. 