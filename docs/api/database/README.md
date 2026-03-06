# Database API Layer

## 🎯 Overview

Forge's Database API Layer provides comprehensive CRUD operations for SQLite data management, file system synchronization, and environment configuration. All APIs support project isolation and complete metadata preservation.

## 🏗️ Architecture

### Database Layer Structure
```
Client → API Routes → Database Service → SQLite Database
  ↓         ↓              ↓                ↓
REST     Validation   CRUD Operations   Persistent Storage
Calls    + Auth       + Transactions    + Relationships
```

### Core Features
- **Complete CRUD**: Create, Read, Update, Delete for all entities
- **Project Isolation**: All data scoped to projects
- **File System Sync**: Bridge between files and database
- **Environment Management**: Configuration and settings
- **Transaction Safety**: Atomic operations with rollback

---

## 📊 Projects API

### **GET** `/api/database/projects`

Retrieve projects from database.

#### Query Parameters
```typescript
id?: string              // Get specific project by ID
```

#### Response Schema
```typescript
interface ProjectResponse {
  success: boolean
  data: Project | Project[]
  message?: string
  error?: string
}

interface DatabaseProject {
  id: string
  name: string
  description: string
  settings: {
    slug?: string
    color?: string
    status?: 'active' | 'archived'
    businessOverview?: BusinessSettings
    brandStory?: BrandSettings
    imagePrompting?: PromptSettings
    loras?: LoRASettings
    lastActivity?: string
    imageCount?: number
  }
  created_at: string
  updated_at: string
}
```

#### Examples
```javascript
// Get all projects
const response = await fetch('/api/database/projects')
const { data: projects } = await response.json()

// Get specific project
const response = await fetch('/api/database/projects?id=dvs')
const { data: project } = await response.json()
```

### **POST** `/api/database/projects`

Create or save projects to database.

#### Request Schema
```typescript
interface SaveProjectRequest {
  project?: DatabaseProject      // Save single project
  projects?: DatabaseProject[]   // Save multiple projects
}
```

#### Examples
```javascript
// Save single project
await fetch('/api/database/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    project: {
      id: 'new-project',
      name: 'New Project',
      description: 'Project description',
      settings: {
        color: '#6B7280',
        status: 'active'
      }
    }
  })
})

// Save multiple projects
await fetch('/api/database/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projects: [project1, project2, project3]
  })
})
```

### **PATCH** `/api/database/projects?id={projectId}`

Update existing project.

#### Request Schema
```typescript
interface UpdateProjectRequest {
  name?: string
  description?: string
  slug?: string
  color?: string
  status?: 'active' | 'archived'
  businessOverview?: BusinessSettings
  brandStory?: BrandSettings
  imagePrompting?: PromptSettings
  loras?: LoRASettings
  lastActivity?: string
  imageCount?: number
}
```

### **DELETE** `/api/database/projects?id={projectId}`

Delete project (protects default project).

---

## 🖼️ Images API

### **GET** `/api/database/images`

Retrieve images from database.

#### Query Parameters
```typescript
projectId?: string       // Filter by project (default: 'default')
id?: string             // Get specific image by ID
```

#### Response Schema
```typescript
interface ImageResponse {
  success: boolean
  data: DatabaseImage | DatabaseImage[]
  message?: string
}

interface DatabaseImage {
  id: string
  filename: string
  title: string
  description?: string
  tags?: string[]
  created_at: string
  updated_at: string
  project_id: string
  file_size?: number
  width?: number
  height?: number
  metadata?: Record<string, unknown>
  hidden: boolean
  timeline_order?: number
}
```

### **POST** `/api/database/images`

Save images to database.

#### Request Schema
```typescript
interface SaveImageRequest {
  image?: DatabaseImage      // Save single image
  images?: DatabaseImage[]   // Save multiple images
}
```

### **DELETE** `/api/database/images?id={imageId}`

Delete image from database.

---

## 🎬 Videos API

### **GET** `/api/database/videos`

Retrieve videos from database.

#### Query Parameters
```typescript
projectId?: string       // Filter by project (default: 'default')
id?: string             // Get specific video by ID
```

#### Response Schema
```typescript
interface DatabaseVideo {
  id: string
  filename: string
  title: string
  description?: string
  tags?: string[]
  created_at: string
  updated_at: string
  project_id: string
  file_size: number
  metadata?: Record<string, unknown>
  hidden: boolean
  timeline_order?: number
}
```

### **POST** `/api/database/videos`

Save videos to database (single or batch).

### **DELETE** `/api/database/videos?id={videoId}`

Delete video from database.

---

## ⚙️ Settings API

### **GET** `/api/database/settings`

Retrieve application settings.

#### Query Parameters
```typescript
key?: string            // Get specific setting by key
projectId?: string      // Get project-specific settings
```

#### Response Schema
```typescript
interface SettingsResponse {
  success: boolean
  data: Setting | Setting[]
  message?: string
}

interface Setting {
  key: string
  value: string          // JSON string
  created_at: string
  updated_at: string
}
```

### **POST** `/api/database/settings`

Save application settings.

#### Request Schema
```typescript
interface SaveSettingRequest {
  key: string
  value: any             // Will be JSON.stringify'd
}
```

#### Examples
```javascript
// Save user preferences
await fetch('/api/database/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'user_preferences',
    value: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    }
  })
})
```

---

## 🔄 Sync APIs

### **POST** `/api/database/sync/images`

Sync file system images to database.

#### Request Schema
```typescript
interface SyncImagesRequest {
  forceSync?: boolean          // Sync all images regardless of timestamp
  projectId?: string           // Target project (default: 'default')
  lastSync?: string           // ISO timestamp for delta sync
}
```

#### Response Schema
```typescript
interface SyncResponse {
  success: boolean
  savedCount: number
  updatedCount: number
  skippedCount: number
  errors?: string[]
  message: string
}
```

#### Process
1. **Scan File System**: Read all image metadata files
2. **Filter New/Changed**: Compare timestamps if `lastSync` provided
3. **Database Operations**: Insert/update images in SQLite
4. **Report Results**: Return sync statistics

### **POST** `/api/database/sync/videos`

Sync file system videos to database (same interface as images).

### **GET** `/api/database/sync/videos?checkFileSystem=true`

Compare database vs file system state.

#### Response
```typescript
interface SyncStatusResponse {
  success: boolean
  data: DatabaseVideo[]
  syncStatus: {
    databaseCount: number
    fileSystemCount: number
    inSyncCount: number
    onlyInDatabase: number
    onlyInFileSystem: number
    needsSync: boolean
  }
}
```

---

## 🌍 Environment APIs

### **GET** `/api/database/projects/[id]/env`

Get environment variables for specific project.

#### Response Schema
```typescript
interface ProjectEnvResponse {
  success: boolean
  data: {
    projectId: string
    environment: Record<string, string>
    lastUpdated: string
  }
}
```

### **POST** `/api/database/projects/[id]/env`

Set environment variables for project.

#### Request Schema
```typescript
interface SetProjectEnvRequest {
  environment: Record<string, string>
}
```

### **GET** `/api/database/settings/env`

Get global application environment settings.

### **POST** `/api/database/settings/env`

Set global environment settings.

---

## 🧪 Testing & Development APIs

### **GET** `/api/database/test`

Database connectivity and health check.

#### Response Schema
```typescript
interface DatabaseTestResponse {
  success: boolean
  database: {
    connected: boolean
    version: string
    tables: string[]
    recordCounts: Record<string, number>
  }
  performance: {
    connectionTime: number
    queryTime: number
  }
  message: string
}
```

#### Example Response
```json
{
  "success": true,
  "database": {
    "connected": true,
    "version": "3.42.0",
    "tables": ["projects", "images", "videos", "user_settings"],
    "recordCounts": {
      "projects": 2,
      "images": 45,
      "videos": 12,
      "user_settings": 8
    }
  },
  "performance": {
    "connectionTime": 2.3,
    "queryTime": 1.7
  },
  "message": "Database is healthy"
}
```

---

## 🔧 Utility APIs

### **GET** `/api/current-project`

Get the current active project from server state.

#### Response Schema
```typescript
interface CurrentProjectResponse {
  success: boolean
  data: {
    projectId: string
    timestamp: string
    source: string         // 'header' | 'session' | 'default'
  }
}
```

### **GET** `/api/images/serve/[imageId]`

Serve images dynamically with metadata.

#### Query Parameters
```typescript
width?: number          // Resize width
height?: number         // Resize height
format?: 'webp' | 'jpeg' | 'png'  // Output format
quality?: number        // Compression quality (1-100)
```

### **POST** `/api/images/update-project`

Update project association for images.

#### Request Schema
```typescript
interface UpdateImageProjectRequest {
  imageIds: string[]
  targetProjectId: string
  sourceProjectId?: string
}
```

---

## 💾 Database Service Layer

### Core Service (`src/services/databaseService.ts`)

The Database Service provides the underlying implementation:

```typescript
class DatabaseService {
  // Projects
  async saveProject(project: DatabaseProject): Promise<boolean>
  async getProject(id: string): Promise<DatabaseProject | null>
  async getProjects(): Promise<DatabaseProject[]>
  async deleteProject(id: string): Promise<boolean>

  // Images
  async saveImage(image: DatabaseImage): Promise<boolean>
  async getImage(id: string): Promise<DatabaseImage | null>
  async getImages(projectId: string): Promise<DatabaseImage[]>
  async deleteImage(id: string): Promise<boolean>

  // Videos
  async saveVideo(video: DatabaseVideo): Promise<boolean>
  async getVideo(id: string): Promise<DatabaseVideo | null>
  async getVideos(projectId: string): Promise<DatabaseVideo[]>
  async deleteVideo(id: string): Promise<boolean>

  // Settings
  async saveSetting(key: string, value: any): Promise<boolean>
  async getSetting(key: string): Promise<any>
  async getSettings(): Promise<Record<string, any>>
  async deleteSetting(key: string): Promise<boolean>
}
```

---

## 🔍 Error Handling

### Common Error Responses
```typescript
// Validation Errors
{ success: false, error: 'Project ID is required', status: 400 }
{ success: false, error: 'Invalid request body', status: 400 }

// Not Found Errors
{ success: false, error: 'Project not found', status: 404 }
{ success: false, error: 'Image not found', status: 404 }

// Database Errors
{ success: false, error: 'Failed to save project', status: 500 }
{ success: false, error: 'Database connection failed', status: 500 }

// Protection Errors
{ success: false, error: 'Cannot delete the default project', status: 403 }
```

### Debugging Tips
1. **Check Database Health**: Use `/api/database/test` first
2. **Verify Project Exists**: Ensure project ID is valid
3. **Check Foreign Keys**: Projects must exist before adding images/videos
4. **Monitor Sync Operations**: Check sync status for file/database mismatches
5. **Validate JSON**: Settings values must be valid JSON

---

## 🧪 Testing Database APIs

### Health Check
```javascript
// Test database connectivity
const response = await fetch('/api/database/test')
const health = await response.json()
console.log('Database health:', health)
```

### Complete CRUD Test
```javascript
// Test complete project lifecycle
const testProjectCRUD = async () => {
  // Create
  await fetch('/api/database/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project: {
        id: 'test-project',
        name: 'Test Project',
        description: 'API Test'
      }
    })
  })
  
  // Read
  const getResponse = await fetch('/api/database/projects?id=test-project')
  const project = await getResponse.json()
  
  // Update
  await fetch('/api/database/projects?id=test-project', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Updated Test Project'
    })
  })
  
  // Delete
  await fetch('/api/database/projects?id=test-project', {
    method: 'DELETE'
  })
}
```

### Sync Testing
```javascript
// Test file system sync
const testSync = async () => {
  // Force full sync
  const response = await fetch('/api/database/sync/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      forceSync: true,
      projectId: 'dvs'
    })
  })
  
  const result = await response.json()
  console.log('Sync results:', result)
}
```

---

## 📊 Performance Considerations

### Optimization Strategies
- **Prepared Statements**: All queries use prepared statements
- **Batch Operations**: Bulk insert/update for multiple records
- **Transactions**: Atomic operations with rollback capability
- **Indexes**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connection management

### Monitoring
```typescript
// Built-in performance tracking
interface PerformanceMetrics {
  connectionTime: number    // Database connection time
  queryTime: number        // Query execution time
  recordsProcessed: number // Number of records affected
  operationType: string    // 'read' | 'write' | 'delete'
}
```

---

## 🔮 Future Enhancements

### Planned Features
- **API Rate Limiting**: Prevent database overload
- **Query Optimization**: Advanced query caching
- **Backup/Restore**: Database backup utilities
- **Migration System**: Schema version management
- **Audit Logging**: Track all database changes

### Advanced Features
- **Multi-tenancy**: User-based data isolation
- **Replication**: Master-slave database setup
- **Sharding**: Horizontal scaling strategies
- **Analytics**: Usage statistics and insights

---

## 🔗 Related Documentation

- [SQLite Database Schema](../../architecture/sqlite-database-implementation.md) - Database structure
- [Auto-Sync System](../../features/auto-sync/) - File system synchronization
- [Project Management](../../features/project-management/) - Project isolation patterns
- [API Documentation](../README.md) - Core API reference 