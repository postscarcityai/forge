# Eliminate Duplicate Project Configuration Utilities

## 🎯 **User Story**

**As a developer**, I want shared project configuration utilities that eliminate duplication across API endpoints, so that I can maintain consistent project settings access with a single source of truth.

## 📝 **Problem Statement**

**Current State:**
- `getProjectMasterPrompt()` duplicated in 2 files (~40 lines each)
- `getProjectLoRAs()` duplicated in 2 files (~45 lines each)  
- `getProjectImageSize()` duplicated in 2 files (~30 lines each)
- **Total duplication: ~230 lines of identical code**

**Files with Duplication:**
```
src/app/api/flux-lora/route.ts
src/app/api/flux-lora/batch-generate/route.ts
```

**Pain Points:**
- **Maintenance nightmare**: Bug fixes must be applied to multiple locations
- **Inconsistent behavior**: Easy for implementations to drift apart
- **Testing overhead**: Same logic tested multiple times
- **Code bloat**: ~230 lines of unnecessary duplication

## ✅ **Recommended Solution**

### **Shared Project Configuration Module**

**Create: `src/app/api/utils/project-config.ts`**

```typescript
interface ProjectConfig {
  masterPrompt: string;
  loras: LoRA[];
  imageSize: string;
}

interface LoRA {
  path: string;
  scale: number;
}

/**
 * Get complete project configuration in a single database call
 */
export async function getProjectConfig(projectId: string): Promise<ProjectConfig> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/database/projects?id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch project ${projectId}, using defaults`);
      return getDefaultProjectConfig();
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn(`No project data found for ${projectId}, using defaults`);
      return getDefaultProjectConfig();
    }
    
    const projectData = result.data;
    return {
      masterPrompt: extractMasterPrompt(projectData),
      loras: extractLoRAs(projectData),
      imageSize: extractImageSize(projectData)
    };
  } catch (error) {
    console.error(`Error fetching project config for ${projectId}:`, error);
    return getDefaultProjectConfig();
  }
}

/**
 * Get individual configuration pieces (for backward compatibility)
 */
export async function getProjectMasterPrompt(projectId: string): Promise<string> {
  const config = await getProjectConfig(projectId);
  return config.masterPrompt;
}

export async function getProjectLoRAs(projectId: string): Promise<LoRA[]> {
  const config = await getProjectConfig(projectId);
  return config.loras;
}

export async function getProjectImageSize(projectId: string): Promise<string> {
  const config = await getProjectConfig(projectId);
  return config.imageSize;
}

/**
 * Default configuration fallbacks
 */
function getDefaultProjectConfig(): ProjectConfig {
  return {
    masterPrompt: DEFAULT_MASTER_PROMPT,
    loras: DEFAULT_LORAS,
    imageSize: 'portrait_16_9'
  };
}

// ... helper functions for extraction logic
```

### **Usage in API Endpoints**

**Before (Duplicated):**
```typescript
// In both flux-lora/route.ts AND batch-generate/route.ts
async function getProjectMasterPrompt(projectId: string): Promise<string> {
  // ~40 lines of duplicate code
}

async function getProjectLoRAs(projectId: string): Promise<LoRA[]> {
  // ~45 lines of duplicate code  
}

async function getProjectImageSize(projectId: string): Promise<string> {
  // ~30 lines of duplicate code
}

// Usage requires 3 separate database calls
const masterPrompt = await getProjectMasterPrompt(currentProjectId);
const loras = await getProjectLoRAs(currentProjectId);  
const imageSize = await getProjectImageSize(currentProjectId);
```

**After (Shared):**
```typescript
// Single import in both endpoints
import { getProjectConfig } from '@/app/api/utils/project-config';

// Usage - single database call gets everything
const { masterPrompt, loras, imageSize } = await getProjectConfig(currentProjectId);

// Or individual pieces for backward compatibility
import { getProjectMasterPrompt, getProjectLoRAs, getProjectImageSize } from '@/app/api/utils/project-config';
```

## 🔧 **Implementation Strategy**

### **Phase 1: Create Shared Module**
1. **Extract common logic** to `src/app/api/utils/project-config.ts`
2. **Consolidate default constants** (remove duplication)
3. **Add comprehensive error handling**
4. **Include TypeScript interfaces** for better type safety

### **Phase 2: Optimize Database Access**
```typescript
// Current: 3 separate database calls per endpoint
const masterPrompt = await getProjectMasterPrompt(projectId);  // DB call 1
const loras = await getProjectLoRAs(projectId);                // DB call 2  
const imageSize = await getProjectImageSize(projectId);        // DB call 3

// Optimized: 1 database call gets everything
const config = await getProjectConfig(projectId);             // DB call 1 (gets all)
```

### **Phase 3: Update Existing Endpoints**
1. **Replace duplicated functions** with shared imports
2. **Update function calls** to use new module
3. **Remove old duplicate code**
4. **Test thoroughly** to ensure behavior is identical

### **Phase 4: Enhanced Configuration**
```typescript
// Future enhancement: cache project configs
const configCache = new Map<string, { config: ProjectConfig; timestamp: number }>();

export async function getProjectConfig(projectId: string, useCache = true): Promise<ProjectConfig> {
  if (useCache && configCache.has(projectId)) {
    const cached = configCache.get(projectId)!;
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
      return cached.config;
    }
  }
  
  const config = await fetchProjectConfig(projectId);
  configCache.set(projectId, { config, timestamp: Date.now() });
  return config;
}
```

## 📊 **Benefits**

### **Code Quality**
- **Eliminate 230+ lines** of duplicate code
- **Single source of truth** for project configuration
- **Consistent error handling** across all endpoints
- **Better type safety** with shared interfaces

### **Performance**
- **Reduce database calls** from 3 to 1 per endpoint
- **Enable caching** for frequently accessed projects
- **Faster API response times**
- **Reduced database load**

### **Maintenance**
- **Fix bugs once** instead of in multiple places
- **Add features once** and they work everywhere
- **Easier testing** with centralized logic
- **Cleaner API endpoint code**

## 🧪 **Testing Strategy**

### **Unit Tests for Shared Module**
```typescript
describe('Project Configuration Utils', () => {
  test('getProjectConfig returns complete configuration', async () => {
    const config = await getProjectConfig('test-project');
    expect(config).toHaveProperty('masterPrompt');
    expect(config).toHaveProperty('loras');
    expect(config).toHaveProperty('imageSize');
  });

  test('handles missing project gracefully', async () => {
    const config = await getProjectConfig('nonexistent');
    expect(config.masterPrompt).toBe(DEFAULT_MASTER_PROMPT);
    expect(config.loras).toEqual(DEFAULT_LORAS);
  });

  test('individual getters work for backward compatibility', async () => {
    const masterPrompt = await getProjectMasterPrompt('test-project');
    const loras = await getProjectLoRAs('test-project');
    const imageSize = await getProjectImageSize('test-project');
    
    expect(typeof masterPrompt).toBe('string');
    expect(Array.isArray(loras)).toBe(true);
    expect(typeof imageSize).toBe('string');
  });
});
```

### **Integration Tests**
```typescript
test('API endpoints use shared configuration', async () => {
  // Test that both endpoints get same configuration for same project
  const singleResponse = await fetch('/api/flux-lora', { /* ... */ });
  const batchResponse = await fetch('/api/flux-lora/batch-generate', { /* ... */ });
  
  // Should use same project settings
  expect(singleResponse.config).toEqual(batchResponse.config);
});
```

## 🚀 **Migration Path**

### **Step 1: Create Shared Module** (No API changes)
- Extract logic to new shared module
- Keep existing endpoints unchanged
- Verify tests pass

### **Step 2: Update First Endpoint**
- Migrate one endpoint to use shared module
- Compare behavior with original
- Deploy and validate

### **Step 3: Update Remaining Endpoints**
- Migrate all other endpoints
- Remove duplicate code
- Update tests

### **Step 4: Cleanup**
- Remove any remaining duplicate constants
- Update documentation
- Add shared module to linting rules

## 📋 **Acceptance Criteria**

### **Functional Requirements**
- [ ] All project configuration logic consolidated into shared module
- [ ] Zero functional changes to existing API behavior
- [ ] Single database call retrieves all project configuration
- [ ] Backward compatibility maintained for individual getters

### **Code Quality Requirements**
- [ ] Remove all duplicate `getProjectMasterPrompt()` functions
- [ ] Remove all duplicate `getProjectLoRAs()` functions  
- [ ] Remove all duplicate `getProjectImageSize()` functions
- [ ] Shared module has comprehensive TypeScript types
- [ ] Error handling is consistent across all configuration access

### **Performance Requirements**
- [ ] Reduce database calls from 3 to 1 per API request
- [ ] No degradation in API response times
- [ ] Configuration caching ready for future implementation

### **Testing Requirements**
- [ ] 100% test coverage for shared configuration module
- [ ] Integration tests verify endpoints use shared logic
- [ ] All existing API tests continue to pass
- [ ] Performance tests validate database call reduction

This consolidation will eliminate significant code duplication while improving performance and maintainability across all image generation endpoints. 