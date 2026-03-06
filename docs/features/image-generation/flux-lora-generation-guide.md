# Flux-LoRA Generation Guide - Step 1: Idea Generation with Style Control

## Overview

Flux-LoRA is the **first step** in the Forge image generation workflow. It uses LoRA (Low-Rank Adaptation) models to generate lots of creative ideas while maintaining a consistent brand style. This is your primary tool for **brainstorming and initial concept creation**.

## When to Use Flux-LoRA

✅ **Perfect For:**
- **Initial concept generation** - Creating first drafts and exploring ideas
- **Style consistency** - Maintaining brand visual identity across variations
- **Bulk generation** - Creating multiple concepts quickly
- **Character design** - Squad members, lint monsters, equipment designs
- **Scene composition** - Basic layouts and environmental concepts

❌ **Not Ideal For:**
- **Fine-tuned edits** - Use Flux-Kontext for detailed modifications
- **Precise transformations** - Kontext is better for specific changes
- **Image-to-image editing** - Kontext handles existing image modifications

## API Endpoints

### **Single Generation**
```
POST /api/flux-lora
```

### **Batch Generation** 
```
POST /api/flux-lora/batch-generate
```

## How LoRAs Work

### **Style Control System**
LoRAs are like "style filters" that guide the AI to generate images in your brand's visual style:

- **MinimalDesign LoRA** (scale: 0.825) - Clean, professional aesthetic
- **Cute 3D Cartoon LoRA** (scale: 0.65) - Pixar-style character rendering

### **Automatic LoRA Loading**
The system automatically loads LoRAs from your current project settings:
1. **Project-specific LoRAs** - If configured in project settings
2. **Default LoRAs** - Fallback to brand-consistent defaults
3. **Override option** - Specify custom LoRAs in API requests

## Master Prompt System

### **Default Master Prompt**
Every generation automatically includes this brand-consistent foundation:

```
"minimal design, professional rugged 3D animation style, Pixar meets military documentary, clean expressive cartoon realism, enhanced color saturation, stylized lighting with orange accents (#FF9B00), crisp shadows, cartoon clarity, slightly heroic proportions with 10% broader shoulders and stronger jawlines, clean-lined stylized features maintaining adult realism, low angle hero shots, enhanced rim lighting with colored edges, dramatic directional lighting, miniaturized scale perspective inside vent systems, brushed aluminum duct walls with stylized wear patterns and purposeful weathering, enhanced cartoon expressiveness with confident determined expressions, volumetric dust particles with animated clarity, cool blue-white transitioning to warm orange lighting, higher contrast for animated depth, crisp purposeful shadows, depth of field storytelling, futuristic charcoal gray and bright orange (#FF9B00) color palette, metallic surfaces with realistic imperfections, gelatinous textures with thick matted details, dirty grays and murky browns for contrast"
```

### **Your Prompt Focus**
Your prompts should focus on **what** you want to generate:
- **Subject description** - "Professional squad leader"
- **Key characteristics** - "Confident expression, tactical gear"
- **Specific details** - "Orange LED accent strips"
- **Composition notes** - "Low angle hero shot"

## Usage Examples

### **Single Generation**

#### **Squad Leader Concept**
```bash
curl -X POST http://localhost:3000/api/flux-lora \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": " Professional squad leader, confident determined expression, charcoal gray tactical jumpsuit with bright orange SQUAD text on chest, orange LED accent strips, tactical equipment with orange highlights",
    "concept": "Squad Leader Portrait",
    "save_to_disk": true
  }'
```

#### **Lint Monster Concept**
```bash
curl -X POST http://localhost:3000/api/flux-lora \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": " Massive irregular lint monster blob, heavily matted dirty gray and dingy yellowed white lint texture, asymmetrical gelatinous form, thick accumulated grime and stains, minimal small beady dark eyes",
    "concept": "Large Lint Monster",
    "save_to_disk": true
  }'
```

### **Batch Generation - Concept Exploration**

#### **Multiple Squad Variations**
```bash
curl -X POST http://localhost:3000/api/flux-lora/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "concept": "Squad Leader",
        "prompt": " Professional squad leader, confident expression, tactical gear with orange accents"
      },
      {
        "concept": "Squad Technician", 
        "prompt": " Technical specialist with advanced scanning equipment, focused expression, orange LED diagnostic tools"
      },
      {
        "concept": "Squad Veteran",
        "prompt": " Experienced squad member with battle-worn gear, determined stance, enhanced AirBlast weapon"
      }
    ],
    "save_to_disk": true
  }'
```

#### **Lint Monster Size Variations**
```bash
curl -X POST http://localhost:3000/api/flux-lora/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "concept": "Small Lint Cluster",
        "prompt": " Small cluster of volleyball-sized lint blobs, matted texture, dirty gray coloring, rolling together"
      },
      {
        "concept": "Medium Lint Monster",
        "prompt": " Beach ball sized lint monster, thick matted texture, asymmetrical blob with random bumps"
      },
      {
        "concept": "Massive Lint Boss",
        "prompt": " Refrigerator-sized lint monster boss, extremely thick matted dirty lint, heavy gelatinous form"
      }
    ]
  }'
```

## Request Parameters

### **Single Generation Parameters**
```typescript
{
  prompt: string,                    // Required: What to generate
  concept?: string,                  // Optional: Concept name for organization
  master_prompt?: string,            // Optional: Override default master prompt
  image_size?: string,               // Default: 'portrait_16_9'
  num_inference_steps?: number,      // Default: 28 (quality vs speed)
  guidance_scale?: number,           // Default: 3.5 (prompt adherence)
  num_images?: number,               // Default: 1
  enable_safety_checker?: boolean,   // Default: true
  output_format?: string,            // Default: 'jpeg'
  loras?: LoRA[],                   // Optional: Override project LoRAs
  save_to_disk?: boolean,           // Default: true
  seed?: number                     // Optional: For reproducible results
}
```

### **Batch Generation Parameters**
```typescript
{
  images: BatchImageRequest[],       // Required: Array of concepts to generate
  save_to_disk?: boolean,           // Default: true
  master_prompt?: string,           // Optional: Override for entire batch
  loras?: LoRA[]                   // Optional: Override LoRAs for batch
}

interface BatchImageRequest {
  concept: string,                  // Required: Concept name
  prompt: string,                  // Required: Generation prompt
  filename?: string               // Optional: Custom filename
}
```

## Generation Parameters Guide

### **Image Size Options**
- `portrait_16_9` - Standard portrait format (576×1024)
- `landscape_16_9` - Wide landscape format
- `square` - Square format (1024×1024)

### **Quality vs Speed Settings**
```typescript
// High Quality (slower)
{
  "num_inference_steps": 50,
  "guidance_scale": 4.0
}

// Balanced (default)
{
  "num_inference_steps": 28,
  "guidance_scale": 3.5
}

// Fast Draft (quicker)
{
  "num_inference_steps": 20,
  "guidance_scale": 3.0
}
```

## Brand-Specific Prompt Patterns

### **Dryer Vent Squad Characters**
```
Base Pattern: " [Role] squad member, [expression], [gear description], [pose/composition]"

Examples:
- " Professional squad leader, confident determined expression, tactical jumpsuit with orange SQUAD text, heroic stance"
- " Technical specialist squad member, focused analytical expression, diagnostic equipment with orange LEDs, working pose"
- " Veteran squad member, battle-tested expression, enhanced gear with orange highlights, ready position"
```

### **Lint Monster Variations**
```
Base Pattern: " [Size] lint monster, [texture description], [form characteristics], [behavior/pose]"

Examples:
- " Beach ball sized lint monster, thick matted gray texture, asymmetrical blob with bumps, sluggish rolling"
- " Massive lint boss, extremely matted dirty lint, gelatinous irregular form, oozing through vent tunnel"
- " Small lint cluster, volleyball-sized dirty blobs, heavily matted texture, rolling together in formation"
```

### **Equipment and Weapons**
```
Base Pattern: " [Equipment type], [design characteristics], [color/materials], [details/features]"

Examples:
- " AirBlast X-7000 weapon, hybrid leaf blower plasma rifle design, matte black with orange highlights, glowing blue energy chamber"
- " Tactical scanner device, handheld holographic display unit, orange wireframe interface, chrome and black construction"
- " Miniaturization pod, sleek chrome cylinder, orange activation button, blue energy field effects"
```

## Response Format

### **Single Generation Response**
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
      {"path": "flux_s_MinimalDesign.safetensors", "scale": 0.825},
      {"path": "Cute_3d_Cartoon_Flux.safetensors", "scale": 0.65}
    ]
  }
}
```

### **Batch Generation Response**
```json
{
  "message": "Batch generation completed: 3/3 successful",
  "total_requested": 3,
  "successful": 3,
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
  "estimated_total_cost": "$0.15"
}
```

## Best Practices for Idea Generation

### **Concept Development Workflow**
1. **Start broad** - Generate multiple variations of basic concepts
2. **Iterate on winners** - Take successful concepts to Flux-Kontext for refinement
3. **Batch similar concepts** - Group related ideas for efficient generation
4. **Use descriptive names** - Clear concept names help with organization

### **Prompt Writing for Ideas**
- **Focus on subjects** - What you want, not how to change it
- **Include key details** - Important characteristics and features
- **Mention brand elements** - Orange accents, tactical gear, etc.
- **Keep it creative** - Explore different angles and approaches

### **Efficient Batching**
```bash
# Good: Related concepts in one batch
{
  "images": [
    {"concept": "Squad Leader Portrait", "prompt": "..."},
    {"concept": "Squad Leader Action", "prompt": "..."},
    {"concept": "Squad Leader Equipment", "prompt": "..."}
  ]
}

# Better: Size variations of same subject
{
  "images": [
    {"concept": "Small Lint Monster", "prompt": "..."},
    {"concept": "Medium Lint Monster", "prompt": "..."},
    {"concept": "Large Lint Monster", "prompt": "..."}
  ]
}
```

## Performance & Cost

### **Generation Metrics**
- **Average time**: ~5 seconds per image
- **Cost per image**: ~$0.05
- **Success rate**: 100% (based on testing)
- **Batch efficiency**: Parallel processing optimized

### **Cost Optimization**
- **Batch requests** reduce API overhead
- **Failed generations** are not charged
- **Quality settings** balance cost vs results
- **Seed reuse** for variations of successful concepts

## Integration with Timeline

Generated images automatically sync to your timeline:
- **Auto-detection**: New images appear within 5 seconds
- **Project organization**: Categorized by current project
- **Full metadata**: All generation parameters preserved
- **Workflow ready**: Drag & drop to gallery or edit with Kontext

## Next Steps: Moving to Flux-Kontext

Once you have successful concept generations from Flux-LoRA:

1. **Select best concepts** - Choose images that need refinement
2. **Identify needed changes** - What specifically needs adjustment
3. **Use Flux-Kontext** - Apply targeted edits and enhancements
4. **Iterate as needed** - Repeat Kontext edits for fine-tuning

See the **Flux-Kontext Editing Guide** for Step 2 of the workflow.

---

*Step 1 Complete! Ready for Flux-Kontext refinement.* 