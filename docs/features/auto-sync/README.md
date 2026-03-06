# Auto-Sync System

## 🎯 Overview

Forge's Auto-Sync system provides real-time monitoring of the file system to automatically discover and integrate newly generated images into the application without manual refresh or intervention.

## 🏗️ Architecture

### System Components
```
File System → File Watcher → Sync API → IndexedDB → UI Update
     ↓            ↓           ↓          ↓         ↓
   Images      Polling     Delta Sync  Metadata   Gallery
   Created     Detection   Processing   Cache     Refresh
```

### Core Files
- **`useFileWatcher.ts`** - Client-side polling and detection
- **`/api/images/sync`** - Server-side file system scanning  
- **`useImageSync.ts`** - Image state synchronization
- **`fal-image-generator.ts`** - File system utilities

---

## 🔍 File System Monitoring

### Polling-Based Detection
```typescript
interface FileWatcherOptions {
  pollInterval?: number        // Default: 2000ms (2 seconds)
  enabled?: boolean           // Default: true
  onNewImages?: (count: number) => void  // Callback for new images
}

const useFileWatcher = (options: FileWatcherOptions) => {
  // Polls file system every 2 seconds for changes
  // Uses delta sync to only fetch new images
  // Automatically triggers UI updates
}
```

### Delta Sync Implementation
```typescript
// Only check for images created since last check
const lastSyncISO = new Date(lastCheckRef.current).toISOString()
const response = await fetch(`/api/images/sync?lastSync=${encodeURIComponent(lastSyncISO)}`)

// Server filters images by timestamp
const lastSyncTime = new Date(lastSync).getTime()
const newImages = savedImages.filter(img => {
  const imgTime = new Date(img.createdAt).getTime()
  return imgTime > lastSyncTime
})
```

---

## 🔄 Sync API Endpoints

### GET `/api/images/sync` - Delta Sync
Retrieve new images since last check.

#### Query Parameters
```typescript
lastSync?: string     // ISO timestamp of last sync
includeAll?: boolean  // Return all images (ignores lastSync)
```

#### Response Schema
```typescript
interface SyncResponse {
  success: boolean
  newImages: ImageData[]
  count: number
  lastChecked: string
  message: string
}
```

#### Example Usage
```javascript
// Delta sync - only new images
const response = await fetch('/api/images/sync?lastSync=2024-01-15T10:30:00.000Z')

// Full sync - all images
const response = await fetch('/api/images/sync?includeAll=true')
```

### POST `/api/images/sync` - Specific Images
Retrieve specific images by ID.

#### Request Schema
```typescript
{
  imageIds: string[]  // Array of image IDs to retrieve
}
```

---

## 📁 File System Structure

### Monitored Directories
```
public/images/
├── image-info/           # Metadata JSON files
│   ├── img_1234.json    # Image metadata
│   └── img_5678.json
└── [image files]        # Actual image files
    ├── img_1234.jpeg
    └── img_5678.jpeg
```

### Metadata Format
Each image has a corresponding JSON metadata file:
```typescript
interface FalMetadata {
  id: string
  title?: string
  description?: string
  filename: string
  createdAt: string        // ISO timestamp
  projectId?: string       // Project association
  tags?: string[]
  fileSize?: number
  metadata?: {
    fal_image_url?: string    // Original Fal.ai URL
    concept?: string          // Generation concept
    prompt?: string           // Full prompt used
    original_prompt?: string  // User's original prompt
    model?: string           // AI model used
    seed?: number            // Generation seed
    inference_time?: number   // Generation time
    // ... complete API response
  }
}
```

---

## ⚡ Real-Time Updates

### Auto-Discovery Process
1. **Image Generation**: API saves image + metadata to file system
2. **File Watcher**: Detects new files via polling (2-second interval)
3. **Delta Sync**: Fetches only new images since last check
4. **Context Update**: `forceReloadImages()` triggers UI refresh
5. **IndexedDB Cache**: Metadata cached for instant access
6. **UI Update**: New images appear in gallery/timeline within 5 seconds

### Performance Optimization
```typescript
// Efficient delta sync - only new files
const checkForNewImages = async () => {
  const lastSyncISO = new Date(lastCheckRef.current).toISOString()
  const response = await fetch(`/api/images/sync?lastSync=${encodeURIComponent(lastSyncISO)}`)
  
  if (data.newImages?.length > 0) {
    lastCheckRef.current = Date.now()  // Update timestamp BEFORE processing
    forceReloadImages()                 // Trigger UI update
    onNewImages?.(data.newImages.length) // Optional callback
  }
}
```

---

## 🎯 Project-Aware Sync

### Project Isolation
Each image is automatically tagged with project ID during generation:
```typescript
// During image save
const metadata = {
  ...generationData,
  projectId: getCurrentProjectFromServerSync()
}
await saveImageWithMetadata(imageUrl, metadata)
```

### Project Filtering
Images are filtered by project in the UI:
```typescript
const getGalleryImages = (projectId?: string): ImageData[] => {
  const images = state.gallery.map(id => state.images[id]).filter(Boolean)
  return projectId ? images.filter(img => img.projectId === projectId) : images
}
```

---

## 🔧 Configuration & Usage

### Basic Setup
```typescript
// Automatic file watching with default settings
const { triggerCheck, isWatching } = useFileWatcher()

// Custom configuration
const { triggerCheck } = useFileWatcher({
  pollInterval: 5000,     // Check every 5 seconds
  enabled: true,          // Enable watching
  onNewImages: (count) => {
    console.log(`${count} new images detected!`)
  }
})
```

### Manual Triggers
```typescript
// Force immediate check
const result = await triggerCheck()
console.log(`Found ${result.count} new images`)

// Manual image reload
const { forceReloadImages } = useImageContext()
await forceReloadImages()
```

---

## 🚨 Error Handling & Resilience

### Graceful Degradation
```typescript
try {
  const response = await fetch(`/api/images/sync?lastSync=${lastSyncISO}`)
  const data = await response.json()
  
  if (data.success && data.newImages?.length > 0) {
    // Process new images
  }
} catch (error) {
  console.error('Error checking for new images:', error)
  // Continue polling - temporary network issues don't break the system
}
```

### Race Condition Prevention
```typescript
// Update timestamp BEFORE processing to avoid duplicate processing
lastCheckRef.current = Date.now()
forceReloadImages()
```

### Startup Behavior
```typescript
// Delayed start to avoid conflicts with initial image load
useEffect(() => {
  if (enabled) {
    const initialDelay = setTimeout(startWatching, 5000) // Wait 5 seconds
    return () => clearTimeout(initialDelay)
  }
}, [enabled])
```

---

## 📊 Performance Metrics

### Typical Performance
- **Polling Interval**: 2 seconds (configurable)
- **Detection Latency**: 0-2 seconds after file creation
- **UI Update Time**: ~500ms after detection
- **Total End-to-End**: 2.5-5 seconds from generation to UI

### Resource Usage
- **Network**: Minimal - only delta requests
- **CPU**: Low - simple timestamp comparisons
- **Memory**: Efficient - metadata only, no image data

### Optimization Features
- **Delta Sync**: Only fetches new images
- **Timestamp Tracking**: Precise change detection
- **Debounced Updates**: Prevents excessive UI refreshes
- **Automatic Cleanup**: Stops watching on unmount

---

## 🧪 Testing & Debugging

### Manual Testing
1. **Generate Image**: Use any API endpoint
2. **Wait 2-5 seconds**: For auto-detection
3. **Check UI**: New image should appear in gallery
4. **Verify Metadata**: Check image details and project association

### Debug Commands
```javascript
// Browser console debugging
const { triggerCheck } = useFileWatcher()

// Force immediate sync check
const result = await triggerCheck()
console.log('Sync result:', result)

// Check current watching status
console.log('Is watching:', isWatching)

// Manual image reload
const { forceReloadImages } = useImageContext()
await forceReloadImages()
```

### API Testing
```bash
# Test delta sync
curl "http://localhost:3000/api/images/sync?lastSync=2024-01-15T10:00:00.000Z"

# Test full sync
curl "http://localhost:3000/api/images/sync?includeAll=true"

# Test specific images
curl -X POST "http://localhost:3000/api/images/sync" \
  -H "Content-Type: application/json" \
  -d '{"imageIds": ["img_1234", "img_5678"]}'
```

---

## 🔮 Future Enhancements

### Planned Improvements
- **WebSocket Integration**: Real-time updates instead of polling
- **File System Events**: Native OS file watching (fs.watch)
- **Batch Processing**: Handle multiple simultaneous generations
- **Conflict Resolution**: Handle concurrent file operations
- **Cloud Storage Sync**: Monitor remote storage changes

### Advanced Features
- **Selective Sync**: Choose which directories to monitor
- **Filter Rules**: Exclude certain file types or patterns
- **Priority Queue**: Prioritize certain image types
- **Retry Logic**: Enhanced error recovery
- **Sync History**: Track all sync operations

---

## 🔗 Related Documentation

- [API Documentation](../../api/) - Image generation endpoints
- [Project Management](../project-management/) - Project-aware image organization
- [Hidden Images](../hidden-images/) - Image visibility management
- [IndexedDB Implementation](../../architecture/indexeddb-caching-implementation.md) - Client-side caching 