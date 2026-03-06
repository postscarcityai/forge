**Needs refinement**

# Deprecate Legacy Flux/LoRA Single Image Endpoint

## 🎯 **User Story**

**As a developer**, I want to eliminate the inferior single image generation endpoint in favor of the unified batch-capable endpoint, so that all image generation uses the best prompt building system and maintains consistency.

## 📝 **Problem Statement**

**Current State:**
- Two endpoints with different capabilities:
  - `/api/flux-lora` (single image, inferior prompt building)
  - `/api/flux-lora/batch-generate` (multiple images, superior prompt building)
- Basic endpoint uses manual component assembly instead of `buildStructuredPrompt()`
- Inconsistent prompt quality between single and batch generation
- Duplicate maintenance burden across similar endpoints

**Specific Problems with Legacy Endpoint:**
```typescript
// Legacy endpoint - manual component building
const {
  buildMasterPromptComponent,
  buildUserInputComponent,
  // ... import 10+ functions
} = await import('@/utils/promptComponents');

// Manual async/sync mixing
const masterPromptPromise = buildMasterPromptComponent(project);
const userInputPromise = buildUserInputComponent(user_prompt || prompt);
// ... manual orchestration of 10 components

// Custom assemblePrompt call
const assembledResult = await assemblePrompt(
  masterPromptPromise,
  userInputPromise,
  // ... 8 more parameters
);
```

vs.

```typescript
// Modern batch endpoint - clean structured approach
const structuredResult = await buildStructuredPrompt({
  userPrompt: imageRequest.prompt,
  characterName: usedCharacter,
  characterOutfit: usedOutfit,
  sceneName: usedScene,
  projectId
});

enhancedPrompt = structuredResult.prompt;
// Includes word budget enforcement, proper error handling, etc.
```

## ✅ **Recommended Solution**

### **Phase 1: Internal Migration (No API Changes)**

**Convert legacy endpoint to use batch logic internally:**

```typescript
// src/app/api/flux-lora/route.ts (new implementation)
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Transform single request to batch format
  const batchRequest = {
    images: [{
      concept: body.concept || 'single-generation',
      prompt: body.prompt,
      character_name: body.character_name,
      scene_name: body.scene_name,
      character_outfit: body.character_outfit_index,
      use_random_database_selection: body.use_random_database_selection,
      filename: body.filename,
      // Map other single-image parameters
      num_inference_steps: body.num_inference_steps,
      guidance_scale: body.guidance_scale,
      seed: body.seed
    }],
    save_to_disk: body.save_to_disk,
    master_prompt: body.master_prompt
  };
  
  // Use the superior batch generation logic
  const batchResponse = await handleBatchGeneration(batchRequest, request);
  
  // Transform response back to single-image format for backward compatibility
  return transformBatchToSingleResponse(batchResponse);
}

function transformBatchToSingleResponse(batchResponse: BatchResponse): SingleResponse {
  const firstImage = batchResponse.images[0];
  
  return {
    success: batchResponse.success,
    image: firstImage?.image,
    generation_data: firstImage?.generation_data,
    local_path: firstImage?.local_path,
    error: firstImage?.error,
    
    // Include enhanced metadata for clients that can use it
    _unified_response: batchResponse, // Prefixed to avoid conflicts
    _generation_metadata: {
      prompt_word_count: firstImage?.generation_data?.word_count,
      prompt_compliance: firstImage?.generation_data?.word_budget_compliance,
      used_structured_prompt: !!firstImage?.generation_data?.structured_components
    }
  };
}
```

### **Phase 2: Shared Generation Logic**

**Extract common batch logic to shared module:**

```typescript
// src/app/api/utils/image-generation.ts
export async function handleBatchGeneration(
  request: BatchGenerationRequest,
  httpRequest: NextRequest
): Promise<BatchResponse> {
  // All the current batch-generate logic moves here
  // Both endpoints import and use this function
}

export async function generateSingleImage(
  imageRequest: BatchImageRequest,
  config: ProjectConfig,
  requestMetadata: RequestMetadata
): Promise<GeneratedImage> {
  // Current generateSingleImage logic from batch endpoint
}
```

### **Phase 3: Enhanced Single Endpoint Response**

**Add new capabilities without breaking existing clients:**

```typescript
interface EnhancedSingleResponse {
  // Existing fields (backward compatible)
  success: boolean;
  image?: GeneratedImage;
  generation_data?: GenerationData;
  local_path?: string;
  error?: string;
  
  // New enhanced fields (prefixed to avoid conflicts)
  _enhanced: {
    word_budget: {
      total_words: number;
      compliance: boolean;
      component_breakdown: ComponentReport[];
    };
    structured_prompt: {
      used: boolean;
      components?: PromptComponents;
      final_prompt?: string;
    };
    generation_metadata: {
      project_id: string;
      character_used?: string;
      scene_used?: string;
      random_selection_used?: boolean;
    };
  };
}
```

## 🔧 **Implementation Strategy**

### **Phase 1: Internal Unification (Week 1)**
1. **Move batch logic to shared module** (`src/app/api/utils/image-generation.ts`)
2. **Update batch endpoint** to use shared module
3. **Update single endpoint** to use shared module internally
4. **Maintain exact same API contracts** (100% backward compatible)
5. **Deploy and validate** - no client changes required

### **Phase 2: Enhanced Capabilities (Week 2)**
1. **Add enhanced response fields** (prefixed to avoid conflicts)
2. **Include structured prompt metadata** in responses
3. **Add word budget compliance information**
4. **Update documentation** with new capabilities

### **Phase 3: Deprecation Notice (Month 2)**
1. **Add deprecation headers** to batch endpoint responses:
   ```typescript
   response.headers.set('X-Deprecated-Endpoint', 'true');
   response.headers.set('X-Deprecation-Date', '2024-06-01');
   response.headers.set('X-Replacement-Endpoint', '/api/flux-lora');
   ```
2. **Update API documentation** with migration guidance
3. **Add console warnings** in development mode

### **Phase 4: Complete Migration (Month 3+)**
1. **Monitor usage** of batch endpoint vs unified endpoint
2. **Provide migration support** for any remaining batch users
3. **Eventually remove** `/api/flux-lora/batch-generate` when usage drops to zero

## 📊 **Benefits**

### **Code Quality**
- **Single prompt building system** (always uses `buildStructuredPrompt()`)
- **Eliminate ~150 lines** of inferior prompt building logic
- **Consistent error handling** across all image generation
- **Better word budget enforcement** for all images

### **User Experience**
- **Better prompts for single images** (same quality as batch)
- **Enhanced metadata** available for all generations
- **Consistent behavior** regardless of image count
- **Future-proof API** that can evolve without breaking changes

### **Development**
- **Single codebase to maintain** for image generation logic
- **Easier testing** with unified generation pipeline
- **Better debugging** with consistent logging and error handling
- **Simplified deployment** with fewer API endpoints

## 🧪 **Testing Strategy**

### **Backward Compatibility Tests**
```typescript
describe('Legacy Single Endpoint Compatibility', () => {
  test('maintains exact response format for existing clients', async () => {
    const legacyRequest = {
      prompt: 'test prompt',
      character_name: 'detective-sarah',
      num_inference_steps: 30
    };
    
    const response = await POST(legacyRequest);
    
    // Must have all original fields
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('image');
    expect(response).toHaveProperty('generation_data');
    
    // Should not break if client ignores new fields
    expect(response._enhanced).toBeDefined(); // New field
    expect(response._unified_response).toBeDefined(); // New field
  });

  test('handles all original parameter combinations', async () => {
    const testCases = [
      { prompt: 'basic prompt' },
      { prompt: 'with character', character_name: 'detective-sarah' },
      { prompt: 'with scene', scene_name: 'police-station' },
      { prompt: 'with random', use_random_database_selection: true },
      { prompt: 'full params', character_name: 'detective-sarah', scene_name: 'office', seed: 12345 }
    ];
    
    for (const testCase of testCases) {
      const response = await POST(testCase);
      expect(response.success).toBe(true);
    }
  });
});
```

### **Quality Improvement Tests**
```typescript
test('single images now use structured prompts', async () => {
  const response = await POST({
    prompt: 'test prompt',
    character_name: 'detective-sarah',
    scene_name: 'police-station'
  });
  
  expect(response._enhanced.structured_prompt.used).toBe(true);
  expect(response._enhanced.word_budget.compliance).toBe(true);
  expect(response._enhanced.word_budget.total_words).toBeLessThanOrEqual(384);
});
```

## 🚀 **Migration Path**

### **For API Consumers**
**No action required** - existing code continues to work exactly as before.

**Optional enhancements:**
```typescript
// Existing code (continues to work)
const response = await fetch('/api/flux-lora', { 
  method: 'POST',
  body: JSON.stringify({ prompt: 'test' })
});
const image = response.image;

// Enhanced code (can access new features)
const response = await fetch('/api/flux-lora', { 
  method: 'POST',
  body: JSON.stringify({ prompt: 'test' })
});
const image = response.image;
const wordBudget = response._enhanced?.word_budget;
const structuredPrompt = response._enhanced?.structured_prompt;
```

### **For Batch Endpoint Users**
**Migration to unified endpoint:**
```typescript
// Old batch endpoint usage
const response = await fetch('/api/flux-lora/batch-generate', {
  method: 'POST',
  body: JSON.stringify({
    images: [
      { concept: 'test1', prompt: 'prompt1' },
      { concept: 'test2', prompt: 'prompt2' }
    ]
  })
});

// New unified endpoint usage (identical request format)
const response = await fetch('/api/flux-lora', {
  method: 'POST',
  body: JSON.stringify({
    images: [
      { concept: 'test1', prompt: 'prompt1' },
      { concept: 'test2', prompt: 'prompt2' }
    ]
  })
});
```

## 📋 **Acceptance Criteria**

### **Functional Requirements**
- [ ] Single endpoint handles both single and batch image generation
- [ ] 100% backward compatibility with existing single-image API
- [ ] All single images use superior `buildStructuredPrompt()` system
- [ ] Response format includes enhanced metadata without breaking existing clients
- [ ] Word budget enforcement applies to all generated images

### **Technical Requirements**
- [ ] Eliminate manual component building logic from single endpoint
- [ ] Share generation logic between single and batch capabilities
- [ ] Maintain exact same API response format for backward compatibility
- [ ] Add enhanced response fields with non-conflicting names
- [ ] All tests pass for both single and batch generation scenarios

### **Quality Requirements**
- [ ] Single images achieve same prompt quality as batch images
- [ ] Consistent error handling across all generation types
- [ ] Comprehensive logging for debugging and monitoring
- [ ] Performance equals or exceeds current single endpoint performance

### **Documentation Requirements**
- [ ] API documentation updated to show unified endpoint capabilities
- [ ] Migration guide for batch endpoint users
- [ ] Examples of both legacy and enhanced response usage
- [ ] Clear deprecation timeline for batch endpoint

This migration will provide superior prompt quality for all image generation while maintaining perfect backward compatibility and reducing maintenance overhead. 