# Gallery, Timeline & Hidden Section - Complete Optimization Plan

**Date:** October 6, 2025
**Status:** 🎯 **Comprehensive Performance & UX Overhaul**
**Estimated Duration:** 3 weeks
**Expected Impact:** 10-15 second load → <1 second load

---

## 🎯 **Executive Summary**

This plan combines **video thumbnail optimization** with **gallery rendering improvements** to solve the "empty cards on refresh" problem and dramatically improve performance.

### **The Two Core Problems**

1. **🎬 Video Performance Crisis** - Loading 25-50 MB of videos for thumbnails
2. **🖼️ UI Flash/Empty Cards** - Hydration delays, missing preload hints, slow dimension extraction

### **The Complete Solution**

| Phase | Focus | Duration | Impact |
|-------|-------|----------|--------|
| **Phase 1** | Video thumbnails + Image preloading | 3-4 days | 90% improvement |
| **Phase 2** | Lazy loading + Skeleton states | 2-3 days | Eliminate flash |
| **Phase 3** | Hover scrubbing + Polish | 3-4 days | Premium UX |

---

## 📋 **Phase 1: Critical Performance Fixes (P0)**
**Duration:** 3-4 days
**Goal:** Eliminate video loading, add image preloading, fix empty cards

### **Day 1: Video Thumbnail Generation**

#### **Task 1.1: Install Dependencies**
```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
npm install --save-dev @types/fluent-ffmpeg

# Or use system ffmpeg
brew install ffmpeg  # macOS
```

#### **Task 1.2: Update MediaSaverService**

**File:** `src/services/mediaSaver.ts`

**Add thumbnail generation:**
```typescript
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath);

class MediaSaverService {

  async saveMedia(request: SaveMediaRequest): Promise<SaveMediaResult> {
    // ... existing save logic ...

    if (request.mediaType === 'video') {
      const videoPath = await this.saveMediaFile(mediaBuffer, filename, 'video');

      // 🆕 Generate thumbnail
      const thumbnailPath = await this.generateVideoThumbnail(
        path.join(process.cwd(), 'public', videoPath),
        filename
      );

      metadata.thumbnailPath = thumbnailPath;
    }

    // ... rest of save logic ...
  }

  /**
   * Extract first frame as thumbnail
   */
  private async generateVideoThumbnail(
    videoPath: string,
    videoFilename: string
  ): Promise<string> {
    const thumbnailFilename = videoFilename.replace(/\.mp4$/, '-thumb.jpg');
    const thumbnailDir = path.join(process.cwd(), 'public/videos/thumbnails');
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    // Ensure directory exists
    await fs.mkdir(thumbnailDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:00.5'], // 0.5 seconds in (skip black frames)
          filename: thumbnailFilename,
          folder: thumbnailDir,
          size: '1920x?', // Maintain aspect ratio
        })
        .on('end', () => {
          console.log(`✅ Generated thumbnail: ${thumbnailFilename}`);
          resolve(`/videos/thumbnails/${thumbnailFilename}`);
        })
        .on('error', (err) => {
          console.error(`❌ Thumbnail generation failed:`, err);
          reject(err);
        });
    });
  }
}
```

#### **Task 1.3: Database Migration**

**File:** Create `scripts/add-thumbnail-column.ts`

```typescript
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'forge.db'));

// Add thumbnail_path column to videos table
db.exec(`
  ALTER TABLE videos ADD COLUMN thumbnail_path TEXT;
`);

console.log('✅ Added thumbnail_path column to videos table');
db.close();
```

**Run migration:**
```bash
npx tsx scripts/add-thumbnail-column.ts
```

#### **Task 1.4: Testing Checkpoint 1** ✅

**Test new videos:**
```bash
# Start dev server
npm run dev

# Generate a test video via API
curl -X POST http://localhost:4900/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test video thumbnail generation",
    "concept": "test-thumb"
  }'

# Verify thumbnail created
ls -la public/videos/thumbnails/
# Should see: test-thumb-*.jpg

# Check database
sqlite3 forge.db "SELECT filename, thumbnail_path FROM videos WHERE filename LIKE 'test-thumb%';"
# Should show thumbnail_path: /videos/thumbnails/test-thumb-*.jpg
```

**Expected Result:**
- ✅ Thumbnail JPG created in `public/videos/thumbnails/`
- ✅ Database has `thumbnail_path` populated
- ✅ Thumbnail is ~15-40KB (vs 1-2MB video)

---

### **Day 2: Update ImageCard to Use Thumbnails**

#### **Task 2.1: Replace Video Element with Image**

**File:** `src/components/ui/ImageCard.tsx`

**Find this section (lines 227-251):**
```tsx
{image.mediaType === 'video' ? (
  <>
    {/* OLD: Loading full video */}
    <video
      src={getVideoUrl(image)}
      className="absolute inset-0 w-full h-full object-cover"
      muted
      preload="metadata"
    />
```

**Replace with:**
```tsx
{image.mediaType === 'video' ? (
  <>
    {/* NEW: Static thumbnail image */}
    <Image
      src={
        image.metadata?.thumbnailPath as string ||
        `/videos/thumbnails/${image.filename.replace('.mp4', '-thumb.jpg')}`
      }
      alt={image.title}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover"
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
      onError={(e) => {
        // Fallback: Try to use video element if thumbnail missing
        console.warn(`Thumbnail missing for ${image.filename}, falling back to video`);
        const img = e.target as HTMLImageElement;
        const parent = img.parentElement;
        if (parent) {
          const videoElement = document.createElement('video');
          videoElement.src = getVideoUrl(image);
          videoElement.className = img.className;
          videoElement.muted = true;
          videoElement.preload = "metadata";
          img.replaceWith(videoElement);
        }
      }}
    />
```

#### **Task 2.2: Add Image Preloading for Gallery**

**File:** `src/components/ui/ImageCard.tsx`

**Update image rendering (lines 254-267):**
```tsx
{/* Regular image */}
<Image
  src={`/images/${image.filename}`}
  alt={image.title}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
  loading={delay < 0.12 ? 'eager' : 'lazy'}  // 🆕 Eager for first 6 cards
  priority={delay < 0.12}                     // 🆕 Priority for above-fold
  placeholder="blur"                          // 🆕 Blur while loading
  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==" // 🆕 Inline SVG placeholder
  onError={(e) => {
    const card = (e.target as HTMLImageElement).closest('.group');
    if (card) {
      (card as HTMLElement).style.display = 'none';
    }
  }}
/>
```

#### **Task 2.3: Testing Checkpoint 2** ✅

**Test gallery rendering:**
```bash
npm run dev

# Open browser to http://localhost:4900/[projectId]
# 1. Check Network tab - should see thumbnail JPGs instead of videos
# 2. Verify videos show play icon overlay
# 3. Click video card → modal opens with actual video
# 4. Check load time (should be <2 seconds for 50 videos)
```

**Expected Result:**
- ✅ Gallery shows video thumbnails (not loading videos)
- ✅ Network tab shows ~15KB JPGs instead of ~1MB videos
- ✅ Page loads 10-20x faster
- ✅ Video plays when clicking into modal

---

### **Day 3: Generate Thumbnails for Existing Videos**

#### **Task 3.1: Backfill Migration Script**

**File:** Create `scripts/generate-existing-thumbnails.ts`

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath);

const db = new Database(path.join(process.cwd(), 'forge.db'));

async function generateThumbnailForVideo(
  videoFilename: string,
  videoId: string
): Promise<string | null> {
  try {
    const videoPath = path.join(process.cwd(), 'public/videos/clips', videoFilename);

    // Check if video file exists
    try {
      await fs.access(videoPath);
    } catch {
      console.warn(`⚠️  Video file not found: ${videoFilename}`);
      return null;
    }

    const thumbnailFilename = videoFilename.replace(/\.mp4$/, '-thumb.jpg');
    const thumbnailDir = path.join(process.cwd(), 'public/videos/thumbnails');
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    // Ensure directory exists
    await fs.mkdir(thumbnailDir, { recursive: true });

    // Generate thumbnail
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:00.5'],
          filename: thumbnailFilename,
          folder: thumbnailDir,
          size: '1920x?',
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`✅ Generated thumbnail: ${thumbnailFilename}`);
    return `/videos/thumbnails/${thumbnailFilename}`;

  } catch (error) {
    console.error(`❌ Failed to generate thumbnail for ${videoFilename}:`, error);
    return null;
  }
}

async function main() {
  // Get all videos without thumbnails
  const videos = db.prepare(`
    SELECT id, filename, thumbnail_path
    FROM videos
    WHERE thumbnail_path IS NULL
    ORDER BY created_at DESC
  `).all() as Array<{ id: string; filename: string; thumbnail_path: string | null }>;

  console.log(`\n🎬 Found ${videos.length} videos without thumbnails\n`);

  let successCount = 0;
  let failCount = 0;

  for (const video of videos) {
    console.log(`Processing: ${video.filename}...`);

    const thumbnailPath = await generateThumbnailForVideo(video.filename, video.id);

    if (thumbnailPath) {
      // Update database
      db.prepare(`
        UPDATE videos
        SET thumbnail_path = ?
        WHERE id = ?
      `).run(thumbnailPath, video.id);

      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total: ${videos.length}\n`);

  db.close();
}

main().catch(console.error);
```

#### **Task 3.2: Run Migration**

```bash
# Generate thumbnails for all existing videos
npx tsx scripts/generate-existing-thumbnails.ts

# Verify thumbnails created
ls -la public/videos/thumbnails/ | wc -l

# Check database
sqlite3 forge.db "SELECT COUNT(*) FROM videos WHERE thumbnail_path IS NOT NULL;"
```

#### **Task 3.3: Testing Checkpoint 3** ✅

**Test with existing videos:**
```bash
# Refresh gallery page
# All video cards should now show thumbnails

# Check Network tab
# Should see NO video requests, only JPG thumbnails

# Measure performance
# Open DevTools → Performance
# Record page load
# Should complete in <2 seconds
```

**Expected Result:**
- ✅ All existing videos have thumbnails
- ✅ Gallery loads instantly (no video downloads)
- ✅ Network traffic reduced by 95%+

---

### **Day 4: Add Skeleton Loading States**

#### **Task 4.1: Create GallerySkeleton Component**

**File:** Create `src/components/ui/GallerySkeleton.tsx`

```tsx
'use client';

import React from 'react';

export const GallerySkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-12 gap-2 md:gap-4 w-full max-w-full">
      {/* Add Image Card Skeleton */}
      <div className="col-span-6 sm:col-span-4 md:col-span-3 xl:col-span-2">
        <div className="bg-accent/50 animate-pulse aspect-square rounded-lg" />
      </div>

      {/* Image Card Skeletons - Mixed aspect ratios */}
      {Array.from({ length: 11 }).map((_, i) => {
        // Simulate realistic grid with varied aspect ratios
        const aspectRatios = [
          'col-span-12 sm:col-span-8 md:col-span-6 xl:col-span-4', // Landscape
          'col-span-6 sm:col-span-6 md:col-span-4 xl:col-span-3',   // Square
          'col-span-6 sm:col-span-4 md:col-span-3 xl:col-span-2',   // Portrait
        ];
        const columnSpan = aspectRatios[i % 3];
        const aspectClass = i % 3 === 0 ? 'aspect-video' : i % 3 === 1 ? 'aspect-square' : 'aspect-[9/16]';

        return (
          <div key={i} className={columnSpan}>
            <div className={`bg-accent/50 animate-pulse ${aspectClass} rounded-lg`} />
          </div>
        );
      })}
    </div>
  );
};
```

#### **Task 4.2: Update Gallery Component**

**File:** `src/components/Gallery/Gallery.tsx`

**Replace hydration check (lines 62-73):**
```tsx
// Remove this section:
if (!isClient) {
  return (
    <section className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    </section>
  );
}
```

**Replace with:**
```tsx
import { GallerySkeleton } from '@/components/ui/GallerySkeleton';

// Show skeleton during hydration
if (!isClient) {
  return (
    <section className="w-full max-w-full overflow-x-hidden">
      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-4 md:py-8 max-w-full">
        <GallerySkeleton />
      </div>
    </section>
  );
}
```

**Also update loading state (lines 76-87):**
```tsx
if (isLoading) {
  return (
    <section className="w-full max-w-full overflow-x-hidden">
      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-4 md:py-8 max-w-full">
        <GallerySkeleton />
      </div>
    </section>
  );
}
```

#### **Task 4.3: Testing Checkpoint 4** ✅

**Test skeleton loading:**
```bash
# Open browser with Network tab throttled to "Fast 3G"
# Refresh gallery page

# Expected behavior:
# 1. Immediate skeleton display (no blank page)
# 2. Cards "pop in" as they load
# 3. No layout shift (skeleton matches final layout)
```

**Expected Result:**
- ✅ No blank/empty screen on refresh
- ✅ Skeleton shows realistic card layout
- ✅ Smooth transition to loaded state
- ✅ Zero Cumulative Layout Shift (CLS)

---

### **Phase 1 Complete! 🎉**

**Checkpoint: Verify Full Impact**
```bash
# Before Phase 1:
# - Gallery with 50 videos: 25-50 MB, 10-15 seconds
# - Empty cards flash on refresh
# - Video files loading in Network tab

# After Phase 1:
# - Gallery with 50 videos: <1 MB, <2 seconds
# - Skeleton → smooth card loading
# - Only JPG thumbnails in Network tab
```

**Success Metrics:**
- ✅ 95%+ reduction in initial page weight
- ✅ 80%+ reduction in load time
- ✅ Zero empty card flash
- ✅ All videos show instant thumbnails

---

## 📋 **Phase 2: Lazy Loading & Performance (P1)**
**Duration:** 2-3 days
**Goal:** Only load visible cards, eliminate off-screen rendering

### **Day 5: Implement Intersection Observer**

#### **Task 5.1: Create LazyImageCard Wrapper**

**File:** Create `src/components/ui/LazyImageCard.tsx`

```tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ImageCard } from './ImageCard';
import { ImageData } from '@/contexts/ImageContext';
import { getAspectRatioClass } from '@/utils/aspectRatioUtils';

interface LazyImageCardProps {
  image: ImageData;
  className?: string;
  delay?: number;
}

export const LazyImageCard: React.FC<LazyImageCardProps> = ({
  image,
  className,
  delay
}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsInView(true);
            setHasLoaded(true);
            // Once loaded, stop observing
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '400px', // Load 400px before scrolling into view
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded]);

  const aspectRatioClass = getAspectRatioClass(image);

  return (
    <div ref={cardRef} className={className}>
      {isInView ? (
        <ImageCard image={image} delay={delay} className="w-full" />
      ) : (
        // Placeholder with correct aspect ratio
        <div className={`bg-accent/30 animate-pulse rounded-lg border border-border ${aspectRatioClass}`}>
          {/* Optional: Show media type indicator */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            {image.mediaType === 'video' ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

#### **Task 5.2: Update Gallery to Use LazyImageCard**

**File:** `src/components/Gallery/Gallery.tsx`

**Find the card rendering section (lines 129-140):**
```tsx
{galleryImages.map((image, index) => {
  const columnSpan = getGalleryColumnSpan(image);

  return (
    <ImageCard
      key={image.id}
      image={image}
      delay={(index + 1) * 0.02}
      className={`w-full ${columnSpan}`}
    />
  );
})}
```

**Replace with:**
```tsx
import { LazyImageCard } from '@/components/ui/LazyImageCard';

{galleryImages.map((image, index) => {
  const columnSpan = getGalleryColumnSpan(image);

  return (
    <LazyImageCard
      key={image.id}
      image={image}
      delay={(index + 1) * 0.02}
      className={`w-full ${columnSpan}`}
    />
  );
})}
```

#### **Task 5.3: Testing Checkpoint 5** ✅

**Test lazy loading:**
```bash
# Open DevTools → Network tab
# Load gallery page with 100+ videos
# Scroll slowly through gallery

# Expected behavior:
# 1. Initial load: Only ~12-15 cards load
# 2. Scroll down: Cards load 400px before visible
# 3. Network requests happen on-demand
# 4. Smooth scrolling (no jank)
```

**Expected Result:**
- ✅ Initial load: Only visible cards
- ✅ Scroll: Progressive loading
- ✅ 100 videos: <500KB initial load (vs 100MB without lazy loading)
- ✅ Smooth 60fps scrolling

---

### **Day 6-7: Timeline & Hidden Section Updates**

#### **Task 6.1: Update Timeline Component**

**File:** `src/components/Timeline/Timeline.tsx`

**Timeline already uses horizontal scroll, but add lazy loading for off-screen cards:**

```tsx
import { LazyImageCard } from '@/components/ui/LazyImageCard';

// In the Timeline render (lines 179-196):
{timelineImages.map((image) => {
  const widthClasses = getTimelineWidthClasses(image);

  return (
    <motion.div
      key={image.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-shrink-0 h-full"
    >
      <LazyImageCard  // 🆕 Use lazy loading
        image={image}
        className={widthClasses}
      />
    </motion.div>
  );
})}
```

#### **Task 6.2: Update Hidden Component**

**File:** `src/components/Hidden/Hidden.tsx`

**Check if it uses the same Gallery component or has its own rendering:**

```bash
# Check Hidden component implementation
cat src/components/Hidden/Hidden.tsx | head -50
```

**If it has custom rendering, apply same optimizations:**
- Use `LazyImageCard` instead of `ImageCard`
- Add `GallerySkeleton` for loading state
- Ensure video thumbnails are used

#### **Task 6.3: Testing Checkpoint 6** ✅

**Test Timeline:**
```bash
# Add 50+ items to timeline
# Scroll horizontally through timeline
# Verify cards load progressively
```

**Test Hidden:**
```bash
# Hide 20+ items
# Navigate to /[projectId]/hidden
# Verify lazy loading works
# Verify video thumbnails display
```

**Expected Result:**
- ✅ Timeline: Smooth horizontal scroll
- ✅ Hidden: Same performance as gallery
- ✅ Consistent behavior across all views

---

### **Phase 2 Complete! 🎉**

**Checkpoint: Verify Lazy Loading Impact**
```bash
# Gallery with 100 videos:
# Before: 50-100 MB initial load
# After: <500 KB initial load (only visible cards)

# Scroll performance:
# Before: Janky (loading videos on scroll)
# After: Smooth 60fps
```

---

## 📋 **Phase 3: Premium UX Features (P1)**
**Duration:** 3-4 days
**Goal:** Hover scrubbing, polished animations, edge cases

### **Day 8-9: Hover Scrubbing Implementation**

#### **Task 8.1: Generate Timeline Thumbnails**

**File:** Update `src/services/mediaSaver.ts`

```typescript
/**
 * Generate timeline thumbnails for hover scrubbing
 */
private async generateTimelineThumbnails(
  videoPath: string,
  videoFilename: string,
  frameCount: number = 10
): Promise<string[]> {
  const baseName = videoFilename.replace(/\.mp4$/, '');
  const thumbnailDir = path.join(process.cwd(), 'public/videos/thumbnails', baseName);

  await fs.mkdir(thumbnailDir, { recursive: true });

  const thumbnailPaths: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const timestamp = (i / (frameCount - 1)) * 100; // 0%, 10%, 20%, ..., 100%
    const thumbnailFilename = `${baseName}-${i.toString().padStart(2, '0')}.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [`${timestamp}%`],
          filename: thumbnailFilename,
          folder: thumbnailDir,
          size: '640x?', // Smaller for hover previews
        })
        .on('end', resolve)
        .on('error', reject);
    });

    thumbnailPaths.push(`/videos/thumbnails/${baseName}/${thumbnailFilename}`);
  }

  return thumbnailPaths;
}

// Update saveMedia to generate timeline thumbnails
async saveMedia(request: SaveMediaRequest): Promise<SaveMediaResult> {
  if (request.mediaType === 'video') {
    const videoPath = path.join(process.cwd(), 'public', ...);

    // Generate main thumbnail
    const thumbnailPath = await this.generateVideoThumbnail(videoPath, filename);

    // Generate timeline thumbnails for hover scrubbing
    const timelineThumbnails = await this.generateTimelineThumbnails(videoPath, filename);

    metadata.thumbnailPath = thumbnailPath;
    metadata.timelineThumbnails = JSON.stringify(timelineThumbnails);
  }
}
```

#### **Task 8.2: Database Migration for Timeline Thumbnails**

```bash
# Add timeline_thumbnails column
sqlite3 forge.db "ALTER TABLE videos ADD COLUMN timeline_thumbnails TEXT;"
```

#### **Task 8.3: Create Scrubber Component**

**File:** Create `src/components/ui/VideoThumbnailScrubber.tsx`

```tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface VideoThumbnailScrubberProps {
  thumbnails: string[];
  videoTitle: string;
  aspectRatioClass: string;
  onClick: () => void;
}

export const VideoThumbnailScrubber: React.FC<VideoThumbnailScrubberProps> = ({
  thumbnails,
  videoTitle,
  aspectRatioClass,
  onClick
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || thumbnails.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const frameIndex = Math.floor(percentage * thumbnails.length);

    setCurrentFrame(Math.max(0, Math.min(frameIndex, thumbnails.length - 1)));
  }, [thumbnails.length]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-accent overflow-hidden cursor-pointer w-full ${aspectRatioClass}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setCurrentFrame(0);
      }}
    >
      {/* Layered thumbnails - toggle visibility based on hover position */}
      {thumbnails.map((thumbnail, index) => (
        <Image
          key={thumbnail}
          src={thumbnail}
          alt={`${videoTitle} - ${Math.round((index / (thumbnails.length - 1)) * 100)}%`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw, 33vw"
          className={`object-cover transition-opacity duration-100 ${
            index === currentFrame ? 'opacity-100' : 'opacity-0'
          }`}
          loading={index === 0 ? 'eager' : 'lazy'}
          priority={index === 0}
        />
      ))}

      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className={`bg-black rounded-full p-3 md:p-4 transition-all duration-200 shadow-lg ${
          isHovering ? 'bg-opacity-90 scale-110' : 'bg-opacity-70'
        }`}>
          <svg className="w-4 h-4 md:w-6 md:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>

      {/* Scrubbing progress indicator */}
      {isHovering && thumbnails.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-40 z-20">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${((currentFrame + 1) / thumbnails.length) * 100}%` }}
          />
        </div>
      )}

      {/* Timestamp indicator */}
      {isHovering && thumbnails.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded z-20">
          {Math.round((currentFrame / (thumbnails.length - 1)) * 100)}%
        </div>
      )}
    </div>
  );
};
```

#### **Task 8.4: Update ImageCard to Use Scrubber**

**File:** `src/components/ui/ImageCard.tsx`

```tsx
import { VideoThumbnailScrubber } from './VideoThumbnailScrubber';

// In render section (lines 227+):
{image.mediaType === 'video' ? (
  image.metadata?.timelineThumbnails ? (
    // Hover scrubbing enabled
    <VideoThumbnailScrubber
      thumbnails={JSON.parse(image.metadata.timelineThumbnails as string)}
      videoTitle={image.title}
      aspectRatioClass={aspectRatioClass}
      onClick={handleImageClick}
    />
  ) : (
    // Fallback: Single thumbnail (existing code)
    <>
      <Image src={image.metadata?.thumbnailPath || ...} />
      {/* Play icon overlay */}
    </>
  )
) : (
  <Image src={`/images/${image.filename}`} />
)}
```

#### **Task 8.5: Testing Checkpoint 7** ✅

**Test hover scrubbing:**
```bash
# Generate new video with timeline thumbnails
curl -X POST http://localhost:4900/api/framepack ...

# Verify thumbnails created
ls -la public/videos/thumbnails/[video-name]/
# Should see: 00.jpg, 01.jpg, 02.jpg, ..., 09.jpg

# Test in browser:
# 1. Hover over video card
# 2. Move mouse left → see beginning
# 3. Move mouse right → see end
# 4. Smooth scrubbing animation
```

**Expected Result:**
- ✅ Smooth frame transitions on hover
- ✅ Progress indicator shows position
- ✅ Timestamp shows percentage
- ✅ Play icon scales on hover

---

### **Day 10: Migration Script for Timeline Thumbnails**

**File:** Create `scripts/generate-timeline-thumbnails.ts`

```typescript
// Similar to generate-existing-thumbnails.ts
// But generates 10 frames instead of 1
// Updates timeline_thumbnails column

async function generateTimelineThumbnails(videoFilename: string): Promise<string[]> {
  // ... implementation ...
  // Generate 10 thumbnails at 0%, 10%, 20%, ..., 90%, 100%
  // Return array of paths
}

// Optional: Only run for recently created videos or high-value content
const videos = db.prepare(`
  SELECT id, filename
  FROM videos
  WHERE timeline_thumbnails IS NULL
  AND created_at > date('now', '-30 days')
  ORDER BY created_at DESC
  LIMIT 50
`).all();
```

**Note:** Timeline thumbnails are optional - single thumbnail is sufficient for most use cases

---

### **Day 11: Polish & Edge Cases**

#### **Task 11.1: Handle Missing Dimensions**

**File:** `src/utils/aspectRatioUtils.ts`

**Improve dimension extraction (lines 82-164):**

```typescript
function extractDimensions(media: ImageData): { width: number; height: number } | null {
  // Priority 1: Direct properties (FAST PATH - 99% of cases)
  if (media.width && media.height) {
    return { width: media.width, height: media.height };
  }

  // If missing, log warning and use fallback
  console.warn(`⚠️ Missing dimensions for ${media.filename}, using fallback`);

  // SLOW PATH: Try to extract from metadata (only if DB missing)
  return extractDimensionsFromMetadata(media);
}

// Separate slow path to avoid waterfall on every render
function extractDimensionsFromMetadata(media: ImageData) {
  // ... existing 8-level priority logic ...
}
```

#### **Task 11.2: Add Error Boundaries**

**File:** Create `src/components/ui/GalleryErrorBoundary.tsx`

```tsx
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GalleryErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Gallery error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-sm text-red-500 mb-2">Failed to load gallery</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-500 hover:underline"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap Gallery:**
```tsx
// src/app/[projectId]/page.tsx
import { GalleryErrorBoundary } from '@/components/ui/GalleryErrorBoundary';

export default function ProjectPage() {
  return (
    <main className="min-h-screen bg-background">
      <GalleryErrorBoundary>
        <Gallery />
      </GalleryErrorBoundary>
    </main>
  );
}
```

#### **Task 11.3: Optimize Blur Placeholders**

**File:** Create `src/utils/blurDataURL.ts`

```typescript
/**
 * Generate tiny blur placeholder for images
 */
export function generateBlurDataURL(width = 10, height = 10): string {
  // Create a tiny 10x10 gray square as placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Generate blur placeholder with gradient
 */
export function generateGradientBlurDataURL(): string {
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#grad)"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
```

**Use in ImageCard:**
```tsx
import { generateGradientBlurDataURL } from '@/utils/blurDataURL';

<Image
  blurDataURL={generateGradientBlurDataURL()}
  placeholder="blur"
  ...
/>
```

#### **Task 11.4: Testing Checkpoint 8** ✅

**Comprehensive testing:**
```bash
# Test all scenarios:
# 1. Gallery with 100+ mixed images/videos
# 2. Timeline with 50+ items
# 3. Hidden section with 20+ items
# 4. Slow 3G network simulation
# 5. Mobile viewport (375px width)
# 6. Large viewport (4K resolution)

# Measure metrics:
# - Initial load time
# - Time to interactive
# - Cumulative Layout Shift
# - Largest Contentful Paint
# - Network traffic
```

**Expected Results:**
- ✅ Load time: <1 second (any gallery size)
- ✅ CLS: <0.1 (no layout shift)
- ✅ LCP: <1.5 seconds
- ✅ Network: <500KB initial (lazy loading working)
- ✅ Smooth 60fps scrolling

---

### **Phase 3 Complete! 🎉**

**Final Verification:**
```bash
# Compare Before vs After:

# BEFORE ALL PHASES:
# - 50 videos: 25-50 MB, 10-15 seconds load
# - Empty cards flash on refresh
# - Janky scrolling
# - Mobile unusable

# AFTER ALL PHASES:
# - 50 videos: <500 KB, <1 second load
# - Skeleton → smooth card loading
# - Smooth 60fps scrolling
# - Hover scrubbing on videos
# - Mobile lightning-fast
```

---

## 📊 **Success Metrics Summary**

| Metric | Before | After Phase 1 | After Phase 3 | Improvement |
|--------|--------|---------------|---------------|-------------|
| **Initial Load (50 videos)** | 25-50 MB | <1 MB | <500 KB | **99% reduction** |
| **Time to Interactive** | 10-15s | <2s | <1s | **93% faster** |
| **First Contentful Paint** | 3-5s | <1s | <0.5s | **90% faster** |
| **Cumulative Layout Shift** | High | Low | Near-zero | **100% improvement** |
| **Scroll Performance** | Janky | Smooth | Butter | **60fps locked** |
| **Mobile Experience** | 💀 Broken | ✅ Good | ✅✅ Excellent | **Infinite improvement** |

---

## 🎯 **Testing Strategy**

### **Incremental Testing (Test After Each Phase)**

**Phase 1 Checkpoint:**
```bash
✅ Video thumbnails generated
✅ Gallery loads <2 seconds
✅ No video requests in Network tab
✅ Skeleton loading works
```

**Phase 2 Checkpoint:**
```bash
✅ Lazy loading active (only visible cards)
✅ Smooth scrolling with 100+ cards
✅ Timeline horizontal scroll smooth
✅ Hidden section matches gallery performance
```

**Phase 3 Checkpoint:**
```bash
✅ Hover scrubbing works on videos
✅ Timeline thumbnails generated
✅ Error boundaries catch failures
✅ All edge cases handled
```

### **Final Integration Test**

**Test Scenario: Real-World Usage**
1. Open gallery with 100 videos
2. Scroll through entire gallery
3. Add 10 items to timeline
4. Hide 5 items
5. Navigate between sections
6. Generate new video
7. Verify new video has thumbnails + scrubbing

**Performance Budget:**
- Initial load: <1 second ✅
- Scroll: 60fps ✅
- New video: Thumbnails generated within 5 seconds ✅

---

## 🚀 **Ready to Start?**

**Recommended Approach:**
1. **Start with Phase 1** (highest impact, lowest risk)
2. **Test thoroughly after each day**
3. **Commit working code daily**
4. **Move to Phase 2 only after Phase 1 is stable**
5. **Phase 3 is optional but highly recommended**

**First Command to Run:**
```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
npm install --save-dev @types/fluent-ffmpeg
```

**Then proceed with Day 1, Task 1.2** (Update MediaSaverService)

Let me know when you're ready to start and I'll guide you through each step! 🚀
