# Fal.ai API Compliance Issues

## Problem Statement

Forge is using **deprecated Fal.ai packages and patterns** that are no longer supported and may break in future updates. The current implementation doesn't follow official Fal.ai best practices.

## Critical Issues Found

### 🚨 1. Using Deprecated Package

**Current:** `@fal-ai/serverless-client` (deprecated)
**Should Use:** `@fal-ai/client` (current)

```typescript
// ❌ CURRENT (deprecated)
import * as fal from '@fal-ai/serverless-client'

// ✅ CORRECT (official)
import { fal } from "@fal-ai/client"
```

**Impact:** The `@fal-ai/serverless-client` package is deprecated and may stop working.

### 🚨 2. Missing Server Proxy Setup

**Current:** API keys exposed in client-side calls
**Should Use:** Server proxy for credential protection

According to Fal.ai docs:
> **it is not recommended** to store your credentials in your client source code. The common practice is to use your own server to serve as a proxy to fal APIs.

### 🔶 3. Inconsistent Configuration Patterns

**Current Issues:**
- Some routes configure globally: `fal.config({ credentials: process.env.FAL_KEY })`
- Others configure per-request: `const falKey = await getEnvVar('FAL_KEY'); fal.config({ credentials: falKey })`
- Mixed environment variable handling

### 🔶 4. Suboptimal API Call Patterns

**Current:** Using `fal.subscribe()` only
**Available:** `fal.run()`, `fal.queue.submit()`, `fal.queue.status()`, `fal.queue.result()`

## Detailed Analysis by Route

### Routes Using Deprecated Package
All image/video generation routes use `@fal-ai/serverless-client`:

1. **`src/app/api/flux-lora/route.ts`** - 614 lines, complex implementation
2. **`src/app/api/framepack/route.ts`** - Image-to-video generation  
3. **`src/app/api/aura-sr/route.ts`** - Image upscaling
4. **`src/app/api/ideogram/route.ts`** - Mixed configuration pattern
5. **`src/app/api/kling-video/route.ts`** - Video generation
6. **`src/app/api/minimax-hailuo/route.ts`** - Video generation
7. **`src/app/api/pixverse/route.ts`** - Video generation
8. **`src/app/api/ideogram-upscale/route.ts`** - Image upscaling

### Configuration Inconsistencies

```typescript
// Pattern 1: Global config (some routes)
fal.config({
  credentials: process.env.FAL_KEY, // ❌ Hardcoded env var
})

// Pattern 2: Per-request config (other routes)  
const falKey = await getEnvVar('FAL_KEY', currentProjectId)
fal.config({
  credentials: falKey // ✅ Better, but still not optimal
})
```

## Recommended Migration Plan

### Phase 1: Update Package and Core Patterns

#### 1.1 Update Package Dependencies
```bash
# Remove deprecated package
npm uninstall @fal-ai/serverless-client

# Install current packages
npm install @fal-ai/client @fal-ai/server-proxy
```

#### 1.2 Create Standardized Fal.ai Service
```typescript
// src/services/falService.ts
import { fal } from "@fal-ai/client";
import { getEnvVar } from '@/lib/envUtils';

export class FalService {
  private static configured = false;

  static async configure(projectId?: string) {
    if (this.configured) return;

    const falKey = await getEnvVar('FAL_KEY', projectId);
    if (!falKey) {
      throw new Error('FAL_KEY not configured');
    }

    fal.config({
      // Use proxy in production for security
      proxyUrl: process.env.NODE_ENV === 'production' 
        ? '/api/fal/proxy' 
        : undefined,
      credentials: process.env.NODE_ENV === 'production' 
        ? undefined 
        : falKey,
    });

    this.configured = true;
  }

  static async subscribe<T>(endpoint: string, options: any): Promise<T> {
    await this.configure();
    
    return fal.subscribe(endpoint, {
      input: options.input,
      logs: options.logs || false,
      onQueueUpdate: options.onQueueUpdate,
    }) as T;
  }

  static async run<T>(endpoint: string, options: any): Promise<T> {
    await this.configure();
    
    return fal.run(endpoint, {
      input: options.input,
    }) as T;
  }

  // For long-running requests
  static async queueSubmit(endpoint: string, options: any) {
    await this.configure();
    
    return fal.queue.submit(endpoint, {
      input: options.input,
      webhookUrl: options.webhookUrl,
    });
  }

  static async queueResult<T>(endpoint: string, requestId: string): Promise<T> {
    await this.configure();
    
    return fal.queue.result(endpoint, { requestId }) as T;
  }
}
```

#### 1.3 Setup Fal.ai Proxy (Recommended)
```typescript
// src/app/api/fal/proxy/route.ts
export { handler as default } from "@fal-ai/server-proxy/nextjs";
```

### Phase 2: Migrate API Routes

#### 2.1 Template for Route Migration
```typescript
// Before (deprecated pattern)
import * as fal from '@fal-ai/serverless-client'

export async function POST(request: NextRequest) {
  const falKey = await getEnvVar('FAL_KEY', currentProjectId)
  fal.config({ credentials: falKey })
  
  const result = await fal.subscribe('fal-ai/flux-lora', {
    input,
    logs: false
  }) as FalResult
}

// After (current pattern)  
import { FalService } from '@/services/falService'

export async function POST(request: NextRequest) {
  const currentProjectId = getCurrentProjectFromServerSync()
  
  const result = await FalService.subscribe<FalResult>('fal-ai/flux-lora', {
    input,
    logs: false,
    projectId: currentProjectId
  })
}
```

#### 2.2 Enhanced Error Handling
```typescript
// Add proper Fal.ai error handling
try {
  const result = await FalService.subscribe<FalResult>(endpoint, options);
  return successResponse(result, 'Generation completed successfully');
} catch (error) {
  if (error instanceof FalError) {
    return errorResponse({
      code: 'FAL_API_ERROR',
      message: error.message,
      details: {
        status: error.status,
        body: error.body,
      }
    });
  }
  
  return errorResponse({
    code: 'GENERATION_ERROR', 
    message: 'Failed to generate content',
    details: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

### Phase 3: Implement Best Practices

#### 3.1 Request Queue Management
```typescript
// For long-running requests, use queue pattern
export async function POST(request: NextRequest) {
  const { immediate = false } = await request.json();
  
  if (immediate) {
    // For fast models, use direct call
    const result = await FalService.run<FalResult>(endpoint, { input });
    return successResponse(result);
  } else {
    // For slow models, use queue
    const { request_id } = await FalService.queueSubmit(endpoint, { 
      input,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/fal`
    });
    
    return successResponse({ 
      requestId: request_id,
      status: 'queued',
      message: 'Request queued successfully'
    });
  }
}
```

#### 3.2 Webhook Handler
```typescript
// src/app/api/webhooks/fal/route.ts
export async function POST(request: NextRequest) {
  const webhook = await request.json();
  
  // Process completed generation
  if (webhook.status === 'completed') {
    await handleCompletedGeneration(webhook);
  }
  
  return NextResponse.json({ received: true });
}
```

## Migration Checklist

### Week 1: Foundation
- [ ] Install new Fal.ai packages
- [ ] Create FalService abstraction  
- [ ] Setup Fal.ai proxy endpoint
- [ ] Update 2-3 routes as proof of concept

### Week 2: Route Migration
- [ ] Migrate flux-lora route (most complex)
- [ ] Migrate framepack route
- [ ] Migrate image upscaling routes (aura-sr, ideogram-upscale)
- [ ] Test all migrated routes

### Week 3: Video Routes  
- [ ] Migrate video generation routes (kling, minimax, pixverse)
- [ ] Update error handling patterns
- [ ] Implement queue management for long requests

### Week 4: Optimization
- [ ] Add webhook handling for async requests
- [ ] Implement request caching where appropriate
- [ ] Add comprehensive monitoring
- [ ] Performance testing and optimization

## Benefits After Migration

### ✅ Security
- API keys protected via server proxy
- No client-side credential exposure
- Proper authentication handling

### ✅ Reliability  
- Using officially supported packages
- Future-proof against deprecations
- Better error handling and retry logic

### ✅ Performance
- Optimized request patterns
- Queue management for long requests  
- Webhook handling for async operations

### ✅ Maintainability
- Consistent patterns across all routes
- Centralized Fal.ai configuration
- Easier to add new AI endpoints

## Files Requiring Updates

### Immediate Priority (Core Routes)
- `src/app/api/flux-lora/route.ts` - Most complex, 614 lines
- `src/app/api/framepack/route.ts` - Image-to-video generation
- `src/app/api/aura-sr/route.ts` - Image upscaling

### Secondary Priority (Video Routes)
- `src/app/api/kling-video/route.ts` - Video generation
- `src/app/api/minimax-hailuo/route.ts` - Video generation  
- `src/app/api/pixverse/route.ts` - Video generation

### Support Files
- `package.json` - Update dependencies
- Create `src/services/falService.ts` - Centralized service
- Create `src/app/api/fal/proxy/route.ts` - Security proxy

## Risk Assessment

### Low Risk
- Package migration is straightforward
- API compatibility maintained
- Gradual migration possible

### Medium Risk  
- Configuration changes may affect existing integrations
- Proxy setup requires testing in production

### Mitigation
- Feature flags for new vs old implementation
- Gradual rollout route by route
- Comprehensive testing in staging environment

This migration will bring Forge up to current Fal.ai standards and improve security, reliability, and maintainability. 