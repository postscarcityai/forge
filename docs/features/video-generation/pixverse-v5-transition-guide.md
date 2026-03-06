# PixVerse V5 Transition Video Generation Guide

## Overview

PixVerse V5 Transition is a powerful video generation model that creates seamless transitions between two images. This endpoint leverages the [fal-ai/pixverse/v5/transition API](https://fal.ai/models/fal-ai/pixverse/v5/transition/api) to generate smooth, cinematic transitions that morph one image into another.

## When to Use PixVerse V5 Transition

✅ **Perfect For:**
- **Image morphing** - Seamless transitions between different scenes or characters
- **Story continuity** - Creating narrative bridges between key moments
- **Creative transitions** - Artistic morphs for visual storytelling
- **Before/after sequences** - Showing transformations over time
- **Character evolution** - Morphing between different character states

❌ **Not Ideal For:**
- **Single image animation** - Use regular image-to-video for single image motion
- **Text-to-video** - Use text-to-video endpoints for generating from prompts only
- **Video extension** - Use video extension endpoints for lengthening existing videos

## API Endpoint

```
POST /api/pixverse-transition
```

## Request Parameters

### **Required Parameters**
```typescript
{
  prompt: string,                    // Required: Description of the transition
  first_image_url: string,          // Required: URL of the starting image
  last_image_url: string            // Required: URL of the ending image
}
```

### **Optional Parameters**
```typescript
{
  duration?: "5" | "8",             // Default: "5" (5 or 8 seconds)
  resolution?: "360p" | "540p" | "720p" | "1080p",  // Default: "720p"
  aspect_ratio?: string,            // IGNORED - Uses project default
  negative_prompt?: string,         // Default: extensive quality filters
  style?: "anime" | "3d_animation" | "clay" | "comic" | "cyberpunk",
  seed?: number,                    // Optional: For reproducible results
  concept?: string,                 // Optional: Concept name for organization
  save_to_disk?: boolean           // Default: true
}
```

## Usage Examples

### **Basic Transition**
```bash
curl -X POST http://localhost:3000/api/pixverse-transition \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Smooth transition from day to night scene",
    "first_image_url": "https://v3.fal.media/files/day-scene.jpg",
    "last_image_url": "https://v3.fal.media/files/night-scene.jpg",
    "concept": "Day to Night Transition"
  }'
```

### **Character Transformation**
```bash
curl -X POST http://localhost:3000/api/pixverse-transition \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Character transforms from young to elderly, aging gracefully with wisdom in their eyes",
    "first_image_url": "https://v3.fal.media/files/young-character.jpg", 
    "last_image_url": "https://v3.fal.media/files/elderly-character.jpg",
    "duration": "8",
    "resolution": "1080p",
    "concept": "Character Aging Transition"
  }'
```

### **Stylized Animation Transition**
```bash
curl -X POST http://localhost:3000/api/pixverse-transition \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Magical transformation with sparkles and energy",
    "first_image_url": "https://v3.fal.media/files/before-magic.jpg",
    "last_image_url": "https://v3.fal.media/files/after-magic.jpg",
    "style": "anime",
    "duration": "5",
    "seed": 12345,
    "concept": "Magical Transformation"
  }'
```

### **JavaScript/Fetch Example**
```javascript
const response = await fetch('/api/pixverse-transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Seamless morphing between two architectural styles",
    first_image_url: "https://v3.fal.media/files/modern-building.jpg",
    last_image_url: "https://v3.fal.media/files/classical-building.jpg",
    duration: "8",
    resolution: "720p",
    concept: "Architecture Evolution"
  })
})

const result = await response.json()
if (result.video?.url) {
  console.log('Transition video generated:', result.video.url)
  console.log('Local path:', result.local_path)
}
```

## Parameter Details

### **Duration Options**
- `"5"` - 5 second transition (faster, standard cost)
- `"8"` - 8 second transition (longer, double cost)

### **Resolution Options**
- `"360p"` - Low resolution, fastest generation
- `"540p"` - Medium resolution, balanced quality/speed
- `"720p"` - High resolution, good quality (default)
- `"1080p"` - Highest resolution, best quality (limited to 5 seconds)

### **Style Options**
- `"anime"` - Japanese animation style
- `"3d_animation"` - 3D rendered animation style
- `"clay"` - Claymation/stop-motion style
- `"comic"` - Comic book illustration style
- `"cyberpunk"` - Futuristic cyberpunk aesthetic
- *No style* - Realistic/photographic style (default)

### **Aspect Ratio Behavior**
⚠️ **Important**: The `aspect_ratio` parameter is **always ignored**. The system uses your project's default aspect ratio setting for consistency across all generated content.

## Response Format

```json
{
  "video": {
    "url": "https://v3.fal.media/files/transition-video.mp4",
    "width": 720,
    "height": 1280,
    "content_type": "video/mp4"
  },
  "message": "PixVerse V5 transition video generated and saved successfully",
  "saved_to_disk": true,
  "local_path": "concept-transition-2025-09-19T22-35-12-345Z.mp4",
  "generation_data": {
    "model_used": "fal-ai/pixverse/v5/transition",
    "input_parameters": {
      "prompt": "Smooth transition from day to night scene",
      "first_image_url": "https://v3.fal.media/files/day-scene.jpg",
      "last_image_url": "https://v3.fal.media/files/night-scene.jpg",
      "duration": "5",
      "resolution": "720p",
      "aspect_ratio": "9:16",
      "style": "default"
    }
  }
}
```

## Best Practices

### **Image Selection**
1. **Similar composition** - Images with similar layouts transition more smoothly
2. **Consistent lighting** - Similar lighting conditions create better morphs
3. **Matching subjects** - Transitions work best between similar subjects/scenes
4. **High quality source** - Better input images produce better transitions

### **Prompt Writing**
```typescript
// Good transition prompts
"Smooth morphing between architectural styles with flowing details"
"Character gracefully aging with natural progression and wisdom"
"Landscape transitioning from summer to winter with seasonal changes"
"Magical transformation with sparkles and energy effects"

// Avoid generic prompts
"Change from A to B"
"Transform"
"Morph"
```

### **Technical Optimization**
- **Use 720p resolution** for best quality/speed balance
- **5 second duration** is usually sufficient for most transitions
- **Consistent aspect ratios** between source images work better
- **Similar resolution** source images produce smoother results

## Creative Applications

### **Storytelling Sequences**
```bash
# Character journey progression
curl -X POST http://localhost:3000/api/pixverse-transition \
  -d '{
    "prompt": "Hero transforms from novice to master warrior, gaining confidence and strength",
    "first_image_url": "https://example.com/novice-hero.jpg",
    "last_image_url": "https://example.com/master-warrior.jpg"
  }'
```

### **Environmental Changes**
```bash
# Seasonal transitions
curl -X POST http://localhost:3000/api/pixverse-transition \
  -d '{
    "prompt": "Forest transitions through seasons from vibrant autumn to snowy winter",
    "first_image_url": "https://example.com/autumn-forest.jpg", 
    "last_image_url": "https://example.com/winter-forest.jpg",
    "duration": "8"
  }'
```

### **Concept Visualization**
```bash
# Abstract concept morphing
curl -X POST http://localhost:3000/api/pixverse-transition \
  -d '{
    "prompt": "Abstract representation of chaos morphing into order with geometric patterns",
    "first_image_url": "https://example.com/chaos-abstract.jpg",
    "last_image_url": "https://example.com/order-abstract.jpg",
    "style": "3d_animation"
  }'
```

## Error Handling

### **Common Errors**
```json
// Missing required parameters
{ "error": "Prompt is required", "status": 400 }
{ "error": "First image URL is required", "status": 400 }
{ "error": "Last image URL is required", "status": 400 }

// Invalid parameters
{ "error": "Duration must be either \"5\" or \"8\" seconds", "status": 400 }
{ "error": "Resolution must be one of: 360p, 540p, 720p, 1080p", "status": 400 }

// API configuration
{ "error": "FAL_KEY not configured", "status": 500 }

// Generation failure
{ "error": "Failed to generate transition video", "status": 500 }
```

### **Debugging Tips**
1. **Check image URLs** - Ensure both images are publicly accessible
2. **Verify image format** - Use standard formats (JPG, PNG, WebP)
3. **Test image similarity** - Very different images may not transition well
4. **Monitor console logs** - Check server logs for detailed error messages
5. **Try different prompts** - More descriptive prompts often work better

## Performance & Costs

### **Generation Times**
- **720p, 5 seconds**: ~30-60 seconds
- **1080p, 5 seconds**: ~60-90 seconds  
- **720p, 8 seconds**: ~45-75 seconds

### **Cost Estimates**
- **5 second video**: ~$0.10-0.15
- **8 second video**: ~$0.20-0.30 (double cost)
- **1080p resolution**: Premium pricing

### **Optimization Tips**
- Use **720p resolution** for best value
- **5 second duration** for most use cases
- **Batch similar transitions** for efficiency
- **Reuse successful seeds** for consistent results

## Integration with Timeline

Generated transition videos automatically:
- **Appear in timeline** within 5 seconds via file system monitoring
- **Include full metadata** for organization and searchability
- **Support drag & drop** to gallery or further editing
- **Maintain project context** with automatic categorization

## Advanced Techniques

### **Multi-Step Transitions**
For complex transformations, create multiple transition videos:
1. **Image A → Image B** (first transition)
2. **Image B → Image C** (second transition)  
3. **Image C → Image D** (final transition)

### **Style Consistency**
Use the same `seed` value across related transitions for visual consistency:
```javascript
const seed = 12345
// Use same seed for all transitions in a sequence
```

### **Prompt Chaining**
Build related prompts for narrative sequences:
```javascript
const transitions = [
  "Character begins their journey with hope and determination",
  "Character faces challenges and grows stronger through adversity", 
  "Character achieves mastery and wisdom from their experiences"
]
```

## Related Documentation

- [PixVerse V4 Image-to-Video Guide](pixverse-image-to-video-guide.md)
- [Video Generation API Overview](../api/README.md#video-generation-apis)
- [Project Settings Configuration](../project-management/)
- [Timeline Integration Guide](../auto-sync/)

---

*Ready to create seamless visual transitions between your images!*
