# Video Generation System

## 🎯 Overview

Forge's Video Generation System provides AI-powered video creation using Kling AI's image-to-video technology. The system supports full integration with the existing project management, auto-sync, and timeline/gallery workflows.

## 🏗️ Architecture

### System Components
```
Image Input → Kling AI API → Video Generation → File System → Auto-Sync → UI Display
     ↓            ↓              ↓               ↓            ↓          ↓
   Static      Text Prompt    MP4 Video      Local Save   Detection   Mixed Media
   Reference   + Settings     + Metadata     + Metadata   + Cache     Timeline
```

### Core Integration
- **Mixed Media Support**: Videos and images unified in timeline/gallery
- **Project Isolation**: Videos tagged with project ID
- **Auto-Sync**: Automatic detection and UI updates
- **Metadata Preservation**: Complete generation parameter tracking

---

## 🎬 Kling Video API

### **POST** `/api/kling-video`

Generate videos from static images using Kling AI v2.1 model.

#### Request Schema
```typescript
interface KlingVideoRequest {
  prompt: string                    // Required: Video transformation prompt
  image_url: string                 // Required: Source image URL
  duration?: string                 // Default: "5" (seconds)
  aspect_ratio?: string             // Default: "9:16" (portrait)
  negative_prompt?: string          // Default: "blur, distort, and low quality"
  cfg_scale?: number               // Default: 0.5 (guidance strength)
  concept?: string                 // Optional: Concept for organization
  save_to_disk?: boolean           // Default: true
}
```

#### Response Schema
```typescript
interface KlingVideoResponse {
  video: {
    url: string                     // Kling AI video URL (temporary)
    width?: number
    height?: number
    content_type?: string
  }
  seed?: number                     // Generation seed
  timings?: {
    inference?: number              // Generation time in seconds
  }
  has_nsfw_concepts?: boolean[]     // Content safety flags
  message: string                   // Success/status message
  saved_to_disk: boolean           // Whether saved locally
  local_path?: string              // Local file path if saved
}
```

#### Example Usage
```javascript
const response = await fetch('/api/kling-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "lint monster moving through dryer vent, slow motion",
    image_url: "http://localhost:3000/api/images/serve/img_123",
    duration: "5",
    aspect_ratio: "16:9",
    concept: "Lint Monster Animation"
  })
})

const result = await response.json()
console.log('Generated video:', result.local_path)
```

---

## 🎭 Pika Scenes API

### **POST** `/api/pika-scenes`

Generate videos by combining multiple images into a cohesive scene using Pika v2.2 Scenes model.

#### Request Schema
```typescript
interface PikaScenesRequest {
  prompt: string                    // Required: Scene description prompt
  images: string[]                  // Required: Array of image URLs (1-5 images)
  seed?: number                     // Optional: Random seed for reproducibility
  negative_prompt?: string          // Default: ""
  resolution?: string               // Default: "720p" ("720p" | "1080p")
  duration?: number                 // Default: 5 (seconds)
  ingredients_mode?: string         // Default: "creative" ("creative" | "precise")
  concept?: string                  // Optional: Concept for organization
  save_to_disk?: boolean           // Default: true
}
```

#### Response Schema
```typescript
interface PikaScenesResponse {
  video: {
    url: string                     // Pika AI video URL (temporary)
    content_type?: string
    file_name?: string
    file_size?: number
  }
  seed?: number                     // Generation seed
  timings?: {
    inference?: number              // Generation time in seconds
  }
  message: string                   // Success/status message
  saved_to_disk: boolean           // Whether saved locally
  local_path?: string              // Local file path if saved
  generation_data: {
    images_used: number            // Number of images combined
    model_used: string             // "fal-ai/pika/v2.2/pikascenes"
  }
}
```

#### Example Usage
```javascript
const response = await fetch('/api/pika-scenes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Three heroes team up for an epic battle scene",
    images: [
      "http://localhost:3000/api/images/serve/hero_1",
      "http://localhost:3000/api/images/serve/hero_2", 
      "http://localhost:3000/api/images/serve/hero_3"
    ],
    duration: 8,
    resolution: "1080p",
    ingredients_mode: "precise",
    concept: "Hero Team Battle"
  })
})

const result = await response.json()
console.log('Generated video with', result.generation_data.images_used, 'images')
```

#### Key Features
- **Multi-Image Input**: Combine 1-5 images into single video
- **Two Modes**: 
  - `creative`: Artistic interpretation of image combination
  - `precise`: Literal combination of image elements
- **High Quality**: Pika's highest quality video model
- **Project Integration**: Uses project aspect ratio and FAL key settings

---

## 📁 Video File Management

### File System Structure
```
public/videos/clips/
├── video-info/                   # Metadata JSON files
│   ├── concept-timestamp.mp4.meta.json
│   └── another-video.mp4.meta.json
├── concept-timestamp.mp4         # Actual video files
└── another-video.mp4
```

### Video Metadata Format
```typescript
interface VideoFileMetadata {
  id: string                       // Unique video ID
  filename: string                 // MP4 filename
  title: string                    // Display title (from concept)
  description: string              // Generation prompt
  createdAt: string               // ISO timestamp
  updatedAt: string               // ISO timestamp
  fileSize: number                // Video file size in bytes
  metadata: {
    // Original generation parameters
    prompt: string
    duration: string
    aspect_ratio: string
    negative_prompt: string
    cfg_scale: number
    
    // Generation results
    seed?: number
    inference_time?: number
    has_nsfw_concepts?: boolean[]
    
    // URLs and paths
    fal_video_url: string          // Original Kling AI URL
    local_path: string             // Relative local path
    
    // API response metadata
    api_response: Record<string, unknown>
    user_agent?: string
    ip_address?: string
    request_id: string
  }
}
```

---

## 🔄 Video Service Layer

### Video Service API (`src/services/videoService.ts`)
```typescript
export interface VideoMetadata {
  id: string
  filename: string
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  projectId?: string               // Project association
  fileSize: number
  metadata?: Record<string, unknown>
  tags?: string[]
}

// Get all videos from file system
export const getAllVideos = async (): Promise<VideoMetadata[]>
```

### Video Sync API (`/api/videos/sync`)
```typescript
// GET /api/videos/sync
interface VideoSyncResponse {
  success: boolean
  data: VideoMetadata[]
  message: string
}

// Returns all videos from file system with metadata
```

---

## 🗄️ Database Integration

### SQLite Video Schema
```sql
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT,                      -- JSON array as string
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  project_id TEXT DEFAULT 'default',
  file_size INTEGER NOT NULL,
  metadata TEXT,                  -- JSON string for extended metadata
  hidden INTEGER DEFAULT 0,       -- 0 = visible, 1 = hidden
  timeline_order INTEGER,         -- Position in timeline, NULL if not in timeline
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### Database Video APIs
```typescript
// GET /api/database/videos?projectId=dvs
// POST /api/database/videos (save single/multiple)
// DELETE /api/database/videos?id=video_123

// Sync file system to database
// POST /api/database/sync/videos
```

---

## 🎨 Mixed Media UI Support

### ImageCard Video Rendering
Videos are displayed using the same `ImageCard` component with `mediaType` detection:

```typescript
interface ImageData {
  // ... existing fields
  mediaType: 'image' | 'video'     // Determines rendering mode
}

// Video rendering in ImageCard
{image.mediaType === 'video' ? (
  <>
    <video 
      src={`/videos/clips/${image.filename}`}
      className="absolute inset-0 w-full h-full object-cover"
      muted
      preload="metadata"
    />
    {/* Play icon overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-black bg-opacity-60 rounded-full p-3">
        <div className="w-6 h-6 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
      </div>
    </div>
  </>
) : (
  /* Regular image rendering */
)}
```

### Timeline/Gallery Integration
- **Unified Display**: Videos and images mixed seamlessly
- **Drag & Drop**: Videos support all drag operations
- **Project Filtering**: Videos filtered by project like images
- **Auto-Sync**: Videos appear automatically after generation

---

## ⚡ Auto-Sync for Videos

### Video File Monitoring
The existing auto-sync system automatically detects new videos:

```typescript
// Video conversion in ImageContext
const convertVideoToImageData = (metadata: VideoMetadata, index: number): ImageData => ({
  id: metadata.id,
  title: metadata.title,
  description: metadata.description,
  index,
  type: 'gallery',                 // New videos start in gallery
  createdAt: new Date(metadata.createdAt).getTime(),
  filename: metadata.filename,
  projectId: metadata.projectId || 'default',
  tags: metadata.tags,
  metadata: metadata.metadata,
  mediaType: 'video'               // Key difference from images
})
```

### Detection Process
1. **Video Generation**: Kling API saves MP4 + metadata
2. **File Watcher**: Detects new .meta.json files
3. **Video Service**: Loads video metadata 
4. **Context Update**: Converts to ImageData with `mediaType: 'video'`
5. **UI Render**: Videos appear in gallery within 5 seconds

---

## 🧪 Testing Video Generation

### Manual Testing
```javascript
// Test Kling video generation (single image to video)
const testKlingVideo = async () => {
  const response = await fetch('/api/kling-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "lint monster slowly moving through vent",
      image_url: "http://localhost:3000/api/images/serve/latest_image_id",
      duration: "5",
      concept: "Test Video"
    })
  })
  
  const result = await response.json()
  console.log('Kling video generated:', result)
}

// Test Pika Scenes generation (multi-image to video)
const testPikaScenes = async () => {
  const response = await fetch('/api/pika-scenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "Characters working together in dramatic scene",
      images: [
        "http://localhost:3000/api/images/serve/character_1",
        "http://localhost:3000/api/images/serve/character_2",
        "http://localhost:3000/api/images/serve/background_scene"
      ],
      duration: 6,
      resolution: "1080p",
      ingredients_mode: "creative",
      concept: "Multi-Character Scene"
    })
  })
  
  const result = await response.json()
  console.log('Pika Scenes video generated with', result.generation_data.images_used, 'images')
}

// Run tests
testKlingVideo()
testPikaScenes()
```

### Debug Commands
```javascript
// Check video service
const { getAllVideos } = require('@/services/videoService')
const videos = await getAllVideos()
console.log('Videos found:', videos.length)

// Check mixed media context
const { state } = useImageContext()
const videoItems = Object.values(state.images).filter(item => item.mediaType === 'video')
console.log('Videos in context:', videoItems.length)
```

---

## 📊 Performance & Costs

### Generation Metrics
- **Model**: Kling AI v2.1 Standard Image-to-Video
- **Generation Time**: ~30-60 seconds (varies by duration)
- **Cost Estimate**: ~$0.15-0.30 per video (varies by duration/quality)
- **File Sizes**: ~2-10 MB for 5-second videos

### Video Specifications
- **Supported Durations**: 2-10 seconds
- **Aspect Ratios**: 9:16 (portrait), 16:9 (landscape), 1:1 (square)
- **Output Format**: MP4 (H.264)
- **Resolution**: 1024x1024 or aspect ratio equivalent

---

## 🚨 Error Handling

### Common Issues
```typescript
// Missing image URL
{ error: 'Image URL is required for video generation' }

// Invalid parameters
{ error: 'Prompt is required' }

// Generation failure
{ error: 'Failed to generate Kling video', details: '...' }

// File save failure
{ success: true, saved_to_disk: false, local_path: null }
```

### Debugging Tips
1. **Verify Source Image**: Ensure image URL is accessible
2. **Check File Permissions**: Video directory write permissions
3. **Monitor Generation Time**: Kling AI can take 30-60 seconds
4. **Validate Prompts**: Clear motion descriptions work best
5. **Test with Simple Cases**: Static to simple motion first

---

## 🎮 User Workflows

### Typical Video Creation
1. **Generate Base Image**: Use Flux-LoRA for static reference
2. **Select for Video**: Choose image from timeline/gallery
3. **Create Motion**: Add video generation prompt
4. **Generate Video**: Submit to Kling API
5. **Auto-Appearance**: Video appears in gallery automatically
6. **Organize**: Drag video to timeline with images

### Creative Workflows
- **Image → Video Pipeline**: Static concepts to animated sequences
- **Mixed Media Timelines**: Combine images and videos
- **Concept Development**: Multiple video variations from single image
- **Brand Storytelling**: DVS characters in motion

---

## 🔮 Future Enhancements

### Planned Features
- **Batch Video Generation**: Multiple videos from image set
- **Video Editing API**: Trim, merge, effects
- **Advanced Models**: Higher quality/longer duration options
- **Video Templates**: Predefined motion patterns

### Integration Possibilities
- **Audio Integration**: Add soundtrack/voiceover
- **Video Thumbnails**: Auto-generate preview frames
- **Compression Options**: Quality vs file size controls
- **Cloud Storage**: Direct upload to DigitalOcean Spaces

---

## 🔗 Related Documentation

- [API Documentation](../../api/) - Core generation APIs
- [Auto-Sync System](../auto-sync/) - File monitoring system
- [Project Management](../project-management/) - Project isolation
- [Database Schema](../../architecture/sqlite-database-implementation.md) - Video storage
- [Mixed Media UI](../ui-components/) - Video display components 