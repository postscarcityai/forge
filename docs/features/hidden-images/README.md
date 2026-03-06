# Hidden Images Feature

## 🎯 Overview

Forge's Hidden Images feature provides per-project image hiding functionality, allowing users to temporarily remove images from their main workspace while preserving the original files and metadata.

## 🏗️ Architecture

### Three-Container System
```
Gallery (Visible) ⟷ Timeline (Active) ⟷ Hidden (Invisible)
     ↓                    ↓                    ↓
  All Images          Featured           Temporarily
   (Default)          Workflow            Removed
```

### Core Concepts
- **Gallery**: Main collection of visible images  
- **Timeline**: Active working images for current project
- **Hidden**: Temporarily removed images (per-project)
- **Persistence**: Hidden state survives browser sessions
- **Project Isolation**: Each project maintains separate hidden lists

---

## 📊 Data Storage

### IndexedDB Implementation
```typescript
// Per-Project Storage Keys
`hidden_images_${projectId}` → string[]  // Array of hidden image IDs

// Example Storage Structure
{
  "hidden_images_dvs": ["img_123", "img_456"],
  "hidden_images_default": ["img_789"],
  "hidden_images_custom_project": []
}
```

### SQLite Database Schema
```sql
-- Future Implementation
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  -- ... other fields
  hidden INTEGER DEFAULT 0,        -- 0 = visible, 1 = hidden  
  project_id TEXT DEFAULT 'default',
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## 🔄 State Management

### Image Types
```typescript
type ImageType = 'timeline' | 'gallery' | 'hidden'

interface ImageData {
  id: string
  type: ImageType           // Current container
  projectId: string        // Project association
  // ... other metadata
}
```

### State Actions
```typescript
// Hide Image
dispatch({ 
  type: 'HIDE_IMAGE', 
  payload: { imageId: 'img_123', projectId: 'dvs' } 
})

// Restore Image (unhide)
dispatch({ 
  type: 'RESTORE_IMAGE', 
  payload: { imageId: 'img_123', projectId: 'dvs' } 
})

// Load Hidden State (initialization)
dispatch({ 
  type: 'RESTORE_HIDDEN', 
  payload: { imageIds: ['img_123', 'img_456'] } 
})
```

---

## 🎨 User Interface

### Hidden Images Page
**Route**: `/[projectId]/hidden`

#### Features
- **Project-Specific View**: Only shows hidden images for current project
- **Drag & Drop Support**: Restore images by dragging to timeline/gallery
- **Grid Layout**: Consistent with main gallery design
- **Empty State**: Clear messaging when no hidden images

#### Example Routes
```
/dvs/hidden        → DVS project hidden images
/default/hidden    → Default project hidden images  
/custom/hidden     → Custom project hidden images
/hidden            → Redirects to current project
```

### Hide/Restore Actions

#### Image Card Menu
- **Hide Button**: Available on gallery and timeline images
- **Restore Button**: Available on hidden images
- **Visual Feedback**: Smooth animations during state changes

#### Drag & Drop Integration
```typescript
// Supported Transitions
Gallery  → Hidden    ✅ (Hide)
Timeline → Hidden    ✅ (Hide)  
Hidden   → Gallery   ✅ (Restore to gallery)
Hidden   → Timeline  ✅ (Restore to timeline)
```

---

## 🔧 Implementation Details

### Context Integration
```typescript
// ImageContext provides helper functions
const { 
  getHiddenImages,     // Get hidden images for project
  dispatch             // Dispatch hide/restore actions
} = useImageContext()

// Project-filtered hidden images
const hiddenImages = getHiddenImages(currentProject.id)
```

### Auto-Save Mechanism
```typescript
case 'HIDE_IMAGE': {
  const { imageId, projectId } = action.payload
  
  // Update state
  const newHidden = [...state.hidden, imageId]
  
  // Auto-save to IndexedDB
  if (projectId) {
    dbCache.saveHiddenImages(projectId, newHidden).catch(err => 
      console.warn('Failed to save hidden images:', err)
    )
  }
  
  return { ...state, hidden: newHidden }
}
```

### Initialization Process
```typescript
const loadHiddenConfig = async () => {
  // Load from all projects
  const [dvsHidden, defaultHidden] = await Promise.all([
    dbCache.loadHiddenImages('dvs'),
    dbCache.loadHiddenImages('default')
  ])
  
  // Combine for global state
  const allHidden = [...dvsHidden, ...defaultHidden]
  
  // Restore without triggering save
  dispatch({ 
    type: 'RESTORE_HIDDEN', 
    payload: { imageIds: allHidden } 
  })
}
```

---

## 🎯 Project Isolation

### Separate Hidden Lists
Each project maintains independent hidden images:
```typescript
// DVS Project: Hide marketing images
hiddenImages_dvs = ["promo_1", "promo_2"]

// Default Project: Hide test images  
hiddenImages_default = ["test_1", "debug_img"]

// No cross-contamination between projects
```

### Project Switching
```typescript
// Hidden images automatically filtered by current project
const { currentProject } = useProjectContext()
const hiddenImages = getHiddenImages(currentProject.id)

// Only shows images belonging to current project
```

---

## ⚡ Performance Optimizations

### Efficient Storage
- **Per-Project Keys**: Only load relevant hidden images
- **Array Storage**: Simple array of image IDs (not full objects)
- **Lazy Loading**: Hidden images loaded only when accessed

### Memory Management
```typescript
// Only store IDs, not full image data
const hiddenIds = ['img_123', 'img_456']  // ✅ Efficient

// Full image objects stored in main images lookup
const image = state.images[hiddenId]      // ✅ Normalized access
```

### Update Patterns
```typescript
// Optimistic updates
const newHidden = [...state.hidden, imageId]  // Immediate UI update

// Background persistence  
dbCache.saveHiddenImages(projectId, newHidden) // Async save
```

---

## 🚨 Error Handling

### Graceful Degradation
```typescript
try {
  await dbCache.saveHiddenImages(projectId, newHidden)
} catch (error) {
  console.warn('Failed to save hidden images:', error)
  // UI continues working, state preserved in memory
}
```

### Recovery Mechanisms
```typescript
// Fallback to empty array on load failure
const loadHiddenImages = async (projectId: string): Promise<string[]> => {
  try {
    return await dbCache.loadHiddenImages(projectId)
  } catch (error) {
    console.warn('Failed to load hidden images:', error)
    return []  // Safe fallback
  }
}
```

### State Validation
```typescript
// Filter out non-existent images during load
const validHiddenIds = allHidden.filter(id => state.images[id])
```

---

## 🧪 Testing & Usage

### Manual Testing
1. **Hide Image**: Right-click image → Hide
2. **Check Hidden View**: Navigate to `/[project]/hidden`
3. **Verify Isolation**: Switch projects and check separation
4. **Restore Image**: Drag from hidden back to gallery
5. **Persistence Test**: Refresh browser and verify state

### Debug Commands
```javascript
// Browser console debugging
const { getHiddenImages } = useImageContext()

// Check hidden images for current project
console.log('Hidden images:', getHiddenImages(currentProject.id))

// Check all projects
console.log('DVS hidden:', getHiddenImages('dvs'))
console.log('Default hidden:', getHiddenImages('default'))

// Force save hidden state
const { dispatch } = useImageContext()
dispatch({ 
  type: 'HIDE_IMAGE', 
  payload: { imageId: 'test_img', projectId: 'dvs' } 
})
```

### API Testing
```javascript
// Test IndexedDB operations
const { dbCache } = require('@/lib/indexedDB')

// Save hidden images
await dbCache.saveHiddenImages('test_project', ['img_1', 'img_2'])

// Load hidden images  
const hidden = await dbCache.loadHiddenImages('test_project')
console.log('Loaded hidden:', hidden)
```

---

## 🎮 User Workflows

### Typical Use Cases

#### 1. **Creative Iteration**
- Generate multiple image variations
- Hide less successful attempts  
- Keep workspace focused on best options
- Restore alternatives if needed

#### 2. **Project Organization**
- Hide promotional/marketing images during creative work
- Separate final deliverables from work-in-progress
- Temporarily remove test/debug images

#### 3. **Client Presentations**
- Hide internal notes and iterations
- Show only polished, client-ready images
- Quickly restore full collection after presentation

### Workflow Example
```
1. Generate 10 image variations
2. Move 3 best to timeline  
3. Hide 5 unsuccessful attempts
4. Keep 2 in gallery for reference
5. Present timeline to client
6. Later: restore hidden images for revision
```

---

## 🔮 Future Enhancements

### Planned Features
- **Bulk Operations**: Hide/restore multiple images at once
- **Hide Reasons**: Add optional notes for why images were hidden
- **Temporary Hide**: Auto-restore after time period
- **Smart Suggestions**: ML-based hiding recommendations

### Advanced Functionality
- **Hide Categories**: Group hidden images by reason
- **Archive Mode**: Permanently archive vs temporarily hide
- **Export Hidden**: Include/exclude hidden images in exports
- **Collaboration**: Share hidden state between team members

### Integration Possibilities
```typescript
// Future API integration
interface HiddenImageEntry {
  imageId: string
  projectId: string  
  hiddenAt: Date
  hiddenBy: string
  reason?: string
  tags?: string[]
}
```

---

## 🔗 Related Documentation

- [Project Management](../project-management/) - Per-project data isolation
- [Drag & Drop System](../drag-drop/) - Moving images between containers
- [IndexedDB Implementation](../../architecture/indexeddb-caching-implementation.md) - Client-side storage
- [Timeline Persistence](../timeline/) - Similar state management patterns 