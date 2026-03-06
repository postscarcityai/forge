# AuraSR Image Upscaling Guide

## Overview
AuraSR is a powerful image upscaling service that can enhance image resolution by 4x while maintaining quality and detail. This guide covers how to use the AuraSR API endpoint in Forge.

## API Endpoint
`POST /api/aura-sr`

## Request Parameters

### Required
- `image_url` (string): URL of the image to upscale

### Optional
- `upscaling_factor` (number): Upscaling factor. Currently only `4` is supported (default: `4`)
- `overlapping_tiles` (boolean): Whether to use overlapping tiles for upscaling. Setting this to `true` helps remove seams but doubles the inference time (default: `false`)
- `checkpoint` (string): Checkpoint to use for upscaling. Options: `"v1"`, `"v2"` (default: `"v1"`)
- `save_to_disk` (boolean): Whether to save the upscaled image to local storage (default: `true`)

## Example Request

```javascript
const response = await fetch('/api/aura-sr', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: 'https://example.com/image.jpg',
    upscaling_factor: 4,
    overlapping_tiles: true,
    checkpoint: 'v2',
    save_to_disk: true
  })
});

const result = await response.json();
```

## Response Format

```json
{
  "image": {
    "url": "https://fal.media/files/...",
    "content_type": "image/png",
    "file_name": "upscaled_image.png",
    "file_size": 4404019,
    "width": 2048,
    "height": 2048,
    "local_path": "images/aura-sr-2025-01-XX-XX-XX-XXX.png"
  },
  "timings": {
    "inference": 2.5
  },
  "message": "Image upscaled with AuraSR and saved successfully",
  "saved_to_disk": true,
  "local_path": "images/aura-sr-2025-01-XX-XX-XX-XXX.png",
  "generation_data": {
    "model_used": "fal-ai/aura-sr",
    "input_parameters": {
      "upscaling_factor": 4,
      "overlapping_tiles": true,
      "checkpoint": "v2"
    }
  }
}
```

## Features

### Quality Options
- **v1 checkpoint**: Standard quality upscaling
- **v2 checkpoint**: Enhanced quality with better detail preservation

### Tiling Options
- **Standard tiling**: Faster processing, may have slight seams
- **Overlapping tiles**: Better seamless results, takes 2x longer

## Best Practices

1. **Choose the right checkpoint**: Use `v2` for higher quality results when processing time isn't critical
2. **Overlapping tiles**: Enable for images where seam removal is important
3. **File size considerations**: Upscaled images will be significantly larger (16x the original size)
4. **Input quality**: Higher quality input images will produce better upscaled results

## Use Cases

- **Photo enhancement**: Improve resolution of photographs
- **Digital art upscaling**: Enhance artwork and illustrations  
- **Archive restoration**: Improve quality of historical images
- **Print preparation**: Prepare images for high-resolution printing

## Error Handling

The API will return appropriate error messages for:
- Missing image URL
- Invalid upscaling factor
- Invalid checkpoint selection
- FAL API configuration issues

## Integration Notes

- Images are automatically saved to the project gallery when `save_to_disk` is true
- Metadata is preserved including generation parameters and timestamps
- The endpoint follows the same authentication pattern as other FAL API routes
- Uses database-stored environment variables for FAL API key management 