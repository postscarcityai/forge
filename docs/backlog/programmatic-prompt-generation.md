# Programmatic Prompt Generation Function

## Overview
Create a sophisticated prompt generation system that programmatically builds 384-word prompts for FLUX.1 LoRA, incorporating project settings, character database, scene templates, and accepting 16-word user input for customization.

## Current State Analysis
- ✅ Master prompt system implemented in flux-lora routes
- ✅ Project settings structure supports comprehensive image prompting options  
- ✅ Image prompting guidelines documented in `@image-prompting.md`
- ✅ **Character database system implemented** with full CRUD operations
- ✅ Character prompt generation utilities created
- ✅ Multiple outfit system working for character consistency
- ⏳ Scene database system needed for structured scene management
- ⏳ Character-scene relationship system needed

## Objective
Build a `generatePrompt()` function that:
- **Input**: 16-word user phrase + character name + scene name + project settings
- **Output**: 384-word structured prompt with character consistency and scene context
- **Integration**: Seamlessly works with existing flux-lora API routes via curl commands
- **Database Integration**: Leverages character and scene databases for consistency

## Technical Specifications

### Function Signature
```typescript
generatePrompt(
  userPhrase: string,      // 16-word user input
  characterName?: string,  // Character from database
  sceneName?: string,      // Scene template from database  
  projectId: string        // Project context
): Promise<string>
```

### Word Budget Allocation (384 words total)
- **Master Prompt Foundation**: 60 words (15.6%) - Project master prompt
- **User Input Integration**: 16 words (4.2%) - Direct user input phrase
- **Character Description**: 80 words (20.8%) - Database character details + outfit
- **Scene Foundation**: 64 words (16.7%) - Database scene template + setting
- **Technical Photography**: 48 words (12.5%) - Camera, lighting from project settings
- **Visual Style & Aesthetic**: 48 words (12.5%) - Color, mood from project settings
- **Atmospheric & Environmental**: 32 words (8.3%) - Weather, time, atmosphere
- **Supporting Elements**: 24 words (6.3%) - Props, background, context
- **Post-Processing & Effects**: 12 words (3.1%) - Filters, enhancements, finish

## Scene Database System (Required)

### Scene Data Model
```typescript
interface Scene {
  id: string;
  name: string;
  projectId: string;
  
  // Scene Details
  setting: string;           // Location/environment description
  timeOfDay: string;         // Morning, afternoon, evening, night
  lighting: string;          // Lighting conditions
  mood: string;              // Emotional tone
  cameraAngle: string;       // Shot perspective
  
  // Scene Context
  description: string;       // Full scene description
  props?: string[];          // Objects/props in scene
  atmosphere?: string;       // Weather, ambiance
  
  // Character Relationships (One-to-Many)
  characterIds: string[];    // Characters that can appear in this scene
  
  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Database Schema
```sql
CREATE TABLE scenes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT NOT NULL,
  setting TEXT NOT NULL,
  time_of_day TEXT,
  lighting TEXT,
  mood TEXT,
  camera_angle TEXT,
  description TEXT NOT NULL,
  props TEXT,                    -- JSON array
  atmosphere TEXT,
  character_ids TEXT NOT NULL,   -- JSON array of character IDs
  tags TEXT,                     -- JSON array
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### Implementation Strategy

#### Phase 1: Scene Database Architecture
**Location**: `src/utils/promptGeneration.ts`

```typescript
interface PromptComponents {
  masterPrompt: string;
  userPhrase: string;
  sceneFoundation: string;
  technicalSpecs: string;
  visualStyle: string;
  atmosphere: string;
  characterDetails: string;
  supportingElements: string;
  postProcessing: string;
}

export function generatePrompt(
  userPhrase: string, 
  projectSettings: Project
): string {
  // Validate and truncate user phrase to 16 words
  const processedUserPhrase = processUserPhrase(userPhrase);
  
  // Build component sections
  const components = buildPromptComponents(processedUserPhrase, projectSettings);
  
  // Assemble final prompt with proper structure
  return assemblePrompt(components);
}
```

#### Phase 2: Component Builders
Create specialized builders for each section:

**Master Prompt Handler**
- Extract from `projectSettings.imagePrompting.masterPrompt`
- Fallback to default if not configured
- Word count: 60 words

**Scene Foundation Builder**
- Incorporate `projectSettings.imagePrompting.subjectMatter`
- Use `composition`, `framing`, `perspective` settings
- Integrate user phrase naturally into scene description
- Word count: 48 words + 16 words (user input)

**Technical Photography Builder**
- Combine `cameraAngle`, `shotType`, `lensType`, `focalLength`
- Include `lightingStyle`, `lightDirection`, `shadowStyle`
- Reference `timeOfDay` and `aspectRatio` settings
- Word count: 64 words

**Visual Style Builder**
- Process `overallStyle`, `aestheticDirection`, `mood`
- Incorporate `colorPalette`, `colorTemperature`, `saturation`
- Include `artisticReferences`, `cinematicReferences`
- Word count: 56 words

#### Phase 3: Smart Integration Logic
**Conflict Resolution**
- Detect conflicting style elements
- Prioritize user input over defaults
- Maintain coherent visual narrative

**Context Awareness**
- Adapt technical specs based on scene type
- Adjust lighting based on time of day
- Scale complexity based on subject matter

**Brand Consistency**
- Incorporate business overview context
- Maintain brand story aesthetic
- Respect visual identity colors

#### Phase 4: API Integration
**Modify Flux-LoRA Routes**
- Update `/api/flux-lora/route.ts`
- Update `/api/flux-lora/batch-generate/route.ts`
- Maintain backward compatibility

**New Request Structure**
```typescript
interface FluxLoRARequest {
  // New programmatic mode
  programmatic?: boolean;
  userPhrase?: string;        // 16 words max
  characterName?: string;     // Character from database
  sceneName?: string;         // Scene from database
  characterOutfit?: number;   // Which outfit index to use
  
  // Legacy mode (maintained for compatibility)
  prompt?: string;
  master_prompt?: string;
  concept?: string;
  
  // Existing parameters
  num_inference_steps?: number;
  enable_safety_checker?: boolean;
  save_to_disk?: boolean;
  projectId?: string;
}
```

## Curl Command Examples

### Character Portrait with Scene
```bash
curl -X POST http://localhost:3000/api/flux-lora \
  -H "Content-Type: application/json" \
  -d '{
    "programmatic": true,
    "userPhrase": "professional confident expression looking directly at camera",
    "characterName": "Rebecca Stein",
    "sceneName": "Office Portrait",
    "characterOutfit": 0,
    "projectId": "amc",
    "save_to_disk": true
  }'
```

### Character in Crime Scene
```bash
curl -X POST http://localhost:3000/api/flux-lora \
  -H "Content-Type: application/json" \
  -d '{
    "programmatic": true,
    "userPhrase": "surveillance camera perspective security footage style",
    "characterName": "Rebecca Stein", 
    "sceneName": "Title Company Conference Room",
    "characterOutfit": 3,
    "projectId": "amc",
    "save_to_disk": true
  }'
```

### Batch Character Sequence
```bash
curl -X POST http://localhost:3000/api/flux-lora/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "programmatic": true,
        "userPhrase": "arriving at the scene",
        "characterName": "Rebecca Stein",
        "sceneName": "Title Company Hallway",
        "characterOutfit": 0
      },
      {
        "programmatic": true, 
        "userPhrase": "conducting the fraud",
        "characterName": "Rebecca Stein",
        "sceneName": "Title Company Conference Room", 
        "characterOutfit": 3
      },
      {
        "programmatic": true,
        "userPhrase": "being arrested",
        "characterName": "Rebecca Stein",
        "sceneName": "Title Company Lobby",
        "characterOutfit": 4
      }
    ],
    "projectId": "amc",
    "save_to_disk": true
  }'
```

## Quality Assurance

### Word Count Enforcement
- Real-time word counting in each component
- Automatic truncation with ellipsis if needed
- Validation warnings for developers

### Prompt Quality Metrics
- Coherence scoring (avoid contradictory elements)
- Completeness check (all required elements present)
- Brand alignment verification

### Testing Strategy
- Unit tests for each component builder
- Integration tests with sample project settings
- A/B testing against manual prompts
- Performance benchmarking (generation speed)

## User Experience Enhancements

### UI Components
- **Smart Input Field**: 16-word counter with autocomplete
- **Prompt Preview**: Real-time 384-word output preview
- **Component Breakdown**: Expandable sections showing each part
- **Quick Templates**: Pre-built user phrases for common scenarios

### Validation & Feedback
- Real-time word count display
- Intelligent suggestions for incomplete prompts
- Style conflict warnings
- Brand consistency alerts

## Technical Implementation Details

### File Structure
```
src/
├── utils/
│   ├── promptGeneration.ts              # Core generation function
│   ├── characterPromptGeneration.ts     # ✅ Character utilities (implemented)
│   ├── scenePromptGeneration.ts         # Scene utilities (needed)
│   ├── promptComponents.ts              # Component builders
│   ├── promptValidation.ts              # Quality checks
│   └── promptTemplates.ts               # Reusable templates
├── app/api/
│   ├── database/
│   │   ├── characters/route.ts           # ✅ Character CRUD (implemented)
│   │   └── scenes/route.ts               # Scene CRUD (needed)
│   └── flux-lora/
│       ├── route.ts                      # Updated with programmatic mode
│       └── batch-generate/route.ts       # Updated with programmatic mode
├── services/
│   └── databaseService.ts                # ✅ Character ops (done), scene ops (needed)
└── components/ui/
    └── PromptGeneratorInput.tsx          # UI component
```

### Performance Considerations
- Lazy loading of component builders
- Caching for repeated project settings
- Optimized string concatenation
- Memory-efficient word counting

## Success Metrics
- **Prompt Quality**: Improved generation consistency
- **User Efficiency**: Reduced manual prompt writing time
- **Brand Consistency**: Better adherence to project aesthetics
- **Developer Experience**: Easier prompt iteration and testing

## Migration Strategy
1. **Parallel Implementation**: Build alongside existing system
2. **Gradual Rollout**: Start with opt-in programmatic mode
3. **Performance Monitoring**: Track generation quality vs manual
4. **User Feedback**: Collect usage patterns and preferences
5. **Full Migration**: Replace manual system once validated

## Future Enhancements
- **AI-Powered Suggestions**: GPT-4o integration for phrase optimization
- **Style Learning**: Adaptive improvement based on user preferences
- **Template Library**: Curated prompt templates for common use cases
- **Multi-Language Support**: Localized prompt generation
- **Advanced Analytics**: Prompt performance tracking and optimization

## Priority Level: HIGH
This feature will significantly improve the workflow efficiency and maintain consistent brand aesthetics across all generated content.

## Estimated Timeline
- ✅ **Character System**: COMPLETED - Database, API, prompt generation utilities
- **Scene System**: 3 days - Database schema, API endpoints, prompt utilities  
- **Programmatic Integration**: 2 days - Update flux-lora routes with new parameters
- **Component Assembly**: 3 days - Build the 384-word prompt assembly function
- **Testing & Validation**: 2 days - Test curl commands and prompt quality
- **UI Components**: 1 week - Character/scene selection interface (optional)

**Total Remaining Time**: 2 weeks (with character system already complete)

## Implementation Priority
1. **Scene Database System** (3 days) - Highest priority for curl command functionality
2. **Flux-LoRA Integration** (2 days) - Enable programmatic parameter processing  
3. **Prompt Assembly Function** (3 days) - 384-word structured generation
4. **Testing & Curl Validation** (2 days) - Ensure curl commands work perfectly 