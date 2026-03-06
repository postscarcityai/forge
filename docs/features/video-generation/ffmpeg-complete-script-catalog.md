# Complete FFmpeg Script Catalog - Forge Video Generation Toolkit

## 🎯 **Overview**

This document outlines a complete professional video generation toolkit using FFmpeg scripts. Each script can handle **one or many images** and includes detailed usage instructions.

---

## 📂 **Directory Structure**

```
scripts/ffmpeg/
├── slideshow/           # Image slideshow generators
├── transitions/         # Advanced transition effects  
├── motion/             # Movement and animation effects
├── atmosphere/         # Atmospheric and mood effects
├── composite/          # Multi-layer composition effects
├── text/               # Text overlay and typography
├── color/              # Color grading and treatment
├── batch/              # Complex multi-step workflows
└── utils/              # Shared utilities and configs
```

---

## 🎞️ **SLIDESHOW SCRIPTS**

### ✅ `slideshow-ken-burns-advanced.sh` (EXISTING)
**Description:** Professional slideshow with advanced Ken Burns effects and directional slide transitions  
**Input:** 1-18 images  
**Output:** 16:9 (1920x1080), ~22 seconds  
**Features:**
- Individual Ken Burns preprocessing for each image
- Multiple transition types: slide left/right/up/down
- 1.2 seconds per image, 0.2s transitions
- Mathematical zoom progression

**README:**
```bash
# Usage: ./slideshow-ken-burns-advanced.sh
# Edit image paths in script before running
# Generates: forge-slideshow-YYYYMMDD-HHMMSS.mp4
# Tempo: 122 BPM (music-sync compatible)
```

### ✅ `slideshow-ken-burns-simple.sh` (EXISTING)
**Description:** Basic slideshow with gentle Ken Burns movement  
**Input:** 1-18 images  
**Output:** 16:9 (1920x1080), ~27 seconds  
**Features:**
- Gentle zoom effects (1.02x max)
- Simple fade transitions
- Consistent timing across all images

**README:**
```bash
# Usage: ./slideshow-ken-burns-simple.sh
# Lighter Ken Burns effect for subtle movement
# Good for professional presentations
```

### ✅ `slideshow-portrait-mobile.sh` (EXISTING)
**Description:** Mobile-optimized vertical slideshow  
**Input:** 1-18 images  
**Output:** 9:16 (1080x1920)  
**Features:**
- Portrait orientation for social media
- Quick fade transitions (0.2s)
- Mobile-first design

**README:**
```bash
# Usage: ./slideshow-portrait-mobile.sh
# Perfect for Instagram Stories, TikTok, YouTube Shorts
# Vertical format optimized for mobile viewing
```

### 🆕 `slideshow-parallax-layers.sh` (PROPOSED)
**Description:** Multi-layer parallax effect slideshow  
**Input:** 2-10 images  
**Output:** 16:9 (1920x1080)  
**Features:**
- Background/foreground layer separation
- Depth-based movement speeds
- 3D parallax illusion

**README:**
```bash
# Usage: ./slideshow-parallax-layers.sh [image1] [image2] ...
# Creates depth illusion with layered movement
# Requires images with clear foreground/background elements
```

### 🆕 `slideshow-magazine-style.sh` (PROPOSED)
**Description:** Magazine layout with multiple images per frame  
**Input:** 4-12 images  
**Output:** 16:9 (1920x1080)  
**Features:**
- Grid layouts (2x2, 3x2, etc.)
- Elegant reveal animations
- Professional magazine aesthetic

**README:**
```bash
# Usage: ./slideshow-magazine-style.sh --layout 2x2 [images...]
# Options: --layout [2x2|3x2|4x1] --timing [fast|medium|slow]
# Creates magazine-style multi-image layouts
```

---

## 🔄 **TRANSITION SCRIPTS**

### ✅ `wipe-transition-accelerating.sh` (EXISTING)
**Description:** Right-to-left wipe transitions with accelerating timing  
**Input:** 1-8 images  
**Output:** 9:16 (1080x1920), 11 seconds  
**Features:**
- Accelerating transition timing (0.8s → 0.2s)
- Mathematical easing curves
- Progressive speed increase

**README:**
```bash
# Usage: ./wipe-transition-accelerating.sh
# Perfect for building momentum and energy
# Timing accelerates throughout sequence
```

### 🆕 `transition-morph-blend.sh` (PROPOSED)
**Description:** Smooth morphing transitions between images  
**Input:** 2-10 images  
**Output:** Configurable aspect ratio  
**Features:**
- AI-powered morphing between similar subjects
- Seamless blend transitions
- Face/object alignment

**README:**
```bash
# Usage: ./transition-morph-blend.sh [image1] [image2] ...
# Best with similar subjects (faces, objects)
# Creates seamless morphing effects
```

### 🆕 `transition-geometric-shapes.sh` (PROPOSED)
**Description:** Geometric shape-based transitions  
**Input:** 2-20 images  
**Output:** 16:9 or 9:16  
**Features:**
- Circle, triangle, hexagon wipes
- Configurable shape sizes and speeds
- Modern geometric aesthetic

**README:**
```bash
# Usage: ./transition-geometric-shapes.sh --shape circle [images...]
# Options: --shape [circle|triangle|hexagon|diamond]
# Modern, clean transition effects
```

### 🆕 `transition-liquid-flow.sh` (PROPOSED)
**Description:** Liquid-like flowing transitions  
**Input:** 2-15 images  
**Output:** Any aspect ratio  
**Features:**
- Fluid dynamics simulation
- Organic flowing movement
- Customizable viscosity and speed

**README:**
```bash
# Usage: ./transition-liquid-flow.sh --viscosity medium [images...]
# Options: --viscosity [low|medium|high] --direction [left|right|up|down]
# Creates organic, fluid transitions
```

---

## 🎭 **MOTION EFFECTS SCRIPTS**

### ✅ `talking-heads-crossfade-advanced.sh` (EXISTING)
**Description:** Professional talking heads with sophisticated crossfade  
**Input:** 3-10 portrait images  
**Output:** 9:16 (1080x1920)  
**Features:**
- Dynamic crossfade calculation
- Variable duration per image (1.5s)
- Professional scaling and cropping

**README:**
```bash
# Usage: ./talking-heads-crossfade-advanced.sh
# Edit IMAGES array with your portrait images
# Perfect for testimonials, interviews, team intros
```

### 🆕 `motion-cinemagraph.sh` (PROPOSED)
**Description:** Creates subtle motion in still images  
**Input:** 1-5 images  
**Output:** 16:9 (1920x1080), 3-10 seconds loop  
**Features:**
- Subtle background movement (clouds, water, smoke)
- Seamless looping
- Selective motion masking

**README:**
```bash
# Usage: ./motion-cinemagraph.sh --element water [image.jpg]
# Options: --element [water|clouds|smoke|trees|fire]
# Creates living photographs with subtle motion
```

### 🆕 `motion-camera-moves.sh` (PROPOSED)
**Description:** Simulates professional camera movements  
**Input:** 1-8 images  
**Output:** Configurable  
**Features:**
- Pan, tilt, zoom, dolly effects
- Smooth camera motion curves
- Professional cinematography techniques

**README:**
```bash
# Usage: ./motion-camera-moves.sh --move dolly-in [image.jpg]
# Options: --move [pan-left|pan-right|tilt-up|tilt-down|dolly-in|dolly-out|zoom-in|zoom-out]
# Simulates professional camera movements
```

### 🆕 `motion-parallax-3d.sh` (PROPOSED)
**Description:** 3D parallax motion from 2D images  
**Input:** 1-6 images  
**Output:** 16:9 (1920x1080)  
**Features:**
- Depth map generation
- 3D camera movement simulation
- Perspective-correct motion

**README:**
```bash
# Usage: ./motion-parallax-3d.sh --depth auto [image.jpg]
# Options: --depth [auto|manual] --movement [orbit|fly-through|dolly]
# Creates 3D motion from flat images
```

---

## 🌟 **ATMOSPHERIC EFFECTS SCRIPTS**

### ✅ `opacity-flicker-atmospheric.sh` (EXISTING)
**Description:** Atmospheric flicker effect with random opacity variations  
**Input:** 1-3 images  
**Output:** 9:16 (1080x1920), 6 seconds  
**Features:**
- Random opacity generation (0.92-1.0)
- Frame-by-frame opacity control
- Cinematic atmosphere effect

**README:**
```bash
# Usage: ./opacity-flicker-atmospheric.sh
# Creates moody, cinematic lighting effects
# Perfect for dramatic scenes
```

### 🆕 `atmosphere-particle-effects.sh` (PROPOSED)
**Description:** Adds particle effects (dust, snow, rain, sparks)  
**Input:** 1-5 images  
**Output:** Any aspect ratio  
**Features:**
- Multiple particle types
- Physics-based movement
- Customizable density and behavior

**README:**
```bash
# Usage: ./atmosphere-particle-effects.sh --particles snow [image.jpg]
# Options: --particles [dust|snow|rain|sparks|leaves|bubbles]
# Adds atmospheric particle effects
```

### 🆕 `atmosphere-lighting-effects.sh` (PROPOSED)
**Description:** Dynamic lighting and shadow effects  
**Input:** 1-8 images  
**Output:** Any aspect ratio  
**Features:**
- Moving light sources
- Dynamic shadows
- Color temperature shifts
- Volumetric lighting

**README:**
```bash
# Usage: ./atmosphere-lighting-effects.sh --light sunset [image.jpg]
# Options: --light [sunrise|sunset|strobe|candle|neon|fire]
# Creates dynamic lighting atmospheres
```

### 🆕 `atmosphere-weather-effects.sh` (PROPOSED)
**Description:** Weather simulation overlays  
**Input:** 1-10 images  
**Output:** Any aspect ratio  
**Features:**
- Rain, snow, fog, wind effects
- Realistic weather simulation
- Seasonal atmosphere enhancement

**README:**
```bash
# Usage: ./atmosphere-weather-effects.sh --weather fog [images...]
# Options: --weather [rain|snow|fog|wind|storm|mist]
# Adds realistic weather effects
```

---

## 🎨 **COMPOSITE EFFECTS SCRIPTS**

### 🆕 `composite-split-screen.sh` (PROPOSED)
**Description:** Split-screen compositions with multiple images  
**Input:** 2-6 images  
**Output:** 16:9 (1920x1080)  
**Features:**
- Horizontal/vertical splits
- Dynamic split lines
- Synchronized or independent timing

**README:**
```bash
# Usage: ./composite-split-screen.sh --split vertical [img1.jpg] [img2.jpg]
# Options: --split [horizontal|vertical|diagonal|custom]
# Creates professional split-screen effects
```

### 🆕 `composite-picture-in-picture.sh` (PROPOSED)
**Description:** Picture-in-picture compositions  
**Input:** 2-8 images  
**Output:** Any aspect ratio  
**Features:**
- Multiple PiP windows
- Animated positioning
- Scale and rotation effects

**README:**
```bash
# Usage: ./composite-picture-in-picture.sh --main [bg.jpg] --pip [fg1.jpg] [fg2.jpg]
# Creates professional picture-in-picture layouts
# Perfect for tutorials, comparisons
```

### 🆕 `composite-collage-animated.sh` (PROPOSED)
**Description:** Animated collage with dynamic layouts  
**Input:** 4-20 images  
**Output:** 16:9 (1920x1080)  
**Features:**
- Dynamic grid layouts
- Animated image placement
- Rotation and scaling effects

**README:**
```bash
# Usage: ./composite-collage-animated.sh --style modern [images...]
# Options: --style [modern|vintage|magazine|polaroid]
# Creates dynamic animated collages
```

---

## 📝 **TEXT OVERLAY SCRIPTS**

### 🆕 `text-kinetic-typography.sh` (PROPOSED)
**Description:** Animated text overlays with kinetic effects  
**Input:** 1-5 images + text file  
**Output:** Any aspect ratio  
**Features:**
- Animated text entrance/exit
- Multiple typography styles
- Synchronized with image timing

**README:**
```bash
# Usage: ./text-kinetic-typography.sh --text "Your Text" [image.jpg]
# Options: --style [modern|classic|handwritten|bold]
# Creates professional animated text overlays
```

### 🆕 `text-subtitle-overlay.sh` (PROPOSED)
**Description:** Professional subtitle and caption overlays  
**Input:** 1-10 images + subtitle file  
**Output:** Any aspect ratio  
**Features:**
- SRT subtitle support
- Multiple font styles
- Automatic positioning

**README:**
```bash
# Usage: ./text-subtitle-overlay.sh --srt subtitles.srt [images...]
# Supports standard SRT subtitle format
# Professional subtitle styling
```

---

## 🎨 **COLOR TREATMENT SCRIPTS**

### 🆕 `color-grading-cinematic.sh` (PROPOSED)
**Description:** Professional color grading presets  
**Input:** 1-20 images  
**Output:** Any aspect ratio  
**Features:**
- Multiple cinematic LUTs
- Color temperature adjustment
- Contrast and saturation control

**README:**
```bash
# Usage: ./color-grading-cinematic.sh --preset film-noir [images...]
# Options: --preset [film-noir|golden-hour|cyberpunk|vintage|modern]
# Professional color grading effects
```

### 🆕 `color-duotone-effects.sh` (PROPOSED)
**Description:** Duotone and color isolation effects  
**Input:** 1-15 images  
**Output:** Any aspect ratio  
**Features:**
- Selective color isolation
- Duotone color mapping
- Artistic color treatments

**README:**
```bash
# Usage: ./color-duotone-effects.sh --colors red,blue [images...]
# Creates artistic duotone effects
# Perfect for brand-consistent styling
```

---

## 🔄 **BATCH PROCESSING SCRIPTS**

### ✅ `framepack-image-to-video-batch.sh` (EXISTING)
**Description:** Complex framepack transitions with API integration  
**Input:** 11 image pairs  
**Output:** 9:16 (720p), variable duration  
**Features:**
- API integration for framepack generation
- Automatic concatenation
- Stop-motion animation style

**README:**
```bash
# Usage: ./framepack-image-to-video-batch.sh
# Processes 11 framepack transitions automatically
# Requires API server running on localhost:3000
```

### 🆕 `batch-style-transfer.sh` (PROPOSED)
**Description:** Applies consistent style across multiple images  
**Input:** 5-50 images  
**Output:** Any aspect ratio  
**Features:**
- Consistent style application
- Batch processing optimization
- Style template system

**README:**
```bash
# Usage: ./batch-style-transfer.sh --style vintage [images...]
# Applies consistent styling across all images
# Perfect for brand consistency
```

### 🆕 `batch-multi-format.sh` (PROPOSED)
**Description:** Generates multiple aspect ratios from same source  
**Input:** 1-20 images  
**Output:** 16:9, 9:16, 1:1, 4:5  
**Features:**
- Intelligent cropping for each format
- Simultaneous multi-format generation
- Social media optimization

**README:**
```bash
# Usage: ./batch-multi-format.sh [images...]
# Generates videos in all major aspect ratios
# Perfect for multi-platform content
```

---

## 🛠️ **UTILITY SCRIPTS**

### 🆕 `ffmpeg-common-functions.sh` (PROPOSED)
**Description:** Shared utility functions for all scripts  
**Features:**
- Metadata generation templates
- Error handling functions
- File validation utilities
- Database sync helpers

**README:**
```bash
# Source this file in other scripts: source ffmpeg-common-functions.sh
# Provides shared functions for all FFmpeg scripts
# Standardizes error handling and metadata
```

### 🆕 `ffmpeg-config.sh` (PROPOSED)
**Description:** Centralized configuration for all scripts  
**Features:**
- Default paths and directories
- Quality and encoding settings
- Aspect ratio definitions

**README:**
```bash
# Edit this file to configure all FFmpeg scripts
# Centralized settings for consistency
# Source in all scripts for shared config
```

### 🆕 `image-preprocessor.sh` (PROPOSED)
**Description:** Prepares images for video processing  
**Input:** 1-100 images  
**Features:**
- Automatic resizing and optimization
- Format standardization
- Quality enhancement

**README:**
```bash
# Usage: ./image-preprocessor.sh --target-size 1920x1080 [images...]
# Prepares images for optimal video processing
# Handles format conversion and optimization
```

---

## 📊 **Complete Script Matrix**

| Category | Script Name | Input | Output | Complexity | Status |
|----------|-------------|-------|---------|------------|---------|
| **Slideshow** | `slideshow-ken-burns-advanced.sh` | 1-18 imgs | 16:9 | High | ✅ Existing |
| | `slideshow-ken-burns-simple.sh` | 1-18 imgs | 16:9 | Medium | ✅ Existing |
| | `slideshow-portrait-mobile.sh` | 1-18 imgs | 9:16 | Medium | ✅ Existing |
| | `slideshow-parallax-layers.sh` | 2-10 imgs | 16:9 | High | 🆕 Proposed |
| | `slideshow-magazine-style.sh` | 4-12 imgs | 16:9 | Medium | 🆕 Proposed |
| **Transitions** | `wipe-transition-accelerating.sh` | 1-8 imgs | 9:16 | High | ✅ Existing |
| | `transition-morph-blend.sh` | 2-10 imgs | Any | Very High | 🆕 Proposed |
| | `transition-geometric-shapes.sh` | 2-20 imgs | Any | Medium | 🆕 Proposed |
| | `transition-liquid-flow.sh` | 2-15 imgs | Any | High | 🆕 Proposed |
| **Motion** | `talking-heads-crossfade-advanced.sh` | 3-10 imgs | 9:16 | High | ✅ Existing |
| | `motion-cinemagraph.sh` | 1-5 imgs | 16:9 | High | 🆕 Proposed |
| | `motion-camera-moves.sh` | 1-8 imgs | Any | Medium | 🆕 Proposed |
| | `motion-parallax-3d.sh` | 1-6 imgs | 16:9 | Very High | 🆕 Proposed |
| **Atmosphere** | `opacity-flicker-atmospheric.sh` | 1-3 imgs | 9:16 | Medium | ✅ Existing |
| | `atmosphere-particle-effects.sh` | 1-5 imgs | Any | High | 🆕 Proposed |
| | `atmosphere-lighting-effects.sh` | 1-8 imgs | Any | High | 🆕 Proposed |
| | `atmosphere-weather-effects.sh` | 1-10 imgs | Any | Medium | 🆕 Proposed |
| **Composite** | `composite-split-screen.sh` | 2-6 imgs | 16:9 | Medium | 🆕 Proposed |
| | `composite-picture-in-picture.sh` | 2-8 imgs | Any | Medium | 🆕 Proposed |
| | `composite-collage-animated.sh` | 4-20 imgs | 16:9 | High | 🆕 Proposed |
| **Text** | `text-kinetic-typography.sh` | 1-5 imgs + text | Any | High | 🆕 Proposed |
| | `text-subtitle-overlay.sh` | 1-10 imgs + srt | Any | Medium | 🆕 Proposed |
| **Color** | `color-grading-cinematic.sh` | 1-20 imgs | Any | Medium | 🆕 Proposed |
| | `color-duotone-effects.sh` | 1-15 imgs | Any | Low | 🆕 Proposed |
| **Batch** | `framepack-image-to-video-batch.sh` | 11 pairs | 9:16 | Very High | ✅ Existing |
| | `batch-style-transfer.sh` | 5-50 imgs | Any | Medium | 🆕 Proposed |
| | `batch-multi-format.sh` | 1-20 imgs | Multi | Medium | 🆕 Proposed |

---

## 🎯 **Implementation Priority**

### **Phase 1: Essential Effects** (High Priority)
1. `transition-geometric-shapes.sh` - Modern, clean transitions
2. `motion-cinemagraph.sh` - Subtle motion effects
3. `composite-split-screen.sh` - Professional compositions
4. `color-grading-cinematic.sh` - Professional color treatment

### **Phase 2: Creative Effects** (Medium Priority)
1. `atmosphere-particle-effects.sh` - Environmental enhancement
2. `motion-camera-moves.sh` - Professional camera simulation
3. `slideshow-parallax-layers.sh` - Advanced depth effects
4. `text-kinetic-typography.sh` - Animated text overlays

### **Phase 3: Advanced Features** (Lower Priority)
1. `transition-morph-blend.sh` - AI-powered morphing
2. `motion-parallax-3d.sh` - 3D effects from 2D images
3. `atmosphere-lighting-effects.sh` - Dynamic lighting
4. `batch-multi-format.sh` - Multi-platform optimization

---

## 🚀 **Usage Patterns**

### **Single Image Enhancement**
```bash
./motion-cinemagraph.sh --element water image.jpg
./atmosphere-particle-effects.sh --particles snow image.jpg
./color-grading-cinematic.sh --preset film-noir image.jpg
```

### **Multi-Image Sequences**
```bash
./slideshow-ken-burns-advanced.sh  # Uses predefined image array
./transition-geometric-shapes.sh --shape circle img1.jpg img2.jpg img3.jpg
./composite-collage-animated.sh --style modern *.jpg
```

### **Batch Processing**
```bash
./batch-style-transfer.sh --style vintage gallery/*.jpg
./batch-multi-format.sh portfolio/*.jpg
```

---

This comprehensive catalog provides a complete professional video generation toolkit that can handle any creative requirement from simple slideshows to complex cinematic effects, all while maintaining the flexibility to work with one or many images as input. 