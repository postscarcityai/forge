# Nano Banana 2 - Image Generation

## When to Use
- User requests image generation with nano-banana or fal.ai
- Text-to-image or image-to-image editing
- Model: `fal-ai/nano-banana-2` (upgraded from nano-banana-pro)

## API Call (Single Image)
- **Endpoint**: `POST http://localhost:4900/api/nano-banana`
- **Required**: `prompt` (string)
- **Optional**:
  - `image_urls`: string[] (for image editing)
  - `aspect_ratio`: `auto` | `21:9` | `16:9` | `3:2` | `4:3` | `5:4` | `1:1` | `4:5` | `3:4` | `2:3` | `9:16`
  - `resolution`: `0.5K` | `1K` | `2K` | `4K`
  - `output_format`: `jpeg` | `png` | `webp`
  - `num_images`: number
  - `concept`: string (for filename)
  - `save_to_disk`: boolean (default true)

## API Call (Batch - Up to 10 Images)
- **Endpoint**: `POST http://localhost:4900/api/nano-banana/batch-generate`
- **Body**:
  ```json
  {
    "images": [
      { "prompt": "...", "aspect_ratio": "9:16", "resolution": "1K", "concept": "name" },
      { "prompt": "...", "aspect_ratio": "9:16", "resolution": "1K", "concept": "name" }
    ],
    "save_to_disk": true
  }
  ```

## Execution
- Call the API directly - no additional setup needed
- Images auto-save to `public/images/` with metadata
- Response includes `local_paths` array with saved file locations
- Never specify the aspect ratio, this is handled at the project level.

## Response Handling
- Single: `response.images[0].local_path`
- Batch: `response.results[].local_paths[]`
- Check `response.success` for status

## Style Shots
- Use `image_urls` array to pass both style shot and template image
- Style shot: Your design/product image (can be URL or local path)
- Template: Mockup/photography template (can be URL or local path)
- Prompt should describe the final composite result
- Works for any product mockup: skateboards, apparel, packaging, etc.
- Example: `"image_urls": ["style_shot_url", "template_path"]`

## Key Differences from Nano Banana Pro
- 4x faster inference
- Better text rendering (validates typography character-by-character)
- `limit_generations: true` by default (controlled output count)
- Supports `0.5K` resolution
- ~$0.15 per image
