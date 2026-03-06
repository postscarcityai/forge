# Multi-Client Project Management PRD
## Forge Framework Enhancement

**Version:** 1.0  
**Date:** June 2025  
**Status:** Planning  
**Author:** PostScarcity AI  

---

## 1. Executive Summary

### Problem Statement
Forge currently treats all generated images as a single pool, making it impossible to organize work by client or project. While client context exists in `docs/brands/`, the backend has no concept of projects, leading to:
- Mixed client work in galleries
- No project-based filtering or organization  
- Difficulty managing multiple client workflows
- Context bleeding between client projects
- Inability to generate client-specific reports or deliverables

### Solution Overview
Implement a comprehensive multi-client project management system that maintains Forge's simplicity while adding enterprise-level organization capabilities.

---

## 2. Current State Analysis

### Backend Architecture (Current)
```
Images: public/images/*.jpg (all mixed together)
Metadata: public/images/image-info/*.json (no client reference)
Context: docs/brands/[client]/ (isolated but not connected to images)
State: Single ImageContext with flat array
Organization: gallery | timeline | hidden (no client dimension)
```

### Pain Points
1. **No Project Isolation**: Can't filter images by client/project
2. **Context Confusion**: Cursor searches across all client contexts simultaneously
3. **Workflow Fragmentation**: Manual organization required outside the app
4. **Delivery Complexity**: No way to export client-specific work
5. **Timeline Pollution**: Client A images mixed with Client B in timeline

---

## 3. Goals & Objectives

### Primary Goals
- **Project Isolation**: Each client gets dedicated workspace
- **Context Separation**: Client-specific prompt generation and context
- **Flexible Organization**: Support various client workflow patterns
- **Backward Compatibility**: Existing images remain functional
- **Scalability**: Support 1-100+ concurrent client projects

### Success Metrics
- Zero context bleeding between client projects
- <2 clicks to switch between client workspaces
- 100% backward compatibility with existing workflows
- Client-specific deliverable generation in <30 seconds

---

## 4. User Stories & Requirements

### Epic 1: Project-Based Workspace
**As a creative agency**, I want to isolate client work so that each project maintains its own context and assets.

#### User Stories:
- **US-1**: As a user, I want to create new client projects with custom names and settings
- **US-2**: As a user, I want to switch between client projects via a project selector
- **US-3**: As a user, I want each project to have its own timeline, gallery, and hidden images
- **US-4**: As a user, I want to see only the current project's content in all views

### Epic 2: Context Management
**As a creative professional**, I want project-specific context so prompts are relevant and consistent per client.

#### User Stories:
- **US-5**: As a user, I want each project to have its own documentation and context
- **US-6**: As a user, I want Cursor's vector search to only use current project context
- **US-7**: As a user, I want to import/export project context and brand guidelines
- **US-8**: As a user, I want project-specific prompt templates and styles

### Epic 3: Asset Management
**As a project manager**, I want sophisticated asset organization and delivery capabilities.

#### User Stories:
- **US-9**: As a user, I want to export all assets for a specific project
- **US-10**: As a user, I want to archive completed projects (hide from active list)
- **US-11**: As a user, I want to duplicate projects to reuse successful setups
- **US-12**: As a user, I want project-specific statistics and reporting

---

## 5. Technical Requirements

### 5.1 Data Model

#### Project Entity
```typescript
interface Project {
  id: string;                    // UUID
  name: string;                  // "DVS Campaign", "Acme Corp"
  slug: string;                  // "dvs-campaign", "acme-corp"
  description?: string;
  color?: string;                // UI accent color
  status: 'active' | 'archived' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  metadata: Record<string, any>;
}

interface ProjectSettings {
  defaultPromptStyle?: string;
  imagePrefix?: string;          // Filename prefix for organization
  autoTimeline?: boolean;        // Auto-add to timeline
  contextPath?: string;          // docs/brands/[slug]
}
```

#### Enhanced Image Metadata
```typescript
interface ImageData {
  // Existing fields...
  id: string;
  filename: string;
  type: 'gallery' | 'timeline' | 'hidden';
  
  // New project fields
  projectId: string;            // Required: which project owns this
  projectSlug: string;          // For easy filtering
  tags?: string[];              // Project-specific tags
  clientVisible?: boolean;      // For client delivery filtering
}
```

### 5.2 File System Organization

#### Proposed Structure
```
public/
  images/
    [project-slug]/             ← Project-isolated directories
      *.jpg                     ← Project images
      image-info/               ← Project metadata
        *.json
  videos/
    [project-slug]/             ← Project videos
      clips/
      raw/

docs/
  projects/                     ← Move from brands/
    [project-slug]/
      context.md                ← Brand guidelines, context
      prompts.md                ← Successful prompts
      config.json               ← Project settings
      deliverables/             ← Final outputs
```

### 5.3 API Enhancements

#### New Endpoints
```
POST   /api/projects                    ← Create project
GET    /api/projects                    ← List projects
GET    /api/projects/[slug]             ← Get project details
PUT    /api/projects/[slug]             ← Update project
DELETE /api/projects/[slug]             ← Archive project

GET    /api/projects/[slug]/images      ← Project images
GET    /api/projects/[slug]/videos      ← Project videos
POST   /api/projects/[slug]/export     ← Export project assets
```

#### Modified Endpoints
```
POST /api/fal-images/generate
  + projectId: string          ← Images now belong to project

GET /api/images/sync
  + projectId?: string         ← Filter by project
```

### 5.4 State Management

#### Enhanced Context
```typescript
interface AppState {
  currentProject: Project | null;
  projects: Project[];
  projectImages: Record<string, ImageData[]>;  // Keyed by projectId
  // ... existing state
}

// New actions
type ProjectAction = 
  | { type: 'SET_CURRENT_PROJECT'; payload: Project }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Partial<Project> }
  | { type: 'ARCHIVE_PROJECT'; payload: string }
```

---

## 6. UI/UX Requirements

### 6.1 Project Selector
**Location**: Navbar (left of Timeline button)  
**Behavior**: Dropdown with project list, shows current project name  
**Features**: Create new project, quick switch, project status indicators

### 6.2 Project Management
**Location**: New `/projects` page  
**Features**: 
- Grid view of all projects with previews
- Create/edit/archive projects
- Project statistics (image count, last activity)
- Import/export capabilities

### 6.3 Gallery Filtering
**Current**: Shows all images mixed together  
**Enhanced**: 
- Only shows current project images
- Project context in header
- Cross-project search if needed

### 6.4 Timeline Isolation
**Current**: Single timeline across all work  
**Enhanced**: Each project has independent timeline

---

## 7. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Project data model and database structure
- [ ] Basic project CRUD operations
- [ ] Project selector UI component
- [ ] Migration script for existing images → "Default Project"

### Phase 2: Asset Association (Week 3)  
- [ ] Associate new images with current project
- [ ] Project-filtered gallery views
- [ ] Project-specific timelines
- [ ] Updated image generation APIs

### Phase 3: Context Integration (Week 4)
- [ ] Project-specific documentation structure
- [ ] Context-aware prompt generation
- [ ] Cursor integration for project-scoped searches
- [ ] Project settings and customization

### Phase 4: Advanced Features (Week 5-6)
- [ ] Project export/import
- [ ] Archive/restore functionality  
- [ ] Project duplication
- [ ] Advanced reporting and analytics
- [ ] Client delivery workflows

---

## 8. Migration Strategy

### Backward Compatibility
1. **Existing Images**: All current images assigned to "Default Project"
2. **Existing Docs**: `docs/brands/` → `docs/projects/`
3. **Existing Workflows**: Continue working until user creates first custom project
4. **Gradual Adoption**: Users can opt-in to multi-project features

### Migration Script
```typescript
// Pseudo-code for migration
async function migrateToProjects() {
  // 1. Create "Default Project"
  const defaultProject = createProject({
    name: "Default Project", 
    slug: "default"
  });
  
  // 2. Assign all existing images to default project
  updateAllImages({ projectId: defaultProject.id });
  
  // 3. Move existing brand docs
  migrateBrandDocs("docs/brands/*" → "docs/projects/*/");
}
```

---

## 9. Technical Considerations

### Performance
- **Lazy Loading**: Only load current project images
- **Caching**: Project-specific IndexedDB caches
- **File Organization**: Isolated directories prevent cross-project pollution

### Security
- **Project Isolation**: No accidental cross-project data leakage
- **Export Controls**: Control what gets included in client deliveries
- **Context Separation**: Cursor searches isolated per project

### Scalability
- **Many Projects**: UI handles 100+ projects efficiently
- **Large Projects**: Projects with 1000+ images perform well
- **Concurrent Users**: Multiple users can work on different projects

---

## 10. Success Criteria

### Must Have (MVP)
- ✅ Create and switch between projects
- ✅ Project-isolated image galleries
- ✅ Project-specific timelines  
- ✅ Context separation for prompts
- ✅ Backward compatibility with existing work

### Should Have (V1)
- ✅ Project export for client delivery
- ✅ Archive/restore projects
- ✅ Project settings and customization
- ✅ Advanced search and filtering

### Could Have (Future)
- ✅ Multi-user collaboration per project
- ✅ Client access controls and sharing
- ✅ Project templates and presets
- ✅ Integration with external project management tools

---

## 11. Open Questions

1. **Default Behavior**: Should new users start with a default project or be prompted to create one?
2. **Cross-Project Features**: Any use cases for cross-project timeline or galleries?  
3. **Context Sharing**: Should there be shared context between projects (e.g., company-wide style guides)?
4. **URL Structure**: Should projects have dedicated URLs (`/projects/dvs/timeline`)?
5. **Export Formats**: What file formats and structures for project export?

---

**Next Steps**: Review with team → Technical design → Implementation Phase 1 