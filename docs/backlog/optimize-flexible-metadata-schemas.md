# Optimize Flexible Metadata Schemas for Multi-Context API Usage

## 📋 **Story Overview**

As a system architect, I need to standardize and optimize the flexible JSON metadata schemas across all API routes to handle different usage contexts (UI-driven vs API-driven) while maintaining data consistency and preventing metadata drift.

## 🎯 **Problem Statement**

Our current API ecosystem has evolved organically, resulting in:

1. **Inconsistent Database Persistence**: Some routes save directly to database (framepack), others rely on sync operations (kling-video)
2. **Schema Variations**: Different routes store different metadata structures for similar operations
3. **Context Handling Gaps**: UI context (project drawer) vs Agent/Curl context (no UI) have different project ID assignment patterns
4. **Metadata Drift**: Over time, different routes have accumulated different metadata fields, making querying and analysis challenging

## 🔍 **Current State Analysis**

### **Route Audit Results**

#### ✅ **Properly Configured Routes**
| Route | Project ID | Database Save | Schema Completeness |
|-------|------------|---------------|-------------------|
| `framepack/route.ts` | ✅ getCurrentProjectFromServerSync() | ✅ Direct | ⭐⭐⭐⭐⭐ |
| `flux-lora/route.ts` | ✅ getCurrentProjectFromServerSync() | ✅ Via saveImageWithMetadata | ⭐⭐⭐⭐⭐ |
| `flux-kontext/route.ts` | ✅ getCurrentProjectFromServerSync() | ✅ Via saveImageWithMetadata | ⭐⭐⭐⭐ |
| `ideogram/route.ts` | ✅ getCurrentProjectFromServerSync() | ✅ Via saveImageWithMetadata | ⭐⭐⭐⭐ |
| All batch routes | ✅ getCurrentProjectFromServerSync() | ✅ Via saveImageWithMetadata | ⭐⭐⭐⭐ |

#### ⚠️ **Routes Needing Attention**
| Route | Issue | Impact |
|-------|-------|--------|
| `kling-video/route.ts` | No direct database save | Videos only appear after manual sync |

### **Context Scenarios**

#### 🖥️ **UI Context (Project Drawer Active)**
```javascript
// User has selected "PSAI" project in UI
// getCurrentProjectFromServerSync() returns "psai"
const currentProjectId = getCurrentProjectFromServerSync(); // "psai"

fetch('/api/kling-video', {
  method: 'POST',
  body: JSON.stringify({ prompt: "...", image_url: "..." })
});
// ✅ Video gets project_id: "psai"
```

#### 🤖 **Agent/Curl Context (No UI State)**
```bash
# Agent makes direct API call with no UI context
curl -X POST http://localhost:3000/api/kling-video \
  -H "Content-Type: application/json" \
  -d '{"prompt": "...", "image_url": "..."}'

# ❓ POTENTIAL ISSUE: What project_id gets assigned?
# Currently: Falls back to server state, but might be stale
```

### **Schema Variations Found**

#### **Video Metadata Schemas**

**Framepack Schema (Comprehensive)**:
```typescript
{
  id: string,
  filename: string,
  title: string,
  description: string,
  projectId: string,              // ✅ Always present
  fileSize: number,
  metadata: {
    prompt: string,
    negative_prompt: string,
    image_url: string,
    end_image_url: string,        // ✅ Framepack-specific
    model: string,
    aspect_ratio: string,
    resolution: string,
    cfg_scale: number,
    guidance_scale: number,
    num_frames: number,
    strength: number,
    seed: number,
    inference_time: number,
    api_response: object,         // ✅ Complete fal.ai response
    user_agent: string,
    ip_address: string,
    request_id: string
  }
}
```

**Kling Video Schema (Simpler)**:
```typescript
{
  id: string,
  filename: string,
  title: string,
  description: string,
  projectId: string,              // ✅ Now fixed
  fileSize: number,
  metadata: {
    prompt: string,
    duration: string,             // ✅ Kling-specific
    aspect_ratio: string,
    negative_prompt: string,
    cfg_scale: number,
    seed: number,
    inference_time: number,
    has_nsfw_concepts: boolean[], // ✅ Safety info
    api_response: object,
    user_agent: string,
    ip_address: string,
    request_id: string
    // ❌ Missing: fal_video_url, local_path
  }
}
```

#### **Image Metadata Schemas**

**Flux-LoRA Schema (Comprehensive)**:
```typescript
{
  id: string,
  filename: string,
  title: string,
  description: string,
  projectId: string,
  fileSize: number,
  dimensions: { width: number, height: number }, // ✅ Image dimensions
  metadata: {
    prompt: string,
    original_prompt: string,      // ✅ User's original input
    user_prompt: string,          // ✅ Before processing
    character_name: string,       // ✅ Character context
    scene_name: string,           // ✅ Scene context
    character_outfit_index: number, // ✅ Outfit variant
    scene_index: number,          // ✅ Scene variant
    model: string,
    image_size: string,
    num_inference_steps: number,
    guidance_scale: number,
    num_images: number,
    loras: LoRA[],               // ✅ LoRA configurations
    concept: string,
    seed: number,
    inference_time: number,
    has_nsfw_concepts: boolean[],
    api_response: object,
    user_agent: string,
    ip_address: string,
    request_id: string,
    prompt_components: object,    // ✅ Prompt breakdown
    prompt_metadata: object       // ✅ Prompt analysis
  }
}
```

## 🎯 **Acceptance Criteria**

### **1. Unified Schema Framework**
- [ ] Create a base metadata interface that all routes extend
- [ ] Define route-specific extensions (e.g., `KlingVideoMetadata extends BaseVideoMetadata`)
- [ ] Implement schema validation for all metadata objects
- [ ] Add migration utilities for existing metadata

### **2. Context-Aware Project Assignment**
- [ ] Implement explicit project ID parameter support in all routes
- [ ] Add fallback logic for when UI context is unavailable
- [ ] Create agent-friendly endpoint variants that require explicit project ID
- [ ] Add request logging to track context scenarios

### **3. Consistent Database Persistence**
- [ ] Update `kling-video/route.ts` to save directly to database
- [ ] Standardize error handling for database save failures
- [ ] Add database save success/failure logging
- [ ] Implement retry logic for failed database operations

### **4. Schema Documentation & Validation**
- [ ] Generate TypeScript types for all metadata schemas
- [ ] Create schema validation functions
- [ ] Add runtime schema validation in development mode
- [ ] Generate API documentation showing metadata examples

### **5. Migration & Backwards Compatibility**
- [ ] Create migration scripts for existing metadata files
- [ ] Add schema version field to new metadata
- [ ] Implement backwards-compatible metadata readers
- [ ] Add data quality validation tools

## 🛠️ **Technical Implementation**

### **Phase 1: Base Schema Definition**

```typescript
// Base metadata interfaces
interface BaseMetadata {
  id: string;
  filename: string;
  title: string;
  description?: string;
  projectId: string;              // Always required
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;          // NEW: Track schema evolution
  requestContext: RequestContext; // NEW: Track how it was created
}

interface RequestContext {
  source: 'ui' | 'api' | 'agent' | 'sync';
  userAgent?: string;
  ipAddress?: string;
  requestId: string;
  timestamp: string;
  projectMethod: 'ui_drawer' | 'explicit_param' | 'server_state' | 'fallback';
}

interface BaseVideoMetadata extends BaseMetadata {
  metadata: {
    // Common video fields
    prompt: string;
    model: string;
    aspect_ratio: string;
    seed?: number;
    inference_time?: number;
    api_response: FalApiResponse;
    fal_video_url: string;        // Always preserve original URL
    local_path: string;           // Always include local path
    
    // Route-specific fields handled via extensions
    [key: string]: unknown;
  }
}

interface BaseImageMetadata extends BaseMetadata {
  dimensions?: { width: number; height: number };
  metadata: {
    // Common image fields
    prompt: string;
    model: string;
    concept: string;
    seed?: number;
    inference_time?: number;
    api_response: FalApiResponse;
    fal_image_url: string;        // Always preserve original URL
    
    // Route-specific fields handled via extensions
    [key: string]: unknown;
  }
}
```

### **Phase 2: Route-Specific Extensions**

```typescript
// Kling-specific metadata
interface KlingVideoMetadata extends BaseVideoMetadata {
  metadata: BaseVideoMetadata['metadata'] & {
    duration: string;
    negative_prompt: string;
    cfg_scale: number;
    has_nsfw_concepts?: boolean[];
  }
}

// Framepack-specific metadata  
interface FramepackVideoMetadata extends BaseVideoMetadata {
  metadata: BaseVideoMetadata['metadata'] & {
    image_url: string;
    end_image_url: string;
    resolution: string;
    cfg_scale: number;
    guidance_scale: number;
    num_frames: number;
    strength: number;
    negative_prompt?: string;
  }
}
```

### **Phase 3: Context-Aware Route Updates**

```typescript
// Enhanced route with explicit context handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      image_url,
      projectId,  // NEW: Allow explicit project ID
      // ... other params
    } = body;

    // Context-aware project ID resolution
    const resolvedProjectId = resolveProjectId({
      explicitProjectId: projectId,
      serverState: getCurrentProjectFromServerSync(),
      userAgent: request.headers.get('user-agent'),
      fallback: 'default'
    });

    const requestContext: RequestContext = {
      source: projectId ? 'api' : 'ui',
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || undefined,
      requestId: `kling-${Date.now()}-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      projectMethod: projectId ? 'explicit_param' : 'server_state'
    };

    // Generate video...
    const result = await fal.subscribe(/* ... */);

    // Save with enhanced metadata
    if (save_to_disk && result.video?.url) {
      const metadata: KlingVideoMetadata = {
        id: requestContext.requestId,
        filename: /* generated */,
        title: concept || 'Kling Video Generation',
        description: prompt,
        projectId: resolvedProjectId,
        fileSize: /* calculated */,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: '2.0.0',
        requestContext,
        metadata: {
          prompt,
          duration,
          aspect_ratio: finalAspectRatio,
          negative_prompt,
          cfg_scale,
          seed: result.seed,
          inference_time: result.timings?.inference,
          has_nsfw_concepts: result.has_nsfw_concepts,
          model: 'fal-ai/kling-video/v2.1/standard/image-to-video',
          api_response: result,
          fal_video_url: result.video.url,
          local_path: /* calculated */
        }
      };

      // Save to file system AND database
      await saveVideoWithMetadata(result.video.url, metadata, resolvedProjectId);
      await databaseService.saveVideo(metadata); // NEW: Direct database save
    }

    return NextResponse.json({
      ...result,
      projectId: resolvedProjectId,
      requestContext: requestContext.requestId,
      saved_to_disk: save_to_disk,
      local_path: localPath
    });
  } catch (error) {
    // Enhanced error handling...
  }
}
```

### **Phase 4: Agent-Friendly Endpoints**

```typescript
// Example: Agent-specific endpoint with required project ID
// POST /api/kling-video/agent
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json({
      error: 'Project ID is required for agent endpoints',
      hint: 'Add "projectId": "psai" to your request body'
    }, { status: 400 });
  }

  // Continue with guaranteed project context...
}
```

## 🧪 **Testing Strategy**

### **Context Testing**
```bash
# UI Context Test
# 1. Set project to "psai" in UI
# 2. Generate content
# 3. Verify project_id = "psai"

# API Context Test  
curl -X POST http://localhost:3000/api/kling-video \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "image_url": "test.jpg", "projectId": "psai"}'
# Verify explicit project ID is used

# Agent Context Test (no project specified)
curl -X POST http://localhost:3000/api/kling-video \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "image_url": "test.jpg"}'
# Verify fallback behavior is documented and consistent
```

### **Schema Validation Testing**
```typescript
// Automated schema validation
const testMetadata: KlingVideoMetadata = { /* test data */ };
const isValid = validateKlingVideoMetadata(testMetadata);
expect(isValid).toBe(true);

// Migration testing
const legacyMetadata = { /* old format */ };
const migratedMetadata = migrateTov2(legacyMetadata);
expect(migratedMetadata.schemaVersion).toBe('2.0.0');
```

## 📊 **Success Metrics**

1. **Schema Consistency**: 100% of new metadata follows unified schema
2. **Database Persistence**: 100% of generated content saves to database immediately
3. **Context Clarity**: All requests include clear project assignment method
4. **Migration Success**: 100% of existing metadata can be read and upgraded
5. **API Reliability**: Zero project_id = null occurrences for new content

## 🚀 **Benefits**

1. **Predictable Behavior**: Users and agents get consistent project assignment
2. **Better Analytics**: Standardized schemas enable powerful querying and analysis
3. **Easier Maintenance**: Unified interfaces reduce code duplication and bugs
4. **Future-Proof**: Schema versioning allows safe evolution
5. **Better UX**: Immediate database persistence means content appears instantly in gallery

## 🔄 **Rollout Plan**

1. **Week 1**: Implement base schemas and validation
2. **Week 2**: Update 2-3 routes with new schemas (starting with kling-video)
3. **Week 3**: Update remaining routes
4. **Week 4**: Migration scripts and backwards compatibility
5. **Week 5**: Testing and documentation
6. **Week 6**: Deploy with monitoring

## 📝 **Related Stories**

- [ ] Database Query Optimization for Flexible Schemas
- [ ] API Documentation Auto-Generation from Schemas  
- [ ] Content Analytics Dashboard Using Standardized Metadata
- [ ] Project Management API Improvements

---

**Priority**: High
**Complexity**: Medium
**Dependencies**: Database schema updates, API route changes
**Estimated Effort**: 3-4 weeks
**Risk Level**: Medium (requires careful migration handling) 