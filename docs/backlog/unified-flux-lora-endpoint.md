# Unified Flux/LoRA Endpoint - Single API for 1-N Image Generation

## 🎯 **User Story**

**As a developer**, I want a single Flux/LoRA endpoint that can generate 1-N images with unique parameters for each image, so that I can use one consistent API regardless of whether I'm generating a single image or multiple images.

## 📝 **Problem Statement**

**Current State:**
- Two separate endpoints: `/api/flux-lora` (single) and `/api/flux-lora/batch-generate` (multiple)
- Different request/response formats between single and batch
- Duplicate logic and maintenance overhead
- Inconsistent prompt building approaches
- API consumers need to know which endpoint to use

**Pain Points:**
- Developers must choose between two different APIs
- Single image endpoint uses inferior prompt building logic
- Code duplication across endpoints (~400+ lines)
- Different error handling and response formats
- Testing complexity with multiple API surfaces

## ✅ **Recommended Solution**

### **Single Unified Endpoint: `/api/flux-lora`**

**Request Format (Always Array-Based):**
```typescript
interface UnifiedFluxRequest {
  images: ImageGenerationRequest[];  // Array of 1-N images
  save_to_disk?: boolean;           // Default: true
  project_id?: string;              // Optional override (uses server state)
}

interface ImageGenerationRequest {
  concept: string;                  // Required: Image concept/name
  prompt: string;                   // Required: Base prompt
  
  // Programmatic prompt building
  character_name?: string;          
  character_outfit?: string | number;
  scene_name?: string;
  use_random_database_selection?: boolean;
  
  // Generation parameters (optional - uses project defaults)
  num_inference_steps?: number;     // Default: 28
  guidance_scale?: number;          // Default: 3.5
  seed?: number;                    // Optional: for reproducible results
  
  // Metadata
  filename?: string;                // Optional: custom filename
}
```

**Response Format (Consistent for 1-N):**
```typescript
interface UnifiedFluxResponse {
  success: boolean;
  images: GeneratedImage[];         // Always array, even for single
  project_id: string;
  generation_metadata: {
    total_images: number;
    successful: number;
    failed: number;
    total_time_ms: number;
  };
  errors?: ImageError[];            // Only if some images failed
}

interface GeneratedImage {
  concept: string;
  status: 'success' | 'failed';
  image?: {
    url: string;                    // Fal CDN URL
    local_path?: string;            // Local saved path (if save_to_disk)
    width: number;
    height: number;
  };
  generation_data?: {
    seed: number;
    prompt: string;                 // Final assembled prompt
    word_count: number;
    inference_time_ms: number;
  };
  error?: string;                   // Only if this specific image failed
}
```

### **Usage Examples**

**Single Image Generation:**
```typescript
const response = await fetch('/api/flux-lora', {
  method: 'POST',
  body: JSON.stringify({
    images: [{
      concept: 'detective-portrait',
      prompt: 'professional headshot',
      character_name: 'detective-sarah',
      scene_name: 'police-station'
    }]
  })
});
```

**Multiple Images with Unique Parameters:**
```typescript
const response = await fetch('/api/flux-lora', {
  method: 'POST', 
  body: JSON.stringify({
    images: [
      {
        concept: 'sarah-office',
        prompt: 'working at desk',
        character_name: 'detective-sarah',
        character_outfit: 'business-suit',
        scene_name: 'police-station'
      },
      {
        concept: 'marcus-street',
        prompt: 'walking investigation',
        character_name: 'detective-marcus', 
        character_outfit: 2,
        scene_name: 'crime-scene'
      },
      {
        concept: 'random-scene',
        prompt: 'dramatic interrogation',
        use_random_database_selection: true
      }
    ],
    save_to_disk: true
  })
});
```

**Mixed Generation Approaches:**
```typescript
const response = await fetch('/api/flux-lora', {
  method: 'POST',
  body: JSON.stringify({
    images: [
      {
        concept: 'structured-prompt',
        prompt: 'intense conversation',
        character_name: 'detective-sarah',
        scene_name: 'interrogation-room'
      },
      {
        concept: 'simple-prompt', 
        prompt: 'police car chase scene, cinematic lighting, dramatic action'
        // No character/scene - uses simple concatenation
      },
      {
        concept: 'random-database',
        prompt: 'mysterious evidence discovery',
        use_random_database_selection: true
      }
    ]
  })
});
```

## 🔧 **Implementation Strategy**

### **Phase 1: Unified Endpoint Logic**
1. **Keep `/api/flux-lora` endpoint** (backward compatibility)
2. **Transform single requests to batch format internally**
3. **Use existing batch generation logic as foundation**
4. **Return consistent array-based responses**

### **Phase 2: Backward Compatibility Layer**
```typescript
// Internal transformation for legacy single-image requests
function transformLegacyRequest(legacyBody: any): UnifiedFluxRequest {
  return {
    images: [{
      concept: legacyBody.concept || 'single-generation',
      prompt: legacyBody.prompt,
      character_name: legacyBody.character_name,
      scene_name: legacyBody.scene_name,
      character_outfit: legacyBody.character_outfit_index,
      num_inference_steps: legacyBody.num_inference_steps,
      guidance_scale: legacyBody.guidance_scale,
      seed: legacyBody.seed
    }],
    save_to_disk: legacyBody.save_to_disk
  };
}
```

### **Phase 3: Response Compatibility**
```typescript
// Transform unified response for legacy consumers
function transformToLegacyResponse(unifiedResponse: UnifiedFluxResponse) {
  const firstImage = unifiedResponse.images[0];
  return {
    success: unifiedResponse.success,
    image: firstImage?.image,
    generation_data: firstImage?.generation_data,
    error: firstImage?.error,
    // Include new metadata for enhanced clients
    unified_response: unifiedResponse
  };
}
```

## 📊 **Benefits**

### **Developer Experience**
- **Single API to learn** instead of two different endpoints
- **Consistent request/response format** regardless of image count
- **Flexible generation approaches** (structured, simple, random) in one request
- **Built-in batch capabilities** without API complexity

### **Maintenance Benefits**
- **Eliminate duplicate code** (~400+ lines of duplication)
- **Single prompt building pipeline** (always uses `buildStructuredPrompt()`)
- **Unified error handling and logging**
- **Single test suite** instead of multiple API surfaces

### **Performance Benefits**
- **Parallel generation** for multiple images
- **Single project config fetch** for entire batch
- **Optimized database queries** across all images
- **Reduced API overhead** for multi-image workflows

## 🧪 **Testing Strategy**

### **Backward Compatibility Tests**
```typescript
// Ensure legacy single-image requests still work
test('legacy single image request format', async () => {
  const legacyRequest = {
    prompt: 'test prompt',
    character_name: 'detective-sarah'
  };
  
  const response = await POST(legacyRequest);
  expect(response.image).toBeDefined();
  expect(response.unified_response.images).toHaveLength(1);
});
```

### **New Format Tests**
```typescript
// Test new unified format
test('unified multi-image request', async () => {
  const unifiedRequest = {
    images: [
      { concept: 'test1', prompt: 'prompt1' },
      { concept: 'test2', prompt: 'prompt2' }
    ]
  };
  
  const response = await POST(unifiedRequest);
  expect(response.images).toHaveLength(2);
  expect(response.generation_metadata.total_images).toBe(2);
});
```

## 🚀 **Migration Path**

### **Phase 1: Internal Consolidation** (No API changes)
- Implement unified logic behind existing endpoints
- Ensure 100% backward compatibility
- Deploy and validate in production

### **Phase 2: Deprecated Batch Endpoint** (Optional)
- Mark `/api/flux-lora/batch-generate` as deprecated
- Add deprecation headers and documentation
- Continue supporting for 6 months

### **Phase 3: Enhanced Documentation**
- Update API documentation to show unified approach
- Provide migration examples for batch endpoint users
- Highlight new capabilities (mixed generation modes)

## 📋 **Acceptance Criteria**

### **Functional Requirements**
- [ ] Single endpoint handles 1-N image generation
- [ ] Maintains 100% backward compatibility with existing single-image API
- [ ] Supports all current generation modes (structured, simple, random)
- [ ] Consistent response format regardless of image count
- [ ] Proper error handling for partial batch failures

### **Technical Requirements**
- [ ] Uses `buildStructuredPrompt()` for all structured generation
- [ ] Eliminates code duplication between endpoints
- [ ] Maintains same performance characteristics
- [ ] Comprehensive test coverage for all request formats
- [ ] Proper logging and monitoring for unified endpoint

### **Documentation Requirements**
- [ ] Updated API documentation with examples
- [ ] Migration guide for batch endpoint users
- [ ] Clear examples of 1-N image generation patterns
- [ ] Error handling documentation for partial failures

This unified endpoint will provide a much cleaner, more maintainable API surface while supporting all current use cases and enabling new mixed-generation workflows. 