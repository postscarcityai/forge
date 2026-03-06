# Kling Video v2.5 Turbo Pro Implementation

## Overview

Added support for the new **Kling Video v2.5 Turbo Pro** image-to-video generation model, which provides top-tier video generation with unparalleled motion fluidity, cinematic visuals, and exceptional prompt precision.

## API Endpoint

- **Route**: `/api/kling-video-v25-turbo-pro`
- **Method**: `POST`
- **Model**: `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`

## Key Features

- **Enhanced Quality**: Superior motion fluidity and cinematic visuals compared to v2.1
- **Better Prompt Precision**: More accurate interpretation of prompts
- **Professional Grade**: Turbo Pro tier for highest quality output
- **Project Integration**: Automatically uses current project context
- **Database Storage**: Videos are saved locally and synced to database
- **Comprehensive Metadata**: Full tracking of generation parameters

## Request Parameters

### Required
- `prompt` (string): Description of the desired video content
- `image_url` (string): URL of the source image for video generation

### Optional
- `duration` (string): Video duration - "5" or "10" seconds (default: "5")
- `negative_prompt` (string): What to avoid in generation (default: "blur, distort, and low quality")
- `cfg_scale` (float): Guidance scale 0-1 (default: 0.5)
- `concept` (string): Concept name for organization
- `save_to_disk` (boolean): Whether to save locally (default: true)

## Example Usage

```javascript
const response = await fetch('/api/kling-video-v25-turbo-pro', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: "A stark starting line divides two powerful cars, engines revving for the challenge ahead. They surge forward in the heat of competition, a blur of speed and chrome. The finish line looms as they vie for victory.",
    image_url: "https://example.com/image.jpg",
    duration: "5",
    concept: "Racing Scene"
  })
});

const result = await response.json();
```

## Response Format

```json
{
  "video": {
    "url": "https://storage.googleapis.com/falserverless/..."
  },
  "local_path": "/videos/project-id/kling-v25-turbo-pro-racing-scene-2025-09-24.mp4",
  "video_metadata": {
    "id": "kling-v25-turbo-pro-1727184123456-abc123def",
    "title": "Racing Scene",
    "description": "A stark starting line divides two powerful cars...",
    "filename": "kling-v25-turbo-pro-racing-scene-2025-09-24.mp4",
    "projectId": "current-project",
    "createdAt": "2025-09-24T12:00:00.000Z",
    "mediaType": "video"
  },
  "model_used": "fal-ai/kling-video/v2.5-turbo/pro/image-to-video"
}
```

## Differences from v2.1

1. **Model Endpoint**: Uses `v2.5-turbo/pro/image-to-video` instead of `v2.1/standard/image-to-video`
2. **Quality**: Significantly improved motion fluidity and visual quality
3. **Precision**: Better prompt adherence and more accurate generation
4. **Performance**: Turbo Pro tier for faster, higher-quality results
5. **Pricing**: $0.35 for 5s video, $0.07 per additional second

## File Organization

- Videos saved to: `public/videos/{projectId}/kling-v25-turbo-pro-{concept}-{timestamp}.mp4`
- Metadata saved to: `public/videos/{projectId}/kling-v25-turbo-pro-{concept}-{timestamp}.mp4.json`
- Database sync: Automatic sync to projects database for UI updates

## Integration Notes

- Uses project-specific FAL_KEY from database environment variables
- Automatically detects current project from server state
- Maintains consistent error handling and logging patterns
- Compatible with existing video management UI components
- Follows established file naming and metadata conventions

## Cost Considerations

The v2.5 Turbo Pro model is premium tier:
- 5-second video: $0.35
- Each additional second: $0.07
- 10-second video: $0.70 total

Consider duration settings based on project budget requirements.

