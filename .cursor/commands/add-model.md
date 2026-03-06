# Add New FAL.ai Model Route

Create a new API route at `src/app/api/[model-name]/route.ts` following these patterns:

## Required Setup

1. **Imports:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { extractConceptFromPrompt } from '@/utils/mediaUtils'
import * as fal from '@fal-ai/serverless-client'
// For images: import { createImageSaveRequest } from '@/types/mediaSaver'
// For images: import { mediaSaverService } from '@/services/mediaSaver'
// For videos: import { createVideoSaveRequest } from '@/types/mediaSaver'
```

2. **Get Project & Configure FAL:**
```typescript
const currentProjectId = getCurrentProjectFromServerSync()
const falKey = await getEnvVar('FAL_KEY', currentProjectId)
if (!falKey) {
  return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
}
fal.config({ credentials: falKey })
```

3. **Project Aspect Ratio/Orientation:**
- Create helper function to fetch from database: `getProjectAspectRatio()` or `getProjectImageSize()`
- Convert project `defaultImageOrientation` ('portrait'/'landscape'/'square') to API format
- **Always use project default**, ignore provided `aspect_ratio` parameter (log warning if provided)
- For images: convert to API format (e.g., '9:16', '16:9', '1:1', or 'portrait_16_9', 'landscape_16_9', 'square')
- For videos: convert to aspect ratio format ('9:16', '16:9', '1:1')

## File Handling

Handle local files and external URLs:
```typescript
async function uploadLocalFileToFal(localPath: string): Promise<string> {
  // Remove leading slash, construct full path: path.join(process.cwd(), 'public', cleanPath)
  // Read file, create File object, upload via fal.storage.upload(file)
}

// Process image_urls array or single image_url
const processedUrls = await Promise.all(
  urls.map(async (url) => {
    if (url.startsWith('/images/') || url.startsWith('/videos/')) {
      return await uploadLocalFileToFal(url)
    }
    // Optionally upload external URLs (skip fal.media URLs)
    return url
  })
)
```

## Validation

- Validate required parameters (prompt, image_urls, etc.)
- Validate enum values (aspect_ratio, resolution, output_format) against API spec
- Return 400 errors with descriptive messages

## API Call

```typescript
const result = await fal.subscribe('fal-ai/[model-name]/[endpoint]', {
  input: { /* API-specific params */ },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === 'IN_PROGRESS') {
      update.logs?.map(log => log.message).forEach(console.log)
    }
  }
})
```

## Saving Media

**For Images:**
```typescript
if (save_to_disk && result.images?.length > 0) {
  const savedResults = await Promise.all(
    result.images.map(async (image, index) => {
      const conceptValue = concept || extractConceptFromPrompt(prompt)
      const requestId = `model-name-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const saveRequest = createImageSaveRequest(
        image.url,
        conceptValue,
        prompt,
        prompt,
        'fal',
        'model-name',
        '/api/model-name',
        requestId,
        currentProjectId,
        { /* generation params */ },
        { /* metadata: seed, timings, etc. */ },
        result,
        { index, /* userAgent, ipAddress, providerSpecificData */ }
      )
      
      const saveResult = await mediaSaverService.saveMedia(saveRequest)
      return saveResult.success 
        ? { ...image, local_path: saveResult.filePath }
        : image
    })
  )
  result.images = savedResults
}
```

**For Videos:**
- Use `createVideoSaveRequest()` with similar pattern
- Include `should_refresh_gallery: true` in response
- Optionally sync to database immediately

## Response Format

```typescript
return NextResponse.json({
  ...result, // images/video array, seed, timings, etc.
  message: save_to_disk ? 'Generated and saved successfully' : 'Generated successfully',
  saved_to_disk: save_to_disk,
  local_paths: result.images?.map(img => img.local_path).filter(Boolean) || [],
  // For videos: should_refresh_gallery: true, video_metadata: {...}
})
```

## Error Handling

```typescript
catch (error) {
  console.error('Error generating [model]:', error)
  return NextResponse.json(
    { 
      error: 'Failed to generate [model]', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 
    { status: 500 }
  )
}
```

## Key Principles

- ✅ Always use project default aspect ratio/orientation (ignore overrides)
- ✅ Always get FAL_KEY from database using `getEnvVar('FAL_KEY', currentProjectId)`
- ✅ Handle local file paths by uploading to fal.ai storage
- ✅ Use `extractConceptFromPrompt()` for concept extraction
- ✅ Include comprehensive metadata in save requests
- ✅ Validate all inputs against API specification
- ✅ Log warnings when ignoring user-provided overrides
- ✅ Return consistent response format with `saved_to_disk`, `local_paths`, `message`

