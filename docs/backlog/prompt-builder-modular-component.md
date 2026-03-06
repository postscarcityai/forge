**Needs refinement**

# Prompt Builder - Modular Reusable Component

## 🎯 **User Story**

**As a developer**, I want a single, self-contained PromptBuilder component that handles all aspects of prompt generation, so that I can generate prompts with one simple API call without understanding the internal complexity.

## 📝 **Problem Statement**

**Current State:**
- Prompt building requires importing 15+ functions from 3 different files
- Manual orchestration of 10 component builders
- Developer must understand word budget system, database fetching, and assembly logic
- Repeated pattern across multiple files with slight variations
- Error handling scattered throughout the process

**Current Usage Pattern (Complex):**
```typescript
// Required imports from multiple files
const { 
  buildMasterPromptComponent,
  buildUserInputComponent,
  buildCharacterComponent,
  buildSceneComponent,
  buildTechnicalPhotographyComponent,
  buildVisualStyleComponent,
  buildLoRATriggerWordsComponent,
  buildAtmosphericComponent,
  buildSupportingElementsComponent,
  buildPostProcessingComponent,
  assemblePrompt
} = await import('./promptComponents');

const { 
  enforceWordBudget, 
  generateWordBudgetReport, 
  logWordBudgetAnalysis 
} = await import('./wordBudgetEnforcer');

// Manual data fetching
const [project, character, scene] = await Promise.all([
  fetchProjectSettings(projectId),
  characterName ? fetchCharacter(characterName, projectId) : null,
  sceneName ? fetchScene(sceneName, projectId) : null
]);

// Manual component building (10 components)
const components = {
  masterPrompt: buildMasterPromptComponent(project),
  userInput: buildUserInputComponent(userPrompt),
  characterDescription: character ? buildCharacterComponent(character, outfitIndex) : '',
  // ... 7 more components
};

// Manual word budget enforcement
const enforcedComponents = enforceWordBudget(components);

// Manual assembly
const finalPrompt = assemblePrompt(enforcedComponents);

// Manual reporting
const budgetReport = generateWordBudgetReport(enforcedComponents);
```

**Pain Points:**
- **High cognitive load**: Developers must understand internal complexity
- **Error-prone**: Easy to miss steps or get order wrong
- **Hard to test**: Many moving parts and dependencies
- **Inconsistent usage**: Different implementations across codebase
- **Maintenance burden**: Changes require updates in multiple locations

## ✅ **Recommended Solution**

### **Single PromptBuilder Component**

**Simple, Clean API:**
```typescript
// Single import, single class
import { PromptBuilder } from '@/utils/PromptBuilder';

// Simple usage - one method call
const builder = new PromptBuilder(projectId);
const result = await builder.build({
  userPrompt: "professional portrait",
  characterName: "detective-sarah",
  sceneName: "police-station"
});

console.log(result.prompt);        // Final 384-word prompt
console.log(result.wordCount);     // 378
console.log(result.compliance);    // true
console.log(result.components);    // Component breakdown
```

### **Component Implementation**

```typescript
// src/utils/PromptBuilder.ts
export interface PromptBuildRequest {
  userPrompt: string;
  characterName?: string;
  characterOutfit?: string | number;
  sceneName?: string;
  useRandomSelection?: boolean;
}

export interface PromptBuildResult {
  prompt: string;
  wordCount: number;
  compliance: boolean;
  components: PromptComponents;
  metadata: {
    projectId: string;
    characterUsed?: string;
    sceneUsed?: string;
    randomSelectionUsed?: boolean;
    generatedAt: Date;
  };
  budgetReport: WordBudgetReport;
}

export class PromptBuilder {
  private projectId: string;
  private config?: ProjectConfig;
  private options: PromptBuilderOptions;
  
  constructor(projectId: string, options: PromptBuilderOptions = {}) {
    this.projectId = projectId;
    this.options = {
      wordBudget: 384,
      enforceStrictBudget: true,
      fallbackToDefaults: true,
      includeDebugInfo: false,
      ...options
    };
  }
  
  /**
   * Build a complete prompt with word budget enforcement
   */
  async build(request: PromptBuildRequest): Promise<PromptBuildResult> {
    try {
      // 1. Load configuration (cached internally)
      await this.ensureConfigLoaded();
      
      // 2. Fetch required data
      const { character, scene } = await this.fetchPromptData(request);
      
      // 3. Build components
      const components = await this.buildComponents(request, character, scene);
      
      // 4. Enforce word budget
      const enforcedComponents = this.enforceWordBudget(components);
      
      // 5. Assemble final prompt
      const finalPrompt = this.assemblePrompt(enforcedComponents);
      
      // 6. Generate report
      const budgetReport = this.generateReport(enforcedComponents);
      
      // 7. Return complete result
      return {
        prompt: finalPrompt,
        wordCount: budgetReport.totalWords,
        compliance: budgetReport.compliance,
        components: enforcedComponents,
        metadata: {
          projectId: this.projectId,
          characterUsed: character?.name,
          sceneUsed: scene?.name,
          randomSelectionUsed: request.useRandomSelection,
          generatedAt: new Date()
        },
        budgetReport
      };
      
    } catch (error) {
      return this.handleError(error, request);
    }
  }
  
  /**
   * Build prompt with custom word budget
   */
  async buildWithCustomBudget(
    request: PromptBuildRequest, 
    customBudget: Partial<typeof WORD_BUDGET>
  ): Promise<PromptBuildResult> {
    const originalBudget = { ...WORD_BUDGET };
    Object.assign(WORD_BUDGET, customBudget);
    
    try {
      return await this.build(request);
    } finally {
      Object.assign(WORD_BUDGET, originalBudget);
    }
  }
  
  /**
   * Get project configuration (cached)
   */
  async getProjectConfig(): Promise<ProjectConfig> {
    await this.ensureConfigLoaded();
    return this.config!;
  }
  
  // ... private methods for internal logic
}
```

### **Advanced Usage Examples**

**Basic Usage:**
```typescript
const builder = new PromptBuilder("amc");
const result = await builder.build({
  userPrompt: "dramatic lighting portrait",
  characterName: "detective-sarah"
});
```

**With Custom Configuration:**
```typescript
const builder = new PromptBuilder("amc", {
  wordBudget: 500,           // Custom budget
  enforceStrictBudget: false, // Allow overages
  includeDebugInfo: true     // Verbose logging
});

const result = await builder.build({
  userPrompt: "action scene",
  useRandomSelection: true   // Random character + scene
});
```

**With Custom Word Budget:**
```typescript
const builder = new PromptBuilder("amc");
const result = await builder.buildWithCustomBudget({
  userPrompt: "detailed portrait",
  characterName: "detective-sarah"
}, {
  characterDescription: 120,  // More words for character
  userInput: 24              // More words for user input
});
```

**Chainable API (Future Enhancement):**
```typescript
const result = await new PromptBuilder("amc")
  .withCharacter("detective-sarah", { outfit: 2 })
  .withScene("police-station")
  .withUserPrompt("dramatic interrogation")
  .withCustomBudget({ characterDescription: 100 })
  .build();
```

## 🔧 **Implementation Strategy**

### **Phase 1: Core Component (Week 1)**
1. **Create PromptBuilder class** with basic functionality
2. **Encapsulate existing logic** from `buildStructuredPrompt()`
3. **Add comprehensive error handling**
4. **Include configuration caching**

### **Phase 2: Enhanced Features (Week 2)**
1. **Add custom word budget support**
2. **Include random selection capabilities**
3. **Add configuration options**
4. **Implement result caching**

### **Phase 3: Integration (Week 3)**
1. **Update API endpoints** to use PromptBuilder
2. **Replace `buildStructuredPrompt()` calls**
3. **Update tests** to use new component
4. **Add comprehensive documentation**

### **Phase 4: Advanced Features (Week 4)**
1. **Add chainable API support**
2. **Include prompt validation**
3. **Add prompt template system**
4. **Implement performance monitoring**

## 📊 **Benefits**

### **Developer Experience**
- **Single import**: One class instead of 15+ functions
- **Simple API**: One method call instead of complex orchestration
- **Self-contained**: Handles all dependencies internally
- **Type-safe**: Comprehensive TypeScript interfaces
- **Configurable**: Adaptable to different use cases

### **Code Quality**
- **Encapsulation**: Internal complexity hidden from consumers
- **Testability**: Easy to mock and test as single component
- **Maintainability**: Changes contained within single class
- **Reusability**: Drop into any project or context
- **Consistency**: Same behavior everywhere it's used

### **Performance**
- **Configuration caching**: Avoid repeated database calls
- **Result caching**: Cache generated prompts for reuse
- **Optimized queries**: Fetch all data in minimal calls
- **Lazy loading**: Only fetch data when needed

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
describe('PromptBuilder', () => {
  test('builds basic prompt successfully', async () => {
    const builder = new PromptBuilder('test-project');
    const result = await builder.build({
      userPrompt: 'test prompt'
    });
    
    expect(result.prompt).toContain('test prompt');
    expect(result.wordCount).toBeLessThanOrEqual(384);
    expect(result.compliance).toBe(true);
  });
  
  test('handles missing character gracefully', async () => {
    const builder = new PromptBuilder('test-project');
    const result = await builder.build({
      userPrompt: 'test prompt',
      characterName: 'nonexistent'
    });
    
    expect(result.prompt).toBeDefined();
    expect(result.metadata.characterUsed).toBeUndefined();
  });
  
  test('supports custom word budgets', async () => {
    const builder = new PromptBuilder('test-project');
    const result = await builder.buildWithCustomBudget({
      userPrompt: 'test prompt'
    }, {
      userInput: 50  // More words for user input
    });
    
    expect(result.budgetReport.components.userInput.budgetWords).toBe(50);
  });
});
```

### **Integration Tests**
```typescript
test('PromptBuilder produces same results as buildStructuredPrompt', async () => {
  const params = {
    userPrompt: 'test prompt',
    characterName: 'detective-sarah',
    sceneName: 'police-station',
    projectId: 'amc'
  };
  
  // Old approach
  const oldResult = await buildStructuredPrompt(params);
  
  // New approach
  const builder = new PromptBuilder(params.projectId);
  const newResult = await builder.build(params);
  
  expect(newResult.prompt).toBe(oldResult.prompt);
  expect(newResult.wordCount).toBe(oldResult.wordCount);
});
```

## 🚀 **Migration Path**

### **Gradual Migration Strategy**
1. **Create PromptBuilder alongside existing system**
2. **Migrate one endpoint at a time**
3. **Keep existing functions for backward compatibility**
4. **Remove old functions once all consumers migrated**

### **Before (Current):**
```typescript
// API endpoint usage
const result = await buildStructuredPrompt({
  userPrompt,
  characterName,
  characterOutfit,
  sceneName,
  projectId
});
```

### **After (PromptBuilder):**
```typescript
// API endpoint usage
const builder = new PromptBuilder(projectId);
const result = await builder.build({
  userPrompt,
  characterName,
  characterOutfit,
  sceneName
});
```

## 📋 **Acceptance Criteria**

### **Functional Requirements**
- [ ] Single class handles all prompt building complexity
- [ ] Maintains exact same output as existing `buildStructuredPrompt()`
- [ ] Supports all current generation modes (structured, simple, random)
- [ ] Includes comprehensive error handling and fallbacks
- [ ] Provides detailed metadata and reporting

### **API Requirements**
- [ ] Simple constructor takes only projectId and optional config
- [ ] Single `build()` method for most use cases
- [ ] Support for custom word budgets
- [ ] Chainable API for complex scenarios
- [ ] TypeScript interfaces for all inputs/outputs

### **Performance Requirements**
- [ ] Configuration caching eliminates redundant database calls
- [ ] Performance equals or exceeds current implementation
- [ ] Memory usage remains reasonable with caching
- [ ] Graceful handling of high-frequency requests

### **Quality Requirements**
- [ ] 100% test coverage for all public methods
- [ ] Comprehensive error handling for all failure modes
- [ ] Clear documentation with usage examples
- [ ] Backward compatibility during migration period

This modular PromptBuilder component will dramatically simplify prompt generation usage while maintaining all current capabilities and enabling future enhancements. 