# Production Readiness Action Plan

## Overview

This document provides a **prioritized roadmap** for making the Forge application production-ready. Based on the comprehensive audit, we've identified critical issues that must be addressed before deployment.

## Critical Issues Summary

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|---------|--------|----------|
| API Response Inconsistency | 🚨 High | High | Medium | **P0** |
| Data Validation Missing | 🚨 High | High | High | **P0** |
| Security Vulnerabilities | 🚨 High | High | Medium | **P0** |
| **Scalable Provider Architecture** | 🚨 **High** | **High** | **High** | **P0** |
| Component Architecture | 🔶 Medium | Medium | High | **P1** |
| Database Inconsistencies | 🔶 Medium | Medium | Medium | **P1** |
| Error Handling | 🔶 Medium | Low | Low | **P2** |

## Phase 1: Critical Security & Stability (Week 1-2)

### P0 Issues - Must Fix Before Production

#### 1. Scalable AI Provider Architecture  
**Files:** All `/api/*` generation routes
**Issue:** [scalable-ai-provider-architecture.md](./scalable-ai-provider-architecture.md)
**Impact:** Critical for multi-provider support (PixVerse, Replicate, ElevenLabs)

#### 1b. Unified Media Saving Architecture
**Files:** All saving logic across routes
**Issue:** [unified-media-saving-architecture.md](./unified-media-saving-architecture.md) 
**Impact:** Eliminates duplicate saving code, ensures consistent metadata across providers

```bash
# Day 1-3: Create provider abstraction layer
touch src/lib/providers/types.ts        # AIProvider interface, AIServiceType enum
touch src/lib/providers/registry.ts     # Provider registration system
touch src/lib/providers/selector.ts     # Smart provider selection
touch src/config/providers.ts           # Provider configuration

# Day 4-5: Implement Fal.ai provider + unified media saving
touch src/lib/providers/fal.ts          # Wrap existing Fal.ai logic
touch src/services/mediaSaver.ts         # Unified saving service
touch src/types/mediaSaver.ts            # Standardized interfaces
- Create MediaSaverService to replace duplicate saveVideoWithMetadata functions
- Migrate flux-lora, framepack, ideogram logic to use unified saving

# Day 6-7: Migrate existing routes to use provider abstraction + unified saving
- Update src/app/api/flux-lora/route.ts to use FalProvider + MediaSaverService
- Update src/app/api/framepack/route.ts to use FalProvider + MediaSaverService
- Keep existing URLs working, change internal implementation only
- Remove duplicate saveVideoWithMetadata functions from routes
```

#### 2. API Response Standardization
**Files:** All `/api/*` routes
**Issue:** [api-response-standardization.md](./api-response-standardization.md)

```bash
# Day 1-2: Create foundation
touch src/lib/apiResponse.ts
touch src/lib/apiRoute.ts
touch src/lib/validation/schemas.ts

# Day 3-4: Migrate database routes (proof of concept)
- Update src/app/api/database/images/route.ts
- Update src/app/api/database/videos/route.ts  
- Update src/app/api/database/projects/route.ts

# Day 5-7: Test and validate frontend integration
- Update src/services/imageService.ts
- Update src/contexts/ImageContext.tsx
- Test error handling flows
```

#### 3. Input Validation & Sanitization
**Files:** All POST/PATCH routes
**Risk:** XSS attacks, data corruption

```bash
# Install dependencies
npm install zod dompurify

# Create validation schemas
src/lib/validation/
├── schemas.ts          # Zod schemas for all entities
├── sanitization.ts     # Input sanitization helpers
└── middleware.ts       # Route validation middleware

# Priority routes to secure:
1. src/app/api/database/projects/[id]/*/route.ts (project settings)
2. src/app/api/flux-lora/route.ts (prompt injection risk)
3. src/app/api/database/characters/route.ts (user content)
4. src/app/api/database/scenes/route.ts (user content)
```

#### 4. Environment Variable Security
**Files:** All routes using `getEnvVar()`
**Risk:** API key exposure, configuration leaks

```bash
# Audit and fix:
- Ensure no env vars in error messages
- Add fallback handling for missing keys
- Implement proper error codes instead of exposing internals
- Review src/lib/envUtils.ts for security

# Critical routes:
- src/app/api/flux-*/route.ts (FAL_KEY exposure)
- src/app/api/database/settings/env/route.ts (env management)
```

## Phase 2: Multi-Provider Implementation & Data Consistency (Week 3)

### Continued P0: Multi-Provider Support

#### Implement Additional Providers
**Goal:** Add PixVerse, Replicate, ElevenLabs to the provider system

```bash
# Week 3 Day 1-2: PixVerse Routes
touch src/lib/providers/pixverse.ts
touch src/app/api/pixverse/text-to-video/route.ts
touch src/app/api/pixverse/image-to-video/route.ts
- Implement PixVerse provider class
- Create provider-specific routes
- Test video generation workflows

# Week 3 Day 3-4: Replicate Routes  
touch src/lib/providers/replicate.ts
touch src/app/api/replicate/flux-schnell/route.ts
touch src/app/api/replicate/stable-video/route.ts
- Implement Replicate provider class
- Add model version management
- Test prediction lifecycle

# Week 3 Day 5-7: ElevenLabs Routes
touch src/lib/providers/elevenlabs.ts
touch src/app/api/elevenlabs/text-to-speech/route.ts
touch src/app/api/elevenlabs/voice-clone/route.ts
- Implement ElevenLabs provider class
- Create audio generation routes
- Test TTS and voice cloning workflows
```

### P1 Issues - Important for Reliability

#### 4. Database Operation Standardization
**Files:** `src/services/databaseService.ts`, database routes
**Issue:** Mixed patterns, potential race conditions

```bash
# Create standardized patterns:
src/services/
├── baseService.ts      # Abstract base class
├── projectService.ts   # Project-specific operations  
├── mediaService.ts     # Images/videos unified
└── migration/          # Database migration scripts

# Refactor services:
1. Implement BaseService pattern
2. Add proper error handling
3. Implement transaction support
4. Add connection pooling
```

#### 5. File Type & Metadata Handling
**Files:** Image/video processing, metadata storage
**Issue:** Inconsistent metadata structures

```bash
# Standardize metadata:
src/types/
├── mediaTypes.ts       # Unified image/video types
├── metadataSchemas.ts  # Consistent metadata structure
└── fileTypes.ts        # Supported file types

# Update processors:
- Unify image/video metadata extraction
- Standardize file naming conventions  
- Implement proper MIME type validation
- Add file size limits and validation
```

## Phase 3: Architecture Improvements (Week 4-5)

### P1 Issues - Development Velocity

#### 6. Component Architecture Refactoring
**Files:** Large components (1000+ lines)
**Issue:** [component-architecture-refactoring.md](./component-architecture-refactoring.md)

```bash
# Week 4: PromptDrawer refactoring
src/components/PromptDrawer/
├── PromptDrawer.tsx           # Main orchestrator (~150 lines)
├── hooks/
│   ├── usePromptState.ts      # State management
│   └── usePromptGeneration.ts # Generation logic
├── sections/
│   ├── UserInputSection.tsx   # ~100 lines each
│   ├── CharacterSection.tsx
│   ├── SceneSection.tsx
│   └── TechnicalSection.tsx
└── components/
    ├── PromptPreview.tsx
    └── PromptActions.tsx

# Week 5: ProjectSettingsModal refactoring  
src/components/ProjectSettings/
├── ProjectSettingsModal.tsx   # Tab orchestrator
├── tabs/
│   ├── GeneralTab.tsx
│   ├── BusinessTab.tsx
│   ├── BrandTab.tsx
│   └── PromptingTab.tsx
└── hooks/
    └── useProjectSettings.ts
```

## Phase 4: Production Features (Week 6)

### P2 Issues - Production Readiness

#### 7. Monitoring & Error Handling
```bash
# Add production monitoring:
src/lib/
├── monitoring.ts       # Application monitoring
├── errorBoundary.tsx   # React error boundaries  
├── logger.ts           # Structured logging
└── healthCheck.ts      # Health check endpoints

# Implementation:
- Add error boundaries to major components
- Implement structured logging
- Add performance monitoring
- Create health check endpoints
```

#### 8. Performance Optimization
```bash
# Add performance tools:
- React.memo for expensive components
- useMemo for expensive calculations
- Implement virtual scrolling for large lists
- Add image lazy loading
- Implement API response caching
```

## Implementation Checklist

### Week 1: Foundation & Security
- [ ] ✅ Create `src/lib/apiResponse.ts` with standard interfaces
- [ ] ✅ Create `src/lib/validation/schemas.ts` with Zod schemas  
- [ ] ✅ Install security dependencies (zod, dompurify)
- [ ] ✅ Update 3 database routes as proof of concept
- [ ] ✅ Add input sanitization to user content routes
- [ ] ✅ Audit environment variable handling
- [ ] ✅ Test API consistency with frontend

### Week 2: API Migration  
- [ ] ✅ Migrate all database API routes to standard format
- [ ] ✅ Migrate image generation routes (flux-*, framepack)
- [ ] ✅ Migrate video generation routes (kling-*, luma-*)  
- [ ] ✅ Update frontend services to use new format
- [ ] ✅ Add comprehensive input validation
- [ ] ✅ Implement proper error codes

### Week 3: Data Consistency
- [ ] ✅ Create BaseService abstract class
- [ ] ✅ Refactor databaseService to use patterns
- [ ] ✅ Standardize metadata structures
- [ ] ✅ Implement file type validation
- [ ] ✅ Add database migration system
- [ ] ✅ Fix video sync undefined errors

### Week 4: Component Refactoring - Part 1
- [ ] ✅ Refactor PromptDrawer into modular components
- [ ] ✅ Extract state management into custom hooks
- [ ] ✅ Create reusable UI components
- [ ] ✅ Implement component testing
- [ ] ✅ Measure performance improvements

### Week 5: Component Refactoring - Part 2  
- [ ] ✅ Refactor ProjectSettingsModal
- [ ] ✅ Refactor UserSettingsModal
- [ ] ✅ Create shared component library
- [ ] ✅ Implement design system patterns
- [ ] ✅ Add comprehensive component tests

### Week 6: Production Readiness
- [ ] ✅ Add error boundaries and monitoring
- [ ] ✅ Implement structured logging
- [ ] ✅ Add health check endpoints
- [ ] ✅ Performance optimization
- [ ] ✅ Security audit and penetration testing
- [ ] ✅ Load testing and scalability assessment

## Success Metrics

### Code Quality
- ✅ All API routes return consistent `ApiResponse<T>` format
- ✅ 100% of user inputs validated with Zod schemas
- ✅ No component exceeds 300 lines
- ✅ 90%+ test coverage on critical paths

### Multi-Provider Architecture
- ✅ Support for 4+ AI providers (Fal.ai, PixVerse, Replicate, ElevenLabs)
- ✅ Provider-based routing (`/api/{provider}/{endpoint}`)
- ✅ Smart provider selection and automatic failover
- ✅ Easy addition of new providers via configuration

### Unified Media Saving
- ✅ Single MediaSaverService replaces 8+ duplicate saving functions
- ✅ Consistent metadata structure across all providers
- ✅ Standardized file naming and organization
- ✅ Provider-agnostic saving with provider-specific data preservation

### Security  
- ✅ All user inputs sanitized
- ✅ No environment variables exposed in responses
- ✅ Input validation prevents injection attacks
- ✅ Proper error handling without information leakage

### Performance
- ✅ < 2s initial page load
- ✅ < 500ms API response times
- ✅ < 100ms component re-render times
- ✅ Smooth scrolling with 1000+ items

### Reliability
- ✅ 99.9% uptime target
- ✅ Graceful degradation on errors
- ✅ Data consistency across operations
- ✅ Proper backup and recovery procedures

## Risk Mitigation

### High Risk Items
1. **Database migrations** - Test thoroughly in staging
2. **API format changes** - Implement backward compatibility
3. **Component refactoring** - Maintain feature parity
4. **Security changes** - Don't break authentication

### Rollback Plans
- Keep old API response format available during transition
- Feature flags for new component architecture
- Database migration rollback scripts
- Monitoring for increased error rates

## Next Immediate Steps

1. **Today**: Create issue tracking for each phase
2. **This Week**: Implement API response standardization foundation
3. **Next Week**: Begin security and validation implementation
4. **Review Points**: Weekly stakeholder updates on progress

This plan transforms Forge from a development prototype into a production-ready application with maintainable, scalable architecture. 