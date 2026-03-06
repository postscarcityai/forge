# Veo 3.1 - Video Generation

## When to Use
- User requests video generation with veo3.1 or Google Veo
- Image-to-video animation
- First-last-frame interpolation (smooth transitions between two images)
- Text-to-video generation (when standard endpoint is available)

## API Endpoint
- **Endpoint**: `POST http://localhost:4900/api/veo3-fast`
- **Note**: Currently implements "fast" variants. Standard variants may be available via fal.ai directly.

## Important: curl Command Formatting

**ALWAYS escape quotes properly in curl commands** to avoid JSON parsing errors. Use single quotes for the outer JSON string and escape internal quotes with `\"` or use `$'...'` syntax.

Example:
```bash
curl -X POST http://localhost:4900/api/veo3-fast \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A character speaks with a sly voice. The script says: \"Hello world\"",
    "image_url": "https://example.com/image.png"
  }'
```

## Mode 1: Image-to-Video (with Audio/Speech Support)

Generate videos from a single static image with optional audio narration.

### Required Parameters
- `prompt` (string): **Complete video generation prompt** - must include ALL information:
  - Animation/movement description (be elaborate and detailed)
  - **VOICE: Be RIDICULOUSLY descriptive** - include tone, timbre, texture, pitch, resonance, breathiness, roughness, smoothness, gravel, vocal fry, accent, regionality, age, gender, emotional quality, warmth, coolness, confidence level
  - **DELIVERY: Detailed pacing** - volume, pacing rhythm, emotional anchor, pause patterns, emphasis points, timing
  - Script/dialogue text (include exact words to be spoken)
  - Camera movements and transitions
  - Exit animations or closing movements
  - Any character instructions
  - **Everything goes in the prompt - there is NO separate `speech` parameter**
  - **DO NOT be afraid of long prompts - this model handles detailed, elaborate prompts very well**
- `image_url` (string): Source image URL or local path (`/images/...` or `/videos/...`)

### Optional Parameters
- `aspect_ratio`: `16:9` | `9:16` (defaults to **input image dimensions** - automatically extracted)
- `duration`: `4s` | `6s` | `8s` (default: `8s`)
- `generate_audio`: boolean (default: `true`)
- `resolution`: `720p` | `1080p` (default: `720p`)
- `concept`: string (for filename/organization)
- `save_to_disk`: boolean (default: `true`)

### Aspect Ratio Handling
- **ALWAYS use the input image's dimensions** to determine aspect ratio
- The API automatically extracts dimensions from `image_url` and calculates the appropriate aspect ratio
- Only override with `aspect_ratio` parameter if you need to force a specific ratio

### Example Request
```json
{
  "prompt": "A sly banana character with sunglasses speaks directly to the camera. VOICE: Male, mature. Sly and snivelly, like an old-time wise guy. Bugs Bunny-like tone and timbre - playful, street-smart, with a slight Brooklyn accent. Smooth, confident delivery. DELIVERY: Steady pace, measured timing. Confident and knowing. Brief pause before the sunglasses reveal. The banana speaks: \"This week we're talking about Nano Banana, the most powerful AI image model out there.\" Then smoothly lowers his sunglasses with a cool, deliberate gesture and says: \"Stop by the Vibe Jam.\"",
  "image_url": "/images/my-banana.jpg",
  "duration": "8s",
  "generate_audio": true,
  "resolution": "1080p",
  "concept": "banana-intro"
}
```

### Response
- `video.url`: fal.ai video URL
- `local_path`: Saved video path (if `save_to_disk: true`)
- `next_frame_path`: Path to extracted last frame (for video chaining)
- `video_metadata`: Complete generation metadata

---

## Mode 2: First-Last-Frame-to-Video (Frame Interpolation)

Generate smooth transitions between two images by interpolating intermediate frames.

### Required Parameters
- `prompt` (string): Description of the transition/animation between frames
- `first_frame_url` (string): Starting frame image URL or local path
- `last_frame_url` (string): Ending frame image URL or local path

### Optional Parameters
- `duration`: `4s` | `6s` | `8s` (default: `8s`)
- `concept`: string (for filename/organization)
- `save_to_disk`: boolean (default: `true`)

### Example Request
```json
{
  "prompt": "A person looks into the camera, breathes in, then exclaims energetically",
  "first_frame_url": "/images/start-frame.jpg",
  "last_frame_url": "/images/end-frame.jpg",
  "duration": "6s",
  "concept": "character-transition"
}
```

### Response
- `video.url`: fal.ai video URL
- `local_path`: Saved video path (if `save_to_disk: true`)
- `next_frame_path`: Path to extracted last frame (for video chaining)
- `video_metadata`: Complete generation metadata

---

## Execution Notes

### Image URL Handling
- **Local paths** (`/images/...` or `/videos/...`): Automatically uploaded to fal.ai storage
- **External URLs** (`http://...` or `https://...`): Automatically uploaded to fal.ai storage for compatibility
- **fal.ai URLs**: Used directly

### Aspect Ratio
- **ALWAYS extract and use the input image's dimensions** to determine aspect ratio
- The API automatically extracts dimensions from the `image_url` and calculates aspect ratio
- Never use project-level defaults - always derive from input image
- Can override with `aspect_ratio` parameter if needed, but prefer using image dimensions

### Audio Generation
- When `generate_audio: true`, the model generates synchronized audio narration based on the prompt
- **All voice, delivery, and script information must be included in the `prompt` field**
- There is NO separate `speech` parameter - everything goes in the prompt
- Audio is embedded directly in the generated video

### Video Chaining
- Last frame is automatically extracted and saved for use as input to next video
- Use `next_frame_path` from response as `image_url` or `first_frame_url` for seamless chaining
- Extracted frames are registered in the gallery database

### File Saving
- Videos auto-save to `public/videos/` with full metadata
- Thumbnails are automatically generated
- Metadata includes all generation parameters for reproducibility

---

## Response Handling

### Success Response
```json
{
  "success": true,
  "video": {
    "url": "https://fal.media/files/...",
    "duration": 8.0,
    "width": 1920,
    "height": 1080,
    "fps": 30
  },
  "local_path": "/videos/veo3.1-fast-1234567890.mp4",
  "next_frame_path": "/images/frames/veo3.1-fast-1234567890-last.jpg",
  "video_metadata": { ... },
  "mode": "image-to-video" | "first-last-frame",
  "should_refresh_gallery": true
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## Available Endpoints (fal.ai)

### Fast Variants (Currently Implemented)
- `fal-ai/veo3.1/fast/image-to-video` ✅
- `fal-ai/veo3.1/fast/first-last-frame-to-video` ✅

### Standard Variants (May be available)
- `fal-ai/veo3.1/image-to-video` (higher quality, slower)
- `fal-ai/veo3.1/first-last-frame-to-video` (higher quality, slower)
- `fal-ai/veo3.1/text-to-video` (text-to-video generation)
- `fal-ai/veo3.1/fast/text-to-video` (fast text-to-video)

**Note**: Standard variants and text-to-video endpoints may require additional API route implementation.

---

## Best Practices

### Prompt Writing
- **Include ALL information in the prompt**: animation, voice characteristics, delivery style, and script
- Format: `[Animation description]. VOICE: [characteristics]. DELIVERY: [style]. [Script/dialogue]`
- **BE RIDICULOUSLY DESCRIPTIVE ABOUT VOICE**: Include every detail - tone, timbre, texture, pitch, resonance, breathiness, roughness, smoothness, accent, regionality, age, gender, emotional quality, vocal fry, gravel, warmth, coolness, confidence level, pacing rhythm, pause patterns, emphasis points, and any unique vocal quirks
- Be descriptive about movement, transitions, and camera motion
- Include details about timing and pacing
- For frame interpolation, describe the transformation between frames
- **DO NOT be afraid of long prompts** - this model can handle very detailed, elaborate prompts (400-1000+ tokens)
- Include camera movements, transitions, and exit animations in your prompt
- **Remember: There is NO separate `speech` parameter - everything must be in the prompt**

### Duration Selection
- `4s`: Quick previews, rapid iterations
- `6s`: Balanced quality and speed
- `8s`: Maximum quality, best for final outputs

### Resolution Selection
- `720p`: Faster generation, good for previews
- `1080p`: Higher quality, best for final outputs

### Video Chaining Workflow
1. Generate first video with `image_url`
2. Use `next_frame_path` from response as `first_frame_url` for next video
3. Provide new `last_frame_url` or `image_url` for continuation
4. Repeat for seamless multi-segment videos

---

## Style Shots / Product Mockups

For product mockups (similar to nano-banana style shots):
- Use `image_url` with your product/design image
- Prompt should describe the final animated result
- Works great for: skateboards, apparel, packaging, digital products
- Audio can narrate product features or brand messaging

---

--- End Command ---
