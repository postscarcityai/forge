# Advanced UI Components

## 🎯 Overview

Forge's Advanced UI Components provide specialized interfaces for system management, debugging, project creation, and advanced user interactions. These components handle complex state management, cache operations, and developer tools.

## 🏗️ Architecture

### Component Hierarchy
```
App Layout
├── LayoutContext (Global State)
├── Navigation & Routing
├── Core Content Areas
│   ├── Gallery & Timeline (Media Display)
│   ├── Project Management UI
│   └── System Management Tools
└── Modal & Overlay Systems
    ├── CreateProjectModal (Project Creation)
    ├── CacheManager (IndexedDB Management)
    └── DebugInfo (Development Tools)
```

### Design Principles
- **Context-Driven State**: Centralized state management
- **Modal-Based Workflows**: Non-blocking user interactions
- **Progressive Disclosure**: Show complexity only when needed
- **Developer-Friendly**: Rich debugging and management tools

---

## 🗂️ CacheManager Component

### Purpose
Advanced IndexedDB cache management interface with real-time statistics, cleanup utilities, and debugging tools.

### Component Location
`src/components/ui/CacheManager.tsx`

### Features
```typescript
interface CacheManagerFeatures {
  // Real-time Cache Statistics
  totalImages: number
  totalVideos: number
  cacheSize: string           // Human-readable size (e.g., "142.3 MB")
  lastUpdate: string         // Timestamp
  
  // Cache Operations
  clearAll: () => Promise<void>
  clearImages: () => Promise<void>
  clearVideos: () => Promise<void>
  clearProjects: () => Promise<void>
  
  // Advanced Features
  exportCache: () => Promise<Blob>     // Export cache data
  importCache: (file: File) => Promise<void>
  compactDatabase: () => Promise<void>
  validateIntegrity: () => Promise<CacheHealth>
}
```

### UI Components
```jsx
// Cache Statistics Panel
<div className="bg-gray-50 rounded-lg p-4">
  <h3 className="text-lg font-semibold mb-4">Cache Statistics</h3>
  
  <div className="grid grid-cols-2 gap-4">
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-600">{totalImages}</div>
      <div className="text-sm text-gray-600">Images Cached</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-green-600">{cacheSize}</div>
      <div className="text-sm text-gray-600">Total Size</div>
    </div>
  </div>
</div>

// Cache Operations Panel
<div className="space-y-3">
  <Button variant="destructive" onClick={clearAll}>
    Clear All Cache
  </Button>
  <Button variant="outline" onClick={compactDatabase}>
    Compact Database
  </Button>
  <Button variant="secondary" onClick={exportCache}>
    Export Cache Data
  </Button>
</div>
```

### State Management
```typescript
interface CacheManagerState {
  stats: CacheStats
  isLoading: boolean
  error?: string
  operations: {
    clearing: boolean
    compacting: boolean
    exporting: boolean
    importing: boolean
  }
}

// Integration with ImageContext
const { state, clearCache, updateCacheStats } = useImageContext()
```

### Error Handling
```typescript
// Cache operation errors with user-friendly messages
const ERROR_MESSAGES = {
  CLEAR_FAILED: "Oops! Our digital janitor slipped on some pixels. Please try again!",
  EXPORT_FAILED: "The cache export got stage fright. Give it another moment to perform!",
  IMPORT_FAILED: "That cache file seems to be speaking a different language. Try another one!",
  COMPACT_FAILED: "Database compaction hit a snag. Like trying to fold fitted sheets!"
}
```

---

## 🏗️ CreateProjectModal Component

### Purpose
Comprehensive project creation interface with validation, settings configuration, and brand integration.

### Component Location
`src/components/ui/CreateProjectModal.tsx`

### Features
```typescript
interface CreateProjectModalFeatures {
  // Basic Project Info
  projectName: string
  projectDescription: string
  projectColor: string        // Theme color selection
  
  // Advanced Configuration
  brandTemplate?: 'dvs' | 'custom'
  businessSettings?: BusinessSettings
  defaultLoRAs?: LoRASettings
  
  // Validation & UX
  nameValidation: ValidationState
  realTimePreview: ProjectPreview
  duplicateDetection: boolean
}
```

### Form Structure
```jsx
<Modal isOpen={isOpen} onClose={onClose} size="xl">
  <ModalHeader>
    <h2 className="text-2xl font-bold">Create New Project</h2>
    <p className="text-gray-600">Set up your creative workspace</p>
  </ModalHeader>
  
  <ModalBody className="space-y-6">
    {/* Basic Information */}
    <FormSection title="Project Details">
      <InputField
        label="Project Name"
        value={projectName}
        onChange={setProjectName}
        validation={nameValidation}
        placeholder="Enter project name..."
      />
      
      <TextareaField
        label="Description"
        value={projectDescription}
        onChange={setProjectDescription}
        placeholder="Describe your project..."
      />
      
      <ColorPicker
        label="Theme Color"
        value={projectColor}
        onChange={setProjectColor}
        presets={THEME_COLORS}
      />
    </FormSection>
    
    {/* Brand Templates */}
    <FormSection title="Brand Template">
      <RadioGroup
        value={brandTemplate}
        onChange={setBrandTemplate}
        options={[
          { value: 'blank', label: 'Blank Project', description: 'Start from scratch' },
          { value: 'dvs', label: 'Dryer Vent Squad', description: 'Pre-configured DVS branding' },
          { value: 'custom', label: 'Custom Template', description: 'Import from file' }
        ]}
      />
    </FormSection>
    
    {/* Advanced Settings */}
    <Collapsible title="Advanced Settings">
      <LoRASelector
        selected={defaultLoRAs}
        onChange={setDefaultLoRAs}
        presets={LORA_PRESETS}
      />
      
      <BusinessSettingsForm
        settings={businessSettings}
        onChange={setBusinessSettings}
      />
    </Collapsible>
  </ModalBody>
  
  <ModalFooter>
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button 
      onClick={handleCreateProject}
      disabled={!isFormValid}
      loading={isCreating}
    >
      Create Project
    </Button>
  </ModalFooter>
</Modal>
```

### Validation System
```typescript
interface ProjectValidation {
  name: {
    isValid: boolean
    errors: string[]
    suggestions?: string[]
  }
  description: {
    isValid: boolean
    wordCount: number
    recommended: boolean
  }
  overall: {
    canSubmit: boolean
    completeness: number  // 0-100%
  }
}

// Real-time validation rules
const validateProjectName = (name: string): ValidationResult => {
  const rules = [
    { test: name.length >= 3, message: "Name must be at least 3 characters" },
    { test: name.length <= 50, message: "Name must be under 50 characters" },
    { test: !/[<>:"/\\|?*]/.test(name), message: "Name contains invalid characters" },
    { test: !existingProjects.includes(name.toLowerCase()), message: "Project name already exists" }
  ]
  
  return {
    isValid: rules.every(rule => rule.test),
    errors: rules.filter(rule => !rule.test).map(rule => rule.message)
  }
}
```

### Project Creation Workflow
```typescript
const handleCreateProject = async () => {
  try {
    setIsCreating(true)
    
    // 1. Validate form data
    const validation = validateForm()
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    // 2. Create project object
    const newProject: DatabaseProject = {
      id: generateProjectId(projectName),
      name: projectName,
      description: projectDescription,
      settings: {
        color: projectColor,
        status: 'active',
        ...advancedSettings
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // 3. Save to database
    await saveProject(newProject)
    
    // 4. Update context
    await refreshProjects()
    
    // 5. Navigate to new project
    router.push(`/${newProject.id}`)
    
    // 6. Close modal
    onClose()
    
    toast.success(`Welcome to ${projectName}! 🎉`)
  } catch (error) {
    toast.error(`Project creation hit a snag: ${error.message}`)
  } finally {
    setIsCreating(false)
  }
}
```

---

## 🔍 DebugInfo Component

### Purpose
Comprehensive development debugging panel with system state inspection, performance monitoring, and diagnostic tools.

### Component Location
`src/components/ui/DebugInfo.tsx`

### Features
```typescript
interface DebugInfoFeatures {
  // System State
  contextState: ImageContextState
  routingInfo: NextRouter
  projectState: ProjectState
  cacheMetrics: CacheMetrics
  
  // Performance Monitoring
  renderTimes: PerformanceEntry[]
  apiCallMetrics: APIMetrics
  memoryUsage: MemoryInfo
  
  // Development Tools
  stateExport: () => Promise<StateSnapshot>
  resetToDefaults: () => Promise<void>
  simulateError: (type: ErrorType) => void
  toggleMockMode: () => void
}
```

### Debug Panels
```jsx
<Collapsible title="🎯 Context State" defaultOpen>
  <JsonViewer
    data={contextState}
    expandLevel={2}
    theme="vs-dark"
    enableClipboard
  />
</Collapsible>

<Collapsible title="📊 Performance Metrics">
  <MetricsGrid>
    <MetricCard
      title="Render Count"
      value={renderCount}
      change={renderDelta}
      trend="neutral"
    />
    <MetricCard
      title="Memory Usage"
      value={formatBytes(memoryUsage.usedJSHeapSize)}
      warning={memoryUsage.usedJSHeapSize > MEMORY_WARNING_THRESHOLD}
    />
    <MetricCard
      title="API Calls"
      value={apiCallCount}
      subtitle={`${successfulCalls}/${apiCallCount} successful`}
    />
  </MetricsGrid>
</Collapsible>

<Collapsible title="🔧 Developer Tools">
  <ButtonGroup>
    <Button onClick={exportState} variant="outline">
      Export State
    </Button>
    <Button onClick={resetDefaults} variant="destructive">
      Reset to Defaults
    </Button>
    <Button onClick={toggleMockMode} variant={mockMode ? "primary" : "outline"}>
      {mockMode ? "Disable" : "Enable"} Mock Mode
    </Button>
  </ButtonGroup>
</Collapsible>

<Collapsible title="🚨 Error Simulation">
  <ErrorSimulator
    onSimulate={simulateError}
    scenarios={[
      { type: 'api_failure', label: 'API Call Failure' },
      { type: 'cache_corruption', label: 'Cache Corruption' },
      { type: 'network_timeout', label: 'Network Timeout' },
      { type: 'memory_pressure', label: 'Memory Pressure' }
    ]}
  />
</Collapsible>
```

### Performance Monitoring
```typescript
interface PerformanceMetrics {
  renders: {
    count: number
    averageTime: number
    slowRenders: number      // > 16ms
  }
  api: {
    totalCalls: number
    successRate: number
    averageResponseTime: number
    errors: APIError[]
  }
  memory: {
    current: number
    peak: number
    leakDetection: boolean
  }
  cache: {
    hitRate: number
    size: number
    operations: CacheOperation[]
  }
}

// Real-time monitoring
useEffect(() => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    updatePerformanceMetrics(entries)
  })
  
  observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
  
  return () => observer.disconnect()
}, [])
```

---

## 🎨 LayoutContext Component

### Purpose
Global layout state management for responsive design, theme control, and UI component coordination.

### Component Location
`src/contexts/LayoutContext.tsx`

### State Management
```typescript
interface LayoutState {
  // Responsive Design
  screenSize: 'mobile' | 'tablet' | 'desktop' | 'wide'
  isMobile: boolean
  orientation: 'portrait' | 'landscape'
  
  // Navigation State
  sidebarOpen: boolean
  navigationMode: 'tabs' | 'drawer' | 'rail'
  activeTab: string
  
  // Theme & Appearance
  theme: 'light' | 'dark' | 'auto'
  colorScheme: ColorScheme
  density: 'compact' | 'comfortable' | 'spacious'
  
  // Modal & Overlay Management
  modals: ActiveModal[]
  toasts: ToastMessage[]
  loadingStates: LoadingState[]
  
  // Developer Features
  debugMode: boolean
  gridOverlay: boolean
  componentBorders: boolean
}

interface LayoutActions {
  // Responsive Actions
  updateScreenSize: (size: ScreenSize) => void
  toggleSidebar: () => void
  setNavigationMode: (mode: NavigationMode) => void
  
  // Theme Actions
  setTheme: (theme: Theme) => void
  updateColorScheme: (scheme: ColorScheme) => void
  setDensity: (density: Density) => void
  
  // Modal Management
  openModal: (modal: ModalConfig) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
  
  // Toast Management
  showToast: (toast: ToastConfig) => string
  dismissToast: (id: string) => void
  
  // Developer Actions
  toggleDebugMode: () => void
  toggleGridOverlay: () => void
}
```

### Responsive Breakpoints
```typescript
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440
} as const

// Hook for responsive behavior
export const useResponsive = () => {
  const { screenSize, isMobile } = useLayoutContext()
  
  return {
    isMobile,
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    isWide: screenSize === 'wide',
    showSidebar: !isMobile,
    maxItems: isMobile ? 2 : screenSize === 'tablet' ? 4 : 6
  }
}
```

### Theme System Integration
```typescript
// Theme-aware component styling
export const useThemeClasses = () => {
  const { theme, colorScheme, density } = useLayoutContext()
  
  return {
    container: cn(
      'transition-colors duration-200',
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900',
      density === 'compact' ? 'p-2' : density === 'spacious' ? 'p-6' : 'p-4'
    ),
    card: cn(
      'rounded-lg border',
      theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
    ),
    text: {
      primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
      accent: `text-${colorScheme.primary}-600`
    }
  }
}
```

---

## 🎛️ Specialized UI Components

### ProgressIndicator
```typescript
interface ProgressIndicatorProps {
  value: number               // 0-100
  type: 'linear' | 'circular' | 'ring'
  size?: 'sm' | 'md' | 'lg'
  color?: string
  showLabel?: boolean
  animated?: boolean
  indeterminate?: boolean
}

// Usage in image generation
<ProgressIndicator
  value={generationProgress}
  type="circular"
  animated
  color="blue"
  showLabel
  className="w-16 h-16"
/>
```

### MultiSelect Component
```typescript
interface MultiSelectProps<T> {
  options: SelectOption<T>[]
  selected: T[]
  onChange: (selected: T[]) => void
  searchable?: boolean
  placeholder?: string
  maxSelections?: number
  groupBy?: keyof T
  renderOption?: (option: SelectOption<T>) => ReactNode
}

// Usage for LoRA selection
<MultiSelect
  options={availableLoRAs}
  selected={selectedLoRAs}
  onChange={setSelectedLoRAs}
  searchable
  placeholder="Select LoRA models..."
  maxSelections={3}
  groupBy="category"
/>
```

### ImagePreview Component
```typescript
interface ImagePreviewProps {
  src: string
  alt: string
  fallback?: string
  loading?: 'lazy' | 'eager'
  aspectRatio?: string
  objectFit?: 'cover' | 'contain' | 'fill'
  overlay?: ReactNode
  onLoad?: () => void
  onError?: (error: Error) => void
}

// Usage in galleries
<ImagePreview
  src={imageSrc}
  alt={imageTitle}
  aspectRatio="1:1"
  loading="lazy"
  overlay={<PlayButton />}
  onError={(error) => toast.error('Image failed to load')}
/>
```

---

## 🧪 Testing UI Components

### Component Testing Utilities
```typescript
// Test utilities for complex components
export const renderWithProviders = (
  ui: ReactElement,
  options?: {
    layoutState?: Partial<LayoutState>
    imageContext?: Partial<ImageContextState>
    router?: Partial<NextRouter>
  }
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <LayoutProvider initialState={options?.layoutState}>
      <ImageProvider initialState={options?.imageContext}>
        <MockRouter router={options?.router}>
          {children}
        </MockRouter>
      </ImageProvider>
    </LayoutProvider>
  )
  
  return render(ui, { wrapper: Wrapper })
}

// Example test
test('CreateProjectModal validates form correctly', async () => {
  const onClose = jest.fn()
  
  renderWithProviders(
    <CreateProjectModal isOpen onClose={onClose} />
  )
  
  const nameInput = screen.getByPlaceholderText('Enter project name...')
  
  // Test validation
  fireEvent.change(nameInput, { target: { value: 'ab' } })
  expect(screen.getByText(/Name must be at least 3 characters/)).toBeInTheDocument()
  
  fireEvent.change(nameInput, { target: { value: 'Valid Project Name' } })
  expect(screen.queryByText(/Name must be at least 3 characters/)).not.toBeInTheDocument()
  
  // Test submission
  const createButton = screen.getByText('Create Project')
  expect(createButton).toBeEnabled()
})
```

---

## 🎯 User Experience Patterns

### Progressive Disclosure
```typescript
// Reveal complexity gradually
const AdvancedSettings = () => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  return (
    <div>
      <BasicSettings />
      
      <Button
        variant="ghost"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-4"
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        <ChevronIcon direction={showAdvanced ? 'up' : 'down'} />
      </Button>
      
      <Collapsible open={showAdvanced}>
        <AdvancedConfiguration />
      </Collapsible>
    </div>
  )
}
```

### Loading States
```typescript
// Consistent loading patterns
const useAsyncOperation = (operation: () => Promise<void>) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const execute = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await operation()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  return { execute, isLoading, error }
}
```

### Error Boundaries
```typescript
// Component-level error handling
export const UIErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<UIErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('UI Component Error:', error, errorInfo)
        // Log to monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

const UIErrorFallback = () => (
  <div className="p-8 text-center">
    <div className="text-6xl mb-4">🤖</div>
    <h2 className="text-xl font-semibold mb-2">
      Whoops! This component had a little digital hiccup
    </h2>
    <p className="text-gray-600 mb-4">
      Don't worry, we've been notified and our pixel engineers are on it!
    </p>
    <Button onClick={() => window.location.reload()}>
      Refresh Page
    </Button>
  </div>
)
```

---

## 🔮 Future Enhancements

### Planned UI Features
- **Command Palette**: Global search and actions
- **Keyboard Shortcuts**: Power user navigation
- **Gesture Support**: Touch and trackpad gestures
- **Voice Commands**: Accessibility improvements
- **AI Assistance**: Smart UI suggestions

### Advanced Interactions
- **Drag & Drop Zones**: Enhanced file handling
- **Virtual Scrolling**: Large dataset performance
- **Real-time Collaboration**: Multi-user indicators
- **Contextual Menus**: Right-click functionality

---

## 🔗 Related Documentation

- [Layout Context](../../contexts/) - State management patterns
- [Design System](../../architecture/design-system.md) - UI component standards
- [Project Management](../project-management/) - Project creation workflows
- [Auto-Sync System](../auto-sync/) - Real-time UI updates
- [Cache Management](../../architecture/indexeddb-caching-implementation.md) - Client-side storage 