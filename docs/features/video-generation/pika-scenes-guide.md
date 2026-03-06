# Pika Scenes Video Generation Guide

## Overview

The Pika Scenes v2.2 API creates high-quality videos by combining multiple images into a single cohesive video that incorporates all objects from the input images. This is perfect for creating dynamic scenes from multiple static images.

## Endpoint

```
POST /api/pika-scenes
```

## Features

- **Multi-Image Input**: Combine up to 5 images into a single video
- **High Quality Output**: Pika's highest quality video model
- **Project-Aware**: Automatically uses project-specific settings
- **Flexible Modes**: Choose between "creative" and "precise" integration modes
- **Multiple Resolutions**: Support for 720p and 1080p output

## Request Parameters

### Required
- `prompt` (string): Text description of the desired video content
- `images` (array): Array of image URLs (1-5 images, strings)

### Optional
- `seed` (integer): Random seed for reproducible results
- `negative_prompt` (string): What to avoid in the generation (default: "")
- `resolution` (string): "720p" or "1080p" (default: "720p")
- `duration` (integer): Video duration in seconds (default: 5)
- `ingredients_mode` (string): "creative" or "precise" (default: "creative")
  - **Creative**: More artistic interpretation of combining images
  - **Precise**: More literal combination of image elements
- `concept` (string): Title/concept for the generated video
- `save_to_disk` (boolean): Whether to save video locally (default: true)

### Project Settings
- `aspect_ratio`: Always uses project default (16:9, 9:16, or 1:1)
- `FAL_KEY`: Uses project-specific or user-level API key from database

## Example Usage

### Basic Multi-Image Video
```javascript
const response = await fetch('/api/pika-scenes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "A cat and dog playing together in a sunny garden",
    images: [
      "https://example.com/cat-image.jpg",
      "https://example.com/dog-image.jpg", 
      "https://example.com/garden-image.jpg"
    ],
    concept: "Pet Playtime",
    duration: 5,
    resolution: "1080p",
    ingredients_mode: "creative"
  })
});
```

### Advanced Configuration
```javascript
const response = await fetch('/api/pika-scenes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Epic battle scene with heroes from different worlds",
    images: [
      "https://example.com/hero1.jpg",
      "https://example.com/hero2.jpg",
      "https://example.com/hero3.jpg",
      "https://example.com/battlefield.jpg"
    ],
    negative_prompt: "blur, low quality, distorted faces",
    seed: 12345,
    concept: "Multi-Hero Battle",
    duration: 8,
    resolution: "1080p",
    ingredients_mode: "precise"
  })
});
```

## Response Format

### Success Response
```json
{
  "video": {
    "url": "https://v3.fal.media/files/zebra/xyz123.mp4",
    "content_type": "video/mp4",
    "file_size": 15728640
  },
  "seed": 12345,
  "timings": {
    "inference": 45.2
  },
  "message": "Pika Scenes video generated and saved successfully",
  "saved_to_disk": true,
  "local_path": "videos/clips/pika-scenes-pet-playtime-2024-01-15T10-30-00-000Z.mp4",
  "video_metadata": {
    "id": "pika-scenes-1705318200000-abc123",
    "title": "Pet Playtime",
    "description": "A cat and dog playing together in a sunny garden",
    "filename": "pika-scenes-pet-playtime-2024-01-15T10-30-00-000Z.mp4",
    "projectId": "current-project-id",
    "imageCount": 3
  },
  "generation_data": {
    "seed": 12345,
    "inference_time": 45.2,
    "images_used": 3,
    "model_used": "fal-ai/pika/v2.2/pikascenes"
  },
  "should_refresh_gallery": true
}
```

### Error Response
```json
{
  "error": "Maximum of 5 images allowed",
  "details": "..."
}
```

## Validation Rules

1. **Prompt**: Required, non-empty string
2. **Images**: 
   - Required array with 1-5 valid image URLs
   - Each URL must be a non-empty string
   - URLs should be publicly accessible
3. **Resolution**: Must be "720p" or "1080p"
4. **Duration**: Typically 1-10 seconds
5. **Ingredients Mode**: Must be "creative" or "precise"

## File Storage

### Local Storage
- Videos saved to: `public/videos/clips/`
- Metadata saved to: `public/videos/clips/video-info/`
- Filename format: `pika-scenes-{concept}-{timestamp}.mp4`

### Database Storage
- Automatically saved to SQLite database
- Associated with current project
- Includes complete generation metadata
- Immediately synced for UI updates

## Common Use Cases

### 1. Character Combination Videos
Combine multiple character images into action scenes:
```javascript
{
  prompt: "Three superheroes team up for an epic battle",
  images: ["hero1.jpg", "hero2.jpg", "hero3.jpg"],
  ingredients_mode: "precise"
}
```

### 2. Scene Composition
Merge different scene elements:
```javascript
{
  prompt: "Magical forest with floating islands and waterfalls",
  images: ["forest.jpg", "islands.jpg", "waterfall.jpg"],
  ingredients_mode: "creative"
}
```

### 3. Product Showcases
Create dynamic product videos:
```javascript
{
  prompt: "Luxury watch showcase in elegant setting",
  images: ["watch.jpg", "luxury-background.jpg"],
  duration: 8,
  resolution: "1080p"
}
```

## Tips for Best Results

1. **Image Quality**: Use high-resolution, clear images for best results
2. **Consistent Style**: Images with similar lighting/style work better together
3. **Creative Mode**: Better for artistic, stylized combinations
4. **Precise Mode**: Better for realistic, literal combinations
5. **Clear Prompts**: Describe how you want the images to interact
6. **Appropriate Duration**: 5-8 seconds works well for most content

## Integration with Forge

- **Project Settings**: Automatically uses project aspect ratio preferences
- **Database Storage**: All videos stored with project association
- **Gallery Integration**: Generated videos appear in project gallery
- **Metadata Tracking**: Complete generation history preserved
- **Sync System**: Immediate database synchronization for UI updates

## Error Handling

The API includes comprehensive error handling for:
- Invalid image URLs
- Too many images (>5)
- Missing required parameters
- FAL AI API errors
- File system errors
- Database storage issues

## Performance Considerations

- **Generation Time**: Typically 30-60 seconds depending on complexity
- **File Size**: Videos range from 5-50MB depending on resolution/duration
- **Queue Status**: Long-running requests show progress updates
- **Storage**: Automatic cleanup of old generations (if configured) 