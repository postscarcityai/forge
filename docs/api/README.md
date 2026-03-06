# Forge API Documentation

## 🎯 Overview

Forge provides multiple AI-powered generation endpoints built on Fal.ai infrastructure:

## Image Generation
- **Flux-LoRA** - Style-controlled idea generation using LoRA models
- **Flux-Kontext** - Fine-grained image editing and transformations

## Video Generation  
- **PixVerse V5 Transition** - Seamless transitions between two images
- **PixVerse V4** - Image-to-video generation
- **Kling Video** - Advanced image-to-video with camera controls
- **MiniMax Hailuo** - High-quality image-to-video generation
- **Luma Dream Machine** - Professional video generation
- **Pika Scenes** - Scene-based video generation

Each API supports both single and batch generation modes for flexible workflows.

## 🛠️ API Endpoints

### Base Configuration

```typescript
// All endpoints use these base settings
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const headers = { 'Content-Type': 'application/json' }
```

---

## 📸 Flux-LoRA APIs

### Single Generation
**POST** `/api/flux-lora`

Generate single images with LoRA style control for creative ideation.

#### Request Schema
```typescript
interface FluxLoRARequest {
  prompt: string                    // Required: Your creative prompt
  master_prompt?: string           // Optional: Override default master prompt
  concept?: string                 // Optional: Concept label for organization
  image_size?: string             // Default: 'portrait_16_9'
  num_inference_steps?: number    // Default: 28
  guidance_scale?: number         // Default: 3.5
  num_images?: number             // Default: 1 (max: 4)
  loras?: LoRA[]                  // Optional: Override project LoRAs
  save_to_disk?: boolean          // Default: true
  seed?: number                   // Optional: For reproducibility
}

interface LoRA {
  path: string                    // LoRA model URL
  scale: number                   // Influence strength (0-1)
}
```

#### Response Schema
```typescript
interface FluxLoRAResponse {
  success: boolean
  images: Array<{
    id: string
    url: string                   // Fal.ai URL (7-day retention)
    local_path: string           // Local server path
    width: number
    height: number
    metadata: {
      prompt: string
      original_prompt: string
      model: string
      seed: number
      inference_time: number
      concept: string
      // ... complete generation parameters
    }
  }>
  timing: {
    total_time: number
    fal_generation_time: number
    save_time: number
  }
  cost_estimate: number           // USD cost
}
```

#### Example Usage
```javascript
const response = await fetch('/api/flux-lora', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "a massive lint monster blocking the dryer vent, gelatinous blob",
    concept: "Lint Monster - Blockage",
    image_size: "landscape_4_3",
    num_inference_steps: 32,
    guidance_scale: 4.0
  })
})

const result = await response.json()
console.log('Generated image:', result.images[0].local_path)
```

### Batch Generation  
**POST** `/api/flux-lora/batch-generate`

Generate multiple image variations with different prompts.

#### Request Schema
```typescript
interface FluxLoRABatchRequest {
  prompts: string[]               // Required: Array of prompts
  base_concept?: string          // Optional: Base concept for all images
  master_prompt?: string         // Optional: Override default master prompt
  shared_params?: {              // Optional: Shared generation parameters
    image_size?: string
    num_inference_steps?: number
    guidance_scale?: number
    loras?: LoRA[]
  }
  save_to_disk?: boolean         // Default: true
}
```

#### Example Usage
```javascript
const response = await fetch('/api/flux-lora/batch-generate', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompts: [
      "lint monster in dryer vent, massive blockage",
      "Squad member with tactical gear and orange accents",
      "lint monster being extracted by professional team"
    ],
    base_concept: "DVS Brand Showcase",
    shared_params: {
      image_size: "portrait_16_9",
      guidance_scale: 3.8
    }
  })
})
```

---

## 🎬 PixVerse V5 Transition API

### Transition Generation
**POST** `/api/pixverse-transition`

Generate seamless transition videos between two images using PixVerse V5.

#### Request Schema
```typescript
interface PixVerseTransitionRequest {
  prompt: string                      // Required: Description of the transition
  first_image_url: string            // Required: Starting image URL
  last_image_url: string             // Required: Ending image URL
  duration?: "5" | "8"               // Default: "5" (8s costs double)
  resolution?: "360p" | "540p" | "720p" | "1080p"  // Default: "720p"
  negative_prompt?: string           // Default: extensive quality filters
  style?: "anime" | "3d_animation" | "clay" | "comic" | "cyberpunk"
  seed?: number                      // Optional: For reproducible results
  concept?: string                   // Optional: Concept name for organization
  save_to_disk?: boolean            // Default: true
}
```

#### Response Schema
```typescript
interface PixVerseTransitionResponse {
  video: {
    url: string                      // Fal.ai URL (7-day retention)
    width: number
    height: number
    content_type: string
  }
  message: string
  saved_to_disk: boolean
  local_path: string                 // Local server path
  generation_data: {
    model_used: string
    input_parameters: {
      prompt: string
      first_image_url: string
      last_image_url: string
      duration: string
      resolution: string
      aspect_ratio: string
      style: string
    }
  }
}
```

#### Example Usage
```javascript
const response = await fetch('/api/pixverse-transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Smooth transition from day to night scene with cinematic lighting",
    first_image_url: "https://v3.fal.media/files/day-scene.jpg",
    last_image_url: "https://v3.fal.media/files/night-scene.jpg",
    duration: "5",
    resolution: "720p",
    concept: "Day to Night Transition"
  })
})

const result = await response.json()
console.log('Transition video:', result.video.url)
console.log('Local path:', result.local_path)
```

---

## ✨ Flux-Kontext APIs

### Single Edit
**POST** `/api/flux-kontext`

Fine-grained editing of existing images using reference image + prompt.

#### Request Schema
```typescript
interface FluxKontextRequest {
  prompt: string                  // Required: Editing instructions
  image_url: string              // Required: Reference image URL
  strength?: number              // Default: 0.95 (edit intensity)
  image_size?: string           // Default: 'portrait_16_9'
  num_inference_steps?: number  // Default: 28
  guidance_scale?: number       // Default: 3.5
  num_images?: number           // Default: 1
  save_to_disk?: boolean        // Default: true
  seed?: number                 // Optional: For reproducibility
}
```

#### Example Usage
```javascript
const response = await fetch('/api/flux-kontext', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "close-up view of the lint monster's face, beady eyes visible",
    image_url: "http://localhost:3000/api/images/serve/img_123",
    strength: 0.8,
    guidance_scale: 4.2
  })
})
```

### Batch Edit
**POST** `/api/flux-kontext/batch-generate`

Apply multiple different edits to a single reference image.

#### Request Schema
```typescript
interface FluxKontextBatchRequest {
  prompts: string[]              // Required: Array of edit prompts
  image_url: string             // Required: Reference image URL
  base_concept?: string         // Optional: Concept for organization
  shared_params?: {             // Optional: Shared parameters
    strength?: number
    image_size?: string
    num_inference_steps?: number
    guidance_scale?: number
  }
  save_to_disk?: boolean        // Default: true
}
```

---

## 🎨 Default LoRA Configuration

### Master Prompt
All Flux-LoRA generations include this master prompt for brand consistency:

```
minimal design, professional rugged 3D animation style, Pixar meets military documentary, clean expressive cartoon realism, enhanced color saturation, stylized lighting with orange accents (#FF9B00), crisp shadows, cartoon clarity, slightly heroic proportions with 10% broader shoulders and stronger jawlines, clean-lined stylized features maintaining adult realism, low angle hero shots, enhanced rim lighting with colored edges, dramatic directional lighting, miniaturized scale perspective inside vent systems, brushed aluminum duct walls with stylized wear patterns and purposeful weathering, enhanced cartoon expressiveness with confident determined expressions, volumetric dust particles with animated clarity, cool blue-white transitioning to warm orange lighting, higher contrast for animated depth, crisp purposeful shadows, depth of field storytelling, futuristic charcoal gray and bright orange (#FF9B00) color palette, metallic surfaces with realistic imperfections, gelatinous textures with thick matted details, dirty grays and murky browns for contrast
```

### Default LoRAs
```typescript
const DEFAULT_LORAS = [
  {
    path: "https://matres.nyc3.cdn.digitaloceanspaces.com/flux_s_MinimalDesign.safetensors",
    scale: 0.825  // Primary style LoRA
  },
  {
    path: "https://matres.nyc3.cdn.digitaloceanspaces.com/Cute_3d_Cartoon_Flux.safetensors",
    scale: 0.65   // Secondary cartoon LoRA
  }
]
```

---

## 📊 Performance & Costs

### Generation Times
- **Flux-LoRA**: ~5 seconds per image
- **Flux-Kontext**: ~3-4 seconds per image  

### Cost Estimates
- **Flux-LoRA**: ~$0.05 per image
- **Flux-Kontext**: ~$0.03 per image

### Rate Limits
- No artificial rate limiting implemented
- Limited by Fal.ai infrastructure capacity
- Batch operations are processed sequentially

---

## 🔧 Project Integration

### Automatic Project Detection
All APIs automatically detect the current project and load:
- **Project-specific LoRAs** from database settings
- **Default fallback** if no project LoRAs configured  
- **Metadata tagging** with project ID for organization

### Auto-Sync to Timeline
Generated images automatically appear in the timeline within 5 seconds via:
- **File system monitoring** (`useFileWatcher`)
- **IndexedDB caching** for instant UI updates
- **Metadata preservation** including all generation parameters

---

## 🧪 Testing the APIs

### Quick Test Script
```javascript
// Test all 4 endpoints
const testAPIs = async () => {
  // Test 1: Flux-LoRA single
  const loraResult = await fetch('/api/flux-lora', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "test lint monster",
      concept: "API Test"
    })
  })
  
  // Test 2: Flux-LoRA batch  
  const loraBatch = await fetch('/api/flux-lora/batch-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompts: ["test 1", "test 2"],
      base_concept: "Batch Test"
    })
  })
  
  // Test 3: Flux-Kontext single (need image URL)
  const kontextResult = await fetch('/api/flux-kontext', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "close-up transformation",
      image_url: "http://localhost:3000/api/images/serve/latest_image_id"
    })
  })
  
  console.log('All APIs tested successfully!')
}
```

### Browser Console Testing
Open DevTools console and run:
```javascript
testAPIs()
```

---

## 🚨 Error Handling

### Common Error Responses
```typescript
// Authentication Error
{ error: 'FAL_KEY not configured', status: 500 }

// Validation Error  
{ error: 'Prompt is required', status: 400 }

// Generation Failure
{ error: 'Fal generation failed: [details]', status: 500 }

// Save Failure
{ success: true, images: [...], warnings: ['Failed to save locally'] }
```

### Debugging Tips
1. **Check FAL_KEY** environment variable
2. **Verify project ID** in current context
3. **Monitor console logs** for detailed error messages
4. **Test with minimal prompts** to isolate issues
5. **Check file system permissions** for image saving

---

## 🔗 Related Documentation

### Image Generation
- [Flux-LoRA Generation Guide](../features/image-generation/flux-lora-generation-guide.md)
- [Flux-Kontext Editing Guide](../features/image-generation/flux-kontext-editing-guide.md)

### Video Generation
- [PixVerse V5 Transition Guide](../features/video-generation/pixverse-v5-transition-guide.md)

### System Integration
- [LLM Feedback Utilities](llm-feedback-utilities.md) - Developer tools for AI assistant guidance
- [Project Management](../features/project-management/)
- [Auto-Sync Implementation](../features/auto-sync/) 