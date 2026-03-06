# Brand Image Generation System - Complete Guide

## Overview

The Forge Brand Image Generation System integrates with [Fal AI's FLUX models](https://docs.fal.ai/) to create consistent, high-quality brand imagery. The system includes multiple API endpoints for different generation types and automatic project integration.

## System Architecture

### API Endpoints

#### **Flux-LoRA Endpoints**
- **Single Generation**: `POST /api/flux-lora`
- **Batch Generation**: `POST /api/flux-lora/batch-generate`
- **Purpose**: Standard image generation with LoRA models
- **Best For**: Character designs, equipment, general brand imagery

#### **Flux-Kontext Endpoints** 
- **Single Generation**: `POST /api/flux-kontext`
- **Batch Generation**: `POST /api/flux-kontext/batch-generate`
- **Purpose**: Transform existing images with new prompts
- **Best For**: Style transfers, variations, enhancements

### System Components

1. **API Routes** - Handle generation requests and save images with metadata
2. **Utility Functions** - `src/utils/fal-image-generator.ts` for image processing
3. **Project Integration** - Automatic current project detection and LoRA settings
4. **Metadata System** - Complete generation parameter preservation

## Setup

### Environment Variables
```env
FAL_KEY=your_fal_api_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # For local development
```

### Project LoRA Configuration
LoRAs are automatically loaded from current project settings and resolved from the global LoRA library. Default LoRAs for new projects:
- **MinimalDesign**: ID `minimal-design` (strength: 0.825) - Clean, professional aesthetic
- **Cute 3D Cartoon**: ID `cute-3d-cartoon` (strength: 0.65) - Pixar-style character rendering

Projects use LoRA IDs that are automatically resolved to file paths during generation.

#### **New Project Creation**
When creating a new project, users can:
- Select from available LoRAs in the global library
- Both default LoRAs are pre-selected and enabled
- Adjust strength values with intuitive sliders
- View LoRA descriptions and trigger words
- Enable/disable individual LoRAs as needed

## Usage Guide

### 1. Flux-LoRA Single Generation

#### **cURL Example**
```bash
curl -X POST http://localhost:3000/api/flux-lora \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": " A professional Squad member in tactical gear",
    "concept": "Squad Portrait",
    "save_to_disk": true,
    "image_size": "portrait_16_9",
    "num_inference_steps": 28,
    "guidance_scale": 3.5
  }'
```

#### **Request Parameters**
```typescript
{
  prompt: string,                    // Required: Description to generate
  concept?: string,                  // Optional: Concept name for organization
  master_prompt?: string,            // Optional: Override default master prompt
  image_size?: string,               // Default: 'portrait_16_9'
  num_inference_steps?: number,      // Default: 28
  guidance_scale?: number,           // Default: 3.5
  num_images?: number,               // Default: 1
  enable_safety_checker?: boolean,   // Default: true
  output_format?: string,            // Default: 'jpeg'
  loras?: LoRA[],                   // Optional: Override project LoRAs
  save_to_disk?: boolean,           // Default: true
  seed?: number                     // Optional: For reproducible results
}
```

#### **Response Format**
```json
{
  "images": [{
    "url": "https://v3.fal.media/files/...",
    "width": 576,
    "height": 1024,
    "content_type": "image/jpeg",
    "local_path": "images/concept-name-timestamp.jpg"
  }],
  "seed": 8404866087574655000,
  "timings": { "inference": 4.95 },
  "has_nsfw_concepts": [false],
  "message": "Flux-LoRA image generated and saved successfully",
  "generation_data": {
    "loras_used": [
      {"path": "flux_s_MinimalDesign.safetensors", "scale": 0.825}
    ]
  }
}
```

### 2. Flux-LoRA Batch Generation

#### **cURL Example**
```bash
curl -X POST http://localhost:3000/api/flux-lora/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "concept": "Squad Leader",
        "prompt": " Professional squad leader with tactical equipment"
      },
      {
        "concept": "Lint Monster", 
        "prompt": " Massive irregular lint blob with matted dirty texture"
      }
    ],
    "save_to_disk": true
  }'
```

#### **Batch Request Parameters**
```typescript
{
  images: BatchImageRequest[],       // Required: Array of image requests
  save_to_disk?: boolean,           // Default: true
  master_prompt?: string,           // Optional: Override default master prompt
  loras?: LoRA[]                   // Optional: Override project LoRAs
}

interface BatchImageRequest {
  concept: string,                  // Required: Concept name
  prompt: string,                  // Required: Generation prompt
  filename?: string               // Optional: Custom filename
}
```

#### **Batch Response Format**
```json
{
  "message": "Batch generation completed: 2/2 successful",
  "total_requested": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "concept": "Squad Leader",
      "status": "success",
      "image": {
        "url": "https://v3.fal.media/files/...",
        "fal_image_url": "https://v3.fal.media/files/..."
      },
      "local_path": "images/squad-leader-timestamp.jpg",
      "generation_data": {
        "seed": 123456,
        "inference_time": 5.2,
        "has_nsfw_concepts": [false]
      }
    }
  ],
  "estimated_total_cost": "$0.10"
}
```

### 3. Flux-Kontext Single Generation

#### **cURL Example**
```bash
curl -X POST http://localhost:3000/api/flux-kontext \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": " Close-up dramatic view with enhanced lighting",
    "image_url": "https://v3.fal.media/files/tiger/source-image.jpg",
    "concept": "Enhanced Detail",
    "aspect_ratio": "9:16",
    "guidance_scale": 3.5
  }'
```

#### **Kontext Request Parameters**
```typescript
{
  prompt: string,                    // Required: Transformation description
  image_url: string,                // Required: Source image URL
  concept?: string,                 // Optional: Concept name
  model?: string,                   // Default: 'fal-ai/flux-pro/kontext'
  guidance_scale?: number,          // Default: 3.5
  sync_mode?: boolean,              // Default: false
  num_images?: number,              // Default: 1
  safety_tolerance?: string,        // Default: "2"
  output_format?: string,           // Default: 'jpeg'
  aspect_ratio?: string,            // Default: '9:16'
  save_to_disk?: boolean,          // Default: true
  seed?: number                    // Optional: For reproducible results
}
```

### 4. Flux-Kontext Batch Generation

#### **cURL Example**
```bash
curl -X POST http://localhost:3000/api/flux-kontext/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "concept": "Action Shot",
        "prompt": " Dynamic action perspective with motion blur",
        "image_url": "https://v3.fal.media/files/source1.jpg"
      },
      {
        "concept": "Close-up Detail",
        "prompt": " Extreme close-up showing surface textures",
        "image_url": "https://v3.fal.media/files/source2.jpg"
      }
    ]
  }'
```

## Master Prompts

### **Default LoRA Master Prompt**
```
"minimal design, professional rugged 3D animation style, Pixar meets military documentary, clean expressive cartoon realism, enhanced color saturation, stylized lighting with orange accents (#FF9B00), crisp shadows, cartoon clarity, slightly heroic proportions with 10% broader shoulders and stronger jawlines, clean-lined stylized features maintaining adult realism, low angle hero shots, enhanced rim lighting with colored edges, dramatic directional lighting, miniaturized scale perspective inside vent systems, brushed aluminum duct walls with stylized wear patterns and purposeful weathering, enhanced cartoon expressiveness with confident determined expressions, volumetric dust particles with animated clarity, cool blue-white transitioning to warm orange lighting, higher contrast for animated depth, crisp purposeful shadows, depth of field storytelling, futuristic charcoal gray and bright orange (#FF9B00) color palette, metallic surfaces with realistic imperfections, gelatinous textures with thick matted details, dirty grays and murky browns for contrast"
```

### **Default Kontext Master Prompt**
```
"Enhanced cinematic style with dramatic lighting and composition. Professional rugged 3D animation aesthetic, Pixar meets military documentary quality, enhanced color saturation with orange LED accents (#FF9B00), crisp shadows and rim lighting, heroic proportions, clean stylized features, confident expressions, volumetric effects, brushed aluminum textures with purposeful weathering."
```

## Brand-Specific Examples

### **Dryer Vent Squad Characters**
```bash
# Squad Leader Portrait
curl -X POST http://localhost:3000/api/flux-lora \
  -d '{"prompt": " Professional squad leader, confident determined expression, charcoal gray tactical jumpsuit with bright orange SQUAD text on chest, orange LED accent strips", "concept": "Squad Leader"}'

# Squad in Action Formation
curl -X POST http://localhost:3000/api/flux-lora \
  -d '{"prompt": " Dryer Vent Squad team in tactical formation, miniaturized perspective inside massive cylindrical dryer vent tunnel, holding AirBlast X-7000 weapons", "concept": "Squad Formation"}'
```

### **Lint Monster Variations**
```bash
# Small Lint Monster
curl -X POST http://localhost:3000/api/flux-lora \
  -d '{"prompt": " Beach ball sized lint monster, thick matted gray and yellowed lint texture, asymmetrical blob with random bumps, minimal dark eyes", "concept": "Small Lint Monster"}'

# Massive Lint Boss
curl -X POST http://localhost:3000/api/flux-lora \
  -d '{"prompt": " Refrigerator-sized lint monster boss, extremely thick matted dirty lint, heavy gelatinous form, murky brown and gray coloring", "concept": "Lint Boss"}'
```

### **Equipment and Weapons**
```bash
# AirBlast Weapon Detail
curl -X POST http://localhost:3000/api/flux-lora \
  -d '{"prompt": " Close-up of AirBlast X-7000 weapon, hybrid leaf blower and sci-fi plasma rifle design, matte black body with orange highlights, glowing blue energy chamber", "concept": "AirBlast Detail"}'
```

## File Organization

### **Generated Images**
- **Location**: `public/images/`
- **Naming**: `{concept-slug}-{timestamp}-{index}.jpg`
- **Metadata**: `public/images/image-info/{filename}.meta.json`

### **Metadata Structure**
Each image generates comprehensive metadata:
```json
{
  "prompt": "Full generation prompt",
  "original_prompt": "User-provided prompt",
  "model": "fal-ai/flux-lora",
  "concept": "Concept name",
  "seed": 123456,
  "inference_time": 5.2,
  "loras": [{"path": "...", "scale": 0.825}],
  "api_response": { /* Complete Fal API response */ },
  "request_id": "flux-lora-timestamp-uuid",
  "user_agent": "browser info",
  "ip_address": "request IP"
}
```

## Project Integration

### **Automatic Project Detection**
- Uses `getCurrentProjectFromServerSync()` to get current project
- Loads project-specific LoRA settings automatically
- Saves images to current project context

### **LoRA Configuration**
Projects can override default LoRAs through project settings:
```json
{
  "settings": {
    "loras": {
      "lora1": {
        "enabled": true,
        "path": "https://custom-lora-url.safetensors",
        "scale": 0.8
      },
      "lora2": {
        "enabled": true,
        "path": "https://another-lora-url.safetensors", 
        "scale": 0.6
      }
    }
  }
}
```

## Performance & Cost

### **Generation Times**
- **Flux-LoRA**: ~5 seconds average
- **Flux-Kontext**: ~3-4 seconds average
- **Batch Processing**: Parallel execution for optimal speed

### **Cost Estimates**
- **Flux-LoRA**: ~$0.05 per image
- **Flux-Kontext**: ~$0.03 per image
- **Batch Discounts**: Automatic parallel processing reduces overhead

### **Success Rates**
Based on testing (2025-06-05):
- **Flux-LoRA**: 7/7 successful (100%)
- **Flux-Kontext**: 3/3 successful (100%)

## Error Handling

### **Individual Failures**
Batch operations continue even if individual images fail:
```json
{
  "concept": "Failed Concept",
  "status": "failed", 
  "error": "Detailed error message",
  "image": null,
  "local_path": null
}
```

### **Common Issues**
1. **Invalid image_url** (Kontext): Ensure URL is accessible
2. **LoRA loading failures**: Check LoRA URL accessibility
3. **Prompt too long**: Keep prompts under 500 characters
4. **Rate limiting**: Batch requests are automatically throttled

## Best Practices

### **Prompt Writing**
- Start with specific subject description
- Include lighting and composition details
- Mention brand colors: orange (#FF9B00), charcoal gray
- Use brand-specific terms: "Squad", "tactical", "lint monster"

### **Concept Naming**
- Use descriptive names: "Squad Leader Portrait" vs "image1"
- Include size/type: "Small Lint Monster", "Large Equipment"
- Be consistent across batches

### **Batch Organization**
- Group related concepts together
- Test small batches first
- Use consistent naming conventions

## Integration with Timeline

Generated images automatically integrate with the Forge timeline system:
- **Auto-sync**: New images appear in timeline within 5 seconds
- **Metadata preservation**: All generation details maintained
- **Drag & drop**: Full timeline functionality available
- **Project organization**: Images categorized by current project

---

*Last updated: June 2025 - Post Flux-LoRA migration* 