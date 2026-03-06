# Project Management System

## 🎯 Overview

Forge implements a comprehensive multi-project workspace system that provides complete isolation between different creative projects while maintaining a unified interface.

## 🏗️ Architecture

### Project Structure
```typescript
interface Project {
  id: string                    // Unique project identifier
  name: string                  // Display name
  description?: string          // Optional description
  lastActivity: Date           // Last interaction timestamp
  settings: ProjectSettings    // Project-specific configuration
}

interface ProjectSettings {
  business?: BusinessSettings   // Business context
  brand?: BrandSettings        // Brand guidelines and story
  prompting?: PromptSettings   // Default prompts and concepts
  loras?: LoRASettings         // LoRA model configuration
}
```

### Built-in Projects
- **Default Project** (`id: 'default'`) - General purpose workspace
- **DVS Project** (`id: 'dvs'`) - Dryer Vent Squad brand project

---

## 🌐 URL-Based Project Routing

### Route Structure
```
/                    → Default project (redirects to /default)
/[projectId]         → Specific project workspace
/dvs                 → DVS brand project
/default             → Default project
```

### Implementation
Project routing is handled by Next.js dynamic routes:
```
src/app/[projectId]/page.tsx     // Main project workspace
src/app/[projectId]/hidden/      // Hidden images view
src/app/[projectId]/styles/      // Project-specific styling
```

### Route Behavior
- **Automatic Detection**: Current project determined from URL path
- **Fallback Handling**: Invalid project IDs redirect to default
- **State Synchronization**: URL changes trigger project context updates

---

## 🔄 Project Context System

### Context Provider
```typescript
// src/contexts/ProjectContext.tsx
interface ProjectContextType {
  currentProject: Project
  allProjects: Project[]
  setCurrentProject: (project: Project) => void
  getProjectById: (id: string) => Project | undefined
}

const ProjectProvider: React.FC = ({ children }) => {
  // Context implementation
}
```

### Usage Pattern
```typescript
const { currentProject, setCurrentProject } = useProjectContext()

// Switch projects programmatically
setCurrentProject(dvsProject)

// Access current project data
console.log('Current project:', currentProject.name)
```

---

## 📊 Data Isolation

### Complete Project Separation
Each project maintains separate:
- **Image Collections**: Timeline, gallery, and hidden images
- **Settings Configuration**: LoRAs, prompts, business context
- **UI State**: Timeline visibility, filter preferences
- **Generation History**: All API calls and results

### Storage Implementation
```typescript
// IndexedDB: Project-specific keys
`timeline_config_${projectId}`
`hidden_images_${projectId}`
`ui_state_${projectId}`

// SQLite: Projects table with JSON settings
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  settings JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎛️ Project Settings Management

### Settings Modal Interface
Accessible via gear icon in Project Drawer, organized into tabs:

#### **General Tab**
- Project name and description
- Creation and modification dates
- Activity statistics

#### **Business Tab**
- Company information
- Contact details  
- Project scope and objectives

#### **Brand Tab**
- Brand story and guidelines
- Visual identity elements
- Tone and messaging

#### **Prompting Tab**
- Default master prompts
- Concept templates
- Generation preferences

#### **LoRAs Tab**
- LoRA model configuration
- Path and scale settings
- Enable/disable toggles

### Settings Persistence
```typescript
// Auto-save on changes
const handleSettingsUpdate = async (newSettings: ProjectSettings) => {
  await fetch(`/api/database/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ settings: newSettings })
  })
}
```

---

## 🔧 Project Switching

### UI Controls
- **Project Drawer**: Hamburger menu reveals project list
- **Visual Indicators**: Current project shown in navbar
- **Quick Navigation**: Click project name to switch

### Switching Process
1. **User Selection**: Click project in drawer
2. **Route Update**: Navigate to `/[newProjectId]`
3. **Context Update**: ProjectContext detects route change
4. **Data Reload**: Images and settings reloaded for new project
5. **UI Refresh**: Timeline, gallery, and modals update

### Implementation Details
```typescript
const handleProjectSelect = (project: Project) => {
  // Update context
  setCurrentProject(project)
  
  // Navigate to project route
  router.push(`/${project.id}`)
  
  // Trigger data reload
  forceReloadImages()
  
  // Close drawer
  onClose()
}
```

---

## 📈 Project Statistics

### Activity Tracking
Each project tracks:
- **Image Count**: Total images in timeline, gallery, hidden
- **Last Activity**: Most recent interaction
- **Generation Stats**: API usage and costs
- **Session Data**: Time spent in project

### Display in Project List
```typescript
<div className="text-xs text-muted-foreground">
  <span>{getImageCountByProject(project.id)} images</span>
  <span>•</span>
  <span>{formatLastActivity(project.lastActivity)}</span>
</div>
```

---

## 🔐 Project Creation & Management

### Creating New Projects
Currently projects are created through:
1. **Manual Database Entry**: Direct SQLite insertion
2. **Code Configuration**: Adding to project list
3. **Future**: UI-based project creation modal

### Default Project Structure
```typescript
const createProject = (id: string, name: string): Project => ({
  id,
  name,
  description: '',
  lastActivity: new Date(),
  settings: {
    business: {},
    brand: {},
    prompting: {
      master_prompt: DEFAULT_MASTER_PROMPT
    },
    loras: {
      lora1: { enabled: false, path: '', scale: 0.5 },
      lora2: { enabled: false, path: '', scale: 0.5 }
    }
  }
})
```

---

## 🔄 Server-Side Project State

### Current Project Detection
Server-side APIs automatically detect current project:

```typescript
// src/lib/serverStateUtils.ts
export function getCurrentProjectFromServerSync(): string {
  // Implementation varies by context:
  // - Header-based detection
  // - Session storage
  // - URL parsing
  return currentProjectId || 'default'
}
```

### API Integration
All generation APIs automatically:
- **Tag images** with current project ID
- **Load project LoRAs** from database
- **Apply project prompts** and settings
- **Save to project directories**

---

## 🎨 DVS Project Configuration

### Brand-Specific Settings
The DVS project includes:
- **Custom LoRAs**: MinimalDesign + Cute_3d_Cartoon
- **Brand Master Prompt**: Orange accents, tactical gear themes
- **Business Context**: Dryer vent cleaning service
- **Character Guidelines**: Lint monsters vs Squad members

### Generation Integration
DVS project automatically applies:
```typescript
const DVS_MASTER_PROMPT = `
minimal design, professional rugged 3D animation style, 
Pixar meets military documentary, enhanced color saturation, 
stylized lighting with orange accents (#FF9B00), 
slightly heroic proportions, tactical gear themes...
`
```

---

## 🧪 Testing Project System

### Manual Testing
1. **Switch Projects**: Use hamburger menu
2. **Check Isolation**: Generate images in each project
3. **Verify Settings**: Configure different LoRAs per project
4. **URL Testing**: Navigate directly to `/dvs` and `/default`

### Debugging Commands
```javascript
// Browser console
console.log('Current project:', useProjectContext().currentProject)
console.log('All projects:', useProjectContext().allProjects)

// Check project images
console.log('DVS images:', getImageCountByProject('dvs'))
console.log('Default images:', getImageCountByProject('default'))
```

---

## 🔮 Future Enhancements

### Planned Features
- **Project Creation UI**: Modal for creating new projects
- **Project Templates**: Pre-configured project types
- **Import/Export**: Project backup and sharing
- **Collaboration**: Multi-user project access
- **Project Analytics**: Detailed usage statistics

### Advanced Settings
- **Custom Routes**: `/custom-project-slug`
- **Project Themes**: Per-project UI customization
- **Workflow Templates**: Project-specific tool configurations
- **Integration Hooks**: Custom API behaviors per project

---

## 🔗 Related Documentation

- [API Documentation](../../api/) - Project-aware API endpoints
- [Auto-Sync System](../auto-sync/) - Project-specific file monitoring
- [Hidden Images](../hidden-images/) - Per-project image hiding
- [Database Schema](../../architecture/sqlite-database-implementation.md) - Project storage structure 