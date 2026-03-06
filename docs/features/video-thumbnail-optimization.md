# Video Thumbnail Optimization Strategy

**Date:** October 6, 2025
**Status:** 🔴 **CRITICAL PERFORMANCE ISSUE**
**Priority:** P0 - Immediate Implementation Required

---

## 🚨 Current Problem

### **Issue: Loading Full Videos for Thumbnails**

**Location:** `src/components/ui/ImageCard.tsx:230-242`

```tsx
{image.mediaType === 'video' ? (
  <video
    src={getVideoUrl(image)}  // ❌ LOADS ENTIRE VIDEO
    className="absolute inset-0 w-full h-full object-cover"
    muted
    preload="metadata"  // ❌ Still downloads ~500KB-2MB per video
    onError={...}
  />
) : (
  <Image src={`/images/${image.filename}`} />  // ✅ Optimized
)}
```

### **Performance Impact**

**Scenario:** Gallery with 50 videos

| Metric | Current (Loading Videos) | With Thumbnails |
|--------|------------------------|-----------------|
| **Initial Page Load** | 25-100 MB | 500 KB - 2 MB |
| **Time to Interactive** | 5-15 seconds | 0.5-1.5 seconds |
| **Network Requests** | 50 videos × ~500KB-2MB | 50 images × ~10-40KB |
| **Mobile Data Usage** | 📱 💀 Unusable | 📱 ✅ Fast |
| **Scroll Performance** | Janky (loading videos on scroll) | Smooth (lazy-loaded images) |

**Example:**
- Video file: `kling-video-2025-09-24.mp4` = **1.2 MB**
- Thumbnail: `kling-video-2025-09-24-thumb.jpg` = **15 KB**
- **Savings: 98.75% reduction per video**

### **Why `preload="metadata"` Isn't Enough**

```tsx
<video preload="metadata" />
```

**What it actually loads:**
- ❌ First 100-500KB of video (to get dimensions, duration)
- ❌ Full header/metadata
- ❌ First GOP (Group of Pictures) for thumbnail

**For 50 videos:** Still 25-50 MB of unnecessary data

---

## ✅ Proposed Solution: Multi-Tier Thumbnail System

### **Architecture Overview**

```
Video Generation → Thumbnail Extraction → Storage → Display
     ↓                    ↓                  ↓          ↓
  video.mp4      → 3 thumbnails saved → Database → Lazy Load
  (1.2 MB)         (15KB each)         metadata     on scroll
```

---

## 📸 **Phase 1: Single Frame Thumbnail**

### **1.1 Generate Thumbnail on Video Save**

**When:** Video is saved via `MediaSaverService`

**Implementation:** Add to `src/services/mediaSaver.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async saveMedia(request: SaveMediaRequest): Promise<SaveMediaResult> {
  // ... existing video save logic ...

  if (request.mediaType === 'video') {
    // Save video file
    const videoPath = await this.saveMediaFile(mediaBuffer, filename, 'video');

    // Generate thumbnail from first frame
    const thumbnailPath = await this.generateVideoThumbnail(videoPath, filename);

    // Update metadata with thumbnail path
    metadata.thumbnailPath = thumbnailPath;
  }

  return { success: true, filePath, metadata };
}

/**
 * Extract first frame as thumbnail using ffmpeg
 */
private async generateVideoThumbnail(
  videoPath: string,
  videoFilename: string
): Promise<string> {
  const thumbnailFilename = videoFilename.replace(/\.mp4$/, '-thumb.jpg');
  const thumbnailPath = path.join('public/videos/thumbnails', thumbnailFilename);

  // Ensure thumbnails directory exists
  await fs.mkdir(path.join('public/videos/thumbnails'), { recursive: true });

  // Extract first frame at 0.5 seconds (skip black intro frames)
  const command = `ffmpeg -i "${videoPath}" -ss 00:00:00.5 -vframes 1 -q:v 2 "${thumbnailPath}"`;

  try {
    await execAsync(command);
    console.log(`✅ Generated thumbnail: ${thumbnailFilename}`);
    return `/videos/thumbnails/${thumbnailFilename}`;
  } catch (error) {
    console.error(`❌ Failed to generate thumbnail for ${videoFilename}:`, error);
    // Fallback: return video path (browser will use video poster)
    return videoPath;
  }
}
```

**Database Schema Update:**

```sql
-- Add thumbnail_path column to videos table
ALTER TABLE videos ADD COLUMN thumbnail_path TEXT;

-- Update existing videos (manual migration)
UPDATE videos SET thumbnail_path = REPLACE(filename, '.mp4', '-thumb.jpg');
```

### **1.2 Update ImageCard to Use Thumbnail**

**Location:** `src/components/ui/ImageCard.tsx`

```tsx
{image.mediaType === 'video' ? (
  <>
    {/* Static thumbnail image - MUCH faster */}
    <Image
      src={image.metadata?.thumbnailPath || `/videos/thumbnails/${image.filename.replace('.mp4', '-thumb.jpg')}`}
      alt={image.title}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover"
      loading="lazy"  // ✅ Lazy load on scroll
      placeholder="blur"  // ✅ Blur while loading
      blurDataURL={generateBlurDataURL()}  // ✅ Inline SVG placeholder
      onError={(e) => {
        // Fallback to video element if thumbnail missing
        const img = e.target as HTMLImageElement;
        const videoElement = document.createElement('video');
        videoElement.src = getVideoUrl(image);
        videoElement.className = img.className;
        videoElement.muted = true;
        videoElement.preload = "metadata";
        img.replaceWith(videoElement);
      }}
    />

    {/* Play icon overlay */}
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="bg-black bg-opacity-70 rounded-full p-4 group-hover:bg-opacity-90 transition-all duration-200 shadow-lg">
        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    </div>
  </>
) : (
  <Image src={`/images/${image.filename}`} ... />
)}
```

---

## 🎬 **Phase 2: Hover Scrubbing (Timeline Preview)**

### **2.1 Generate Multiple Thumbnails**

**Extract 5-10 frames from video timeline:**

```typescript
/**
 * Generate timeline scrubbing thumbnails
 * Extracts frames at 10%, 20%, 30%... of video duration
 */
private async generateTimelineThumbnails(
  videoPath: string,
  videoFilename: string,
  frameCount: number = 10
): Promise<string[]> {
  const baseName = videoFilename.replace(/\.mp4$/, '');
  const thumbnailDir = path.join('public/videos/thumbnails', baseName);

  // Create directory for this video's thumbnails
  await fs.mkdir(thumbnailDir, { recursive: true });

  const thumbnailPaths: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const percentage = (i / (frameCount - 1)) * 100;
    const thumbnailFilename = `${baseName}-${i.toString().padStart(2, '0')}.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    // Extract frame at specific percentage of duration
    const command = `ffmpeg -i "${videoPath}" -vf "select='between(t,0,100)*gte(t,${percentage})',scale=320:-1" -vframes 1 -q:v 3 "${thumbnailPath}"`;

    try {
      await execAsync(command);
      thumbnailPaths.push(`/videos/thumbnails/${baseName}/${thumbnailFilename}`);
    } catch (error) {
      console.error(`Failed to generate timeline thumbnail ${i}:`, error);
    }
  }

  return thumbnailPaths;
}
```

**Database Schema:**

```sql
-- Store timeline thumbnails as JSON array
ALTER TABLE videos ADD COLUMN timeline_thumbnails TEXT; -- JSON array of paths

-- Example data:
-- timeline_thumbnails: '["path/00.jpg", "path/01.jpg", ..., "path/09.jpg"]'
```

### **2.2 Hover Scrubbing Component**

**New Component:** `src/components/ui/VideoThumbnailScrubber.tsx`

```tsx
'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface VideoThumbnailScrubberProps {
  thumbnails: string[]; // Array of thumbnail paths
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || thumbnails.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const frameIndex = Math.floor(percentage * thumbnails.length);

    setCurrentFrame(Math.max(0, Math.min(frameIndex, thumbnails.length - 1)));
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setCurrentFrame(0); // Reset to first frame
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-accent overflow-hidden cursor-pointer w-full ${aspectRatioClass}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Show all thumbnails layered, toggle opacity based on currentFrame */}
      {thumbnails.map((thumbnail, index) => (
        <Image
          key={thumbnail}
          src={thumbnail}
          alt={`${videoTitle} - Frame ${index + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw, 33vw"
          className={`object-cover transition-opacity duration-75 ${
            index === currentFrame ? 'opacity-100' : 'opacity-0'
          }`}
          loading={index === 0 ? 'eager' : 'lazy'} // Only load first frame initially
          priority={index === 0}
        />
      ))}

      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="bg-black bg-opacity-70 rounded-full p-4 hover:bg-opacity-90 transition-all duration-200 shadow-lg">
          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>

      {/* Scrubbing progress indicator */}
      {isHovering && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-30 z-20">
          <div
            className="h-full bg-white transition-all duration-75"
            style={{ width: `${((currentFrame + 1) / thumbnails.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
```

**Update ImageCard.tsx:**

```tsx
import { VideoThumbnailScrubber } from './VideoThumbnailScrubber';

{image.mediaType === 'video' ? (
  image.metadata?.timeline_thumbnails ? (
    // Hover scrubbing enabled
    <VideoThumbnailScrubber
      thumbnails={JSON.parse(image.metadata.timeline_thumbnails as string)}
      videoTitle={image.title}
      aspectRatioClass={aspectRatioClass}
      onClick={handleImageClick}
    />
  ) : (
    // Fallback: Single thumbnail
    <Image src={image.metadata?.thumbnailPath || ...} />
  )
) : (
  <Image src={`/images/${image.filename}`} />
)}
```

---

## 🚀 **Phase 3: Lazy Loading + Intersection Observer**

### **3.1 Only Load Visible Videos**

**Implementation:** `src/components/ui/LazyImageCard.tsx`

```tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ImageCard } from './ImageCard';

interface LazyImageCardProps {
  image: ImageData;
  className?: string;
  delay?: number;
}

export const LazyImageCard: React.FC<LazyImageCardProps> = ({ image, className, delay }) => {
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Once loaded, stop observing
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Load 200px before scrolling into view
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className={className}>
      {isInView ? (
        <ImageCard image={image} delay={delay} />
      ) : (
        // Placeholder with correct aspect ratio
        <div className={`bg-accent animate-pulse ${getAspectRatioClass(image)}`} />
      )}
    </div>
  );
};
```

**Update Gallery.tsx:**

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

---

## 📊 **Performance Comparison**

### **Before: Loading Full Videos**

| Gallery Size | Initial Load | Network Traffic | Time to Interactive |
|-------------|--------------|-----------------|-------------------|
| 10 videos | 5-10 MB | 10 video requests | 3-5 seconds |
| 50 videos | 25-50 MB | 50 video requests | 10-15 seconds |
| 100 videos | 50-100 MB | 100 video requests | 15-30 seconds |

**Mobile Experience:** 📱 💀 **Unusable** (burns data, slow, crashes)

### **After: Static Thumbnails + Lazy Loading**

| Gallery Size | Initial Load | Network Traffic | Time to Interactive |
|-------------|--------------|-----------------|-------------------|
| 10 videos | 150 KB | 10 thumbnail requests | 0.5-1 second |
| 50 videos | 750 KB | 50 thumbnail requests | 1-2 seconds |
| 100 videos | 1.5 MB | Only visible thumbnails loaded | 1.5-2.5 seconds |

**Mobile Experience:** 📱 ✅ **Fast & Smooth**

---

## 🛠️ **Implementation Plan**

### **Week 1: Phase 1 - Single Thumbnails (P0 - Critical)**

**Day 1-2: Thumbnail Generation**
- [ ] Add `ffmpeg` to dependencies (or use `fluent-ffmpeg` package)
- [ ] Update `MediaSaverService` to generate first-frame thumbnail
- [ ] Save thumbnail path to database (`thumbnail_path` column)

**Day 3: ImageCard Update**
- [ ] Replace `<video>` with `<Image>` for thumbnails
- [ ] Add fallback for missing thumbnails
- [ ] Test with existing videos

**Day 4-5: Migration Script**
- [ ] Create script to generate thumbnails for existing videos
- [ ] Update database with thumbnail paths
- [ ] Verify all videos have thumbnails

**Deliverables:**
- ✅ All video cards show static thumbnails
- ✅ 95%+ performance improvement
- ✅ Gallery loads in <2 seconds

---

### **Week 2: Phase 2 - Hover Scrubbing (P1 - Enhancement)**

**Day 1-2: Timeline Thumbnail Generation**
- [ ] Update thumbnail generator to create 10 frames
- [ ] Store timeline_thumbnails JSON in database
- [ ] Generate for new videos automatically

**Day 3-4: Scrubber Component**
- [ ] Build `VideoThumbnailScrubber` component
- [ ] Add mouse tracking for frame selection
- [ ] Implement smooth transitions

**Day 5: Polish & Testing**
- [ ] Add progress indicator
- [ ] Optimize thumbnail preloading
- [ ] Test on mobile devices

**Deliverables:**
- ✅ Hover over video = see timeline preview
- ✅ Smooth scrubbing experience
- ✅ Only loads visible thumbnails

---

### **Week 3: Phase 3 - Lazy Loading (P1 - Performance)**

**Day 1-2: Intersection Observer**
- [ ] Create `LazyImageCard` wrapper
- [ ] Implement viewport detection
- [ ] Add placeholder skeletons

**Day 3: Gallery Integration**
- [ ] Replace `ImageCard` with `LazyImageCard` in Gallery
- [ ] Add skeleton placeholders
- [ ] Configure load-ahead distance (200px)

**Day 4-5: Optimization & Testing**
- [ ] Test with 100+ videos
- [ ] Measure scroll performance
- [ ] Optimize thumbnail file sizes

**Deliverables:**
- ✅ Only visible cards loaded initially
- ✅ Smooth infinite scroll
- ✅ Minimal initial page weight

---

## 🎯 **Success Metrics**

### **Performance Targets**

| Metric | Current | Target (Phase 1) | Target (Phase 3) |
|--------|---------|------------------|------------------|
| Initial Page Load (50 videos) | 25-50 MB | <1 MB | <500 KB |
| Time to Interactive | 10-15s | <2s | <1s |
| Largest Contentful Paint | 5-8s | <1.5s | <1s |
| Cumulative Layout Shift | High (videos loading) | Low | Near-zero |
| Mobile Data Usage | 💀 | ✅ | ✅✅ |

### **User Experience Improvements**

- ✅ **Instant gallery display** (no waiting for videos to load)
- ✅ **Smooth scrolling** (no jank from lazy video loads)
- ✅ **Hover preview** (scrub through video timeline)
- ✅ **Mobile-friendly** (minimal data usage)
- ✅ **Better perceived performance** (thumbnails load fast)

---

## 💡 **Future Enhancements**

### **Phase 4: Advanced Optimizations (Optional)**

1. **WebP/AVIF Thumbnails** - Even smaller file sizes (50% reduction)
2. **Progressive JPEGs** - Show low-res preview instantly
3. **Thumbnail CDN** - Serve from edge locations
4. **Lazy Thumbnail Generation** - Generate on-demand for old videos
5. **Video Sprites** - Single image with all frames (like YouTube)
6. **Motion Thumbnails** - Animated WebP/GIF for 3-second preview

---

## 🔧 **Dependencies**

### **Required Packages**

```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
npm install --save-dev @types/fluent-ffmpeg
```

### **Alternative: Use ffmpeg Binary Directly**

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
apt-get install ffmpeg

# Windows
choco install ffmpeg
```

---

## 📝 **Database Migration Script**

```sql
-- Add thumbnail columns
ALTER TABLE videos ADD COLUMN thumbnail_path TEXT;
ALTER TABLE videos ADD COLUMN timeline_thumbnails TEXT; -- JSON array

-- Create index for fast thumbnail lookups
CREATE INDEX idx_videos_thumbnail ON videos(thumbnail_path);

-- Backfill thumbnails for existing videos (run migration script)
-- UPDATE videos SET thumbnail_path = '/videos/thumbnails/' || REPLACE(filename, '.mp4', '-thumb.jpg');
```

---

## ✅ **Ready to Implement?**

**Phase 1 (Single Thumbnails) is the highest priority** - it will deliver 95% of the performance improvement with minimal effort.

**Recommended approach:**
1. Start with Phase 1 (single thumbnails)
2. Test with production data
3. Measure performance gains
4. Add Phase 2 (hover scrubbing) if users find it valuable
5. Add Phase 3 (lazy loading) for galleries with 50+ videos

**This will transform the gallery from unusable to lightning-fast! 🚀**
