# Prompt Reinforcement Schedule System

## Overview
A dynamic scoring and feedback system that evaluates prompt effectiveness based on image lifecycle states and user behavior patterns. This system creates a reinforcement schedule that tracks how prompts perform across the image workflow (gallery → timeline → hidden) and uses temporal analysis to identify prompt quality patterns.

## Core Concept
The reinforcement schedule measures prompt success by analyzing the journey of generated images through different states:
- **Timeline**: Highest positive reinforcement (images actively used in projects)
- **Gallery**: Moderate positive reinforcement (images kept but not yet used)
- **Hidden**: Negative reinforcement (images rejected/hidden by users)
- **Time-based penalties**: Additional negative scoring for images hidden quickly after creation

## Scoring Framework

### Base State Scores
```typescript
interface PromptStateScore {
  timeline: number;      // +10 points (highest success)
  gallery: number;       // +5 points (moderate success)
  hidden: number;        // -15 points (failure)
  deleted: number;       // -20 points (complete failure)
}
```

### Temporal Penalty Multipliers
Time-based scoring that increases negative reinforcement for quickly rejected prompts:
```typescript
interface TemporalPenalties {
  immediate: number;     // Hidden within 1 minute: 3x penalty
  veryQuick: number;     // Hidden within 5 minutes: 2.5x penalty
  quick: number;         // Hidden within 30 minutes: 2x penalty
  normal: number;        // Hidden after 30+ minutes: 1x penalty
}
```

### Composite Scoring Algorithm
```typescript
function calculatePromptScore(
  state: 'timeline' | 'gallery' | 'hidden' | 'deleted',
  createdAt: Date,
  stateChangedAt: Date,
  projectId: string
): PromptScore {
  const baseScore = getBaseScore(state);
  const timeDelta = stateChangedAt.getTime() - createdAt.getTime();
  const penaltyMultiplier = calculateTemporalPenalty(timeDelta, state);
  
  return {
    baseScore,
    temporalPenalty: penaltyMultiplier,
    finalScore: baseScore * (state === 'hidden' || state === 'deleted' ? penaltyMultiplier : 1),
    projectId,
    timestamp: stateChangedAt
  };
}
```

## Data Model

### Prompt Performance Tracking
```typescript
interface PromptPerformanceRecord {
  id: string;
  promptText: string;
  promptHash: string;           // For deduplication
  projectId: string;
  
  // Generation Context
  imageId: string;
  generatedAt: Date;
  modelUsed: string;            // flux-dev, flux-pro, etc.
  
  // Lifecycle Tracking
  currentState: 'gallery' | 'timeline' | 'hidden' | 'deleted';
  stateHistory: StateTransition[];
  
  // Scoring
  currentScore: number;
  scoreHistory: PromptScore[];
  
  // Metadata
  characterUsed?: string;
  sceneUsed?: string;
  userPhrase?: string;          // 16-word user input
  generationMethod: 'manual' | 'programmatic';
  
  createdAt: Date;
  updatedAt: Date;
}

interface StateTransition {
  fromState: string;
  toState: string;
  timestamp: Date;
  duration: number;             // Time spent in previous state (ms)
}

interface PromptScore {
  score: number;
  reason: string;
  calculatedAt: Date;
  factors: {
    baseScore: number;
    temporalPenalty: number;
    finalScore: number;
  };
}
```

### Database Schema
```sql
CREATE TABLE prompt_performance (
  id TEXT PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  project_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  generated_at DATETIME NOT NULL,
  model_used TEXT NOT NULL,
  current_state TEXT NOT NULL CHECK (current_state IN ('gallery', 'timeline', 'hidden', 'deleted')),
  current_score REAL DEFAULT 0,
  character_used TEXT,
  scene_used TEXT,
  user_phrase TEXT,
  generation_method TEXT NOT NULL CHECK (generation_method IN ('manual', 'programmatic')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (image_id) REFERENCES images(id)
);

CREATE TABLE prompt_state_transitions (
  id TEXT PRIMARY KEY,
  prompt_performance_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  duration INTEGER, -- milliseconds in previous state
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prompt_performance_id) REFERENCES prompt_performance(id)
);

CREATE TABLE prompt_scores (
  id TEXT PRIMARY KEY,
  prompt_performance_id TEXT NOT NULL,
  score REAL NOT NULL,
  reason TEXT NOT NULL,
  base_score REAL NOT NULL,
  temporal_penalty REAL NOT NULL,
  final_score REAL NOT NULL,
  calculated_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prompt_performance_id) REFERENCES prompt_performance(id)
);

-- Indexes for efficient querying
CREATE INDEX idx_prompt_performance_project_score ON prompt_performance(project_id, current_score DESC);
CREATE INDEX idx_prompt_performance_hash ON prompt_performance(prompt_hash);
CREATE INDEX idx_prompt_performance_state ON prompt_performance(current_state);
CREATE INDEX idx_prompt_transitions_timestamp ON prompt_state_transitions(timestamp);
```

## API Design

### Core Service Functions
```typescript
class PromptReinforcementService {
  // Track new image generation
  async trackPromptGeneration(
    promptText: string,
    imageId: string,
    projectId: string,
    context: GenerationContext
  ): Promise<PromptPerformanceRecord>;
  
  // Update when image state changes
  async updateImageState(
    imageId: string,
    newState: 'gallery' | 'timeline' | 'hidden' | 'deleted'
  ): Promise<PromptScore>;
  
  // Retrieve project-specific prompt analytics
  async getProjectPromptAnalytics(
    projectId: string,
    options?: AnalyticsOptions
  ): Promise<ProjectPromptAnalytics>;
  
  // Get top/bottom performing prompts
  async getPromptLeaderboard(
    projectId: string,
    limit: number,
    type: 'best' | 'worst'
  ): Promise<PromptPerformanceRecord[]>;
  
  // Identify prompt patterns
  async analyzePromptPatterns(
    projectId: string
  ): Promise<PromptPatternAnalysis>;
}
```

### Analytics Data Structures
```typescript
interface ProjectPromptAnalytics {
  projectId: string;
  totalPrompts: number;
  averageScore: number;
  scoreDistribution: ScoreDistribution;
  stateBreakdown: StateBreakdown;
  temporalTrends: TemporalTrend[];
  topPerformingPrompts: PromptPerformanceRecord[];
  worstPerformingPrompts: PromptPerformanceRecord[];
  patternInsights: PatternInsight[];
}

interface PromptPatternAnalysis {
  commonSuccessPatterns: string[];    // Frequent words/phrases in high-scoring prompts
  commonFailurePatterns: string[];    // Frequent words/phrases in low-scoring prompts
  optimalPromptLength: number;        // Average character count of best prompts
  effectiveKeywords: KeywordAnalysis[];
  characterPerformance: CharacterPromptStats[];
  scenePerformance: ScenePromptStats[];
}
```

## Implementation Phases

### Phase 1: Core Tracking Infrastructure (Week 1)
- Database schema implementation
- Basic tracking service for prompt generation
- State transition recording
- Simple scoring algorithm

### Phase 2: Analytics & Reporting (Week 2)
- Project-specific analytics dashboard
- Leaderboard functionality
- Pattern analysis algorithms
- Temporal trend analysis

### Phase 3: Integration & Automation (Week 3)
- Integration with existing image generation workflows
- Automatic state tracking based on UI interactions
- Real-time score updates
- Performance alerts for consistently poor prompts

### Phase 4: Advanced Features (Week 4)
- Machine learning-based pattern recognition
- Predictive prompt scoring
- Automated prompt suggestions based on successful patterns
- A/B testing framework for prompt variants

## Workflow Integration Points

### Image Generation Hooks
```typescript
// In flux-lora route
const response = await generateImage(finalPrompt, options);
await promptReinforcementService.trackPromptGeneration(
  finalPrompt,
  response.imageId,
  projectId,
  {
    modelUsed: 'flux-dev',
    generationMethod: options.programmatic ? 'programmatic' : 'manual',
    characterUsed: options.characterName,
    sceneUsed: options.sceneName,
    userPhrase: options.userPhrase
  }
);
```

### State Change Tracking
```typescript
// In image state update endpoints
await promptReinforcementService.updateImageState(imageId, newState);

// In timeline operations
await promptReinforcementService.updateImageState(imageId, 'timeline');

// In hide/delete operations
await promptReinforcementService.updateImageState(imageId, 'hidden');
```

## User Interface Components

### Analytics Dashboard
- **Project Prompt Performance Overview**: Score trends, state distribution
- **Leaderboard Views**: Best/worst performing prompts with scores
- **Pattern Analysis**: Visual representation of successful vs failed patterns
- **Temporal Analysis**: Charts showing quick rejection patterns

### Prompt Editor Enhancements
- **Real-time Score Prediction**: Show estimated score based on historical patterns
- **Pattern Warnings**: Alert when prompt contains frequently failed patterns
- **Success Suggestions**: Recommend modifications based on top-performing prompts

## Success Metrics & KPIs

### Prompt Quality Indicators
- **Average Prompt Score**: Overall health of prompting strategy
- **Hidden Rate**: Percentage of images hidden within 5 minutes
- **Timeline Adoption Rate**: Percentage of images that reach timeline status
- **Prompt Iteration Efficiency**: How quickly prompts improve over time

### Learning Acceleration Metrics
- **Pattern Recognition Speed**: How quickly system identifies successful patterns
- **Recommendation Accuracy**: Success rate of system-suggested prompt modifications
- **User Adoption**: How frequently users follow reinforcement-based suggestions

## Future Enhancements

### Machine Learning Integration
- **Natural Language Processing**: Semantic analysis of prompt components
- **Predictive Modeling**: AI-powered prompt success prediction
- **Automated Optimization**: Self-improving prompt generation based on feedback

### Advanced Analytics
- **Cross-Project Learning**: Share successful patterns across projects
- **User Behavior Analysis**: Personalized scoring based on individual preferences
- **Competitive Analysis**: Compare prompt performance across different models

### Workflow Automation
- **Auto-Prompt Refinement**: Automatically adjust prompts based on poor performance
- **Smart Batching**: Group similar prompts for efficiency testing
- **Quality Gates**: Prevent generation of prompts likely to fail

## Technical Considerations

### Performance Optimization
- **Async Processing**: Score calculations run in background
- **Caching Strategy**: Cache frequently accessed analytics data
- **Batch Operations**: Bulk state updates for efficiency

### Data Privacy & Storage
- **Anonymization**: Option to anonymize prompt text for pattern analysis
- **Retention Policies**: Configurable data retention for performance records
- **Export Capabilities**: Allow users to export their prompt performance data

## Priority Level: MEDIUM-HIGH
This feature provides valuable feedback loops for improving prompt quality and will become essential as the platform scales and users generate more content.

## Estimated Timeline: 4 weeks
- Week 1: Core infrastructure and basic tracking
- Week 2: Analytics and reporting systems  
- Week 3: UI integration and workflow automation
- Week 4: Advanced features and optimization

## Dependencies
- Existing image generation workflows
- Project management system
- Timeline and gallery state management
- Database migration capabilities

## Success Criteria
1. **Accurate Tracking**: All prompt generations and state changes captured
2. **Meaningful Scores**: Scoring system correlates with actual user satisfaction
3. **Actionable Insights**: Analytics provide clear guidance for prompt improvement
4. **Performance Impact**: System improves average prompt success rate by 25%
5. **User Adoption**: 80% of active users engage with reinforcement feedback

This reinforcement schedule system will transform prompting from guesswork into a data-driven optimization process, continuously improving the quality and effectiveness of generated content.



