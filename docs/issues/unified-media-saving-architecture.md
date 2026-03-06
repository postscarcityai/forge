# Unified Media Saving Architecture

## Problem Statement

Currently, each AI provider route has **duplicate saving logic** with inconsistent metadata structures. The saving process is **tightly coupled** to specific providers and routes, making it difficult to maintain consistency across the multi-provider architecture.

## Current Saving Pattern Analysis

### Image Saving (via `saveImageWithMetadata`)

**Process Flow:**
1. Download image from provider URL
2. Generate filename: `{concept}-{timestamp}-{index}.jpg`
3. Save file to `public/images/`
4. Create comprehensive metadata object
5. Save metadata to `public/images/image-info/{filename}.meta.json`
6. Call `databaseService.saveImage()` to store in database

**Metadata Structure:**
```typescript
interface CurrentImageMetadata {
  // Core fields
  id: string
  filename: string
  title: string
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
  projectId: string
  fileSize: number
  dimensions?: { width: number, height: number }
  
  // Nested metadata object
  metadata: {
    // Generation parameters
    prompt: string
    original_prompt: string
    user_prompt?: string
    character_name?: string
    scene_name?: string
    model: string
    image_size: string
    num_inference_steps?: number
    guidance_scale: number
    loras: Array<{ path: string; scale: number }>
    concept: string
    
    // Generation results
    seed?: number
    inference_time?: number
    has_nsfw_concepts?: boolean[]
    
    // Provider-specific data
    api_response: Record<string, unknown>
    fal_image_url?: string
    source_image_url?: string
    
    // Request metadata
    user_agent?: string
    ip_address?: string
    request_id: string
    
    // Prompt analysis
    prompt_components?: PromptComponents
    prompt_metadata?: PromptMetadata
  }
}
```

### Video Saving (via multiple `saveVideoWithMetadata`)

**Current Duplication Problem:**
```typescript
// DUPLICATE FUNCTIONS ACROSS ROUTES:
// src/app/api/pixverse/route.ts - saveVideoWithMetadata()
// src/app/api/kling-video/route.ts - saveVideoWithMetadata()  
// src/app/api/framepack/route.ts - saveVideoWithMetadata()
// src/app/api/luma-dream/route.ts - saveVideoWithMetadata()
// src/app/api/wan-flf2v/route.ts - saveVideoWithMetadata()
// ... and more!
```

**Process Flow:**
1. Download video from provider URL
2. Generate filename: `{concept}-{timestamp}.mp4`
3. Save file to `public/videos/clips/`
4. Create metadata object (inconsistent structure per route)
5. Save metadata to various video-info directories
6. Call `databaseService.saveVideo()` to store in database

**Metadata Structure (Inconsistent):**
```typescript
interface CurrentVideoMetadata {
  // Core fields (consistent)
  id: string
  filename: string
  title: string
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
  projectId: string
  fileSize: number
  
  // Nested metadata (INCONSISTENT per provider)
  metadata: {
    model?: string
    generationParams?: Record<string, unknown>  // Different per provider
    api_response?: Record<string, unknown>      // Different per provider
    // ... provider-specific fields
  }
}
```

## Unified Saving Architecture Design

### 1. Provider-Agnostic Media Saver Service

```typescript
// src/services/mediaSaver.ts
export class MediaSaverService {
  
  /**
   * Save any media (image/video/audio) with standardized metadata
   */
  async saveMedia(request: SaveMediaRequest): Promise<SaveMediaResult> {
    try {
      // 1. Download media from URL
      const mediaBuffer = await this.downloadMedia(request.mediaUrl)
      
      // 2. Generate standardized filename
      const filename = this.generateFilename(request)
      
      // 3. Save media file
      const filePath = await this.saveMediaFile(mediaBuffer, filename, request.mediaType)
      
      // 4. Create standardized metadata
      const metadata = this.createStandardizedMetadata(request, filename, mediaBuffer.length)
      
      // 5. Save metadata file
      await this.saveMetadataFile(metadata, filename, request.mediaType)
      
      // 6. Save to database
      const dbSuccess = await this.saveToDatabasee(metadata, request.mediaType)
      
      return {
        success: true,
        filePath,
        metadata,
        dbSaved: dbSuccess
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  private async downloadMedia(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.statusText}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }
  
  private generateFilename(request: SaveMediaRequest): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeConcept = request.concept.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const indexSuffix = request.index !== undefined ? `-${request.index.toString().padStart(2, '0')}` : ''
    const extension = this.getExtension(request.mediaType)
    
    return `${safeConcept}-${timestamp}${indexSuffix}.${extension}`
  }
  
  private createStandardizedMetadata(request: SaveMediaRequest, filename: string, fileSize: number): StandardizedMetadata {
    return {
      // Core metadata (same for all providers)
      id: request.requestId,
      filename,
      title: request.concept,
      description: request.originalPrompt,
      tags: this.extractTags(request.originalPrompt),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: request.projectId,
      fileSize,
      mediaType: request.mediaType,
      
      // Provider information
      provider: request.provider,
      model: request.model,
      
      // Generation metadata (provider-agnostic)
      generation: {
        prompt: request.prompt,
        originalPrompt: request.originalPrompt,
        userPrompt: request.userPrompt,
        characterName: request.characterName,
        sceneName: request.sceneName,
        concept: request.concept,
        parameters: request.generationParameters,
        results: request.generationResults
      },
      
      // Request metadata
      request: {
        id: request.requestId,
        timestamp: new Date().toISOString(),
        userAgent: request.userAgent,
        ipAddress: request.ipAddress,
        route: request.apiRoute
      },
      
      // Provider-specific data (preserved but normalized)
      providerData: {
        apiResponse: request.apiResponse,
        ...request.providerSpecificData
      },
      
      // Prompt analysis (if available)
      promptAnalysis: request.promptComponents ? {
        components: request.promptComponents,
        metadata: request.promptMetadata
      } : undefined
    }
  }
}
```

### 2. Standardized Request Interface

```typescript
// src/types/mediaSaver.ts
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
}
```

### 3. Provider Integration Points

```typescript
// In each provider class
export class FalProvider implements AIProvider {
  
  async generateImage(request: ImageGenerationRequest): Promise<AIResponse<ImageResult>> {
    // ... generation logic ...
    
    // Use unified saving system
    if (request.saveToDisk) {
      const saveRequest: SaveMediaRequest = {
        mediaUrl: result.images[0].url,
        mediaType: 'image',
        concept: extractConceptFromPrompt(request.prompt),
        provider: 'fal',
        model: request.model,
        apiRoute: '/api/fal/flux-lora',
        
        // Generation context
        prompt: request.prompt,
        originalPrompt: request.originalPrompt,
        userPrompt: request.userPrompt,
        
        // Parameters (standardized)
        generationParameters: {
          imageSize: request.image_size,
          numInferenceSteps: request.num_inference_steps,
          guidanceScale: request.guidance_scale,
          loras: request.loras
        },
        
        // Results (standardized)
        generationResults: {
          seed: result.seed,
          inferenceTime: result.timings?.inference,
          hasNsfwConcepts: result.has_nsfw_concepts
        },
        
        // Request metadata
        requestId: `fal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId: request.projectId,
        
        // Raw provider data
        apiResponse: result,
        providerSpecificData: {
          falImageUrl: result.images[0].url,
          enableSafetyChecker: request.enable_safety_checker
        }
      }
      
      const saveResult = await mediaSaverService.saveMedia(saveRequest)
      if (!saveResult.success) {
        console.warn('Failed to save media:', saveResult.error)
      }
    }
    
    return { success: true, data: result, provider: 'fal', model: request.model }
  }
}
```

### 4. Migration Strategy

#### Phase 1: Create Unified Service (Week 1)
```bash
# Create unified media saver
touch src/services/mediaSaver.ts
touch src/types/mediaSaver.ts
touch src/utils/mediaUtils.ts

# Update existing image saving
- Wrap saveImageWithMetadata() to use new service internally
- Maintain backward compatibility
- Test with flux-lora route
```

#### Phase 2: Migrate Existing Routes (Week 2)
```bash
# Remove duplicate saveVideoWithMetadata functions
- Delete from src/app/api/pixverse/route.ts
- Delete from src/app/api/kling-video/route.ts  
- Delete from src/app/api/framepack/route.ts
- Update all routes to use mediaSaverService

# Maintain exact same metadata structure for backward compatibility
```

#### Phase 3: Provider Integration (Week 3)
```bash
# Integrate with provider abstraction
- Update FalProvider to use mediaSaverService
- Update new PixVerseProvider to use mediaSaverService
- Update new ReplicateProvider to use mediaSaverService
```

### 5. Benefits of Unified Architecture

#### ✅ Consistency
- **Same metadata structure** across all providers
- **Standardized file naming** and organization
- **Consistent database schema** usage

#### ✅ Maintainability  
- **Single saving implementation** instead of 8+ duplicates
- **Centralized file path management**
- **Unified error handling and logging**

#### ✅ Provider-Agnostic
- **Same interface** for all providers (Fal.ai, PixVerse, Replicate)
- **Preserve provider-specific data** while standardizing core fields
- **Easy to add new providers** without touching saving logic

#### ✅ Backward Compatibility
- **Existing metadata files** continue to work
- **Database schema** remains unchanged
- **Frontend code** continues to work without changes

#### ✅ Enhanced Features
- **Comprehensive metadata** for debugging and analytics
- **Provider performance tracking** built-in
- **Cost tracking** ready (provider + model + usage data)
- **Request tracing** for debugging

## Database Schema Optimization

### Current Schema (Maintained)
```sql
-- Images table (no changes needed)
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT,  -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'default',
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  metadata TEXT,  -- JSON object with all provider-specific data
  hidden INTEGER DEFAULT 0,
  timeline_order INTEGER
);

-- Videos table (no changes needed)
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT,  -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'default',
  file_size INTEGER,
  metadata TEXT,  -- JSON object with all provider-specific data
  hidden INTEGER DEFAULT 0,
  timeline_order INTEGER
);
```

### Enhanced Queries (Future Optimization)
```sql
-- Query by provider
SELECT * FROM images 
WHERE JSON_EXTRACT(metadata, '$.request.route') LIKE '/api/fal/%'
ORDER BY created_at DESC;

-- Query by model
SELECT * FROM images 
WHERE JSON_EXTRACT(metadata, '$.generation.model') = 'flux-lora'
ORDER BY created_at DESC;

-- Provider performance analytics
SELECT 
  JSON_EXTRACT(metadata, '$.provider') as provider,
  JSON_EXTRACT(metadata, '$.model') as model,
  AVG(JSON_EXTRACT(metadata, '$.generation.results.inferenceTime')) as avg_time,
  COUNT(*) as total_generations
FROM images 
WHERE created_at > date('now', '-30 days')
GROUP BY provider, model;
```

## Implementation Example

### Before: Duplicate Video Saving
```typescript
// src/app/api/pixverse/route.ts (current)
async function saveVideoWithMetadata(videoUrl: string, generationParams: any, projectId: string) {
  // 50+ lines of duplicate logic
  const filename = generateFilename(generationParams.concept)
  const videoBuffer = await fetch(videoUrl).then(r => r.arrayBuffer())
  fs.writeFileSync(path.join('public/videos/clips', filename), Buffer.from(videoBuffer))
  // ... metadata creation, file saving, database saving
}
```

### After: Unified Saving
```typescript
// src/app/api/pixverse/text-to-video/route.ts (new)
export async function POST(request: NextRequest) {
  const provider = providerRegistry.getProvider('pixverse')
  const result = await provider.generateVideo(body)
  
  // Unified saving (2 lines!)
  const saveRequest = createSaveRequest(result, body, 'pixverse', 'text-to-video')
  const saveResult = await mediaSaverService.saveMedia(saveRequest)
  
  return NextResponse.json(result)
}
```

This unified architecture **maintains all existing functionality** while providing a **scalable foundation** for the multi-provider ecosystem. 