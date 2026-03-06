# Word Budget Enforcement Plan

## Current State Analysis

### Document vs Implementation Mismatch
The `programmatic-prompt-generation.md` document specifies a sophisticated 9-component word budget allocation, but the current `buildStructuredPrompt()` function implements a simplified 5-component system.

**Documented Word Budget (384 words total):**
- **Master Prompt Foundation**: 60 words (15.6%)
- **User Input Integration**: 16 words (4.2%) 
- **Character Description**: 80 words (20.8%)
- **Scene Foundation**: 64 words (16.7%)
- **Technical Photography**: 48 words (12.5%)
- **Visual Style & Aesthetic**: 48 words (12.5%)
- **Atmospheric & Environmental**: 32 words (8.3%)
- **Supporting Elements**: 24 words (6.3%)
- **Post-Processing & Effects**: 12 words (3.1%)

**Current Implementation (5 components):**
- User Prompt: 16 words max
- Character Details: 40 words max (should be 80)
- Scene Details: 100 words max (should be 64)
- LoRA Trigger Words: 20 words max (not in spec)
- Style & Technical: 80 words max (should be split into multiple components)

## Implementation Plan

### Phase 1: Database Enhancement (2 days)
**Objective**: Add missing project settings fields to support all 9 word budget components

#### 1.1 Project Settings Database Schema Updates
**File**: `src/services/databaseService.ts`

Add missing `ImagePrompting` fields to support the 9-component system:

```typescript
interface ImagePrompting {
  // Master Prompt Foundation (60 words)
  masterPrompt?: string;
  
  // Technical Photography (48 words) 
  cameraAngle?: string;
  shotType?: string;
  lensType?: string;
  focalLength?: string;
  lightingStyle?: string;
  lightDirection?: string;
  lightQuality?: string;
  shadowStyle?: string;
  
  // Visual Style & Aesthetic (48 words)
  overallStyle?: string;
  aestheticDirection?: string;
  mood?: string;
  colorPalette?: string;
  colorTemperature?: string;
  artisticReferences?: string[];
  cinematicReferences?: string[];
  
  // Atmospheric & Environmental (32 words)
  timeOfDay?: string;
  atmosphericEffects?: string[];
  
  // Supporting Elements (24 words)
  surfaceTextures?: string[];
  materialProperties?: string[];
  
  // Post-Processing & Effects (12 words)
  visualEffects?: string[];
  postProcessing?: string[];
  compressionLevel?: string;
}
```

#### 1.2 Database Migration
Create migration script to add new fields to existing AMC project.

### Phase 2: Component Builder Functions (3 days)
**Objective**: Create specialized builder functions for each of the 9 word budget components

#### 2.1 Core Component Builders
**File**: `src/utils/promptComponents.ts` (new)

```typescript
interface PromptComponents {
  masterPrompt: string;        // 60 words
  userInput: string;          // 16 words  
  characterDescription: string; // 80 words
  sceneFoundation: string;    // 64 words
  technicalPhotography: string; // 48 words
  visualStyleAesthetic: string; // 48 words
  atmosphericEnvironmental: string; // 32 words
  supportingElements: string;  // 24 words
  postProcessingEffects: string; // 12 words
}

// Individual component builders
export function buildMasterPromptComponent(project: Project): string;
export function buildUserInputComponent(userPrompt: string): string;
export function buildCharacterComponent(character: Character, outfitIndex?: number): string;
export function buildSceneComponent(scene: Scene): string;
export function buildTechnicalPhotographyComponent(project: Project): string;
export function buildVisualStyleComponent(project: Project): string;
export function buildAtmosphericComponent(project: Project, scene: Scene): string;
export function buildSupportingElementsComponent(project: Project, scene: Scene): string;
export function buildPostProcessingComponent(project: Project): string;
```

#### 2.2 Word Count Enforcement
**File**: `src/utils/wordBudgetEnforcer.ts` (new)

```typescript
interface WordBudget {
  masterPrompt: 60;
  userInput: 16;
  characterDescription: 80;
  sceneFoundation: 64;
  technicalPhotography: 48;
  visualStyleAesthetic: 48;
  atmosphericEnvironmental: 32;
  supportingElements: 24;
  postProcessingEffects: 12;
}

export function enforceWordBudget(components: PromptComponents): PromptComponents;
export function validateWordCount(component: string, maxWords: number): string;
export function generateWordBudgetReport(components: PromptComponents): WordBudgetReport;
```

### Phase 3: Enhanced buildStructuredPrompt Function (2 days)
**Objective**: Rewrite the main prompt generation function to use the 9-component system

#### 3.1 New Function Structure
**File**: `src/utils/characterPromptGeneration.ts`

```typescript
export async function buildStructuredPrompt(params: StructuredPromptParams): Promise<{
  prompt: string;
  wordCount: number;
  components: PromptComponents;
  budgetReport: WordBudgetReport;
}> {
  // 1. Fetch all required data
  const [project, character, scene] = await Promise.all([
    fetchProjectSettings(params.projectId),
    params.characterName ? fetchCharacter(params.characterName, params.projectId) : null,
    params.sceneName ? fetchScene(params.sceneName, params.projectId) : null
  ]);

  // 2. Build individual components with strict word budgets
  const components: PromptComponents = {
    masterPrompt: buildMasterPromptComponent(project),           // 60 words
    userInput: buildUserInputComponent(params.userPrompt),      // 16 words
    characterDescription: character ? 
      buildCharacterComponent(character, params.characterOutfit) : '', // 80 words
    sceneFoundation: scene ? buildSceneComponent(scene) : '',   // 64 words
    technicalPhotography: buildTechnicalPhotographyComponent(project), // 48 words
    visualStyleAesthetic: buildVisualStyleComponent(project),   // 48 words
    atmosphericEnvironmental: buildAtmosphericComponent(project, scene), // 32 words
    supportingElements: buildSupportingElementsComponent(project, scene), // 24 words
    postProcessingEffects: buildPostProcessingComponent(project) // 12 words
  };

  // 3. Enforce word budget constraints
  const enforcedComponents = enforceWordBudget(components);
  
  // 4. Assemble final prompt
  const finalPrompt = assemblePrompt(enforcedComponents);
  
  // 5. Generate budget report
  const budgetReport = generateWordBudgetReport(enforcedComponents);
  
  return {
    prompt: finalPrompt,
    wordCount: countWords(finalPrompt),
    components: enforcedComponents,
    budgetReport
  };
}
```

### Phase 4: Integration & Testing (2 days)
**Objective**: Update API routes and test the new system

#### 4.1 API Route Updates
**Files**: 
- `src/app/api/flux-lora/route.ts`
- `src/app/api/flux-lora/batch-generate/route.ts`

Update to return enhanced prompt data:

```typescript
interface EnhancedPromptResponse {
  prompt: string;
  wordCount: number;
  budgetCompliance: boolean;
  components: {
    masterPrompt: { content: string; words: number; budget: number };
    userInput: { content: string; words: number; budget: number };
    characterDescription: { content: string; words: number; budget: number };
    sceneFoundation: { content: string; words: number; budget: number };
    technicalPhotography: { content: string; words: number; budget: number };
    visualStyleAesthetic: { content: string; words: number; budget: number };
    atmosphericEnvironmental: { content: string; words: number; budget: number };
    supportingElements: { content: string; words: number; budget: number };
    postProcessingEffects: { content: string; words: number; budget: number };
  };
}
```

#### 4.2 Testing Strategy

**Unit Tests**: Test each component builder individually
```bash
# Test individual components
npm test -- wordBudgetEnforcer.test.ts
npm test -- promptComponents.test.ts
```

**Integration Tests**: Test full prompt generation
```bash
# Test full 384-word prompt generation
curl -X POST http://localhost:3000/api/flux-lora \
  -H "Content-Type: application/json" \
  -d '{
    "programmatic": true,
    "userPhrase": "professional confident expression looking directly at camera",
    "characterName": "Rebecca Stein",
    "sceneName": "Federal Office",
    "characterOutfit": 0,
    "projectId": "amc_defense_law",
    "returnPromptAnalysis": true
  }'
```

### Phase 5: UI Enhancements (1 day)
**Objective**: Add word budget visualization to project settings

#### 5.1 Word Budget Dashboard
**File**: `src/components/ui/WordBudgetDashboard.tsx` (new)

```typescript
interface WordBudgetDashboardProps {
  projectId: string;
  samplePrompt?: {
    userPhrase: string;
    characterName?: string;
    sceneName?: string;
  };
}

// Real-time word budget visualization
// Progress bars for each component
// Compliance indicators
// Sample prompt preview
```

#### 5.2 Project Settings Integration
**File**: `src/components/ui/ProjectSettingsModal.tsx`

Add new tab: "Word Budget" to show:
- Current component allocations
- Real-time prompt preview
- Word count compliance status
- Component-by-component breakdown

### Phase 6: AMC Project Data Enhancement (1 day)
**Objective**: Populate the AMC project with comprehensive settings to support all 9 components

#### 6.1 Master Prompt Foundation (60 words)
```typescript
const amcMasterPrompt = `Tactical noir justice aesthetic cinematic neo-noir meets graphic novel realism professional legal defense photography dramatic courtroom lighting high contrast black and white with selective color highlights documentary style authenticity forensic attention to detail prosecutorial precision defense attorney perspective client advocacy visual storytelling criminal justice system representation tactical legal strategy photojournalistic approach`;
```

#### 6.2 Technical Photography Settings (48 words)
```typescript
const amcTechnicalSettings = {
  cameraAngle: "eye-level professional perspective slightly low angle for authority",
  shotType: "medium close-up establishing environmental context",
  lensType: "85mm portrait lens with shallow depth of field",
  lightingStyle: "dramatic directional lighting with strong shadows",
  lightDirection: "key light from 45-degree angle rim lighting for separation",
  shadowStyle: "hard shadows with strategic fill light for detail retention"
};
```

#### 6.3 Visual Style & Aesthetic (48 words)
```typescript
const amcVisualStyle = {
  overallStyle: "tactical noir justice aesthetic graphic novel realism",
  aestheticDirection: "professional legal authority documentary authenticity",
  mood: "serious determined strategic focused analytical",
  colorPalette: "desaturated earth tones navy charcoal selective red accents",
  artisticReferences: ["Gregory Crewdson", "Jeff Wall", "Andreas Gursky"],
  cinematicReferences: ["The Firm", "Michael Clayton", "Dark Waters"]
};
```

## Success Metrics

### Compliance Targets
- **Word Budget Accuracy**: 95% compliance with ±2 word tolerance per component
- **Prompt Quality**: Maintain coherent narrative flow across all 9 components
- **Generation Speed**: Under 500ms for complete 384-word prompt assembly
- **API Consistency**: All curl commands return valid 384-word structured prompts

### Quality Assurance
- **Component Isolation**: Each component builder can be tested independently
- **Budget Enforcement**: Automatic truncation with intelligent ellipsis placement
- **Validation Pipeline**: Real-time compliance checking during generation
- **Error Handling**: Graceful degradation when data is missing

## Implementation Timeline

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| Database Enhancement | 2 days | HIGH | Current schema |
| Component Builders | 3 days | HIGH | Database updates |
| Enhanced buildStructuredPrompt | 2 days | HIGH | Component builders |
| Integration & Testing | 2 days | MEDIUM | Enhanced function |
| UI Enhancements | 1 day | LOW | Working system |
| AMC Data Enhancement | 1 day | MEDIUM | Database enhancement |

**Total Timeline**: 11 days
**Critical Path**: Database → Components → Enhanced Function → Testing

## Risk Mitigation

### Backward Compatibility
- Maintain existing API endpoints during transition
- Gradual rollout with feature flags
- Fallback to current system if new system fails

### Performance Considerations
- Component builder caching to avoid redundant database calls
- Lazy loading of complex project settings
- Memory-efficient string manipulation for word counting

### Data Quality
- Validation pipeline for missing project settings
- Default fallbacks for each component
- Comprehensive logging for debugging word budget issues

## Next Steps

1. **Immediate**: Review and approve this plan
2. **Day 1-2**: Implement database enhancements and test with AMC project
3. **Day 3-5**: Build component builders and word budget enforcement
4. **Day 6-7**: Rewrite buildStructuredPrompt with 9-component system
5. **Day 8-9**: Integration testing with curl commands
6. **Day 10**: UI enhancements and dashboard
7. **Day 11**: Final AMC project data population and testing

This plan will transform the current simplified prompt generation into a sophisticated 9-component system that enforces precise word budgets while maintaining narrative coherence and brand consistency. 