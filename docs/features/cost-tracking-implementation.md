# Cost Tracking Implementation Documentation

## Overview

This document outlines the implementation requirements for adding cost tracking to all image and video generation API endpoints in the Forge (Forge) application. The feature will track the cost of each generated media item and display this information prominently in the frontend.

## Current State Analysis

### Existing Infrastructure

Based on the codebase analysis, we have:
- **Database Schema**: SQLite database with `images` and `videos` tables containing metadata fields
- **Frontend Components**: `ImageModal.tsx` shows detailed image metadata to users
- **Batch Endpoints**: Some endpoints already include rough cost estimates (e.g., `estimated_total_cost: $${(images.length * 0.05).toFixed(2)}`)
- **Provider System**: Modular provider architecture with pricing information (`src/lib/providers/types.ts`)

### Current Cost Implementation
Some batch endpoints already include basic cost estimation:
- `flux-kontext/batch-generate`: `$0.03` per image estimate
- `flux-lora/batch-generate`: `$0.05` per image estimate

## Implementation Requirements

### Database Schema Changes

#### 1. Add Cost Column to Images Table
```sql
ALTER TABLE images ADD COLUMN generation_cost REAL;
ALTER TABLE images ADD COLUMN cost_currency TEXT DEFAULT 'USD';
```

#### 2. Add Cost Column to Videos Table
```sql
ALTER TABLE videos ADD COLUMN generation_cost REAL;
ALTER TABLE videos ADD COLUMN cost_currency TEXT DEFAULT 'USD';
```

#### 3. Create Cost Tracking Table (Optional Enhancement)
```sql
CREATE TABLE IF NOT EXISTS generation_costs (
  id TEXT PRIMARY KEY,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'image' or 'video'
  provider TEXT NOT NULL, -- 'fal', 'ideogram', etc.
  model TEXT NOT NULL, -- Model name used
  cost_amount REAL NOT NULL,
  cost_currency TEXT DEFAULT 'USD',
  cost_breakdown TEXT, -- JSON string with detailed cost breakdown
  generation_timestamp DATETIME NOT NULL,
  project_id TEXT NOT NULL,
  FOREIGN KEY (media_id) REFERENCES images(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### API Endpoints Requiring Cost Tracking

#### Image Generation Endpoints

1. **`/api/flux-kontext/route.ts`**
   - Model: `fal-ai/flux-pro/kontext`
   - Current Status: No cost tracking
   - Estimated Cost: ~$0.03 per image

2. **`/api/flux-kontext/batch-generate/route.ts`**
   - Model: `fal-ai/flux-pro/kontext`
   - Current Status: Has rough estimate (`$0.03` per image)
   - Needs: Actual per-image cost tracking

3. **`/api/flux-lora/route.ts`**
   - Model: `fal-ai/flux-pro`
   - Current Status: No cost tracking
   - Estimated Cost: ~$0.05 per image

4. **`/api/flux-lora/batch-generate/route.ts`**
   - Model: `fal-ai/flux-pro`
   - Current Status: Has rough estimate (`$0.05` per image)
   - Needs: Actual per-image cost tracking

5. **`/api/ideogram/route.ts`**
   - Model: `fal-ai/ideogram/v2`
   - Current Status: No cost tracking
   - Estimated Cost: ~$0.08 per image

6. **`/api/ideogram/batch-generate/route.ts`**
   - Model: `fal-ai/ideogram/v2`
   - Current Status: No cost tracking
   - Estimated Cost: ~$0.08 per image

7. **`/api/aura-sr/route.ts`**
   - Model: `fal-ai/aura-sr`
   - Current Status: No cost tracking (upscaling service)
   - Estimated Cost: ~$0.02 per upscale

8. **`/api/ideogram-upscale/route.ts`**
   - Model: Ideogram upscaling
   - Current Status: No cost tracking
   - Estimated Cost: ~$0.04 per upscale

#### Video Generation Endpoints

9. **`/api/minimax-hailuo/route.ts`**
   - Model: `fal-ai/minimax/hailuo-02/standard/image-to-video`
   - Current Status: No cost tracking
   - Estimated Cost: ~$0.20 per video

10. **`/api/pika-scenes/route.ts`**
    - Model: `fal-ai/pika/v2.2/pikascenes`
    - Current Status: No cost tracking
    - Estimated Cost: ~$0.25 per video

11. **`/api/pixverse/route.ts`**
    - Model: PixVerse video generation
    - Current Status: No cost tracking
    - Estimated Cost: ~$0.15 per video

12. **`/api/kling-video/route.ts`**
    - Model: Kling video generation
    - Current Status: No cost tracking
    - Estimated Cost: ~$0.30 per video

13. **`/api/kling-video-elements/route.ts`**
    - Model: Kling video elements
    - Current Status: No cost tracking
    - Estimated Cost: ~$0.25 per video

14. **`/api/luma-dream/route.ts`**
    - Model: `fal-ai/luma-dream-machine/ray-2-flash/image-to-video`
    - Current Status: No cost tracking
    - Estimated Cost: ~$0.40 per video

15. **`/api/framepack/route.ts`**
    - Model: Framepack video generation
    - Current Status: No cost tracking
    - Estimated Cost: ~$0.10 per video

16. **`/api/wan-flf2v/route.ts`**
    - Model: WAN video generation
    - Current Status: No cost tracking
    - Estimated Cost: ~$0.18 per video

### Implementation Strategy

#### Phase 1: Database Schema Updates

1. **Migration Script**: Create database migration to add cost columns
2. **Backward Compatibility**: Ensure existing records work with null cost values
3. **Type Updates**: Update TypeScript interfaces to include cost fields

#### Phase 2: Provider Cost Integration

1. **Cost Provider Service**: Create a centralized cost calculation service
2. **Provider-Specific Costs**: Map each model to its actual cost
3. **Dynamic Pricing**: Support for changing provider pricing

#### Phase 3: API Endpoint Updates

1. **Cost Calculation**: Add cost calculation to each generation endpoint
2. **Response Updates**: Include cost information in API responses
3. **Database Persistence**: Save cost information with each generated item

#### Phase 4: Frontend Integration

1. **ImageModal Updates**: Display cost prominently in image details
2. **Cost Formatting**: Proper currency formatting and display
3. **Aggregate Costs**: Show project-level cost summaries

### Cost Provider Service Design

```typescript
// src/services/costService.ts
interface CostBreakdown {
  baseImageCost?: number;
  baseVideoCost?: number;
  upscalingCost?: number;
  processingCost?: number;
  total: number;
  currency: string;
}

interface ModelPricing {
  [modelName: string]: {
    costPerImage?: number;
    costPerVideo?: number;
    costPerSecond?: number; // For video duration-based pricing
    costPerUpscale?: number;
  };
}

class CostService {
  private static modelPricing: ModelPricing = {
    'fal-ai/flux-pro/kontext': { costPerImage: 0.035 },
    'fal-ai/flux-pro': { costPerImage: 0.055 },
    'fal-ai/ideogram/v2': { costPerImage: 0.080 },
    'fal-ai/aura-sr': { costPerUpscale: 0.020 },
    'fal-ai/minimax/hailuo-02/standard/image-to-video': { costPerVideo: 0.200 },
    'fal-ai/pika/v2.2/pikascenes': { costPerVideo: 0.250 },
    'fal-ai/luma-dream-machine/ray-2-flash/image-to-video': { costPerVideo: 0.400 },
    // ... additional models
  };

  static calculateCost(
    modelName: string,
    type: 'image' | 'video' | 'upscale',
    options?: { duration?: number; count?: number }
  ): CostBreakdown {
    // Implementation logic here
  }

  static updateModelPricing(updates: Partial<ModelPricing>): void {
    // Update pricing logic
  }
}
```

### Frontend Display Requirements

#### ImageModal Cost Display

Add a prominent cost section in the `ImageModal.tsx` component:

```tsx
{/* Generation Cost Section */}
{metadata.generation_cost && (
  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon icon={DollarSign} size="sm" className="text-green-600" />
        <span className="font-semibold text-green-800 dark:text-green-200">Generation Cost</span>
      </div>
      <div className="text-lg font-bold text-green-600">
        ${metadata.generation_cost.toFixed(4)} USD
      </div>
    </div>
    {metadata.cost_breakdown && (
      <div className="mt-2 text-sm text-green-700 dark:text-green-300">
        <CostBreakdownDisplay breakdown={JSON.parse(metadata.cost_breakdown)} />
      </div>
    )}
  </div>
)}
```

#### Cost Summary Features

1. **Individual Item Cost**: Display cost for each image/video in detail modal
2. **Project Cost Summary**: Show total project generation costs
3. **Cost Trends**: Optional analytics showing cost over time
4. **Cost Warnings**: Alert when generation costs exceed thresholds

### Implementation Steps

#### Step 1: Database Migration
```sql
-- Migration script to be run against the SQLite database
BEGIN TRANSACTION;

-- Add cost columns to existing tables
ALTER TABLE images ADD COLUMN generation_cost REAL;
ALTER TABLE images ADD COLUMN cost_currency TEXT DEFAULT 'USD';
ALTER TABLE videos ADD COLUMN generation_cost REAL;
ALTER TABLE videos ADD COLUMN cost_currency TEXT DEFAULT 'USD';

-- Create detailed cost tracking table
CREATE TABLE IF NOT EXISTS generation_costs (
  id TEXT PRIMARY KEY,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  cost_amount REAL NOT NULL,
  cost_currency TEXT DEFAULT 'USD',
  cost_breakdown TEXT,
  generation_timestamp DATETIME NOT NULL,
  project_id TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_generation_costs_media_id ON generation_costs(media_id);
CREATE INDEX idx_generation_costs_project_id ON generation_costs(project_id);
CREATE INDEX idx_generation_costs_timestamp ON generation_costs(generation_timestamp);

COMMIT;
```

#### Step 2: Update Type Definitions
```typescript
// src/types/database.ts
export interface DatabaseImage {
  // ... existing fields
  generation_cost?: number;
  cost_currency?: string;
}

export interface DatabaseVideo {
  // ... existing fields
  generation_cost?: number;
  cost_currency?: string;
}

export interface GenerationCost {
  id: string;
  media_id: string;
  media_type: 'image' | 'video';
  provider: string;
  model: string;
  cost_amount: number;
  cost_currency: string;
  cost_breakdown?: string; // JSON
  generation_timestamp: string;
  project_id: string;
}
```

#### Step 3: Cost Service Implementation
Create `src/services/costService.ts` with:
- Model pricing definitions
- Cost calculation logic
- Provider-specific cost handling
- Currency formatting utilities

#### Step 4: API Endpoint Updates
For each endpoint listed above:
1. Calculate generation cost using `CostService`
2. Include cost in metadata saved to database
3. Return cost information in API response
4. Update existing batch endpoints to use actual costs

#### Step 5: Frontend Integration
1. Update `ImageModal.tsx` to display cost information
2. Add cost display to `ImageCard.tsx` (optional)
3. Create project cost summary components
4. Update type definitions for frontend interfaces

### Testing Strategy

#### Unit Tests
- Cost calculation accuracy
- Database schema migrations
- API response format validation

#### Integration Tests
- End-to-end generation with cost tracking
- Frontend cost display verification
- Project cost aggregation

#### Performance Tests
- Database query performance with cost data
- Frontend rendering with cost information

### Security Considerations

1. **Cost Data Integrity**: Ensure cost calculations cannot be manipulated
2. **Privacy**: Cost information should only be visible to project owners
3. **Audit Trail**: Maintain detailed cost tracking for billing purposes

### Future Enhancements

1. **Cost Budgets**: Set spending limits per project
2. **Cost Alerts**: Notifications when costs exceed thresholds
3. **Cost Analytics**: Detailed reporting and trend analysis
4. **Provider Comparison**: Compare costs across different providers
5. **Bulk Discounts**: Handle volume-based pricing from providers

### Migration Timeline

- **Week 1**: Database schema migration and cost service implementation
- **Week 2**: API endpoint updates for image generation
- **Week 3**: API endpoint updates for video generation
- **Week 4**: Frontend integration and testing
- **Week 5**: Polish, documentation, and deployment preparation

## Summary

This implementation will provide comprehensive cost tracking across all media generation endpoints, giving users clear visibility into the cost of their AI-generated content. The modular design allows for easy updates to pricing and addition of new providers while maintaining backward compatibility with existing data.

The prominent display of cost information in the frontend will help users make informed decisions about their content generation and project budgets.
