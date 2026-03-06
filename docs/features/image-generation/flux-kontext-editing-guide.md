# Flux-Kontext Editing Guide - Step 2: Fine-Grained Image Control

## Overview

Flux-Kontext is the **second step** in the Forge image generation workflow. It gives you precise control to edit and refine existing images while **maintaining the exact same visual style**. Your prompts should focus on **what changes** and **how to modify** rather than generating from scratch.

## ⚠️ **CRITICAL: Style Preservation Principle**

**Kontext's Primary Job: NEVER change the style, ONLY change the scene.**

- ✅ **Always preserve**: Existing visual style, lighting quality, artistic approach, color palette
- ✅ **Only modify**: Scene composition, details, perspective, specific elements, environmental context
- ✅ **Applies to all edits**: Whether small precise changes or large involved transformations
- ✅ **Both modes**: Single image edits and batch operations must maintain style consistency

## When to Use Flux-Kontext

✅ **Perfect For:**
- **Scene modifications** - Changing what's happening while keeping visual style identical
- **Perspective changes** - Zooming, rotating, or changing viewpoints without style drift
- **Detail enhancement** - Adding specific elements while preserving artistic approach
- **Composition refinement** - Adjusting framing and focus with style consistency
- **Environmental changes** - Modifying backgrounds/context while maintaining visual treatment
- **Character positioning** - Changing poses/actions while keeping visual style intact

❌ **Not Ideal For:**
- **Style changes** - Use Flux-LoRA for different visual approaches
- **Complete redesigns** - LoRA is better for starting fresh with new styles
- **Artistic style transfers** - Kontext preserves style, doesn't change it

## API Endpoints

### **Single Edit**
```
POST /api/flux-kontext
```

### **Batch Editing**
```
POST /api/flux-kontext/batch-generate
```

## How Kontext Works

### **Scene-to-Scene Transformation with Style Preservation**
Kontext takes an existing image URL and applies targeted modifications **while maintaining the exact visual style**:

1. **Source Image** - Provides both content AND visual style template
2. **Transformation Prompt** - Describe ONLY what should change in the scene
3. **Style-Preserved Result** - Get the modified scene with identical visual treatment

### **Style Preservation Master Prompt**
Kontext automatically preserves the visual style from the source image. The master prompt reinforces style consistency:

```
"Maintain exact visual style, lighting, and artistic treatment from source image. Enhanced cinematic style with dramatic lighting and composition. Professional rugged 3D animation aesthetic, Pixar meets military documentary quality, enhanced color saturation with orange LED accents (#FF9B00), crisp shadows and rim lighting, heroic proportions, clean stylized features, confident expressions, volumetric effects, brushed aluminum textures with purposeful weathering. PRESERVE all existing visual style elements."
```

## Prompt Writing for Style-Preserving Edits

### **Focus ONLY on Scene Changes**
Your prompts should describe **what changes in the scene**, never style modifications:

**❌ Bad Kontext Prompt (tries to change style):**
```
"Make it more dramatic and cinematic with different lighting style"
```

**✅ Good Kontext Prompt (changes scene, preserves style):**
```
"Zoom into weapon details, add glowing energy effects, show more mechanical components"
```

### **Style-Preserving Pattern**
```
" [Scene change], [composition adjustment], [detail modification]"

Examples (style stays identical):
- " Zoom into weapon details, enhance metallic textures, add glowing energy effects"
- " Change perspective to low angle, show more environment, add background elements"  
- " Close-up on facial expression, show more character detail, add environmental context"
```

### **⚠️ Never Include Style Instructions**
Kontext automatically preserves style - never include:
- Lighting style changes ("make it darker", "change to warm lighting")
- Artistic approach modifications ("more realistic", "different art style")
- Color palette adjustments ("make it more colorful", "change color scheme")
- Visual treatment changes ("more dramatic", "less stylized")

## Usage Examples

### **Single Image Editing**

#### **Enhance Squad Leader Detail**
```bash
curl -X POST http://localhost:3000/api/flux-kontext \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": " Dramatic close-up zoom into the face showing determined expression, enhanced orange rim lighting, more detailed tactical gear textures",
    "image_url": "https://v3.fal.media/files/penguin/3am8Wcy9HMtuhLPsyAWQx_source.jpg",
    "concept": "Squad Leader Close-up",
    "save_to_disk": true
  }'
```

#### **Transform Lint Monster Perspective**
```bash
curl -X POST http://localhost:3000/api/flux-kontext \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": " Change to extreme close-up showing thick matted lint texture details, enhanced dirty and grimy surface, more visible tiny beady eyes",
    "image_url": "https://v3.fal.media/files/tiger/I9LEr9EKsM22FR_lint.jpg",
    "concept": "Lint Monster Texture Detail",
    "save_to_disk": true
  }'
```

### **Batch Editing - Multiple Transformations**

#### **Equipment Detail Enhancement**
```bash
curl -X POST http://localhost:3000/api/flux-kontext/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "concept": "Weapon Close-up",
        "prompt": " Extreme close-up of the glowing blue energy chamber, enhanced particle effects, more detailed mechanical components",
        "image_url": "https://v3.fal.media/files/elephant/2gfi8h8GuwtWkB04CXC5U_weapon.jpg"
      },
      {
        "concept": "Tactical Gear Detail",
        "prompt": " Zoom into orange LED accent strips, enhanced glow effects, detailed fabric textures and tactical attachments",
        "image_url": "https://v3.fal.media/files/penguin/3am8Wcy9HMtuhLPsyAWQx_gear.jpg"
      }
    ],
    "save_to_disk": true
  }'
```

#### **Action Sequence Enhancement**
```bash
curl -X POST http://localhost:3000/api/flux-kontext/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "concept": "Dynamic Action Shot",
        "prompt": " Add motion blur effects, enhance air blast weapon discharge, more dramatic action lines and particle effects",
        "image_url": "https://v3.fal.media/files/tiger/VumKVuHYVZZ7E-action.jpg"
      },
      {
        "concept": "Battle Impact",
        "prompt": " Show lint monster being hit by air blast, add debris and lint particles flying, enhance impact effects",
        "image_url": "https://v3.fal.media/files/tiger/VumKVuHYVZZ7E-battle.jpg"
      }
    ]
  }'
```

## Kontext Edit Categories

### **1. Perspective & Framing Changes**
```bash
# Close-up Details
"prompt": " Extreme close-up showing surface textures and fine details"

# Wide Shot Context  
"prompt": " Pull back to wide shot showing full environment and scale"

# Low Angle Power
"prompt": " Change to dramatic low angle, more heroic perspective"

# Over-Shoulder View
"prompt": " Shift to over-shoulder perspective, cinematic framing"
```

### **2. Lighting & Atmosphere**
```bash
# Dramatic Lighting
"prompt": " Enhance dramatic directional lighting, stronger rim lighting effects"

# Mood Adjustment
"prompt": " Add volumetric fog effects, more atmospheric depth"

# Color Enhancement
"prompt": " Intensify orange LED glow, enhance brand color saturation"

# Shadow Play
"prompt": " Increase shadow contrast, more cinematic shadow patterns"
```

### **3. Detail Enhancement**
```bash
# Texture Details
"prompt": " Enhance surface textures, more detailed material properties"

# Mechanical Details
"prompt": " Add more intricate mechanical components, enhanced tech details"

# Fabric/Clothing
"prompt": " Improve fabric textures, more realistic wear patterns"

# Expression Enhancement
"prompt": " Intensify facial expression, more determined confident look"
```

### **4. Action & Motion**
```bash
# Motion Effects
"prompt": " Add motion blur and speed lines, dynamic action effects"

# Impact Effects
"prompt": " Enhance impact with particle effects and debris"

# Energy Effects
"prompt": " Amplify energy weapon discharge, glowing particle streams"

# Environmental Interaction
"prompt": " Show interaction with vent environment, dust and air currents"
```

## Request Parameters

### **Single Edit Parameters**
```typescript
{
  prompt: string,                    // Required: Description of changes
  image_url: string,                // Required: Source image URL from Fal
  concept?: string,                 // Optional: Edit concept name
  model?: string,                   // Default: 'fal-ai/flux-pro/kontext'
  guidance_scale?: number,          // Default: 3.5 (change intensity)
  sync_mode?: boolean,              // Default: false
  num_images?: number,              // Default: 1
  safety_tolerance?: string,        // Default: "2"
  output_format?: string,           // Default: 'jpeg'
  aspect_ratio?: string,            // Default: '9:16'
  save_to_disk?: boolean,          // Default: true
  seed?: number                    // Optional: For reproducible edits
}
```

### **Batch Edit Parameters**
```typescript
{
  images: BatchKontextRequest[],    // Required: Array of edit requests
  save_to_disk?: boolean,          // Default: true
  master_prompt?: string,          // Optional: Override for entire batch
  guidance_scale?: number,         // Default: 3.5
  num_images?: number,             // Default: 1
  safety_tolerance?: string,       // Default: "2"
  output_format?: string,          // Default: 'jpeg'
  aspect_ratio?: string           // Default: '9:16'
}

interface BatchKontextRequest {
  concept: string,                 // Required: Edit concept name
  prompt: string,                 // Required: Change description
  image_url: string              // Required: Source image URL
}
```

## Advanced Editing Techniques

### **Progressive Enhancement Workflow**
```bash
# Step 1: Generate base concept with LoRA
curl -X POST http://localhost:3000/api/flux-lora \
  -d '{"prompt": " Squad leader with tactical gear", "concept": "Base Squad Leader"}'

# Step 2: Enhance lighting with Kontext
curl -X POST http://localhost:3000/api/flux-kontext \
  -d '{
    "prompt": " Enhance dramatic lighting with orange rim glow",
    "image_url": "[URL from step 1]",
    "concept": "Enhanced Lighting"
  }'

# Step 3: Add detail focus with Kontext
curl -X POST http://localhost:3000/api/flux-kontext \
  -d '{
    "prompt": " Close-up on tactical equipment details",
    "image_url": "[URL from step 2]", 
    "concept": "Equipment Detail"
  }'
```

### **Variation Creation**
```bash
# Create multiple versions of same base image
{
  "images": [
    {
      "concept": "Close-up Version",
      "prompt": " Zoom into facial details, enhanced expression",
      "image_url": "[base-image-url]"
    },
    {
      "concept": "Action Version", 
      "prompt": " Add motion effects and dynamic pose",
      "image_url": "[base-image-url]"
    },
    {
      "concept": "Environmental Version",
      "prompt": " Show more vent tunnel background context",
      "image_url": "[base-image-url]"
    }
  ]
}
```

## Editing Parameters Guide

### **Guidance Scale for Edits**
```typescript
// Subtle Changes
{
  "guidance_scale": 2.0  // Minimal modifications
}

// Balanced Changes (default)
{
  "guidance_scale": 3.5  // Moderate modifications
}

// Dramatic Changes
{
  "guidance_scale": 5.0  // Significant transformations
}
```

### **Aspect Ratio Adjustments**
```typescript
// Maintain Original
{
  "aspect_ratio": "9:16"  // Keep source proportions
}

// Cinematic Framing
{
  "aspect_ratio": "16:9"  // Wide cinematic format
}

// Square Crop
{
  "aspect_ratio": "1:1"   // Square social media format
}
```

## Response Format

### **Single Edit Response**
```json
{
  "images": [{
    "url": "https://fal.media/files/kangaroo/enhanced-result.jpg",
    "content_type": "image/jpeg",
    "width": 752,
    "height": 1392,
    "local_path": "images/concept-name-timestamp.jpg"
  }],
  "seed": 1226316029,
  "has_nsfw_concepts": [false],
  "message": "Kontext image generated and saved successfully",
  "saved_to_disk": true
}
```

### **Batch Edit Response**
```json
{
  "message": "Batch kontext generation completed: 2/2 successful",
  "total_requested": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "concept": "Close-up Detail",
      "status": "success",
      "image": {
        "url": "https://fal.media/files/enhanced1.jpg",
        "fal_image_url": "https://fal.media/files/enhanced1.jpg"
      },
      "local_path": "images/close-up-detail-timestamp.jpg",
      "source_image_url": "https://v3.fal.media/files/original.jpg",
      "generation_data": {
        "seed": 2878148552,
        "has_nsfw_concepts": [false]
      }
    }
  ],
  "estimated_total_cost": "$0.06"
}
```

## Common Edit Workflows

### **Character Enhancement Pipeline**
1. **LoRA Generation** → Basic character concept
2. **Lighting Enhancement** → Dramatic lighting with Kontext  
3. **Detail Focus** → Close-up equipment/face details
4. **Expression Refinement** → Fine-tune facial expressions
5. **Final Polish** → Color grading and atmosphere

### **Environment Development**
1. **LoRA Scene** → Basic environment layout
2. **Perspective Shift** → Adjust camera angle with Kontext
3. **Atmosphere Addition** → Add fog, lighting effects
4. **Detail Enhancement** → Texture and surface improvements
5. **Mood Adjustment** → Final atmospheric tweaks

### **Action Sequence Creation**
1. **LoRA Static Pose** → Character in basic position
2. **Motion Addition** → Add blur and speed effects
3. **Impact Effects** → Weapon discharge and debris
4. **Environmental Response** → Show effect on surroundings
5. **Cinematic Enhancement** → Final dramatic improvements

## Performance & Cost

### **Edit Metrics**
- **Average time**: ~3-4 seconds per edit
- **Cost per edit**: ~$0.03
- **Success rate**: 100% (based on testing)
- **Quality**: Maintains source image quality with enhancements

### **Cost Efficiency**
- **Cheaper than LoRA** - Better for refinements than full generation
- **Targeted changes** - Only pay for specific modifications
- **Iterative workflow** - Build up edits progressively

## Best Practices for Style-Preserving Edits

### **Scene-Only Prompt Writing Strategy**
- **Describe scene changes** - "zoom in", "add elements", "change angle"
- **Focus on composition** - What should be visible, positioned, or emphasized
- **Detail modifications** - Add/remove specific objects or environmental elements
- **Perspective adjustments** - Camera angle, framing, focus changes
- **NEVER mention style** - Let Kontext preserve the existing visual treatment

### **Style Preservation Guidelines**
- **Trust the model** - Kontext automatically maintains visual consistency
- **Scene-focused prompts** - Only describe what changes in the content/composition
- **Small or large edits** - Style preservation applies to all modification scales
- **Batch consistency** - All images in batch maintain identical style from source

### **Iterative Enhancement with Style Consistency**
- **Preserve throughout chain** - Each edit maintains style from original source
- **Scene evolution** - Let scenes change while style remains constant
- **Detail refinement** - Add complexity without style drift
- **Compositional development** - Enhance framing while keeping visual treatment

### **Quality Control for Style Preservation**
- **Compare visual style** - Ensure output matches source image's artistic approach
- **Check consistency** - Verify lighting, color palette, and rendering style match
- **Scene vs Style** - Confirm only scene content changed, not visual treatment
- **Batch uniformity** - All batch results should have identical visual style

## Integration with Workflow

### **Coming from Flux-LoRA**
Generated images from LoRA provide both content and style template for Kontext:
- **Style template established** - LoRA sets the visual style foundation
- **Scene modifications only** - Kontext modifies content while preserving LoRA style
- **Consistency maintained** - Original artistic vision preserved through edit chain
- **Workflow continuity** - Style established in LoRA, refined in Kontext

### **Style Preservation Chain**
```
LoRA Generation → Kontext Edit 1 → Kontext Edit 2 → Kontext Edit 3
    ↓               ↓               ↓               ↓
 Sets Style    Preserves Style  Preserves Style  Preserves Style
Creates Scene   Modifies Scene   Modifies Scene   Modifies Scene
```

## Troubleshooting

### **Common Issues**
1. **Invalid image_url** - Ensure Fal URL is still accessible (7-day retention)
2. **Minimal changes** - Increase guidance_scale for more dramatic edits
3. **Over-processing** - Reduce guidance_scale for subtle refinements
4. **Source image quality** - Higher quality sources produce better edits

### **Edit Recovery**
- **Fal URL expiration** - Use local copies for continued editing
- **Failed edits** - Try different prompt approaches
- **Quality degradation** - Return to earlier version in edit chain

---

*Step 2 Complete! Perfect for fine-tuning your Flux-LoRA concepts.* 