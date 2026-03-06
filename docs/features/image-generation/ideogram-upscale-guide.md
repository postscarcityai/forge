# Ideogram Upscale Guide

## Overview
Ideogram Upscale enhances image resolution by up to 2X while optionally refining the image with prompts. This guide covers how to use the Ideogram upscale API endpoint in Forge.

## API Endpoint
`POST /api/ideogram-upscale`

## Request Parameters

### Required
- `image_url` (string): The image URL to upscale

### Optional
- `prompt` (string): The prompt to upscale the image with (default: `""`)
- `resemblance` (integer): The resemblance of the upscaled image to the original image, 0-100 (default: `50`)
- `detail` (integer): The detail of the upscaled image, 0-100 (default: `50`)
- `expand_prompt` (boolean): Whether to expand the prompt with MagicPrompt functionality (default: `false`)
- `seed` (integer): Seed for the random number generator (optional)
- `sync_mode` (boolean): Wait for upload before returning response (default: `false`)
- `save_to_disk` (boolean): Whether to save the upscaled image to local storage (default: `true`)

## Example Request

```javascript
const response = await fetch('/api/ideogram-upscale', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: 'https://example.com/image.jpg',
    prompt: 'enhance details and clarity',
    resemblance: 70,
    detail: 80,
    expand_prompt: true
  })
});

const result = await response.json();
```

## Response Format

```json
{
  "images": [
    {
      "url": "https://v3.fal.media/files/...",
      "content_type": "image/png",
      "file_name": "image.png",
      "file_size": 5504243,
      "local_path": "images/ideogram-upscale-2025-01-XX-XX-XX-XXX-00.jpg"
    }
  ],
  "seed": 21159,
  "message": "Images upscaled with Ideogram and saved successfully",
  "saved_to_disk": true,
  "local_paths": [
    "images/ideogram-upscale-2025-01-XX-XX-XX-XXX-00.jpg"
  ],
  "generation_data": {
    "model_used": "fal-ai/ideogram/upscale",
    "input_parameters": {
      "prompt": "enhance details and clarity",
      "resemblance": 70,
      "detail": 80,
      "expand_prompt": true
    }
  }
}
```

## Key Features

### Prompt-Guided Enhancement
- **No prompt**: Pure upscaling with no style changes
- **With prompt**: Guide the enhancement with specific instructions
- **MagicPrompt**: Auto-expand prompts for better results

### Quality Controls
- **Resemblance (0-100)**: How closely the result matches the original
  - `0`: Maximum creative freedom
  - `50`: Balanced (default)
  - `100`: Maximum fidelity to original
- **Detail (0-100)**: Level of detail enhancement
  - `0`: Minimal detail addition
  - `50`: Balanced (default)
  - `100`: Maximum detail enhancement

## Best Practices

1. **Balanced settings**: Start with defaults (50/50) for most images
2. **High resemblance**: Use 70-90 for photos where accuracy is critical
3. **High detail**: Use 70-90 for images that need more sharpness
4. **Prompt guidance**: Add prompts for specific enhancements like "sharper details" or "enhanced contrast"
5. **MagicPrompt**: Enable for automatic prompt enhancement

## Use Cases

- **Photo enhancement**: Improve resolution of photographs with 2x scaling
- **Document upscaling**: Enhance scanned documents and text
- **Digital art**: Upscale artwork while maintaining style
- **Print preparation**: Prepare images for higher resolution printing
- **Archive restoration**: Improve quality of historical images

## Comparison with AuraSR

| Feature | Ideogram Upscale | AuraSR |
|---------|------------------|---------|
| **Scale Factor** | 2x | 4x |
| **Prompt Support** | ✅ Yes | ❌ No |
| **Quality Controls** | Resemblance + Detail | Checkpoint + Overlapping |
| **Speed** | Fast | Medium-Fast |
| **Best For** | Prompt-guided enhancement | Pure upscaling |

## Error Handling

The API will return appropriate error messages for:
- Missing image URL
- Invalid resemblance/detail values (must be 0-100)
- FAL API configuration issues

## Integration Notes

- Images are automatically saved to the project gallery when `save_to_disk` is true
- Metadata includes all generation parameters and seed for reproducibility
- Multiple images can be returned (though typically just one for upscaling)
- Uses database-stored environment variables for FAL API key management
- Follows the same authentication pattern as other FAL API routes 