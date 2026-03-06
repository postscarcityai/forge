# Framepack Video Generation

## 🎬 Overview

The Framepack API generates videos from two input images using the fal.ai framepack model (`fal-ai/framepack/flf2v`). This model creates smooth transitions between a first frame and last frame, generating intermediate frames based on your prompt.

## 🎯 Key Features

- **First-to-Last Frame Generation**: Interpolates between two input images
- **Prompt-Guided Animation**: Uses text prompts to control the video generation
- **Multiple Aspect Ratios**: Supports 16:9 and 9:16 aspect ratios
- **Quality Control**: Choose between 480p and 720p resolution
- **Frame Count Control**: Generate videos with up to 240 frames
- **Automatic Save**: Videos are saved to disk with full metadata

## 🚀 API Endpoint

**POST** `/api/framepack`

Generate videos with framepack image-to-video model.

### Request Schema

```typescript
interface FramepackRequest {
  prompt: string                    // Required: Video generation prompt (max 500 chars)
  image_url: string                // Required: URL of the first frame image
  end_image_url: string            // Required: URL of the last frame image
  negative_prompt?: string         // Optional: What to avoid in generation
  seed?: number                    // Optional: For reproducible results
  aspect_ratio?: string           // Optional: "16:9" or "9:16" (default: "16:9")
  resolution?: string             // Optional: "480p" or "720p" (default: "480p")
  cfg_scale?: number              // Optional: CFG guidance (default: 1)
  guidance_scale?: number         // Optional: Generation guidance (default: 10)
  num_frames?: number             // Optional: Frame count (default: 240)
  strength?: number               // Optional: End frame influence (default: 0.8)
  enable_safety_checker?: boolean // Optional: Enable safety checks (default: true)
  save_to_disk?: boolean          // Optional: Save video locally (default: true)
}
```

### Response Schema

```typescript
interface FramepackResponse {
  video: {
    url: string                   // Remote video URL from fal.ai
    local_path?: string          // Local path if saved to disk
    content_type?: string        // Video MIME type
    file_name?: string           // Original filename
    file_size?: number           // File size in bytes
  }
  seed: number                   // Seed used for generation
  message: string                // Success message
  saved_to_disk: boolean         // Whether video was saved locally
  local_path?: string            // Local file path
  generation_data: {
    seed: number
    model_used: string
    input_parameters: {
      aspect_ratio: string
      resolution: string
      num_frames: number
      strength: number
    }
  }
}
```

## 📝 Usage Examples

### Basic Video Generation

```javascript
const response = await fetch('/api/framepack', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: "A cat transforms into a dragon with magical sparkles",
    image_url: "https://example.com/first-frame.jpg",
    end_image_url: "https://example.com/last-frame.jpg"
  })
});

const result = await response.json();
console.log('Video generated:', result.video.url);
```

### Advanced Configuration

```javascript
const response = await fetch('/api/framepack', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: "Epic cinematic transformation scene with dramatic lighting",
    image_url: "https://example.com/hero-start.jpg",
    end_image_url: "https://example.com/hero-end.jpg",
    negative_prompt: "blurry, low quality, distorted",
    aspect_ratio: "16:9",
    resolution: "720p",
    num_frames: 180,
    strength: 0.9,
    guidance_scale: 12,
    seed: 12345
  })
});
```

## ⚙️ Parameter Details

### Core Parameters

- **prompt**: Text description of the desired video transformation (500 char limit)
- **image_url**: URL of the starting frame image
- **end_image_url**: URL of the ending frame image

### Quality Settings

- **aspect_ratio**: Video dimensions
  - `"16:9"`: Landscape format (default)
  - `"9:16"`: Portrait format
  
- **resolution**: Video quality
  - `"480p"`: Standard quality (default, faster)
  - `"720p"`: High quality (1.5x cost, slower)

### Generation Control

- **num_frames**: Number of frames to generate (default: 240)
- **strength**: Influence of the end frame (0.0-1.0, default: 0.8)
- **cfg_scale**: Classifier-Free Guidance scale (default: 1)
- **guidance_scale**: Generation guidance strength (default: 10)

## 💾 File Storage

Videos are automatically saved to:
- **Video files**: `public/videos/framepack-[timestamp].mp4`
- **Metadata**: `public/videos/video-info/framepack-[timestamp].mp4.meta.json`
- **Database**: Video metadata stored in SQLite database

### Metadata Structure

```json
{
  "id": "framepack-1234567890-abc123",
  "filename": "framepack-2024-01-15T10-30-00-000Z.mp4",
  "title": "Framepack Video - Epic cinematic transformation...",
  "description": "Epic cinematic transformation scene with dramatic lighting",
  "projectId": "current-project-id",
  "fileSize": 15728640,
  "metadata": {
    "prompt": "Epic cinematic transformation scene",
    "image_url": "https://example.com/hero-start.jpg",
    "end_image_url": "https://example.com/hero-end.jpg",
    "model": "fal-ai/framepack/flf2v",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "num_frames": 180,
    "strength": 0.9,
    "seed": 12345,
    "fal_video_url": "https://fal.media/files/video.mp4",
    "api_response": { /* Complete fal.ai response */ }
  }
}
```

## 🎨 Best Practices

### Prompt Guidelines
- Keep prompts under 500 characters
- Be specific about the desired transformation
- Include style and mood descriptors
- Use negative prompts to avoid unwanted elements

### Image Requirements
- Use high-quality, clear images for first and last frames
- Ensure images have similar composition and lighting
- Avoid extreme perspective changes between frames
- Consider the aspect ratio when selecting images

### Performance Tips
- Use `480p` for faster generation and testing
- Higher `strength` values make the end frame more influential
- Lower `num_frames` for quicker processing
- Use consistent `seed` values for reproducible results

## 🔧 Error Handling

```javascript
try {
  const response = await fetch('/api/framepack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Generation failed:', error.details);
    return;
  }
  
  const result = await response.json();
  // Handle successful generation
} catch (error) {
  console.error('Request failed:', error);
}
```

## 📊 Cost Considerations

- **480p**: Standard cost per video
- **720p**: 1.5x cost per video
- Frame count affects generation time but not cost
- Failed generations are not charged

## 🔗 Related Models

- **Flux-LoRA**: For still image generation with style control
- **Flux-Kontext**: For image editing and transformations

For more information, see the [API Documentation](../api/README.md). 