# Forge Documentation Hub

## 🎯 Welcome to Forge Workshop

Complete documentation for Forge - a Next.js AI-powered image generation and project management platform.

---

## 🚀 Quick Start

### Essential Reading
1. **[API Documentation](api/)** - All generation endpoints (images + video)
2. **[Database APIs](api/database/)** - Complete data layer with CRUD operations
3. **[Project Management](features/project-management/)** - Multi-project workspace system
4. **[Video Generation](features/video-generation/)** - Kling AI video creation system
5. **[Auto-Sync System](features/auto-sync/)** - Real-time file monitoring

### For Developers
- **[Architecture Overview](architecture/project-structure.md)** - Complete system architecture
- **[Database Schema](architecture/sqlite-database-implementation.md)** - SQLite + IndexedDB setup
- **[Design System](architecture/design-system.md)** - UI components and theming

---

## 📚 Documentation Categories

### 🛠️ API Reference
- **[Generation APIs](api/)** - AI-powered content creation
  - Flux-LoRA (single & batch) - Style-controlled generation
  - Flux-Kontext (single & batch) - Fine-grained editing
  - Kling Video API - Image-to-video generation
- **[Database APIs](api/database/)** - Complete data layer
  - Projects, Images, Videos CRUD operations
  - File system synchronization
  - Environment & settings management

### 🎯 Core Features
- **[Project Management](features/project-management/)** - Multi-project architecture
- **[Video Generation](features/video-generation/)** - Mixed media workflows
- **[Auto-Sync System](features/auto-sync/)** - File system monitoring & delta sync  
- **[Advanced UI Components](features/ui-components/)** - Specialized system interfaces
- **[Hidden Images](features/hidden-images/)** - Per-project media hiding
- **[Drag & Drop](features/drag-drop/)** - Cross-container interactions
- **[Timeline System](features/timeline/)** - Timeline persistence & visibility
- **[Image Generation](features/image-generation/)** - AI generation workflows

### 🏗️ Architecture
- **[Project Structure](architecture/project-structure.md)** - Complete app architecture
- **[Database Implementation](architecture/sqlite-database-implementation.md)** - SQLite server + IndexedDB client
- **[IndexedDB Caching](architecture/indexeddb-caching-implementation.md)** - Client-side storage
- **[Design System](architecture/design-system.md)** - UI components & themes

### 📋 Product & Planning
- **[Product Overview](product/overview.md)** - Product vision and scope
- **[Multi-Client PRD](product/multi-client-project-management-prd.md)** - Project requirements
- **[Backlog](backlog/)** - Future integrations and features

### 🎨 Brand Assets
- **[DVS Brand](brands/dvs/)** - Dryer Vent Squad brand guidelines
  - Brand story, business overview, character guidelines

---

## ⚡ Feature Matrix

| Feature | Status | Documentation | Testing |
|---------|--------|---------------|---------|
| **Flux-LoRA API** | ✅ Production | [Guide](api/) | ✅ Tested |
| **Flux-Kontext API** | ✅ Production | [Guide](api/) | ✅ Tested |
| **Kling Video API** | ✅ Production | [Guide](features/video-generation/) | ✅ Tested |
| **Database APIs** | ✅ Production | [Guide](api/database/) | ✅ Tested |
| **Project Management** | ✅ Production | [Guide](features/project-management/) | ✅ Tested |
| **Auto-Sync System** | ✅ Production | [Guide](features/auto-sync/) | ✅ Tested |
| **Advanced UI Components** | ✅ Production | [Guide](features/ui-components/) | ✅ Tested |
| **Drag & Drop** | ✅ Production | [Guide](features/drag-drop/) | ✅ Tested |
| **Hidden Images** | ✅ Production | [Guide](features/hidden-images/) | ✅ Tested |
| **Timeline Persistence** | ✅ Production | [Guide](features/timeline/) | ✅ Tested |
| **Design System** | ✅ Production | [Guide](architecture/design-system.md) | ✅ Tested |
| **IndexedDB Caching** | ✅ Production | [Guide](architecture/indexeddb-caching-implementation.md) | ✅ Tested |

---

## 🧪 Testing & Development

### Quick API Testing
```javascript
// Test all 4 API endpoints
fetch('/api/flux-lora', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: "test image", concept: "API Test" })
})
```

### Browser Console Debugging
```javascript
// Access project context
console.log('Current project:', useProjectContext().currentProject)

// Check image counts
console.log('DVS images:', getImageCountByProject('dvs'))

// Force sync check
const { triggerCheck } = useFileWatcher()
await triggerCheck()
```

### Performance Monitoring
- **Generation Times**: LoRA ~5s, Kontext ~3-4s
- **Auto-Sync Latency**: 2-5 seconds end-to-end
- **Cache Hit Rates**: ~90% after initial load

---

## 🎮 User Workflows

### Typical Creative Session
1. **Switch Project**: Use hamburger menu → Select DVS project
2. **Generate Ideas**: Use Flux-LoRA for style-controlled variations  
3. **Refine Images**: Use Flux-Kontext for fine-grained edits
4. **Organize Timeline**: Drag best images to timeline
5. **Hide Iterations**: Move unsuccessful attempts to hidden
6. **Auto-Sync**: New images appear automatically within 5 seconds

### Project Management
1. **Create Workspace**: Switch between Default and DVS projects
2. **Configure LoRAs**: Set project-specific AI models in settings
3. **Brand Consistency**: Automatic brand prompts and styling
4. **Isolated Storage**: Complete separation between projects

---

## 🔧 Technical Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **React 19** - UI library with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **@dnd-kit** - Drag and drop interactions

### Backend  
- **Next.js API Routes** - Server-side API endpoints
- **SQLite** - Server-side persistent storage
- **IndexedDB** - Client-side browser caching
- **Fal.ai Integration** - AI image generation

### Architecture Patterns
- **Context + Reducer** - Global state management
- **Normalized Data** - Efficient data structures  
- **Optimistic Updates** - Immediate UI feedback
- **Delta Sync** - Efficient file monitoring
- **Project Isolation** - Multi-tenant data separation

---

## 🔮 Roadmap & Future Features

### Phase 2: Advanced Features
- **Component Library Documentation** - Complete UI catalog
- **Video Generation** - Kling AI integration
- **Cloud Storage** - DigitalOcean Spaces integration
- **Collaboration Tools** - Multi-user project access

### Phase 3: Enterprise Features  
- **Advanced Analytics** - Usage tracking and insights
- **API Rate Limiting** - Production-ready scaling
- **User Management** - Role-based access control
- **Backup & Export** - Data portability

---

## 📞 Support & Contributing

### Getting Help
- **Architecture Questions**: Check [Project Structure](architecture/project-structure.md)
- **API Issues**: Review [API Documentation](api/)
- **Feature Requests**: Add to [Backlog](backlog/)
- **Bug Reports**: Check existing documentation first

### Development Guidelines
- **SOLID Principles**: Follow Uncle Bob's design principles
- **Modular Components**: Keep files focused and small
- **Semantic Colors**: Use design system tokens
- **Error Messaging**: Make errors fun and helpful
- **Test Coverage**: Document all major features

---

## 📊 Documentation Statistics

- **Total Files**: 26 documentation files
- **API Endpoints**: 15+ fully documented (4 generation + 10+ database)
- **Core Features**: 11 comprehensive guides  
- **Architecture Docs**: 5 technical references
- **Brand Assets**: Complete DVS guidelines
- **Test Coverage**: All production features documented

**Last Updated**: January 2024  
**Version**: 2.0 (Post-API Migration)  
**Completeness**: 95% feature coverage 