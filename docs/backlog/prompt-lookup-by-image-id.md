# Prompt Lookup by Image ID - Research & Implementation

## Backlog Item Overview
**Epic**: Database Query Utilities  
**Feature**: Prompt Retrieval System  
**Priority**: Medium  
**Estimated Effort**: 1-2 weeks  
**Dependencies**: SQLite database, existing DatabaseService

## Problem Statement
Currently, there's no standardized way to retrieve the original prompt used to generate a specific image. While prompts are stored in the database metadata, there's no dedicated API or utility function to easily extract prompt information by image ID. This is needed for:
- Prompt reinforcement schedule analysis
- Debugging generation issues
- Prompt template extraction and reuse
- Analytics and reporting systems

## Research Findings

### ✅ Current Database Structure Analysis
**Database**: `forge.db` (SQLite)  
**Table**: `images`  
**Prompt Storage**: JSON in `metadata` column

**Available Prompt Fields:**
```json
{
  "prompt": "Full generated prompt (~400 words)",
  "original_prompt": "Backup/original version", 
  "user_prompt": "User's 16-word input phrase",
  "character_name": "Character used in generation",
  "scene_name": "Scene used in generation",
  "concept": "Generation concept/theme",
  "prompt_components": {
    "masterPrompt": "Master prompt section",
    "userInput": "User input integration",
    "characterDescription": "Character details",
    "sceneFoundation": "Scene context",
    // ... other component breakdowns
  },
  "prompt_metadata": {
    "charactersUsed": ["character names"],
    "sceneUsed": "scene name",
    "wordCount": 384,
    "budgetCompliant": true
  }
}
```

### ✅ Existing Infrastructure
**DatabaseService Methods:**
- `getImage(id: string)` - Returns complete image metadata
- `getImages(projectId: string)` - Returns all project images
- `getHiddenImages(projectId: string)` - Returns hidden images

**JSON Extraction Pattern:**
```sql
SELECT 
  JSON_EXTRACT(metadata, '$.prompt') as prompt,
  JSON_EXTRACT(metadata, '$.user_prompt') as user_prompt,
  JSON_EXTRACT(metadata, '$.character_name') as character_name
FROM images WHERE id = ?
```

## Solution Design

### Phase 1: Core Prompt Lookup Service
Create a dedicated service for prompt retrieval with optimized queries.

```typescript
class PromptLookupService {
  // Get complete prompt data for an image
  async getPromptByImageId(imageId: string): Promise<PromptData | null>;
  
  // Get specific prompt fields only (performance optimized)
  async getPromptFields(imageId: string, fields: string[]): Promise<Partial<PromptData> | null>;
  
  // Batch prompt lookup for multiple images
  async getPromptsByImageIds(imageIds: string[]): Promise<Map<string, PromptData>>;
  
  // Find images by prompt content similarity
  async findImagesByPromptPattern(pattern: string, projectId?: string): Promise<ImagePromptMatch[]>;
}
```

### Phase 2: API Endpoints
Create REST endpoints for prompt retrieval.

```typescript
// GET /api/prompts/by-image/:imageId
// GET /api/prompts/batch?imageIds=id1,id2,id3
// GET /api/prompts/search?pattern=search-term&projectId=optional
```

### Phase 3: Integration Utilities
Build helper functions for common use cases.

```typescript
// For reinforcement schedule
async function getPromptPerformanceData(imageId: string): Promise<PromptPerformance>;

// For prompt template extraction
async function extractPromptTemplate(imageId: string): Promise<PromptTemplate>;

// For debugging/analysis
async function analyzePromptComponents(imageId: string): Promise<PromptAnalysis>;
```

## Technical Specifications

### Core Data Model
```typescript
interface PromptData {
  imageId: string;
  fullPrompt: string;
  originalPrompt: string;
  userPrompt?: string;
  characterName?: string;
  sceneName?: string;
  concept: string;
  
  // Component breakdown (if available)
  components?: {
    masterPrompt?: string;
    userInput?: string;
    characterDescription?: string;
    sceneFoundation?: string;
    technicalPhotography?: string;
    visualStyleAesthetic?: string;
    atmosphericEnvironmental?: string;
    supportingElements?: string;
    postProcessingEffects?: string;
    triggerWords?: string;
  };
  
  // Generation metadata
  metadata?: {
    charactersUsed?: string[];
    sceneUsed?: string;
    wordCount?: number;
    budgetCompliant?: boolean;
    generationMethod?: 'manual' | 'programmatic';
  };
  
  // Database fields for correlation
  projectId: string;
  generatedAt: string;
  modelUsed: string;
  imageHidden: boolean;
  timelineOrder?: number;
}

interface PromptPerformance {
  promptData: PromptData;
  imageState: 'gallery' | 'timeline' | 'hidden';
  stateHistory: StateTransition[];
  currentScore?: number;
  generationToHideTime?: number; // milliseconds
}

interface ImagePromptMatch {
  imageId: string;
  promptData: PromptData;
  matchScore: number;
  matchedFields: string[];
}
```

### Database Query Optimization

#### Indexed Queries for Performance
```sql
-- Create indexes for prompt searching
CREATE INDEX IF NOT EXISTS idx_images_metadata_prompt 
ON images(JSON_EXTRACT(metadata, '$.prompt'));

CREATE INDEX IF NOT EXISTS idx_images_metadata_concept 
ON images(JSON_EXTRACT(metadata, '$.concept'));

CREATE INDEX IF NOT EXISTS idx_images_metadata_character 
ON images(JSON_EXTRACT(metadata, '$.character_name'));

-- Compound index for common query patterns
CREATE INDEX IF NOT EXISTS idx_images_project_hidden_timeline 
ON images(project_id, hidden, timeline_order);
```

#### Optimized Query Functions
```typescript
class PromptLookupService {
  // Single image prompt lookup (most common case)
  async getPromptByImageId(imageId: string): Promise<PromptData | null> {
    const query = `
      SELECT 
        id,
        project_id,
        created_at,
        hidden,
        timeline_order,
        JSON_EXTRACT(metadata, '$.prompt') as prompt,
        JSON_EXTRACT(metadata, '$.original_prompt') as original_prompt,
        JSON_EXTRACT(metadata, '$.user_prompt') as user_prompt,
        JSON_EXTRACT(metadata, '$.character_name') as character_name,
        JSON_EXTRACT(metadata, '$.scene_name') as scene_name,
        JSON_EXTRACT(metadata, '$.concept') as concept,
        JSON_EXTRACT(metadata, '$.model') as model,
        JSON_EXTRACT(metadata, '$.prompt_components') as components,
        JSON_EXTRACT(metadata, '$.prompt_metadata') as prompt_metadata
      FROM images 
      WHERE id = ?
    `;
    // Implementation follows...
  }
  
  // Batch lookup with single query (performance optimization)
  async getPromptsByImageIds(imageIds: string[]): Promise<Map<string, PromptData>> {
    const placeholders = imageIds.map(() => '?').join(',');
    const query = `
      SELECT 
        id,
        JSON_EXTRACT(metadata, '$.prompt') as prompt,
        JSON_EXTRACT(metadata, '$.user_prompt') as user_prompt,
        -- ... other fields
      FROM images 
      WHERE id IN (${placeholders})
    `;
    // Implementation follows...
  }
  
  // Pattern-based search with fuzzy matching
  async findImagesByPromptPattern(
    pattern: string, 
    projectId?: string,
    limit: number = 50
  ): Promise<ImagePromptMatch[]> {
    const baseQuery = `
      SELECT 
        id,
        JSON_EXTRACT(metadata, '$.prompt') as prompt,
        JSON_EXTRACT(metadata, '$.concept') as concept,
        JSON_EXTRACT(metadata, '$.character_name') as character_name
      FROM images 
      WHERE JSON_EXTRACT(metadata, '$.prompt') LIKE ?
    `;
    
    const conditions = [baseQuery];
    const params = [`%${pattern}%`];
    
    if (projectId) {
      conditions.push(' AND project_id = ?');
      params.push(projectId);
    }
    
    conditions.push(' ORDER BY created_at DESC LIMIT ?');
    params.push(limit.toString());
    
    // Implementation follows...
  }
}
```

## Implementation Plan

### Week 1: Core Service Development
**Tasks:**
- [ ] Create `PromptLookupService` class with TypeScript interfaces
- [ ] Implement basic image ID → prompt lookup functionality
- [ ] Add database query optimization and indexing
- [ ] Create comprehensive unit tests for lookup functions
- [ ] Performance testing with large dataset (1000+ images)

**Deliverables:**
- Core service class with full prompt retrieval
- Optimized database queries
- Test suite with edge case coverage

### Week 2: API Integration & Utilities
**Tasks:**
- [ ] Create REST API endpoints for prompt lookup
- [ ] Build batch lookup functionality
- [ ] Implement prompt pattern searching
- [ ] Add integration with existing DatabaseService
- [ ] Create utility functions for common use cases

**Deliverables:**
- RESTful API endpoints
- Batch processing capabilities
- Search functionality
- Integration documentation

## Use Cases & Examples

### Use Case 1: Reinforcement Schedule Integration
```typescript
// Get prompt for scoring analysis
const promptData = await promptLookupService.getPromptByImageId(imageId);
const performance = await promptReinforcementService.analyzePromptPerformance(promptData);

// Example: Image hidden quickly = bad prompt
if (performance.stateHistory.some(s => s.toState === 'hidden' && s.duration < 300000)) {
  console.log(`Poor prompt detected: ${promptData.userPrompt}`);
}
```

### Use Case 2: Template Extraction
```typescript
// Find successful prompts for template creation
const timelineImages = await databaseService.getImages(projectId);
const timelinePrompts = await promptLookupService.getPromptsByImageIds(
  timelineImages.filter(img => img.timeline_order).map(img => img.id)
);

// Extract common patterns from successful prompts
const successPatterns = analyzeCommonPatterns(Array.from(timelinePrompts.values()));
```

### Use Case 3: Debugging Generation Issues
```typescript
// Investigate why specific images failed
const hiddenImages = await databaseService.getHiddenImages(projectId);
const failedPrompts = await promptLookupService.getPromptsByImageIds(
  hiddenImages.map(img => img.id)
);

// Analyze failure patterns
failedPrompts.forEach((promptData, imageId) => {
  console.log(`Failed prompt: ${promptData.userPrompt}`);
  console.log(`Character: ${promptData.characterName}`);
  console.log(`Word count: ${promptData.metadata?.wordCount}`);
});
```

### Use Case 4: API Usage Examples
```bash
# Get prompt for specific image
curl "http://localhost:3000/api/prompts/by-image/batch-123-456"

# Batch lookup for multiple images
curl "http://localhost:3000/api/prompts/batch?imageIds=id1,id2,id3"

# Search for images with specific prompt patterns
curl "http://localhost:3000/api/prompts/search?pattern=vintage&projectId=amc"
```

## Testing Strategy

### Unit Tests
- Single image prompt lookup with valid/invalid IDs
- Batch lookup with mixed valid/invalid IDs
- Pattern search with various search terms
- Performance testing with large datasets
- Edge cases: missing metadata, malformed JSON

### Integration Tests
- End-to-end API testing
- Database query performance verification
- Integration with existing DatabaseService
- Concurrent access testing

### Performance Benchmarks
- Single lookup: < 10ms
- Batch lookup (100 images): < 100ms
- Pattern search: < 500ms
- Memory usage: < 50MB for 1000 image dataset

## Success Criteria

### Functional Requirements
- [ ] Successfully retrieve prompt data for any valid image ID
- [ ] Batch lookup handles up to 100 images efficiently
- [ ] Pattern search finds relevant matches with 90%+ accuracy
- [ ] API responses include all available prompt metadata
- [ ] Error handling for missing/invalid image IDs

### Performance Requirements
- [ ] Single image lookup completes in < 10ms
- [ ] Batch operations scale linearly with image count
- [ ] Database queries use proper indexes for optimization
- [ ] Memory usage remains reasonable for large datasets

### Integration Requirements
- [ ] Seamless integration with existing DatabaseService
- [ ] Compatible with reinforcement schedule system
- [ ] RESTful API follows existing app conventions
- [ ] TypeScript interfaces provide full type safety

## Future Enhancements

### Advanced Search Capabilities
- Semantic prompt similarity using NLP
- Fuzzy matching for typos and variations
- Advanced filtering by generation parameters
- Cross-project prompt pattern analysis

### Caching & Performance
- Redis caching for frequently accessed prompts
- Elasticsearch integration for advanced text search
- Database connection pooling for high concurrency
- Query result caching with TTL

### Analytics Integration
- Prompt effectiveness scoring
- A/B testing framework for prompt variations
- Historical trend analysis
- Automated prompt optimization suggestions

## Risk Assessment

### Technical Risks
**Medium Risk**: Database performance with large prompt datasets
- *Mitigation*: Implement proper indexing and query optimization

**Low Risk**: JSON parsing errors with malformed metadata
- *Mitigation*: Robust error handling and data validation

### Business Risks
**Low Risk**: Breaking changes to existing prompt storage format
- *Mitigation*: Backward compatibility and gradual migration

## Definition of Done

### Technical Completion
- [ ] All unit tests pass with >95% coverage
- [ ] Integration tests verify API functionality
- [ ] Performance benchmarks meet defined criteria
- [ ] Code review completed and approved
- [ ] Documentation updated for new APIs

### User Acceptance
- [ ] API endpoints accessible and functional
- [ ] Prompt data retrieval works for all image types
- [ ] Search functionality returns relevant results
- [ ] Error messages are clear and actionable

This implementation will provide a solid foundation for prompt analysis, reinforcement learning, and advanced prompting features while maintaining high performance and reliability.



