# FFmpeg Script Catalog - Reorganized & Renamed

## 📂 **New Directory Structure**

```
scripts/ffmpeg/
├── slideshow/           # Image slideshow generators
├── talking-heads/       # People/portrait sequences  
├── effects/            # Special visual effects
├── batch/              # Complex multi-step workflows
└── utils/              # Shared utilities
```

---

## 🎞️ **Slideshow Scripts**

### `slideshow-ken-burns-advanced.sh`
**Original:** `create-slideshow.sh`  
**Description:** Professional slideshow with advanced Ken Burns effects and directional slide transitions  
**Features:**
- Individual Ken Burns preprocessing for each image
- Multiple transition types: slide left/right/up/down
- 18 images, 1.2 seconds each, 0.2s transitions
- 16:9 landscape format (1920x1080)
- ~22 seconds total duration
- 122 BPM tempo sync

### `slideshow-ken-burns-simple.sh`
**Original:** `create-slideshow-simple.sh`  
**Description:** Simplified slideshow with basic Ken Burns and slide transitions  
**Features:**
- Subtle Ken Burns zoom effect
- Sequential slide transitions
- File list input method
- 18 images, 1.5 seconds each, 0.3s transitions
- 16:9 landscape format
- ~27 seconds total duration
- 100 BPM tempo sync

### `slideshow-portrait-mobile.sh`
**Original:** `create-slideshow-vertical.sh`  
**Description:** Mobile-optimized slideshow in portrait orientation  
**Features:**
- 9:16 portrait format (1080x1920)
- Optimized for mobile viewing
- Vertical-friendly transitions
- Social media ready

### `slideshow-music-sync-122bpm.sh`
**Original:** `create-slideshow-122bpm.sh`  
**Description:** Music-synchronized slideshow timed to 122 BPM tracks  
**Features:**
- Precisely timed to 122 BPM music
- Beat-synchronized transitions
- Perfect for music video backgrounds
- Dance/electronic music compatible

### `slideshow-fast-processing.sh`
**Original:** `create-slideshow-fast.sh`  
**Description:** High-performance slideshow optimized for speed  
**Features:**
- Minimal effects for faster processing
- Optimized encoding settings
- Batch processing friendly
- Lower resource usage

### `slideshow-basic-minimal.sh`
**Original:** `create-slideshow-basic.sh`  
**Description:** Minimal slideshow with simple concatenation  
**Features:**
- No complex effects
- Basic image sequence
- Fastest processing time
- Educational/template use

### `slideshow-full-gallery-18images.sh`
**Original:** `create-slideshow-all18.sh`  
**Description:** Processes all 18 images in gallery with standardized settings  
**Features:**
- Auto-includes all gallery images
- Standardized timing and effects
- No manual image selection needed
- Consistent output format

---

## 👥 **Talking Heads Scripts**

### `talking-heads-crossfade-advanced.sh`
**Original:** `create-talking-heads-video.sh`  
**Description:** Professional talking heads video with sophisticated crossfade transitions  
**Features:**
- Dynamic crossfade calculation with mathematical precision
- Variable duration per image (1.5s) with configurable fade (0.3s)
- 9:16 portrait format (1080x1920)
- Automatic metadata generation
- Database sync integration
- Professional scaling and cropping

### `talking-heads-crossfade-simple.sh`
**Original:** `create-talking-heads-fade.sh`  
**Description:** Simplified talking heads video with basic crossfade  
**Features:**
- 7 images with 1.5s display time
- 0.5s crossfade transitions
- 9:16 portrait format
- 8 seconds total duration
- Simple, clean transitions

---

## ✨ **Special Effects Scripts**

### `opacity-flicker-atmospheric.sh`
**Original:** `create-flicker-video.sh`  
**Description:** Creates atmospheric flicker effect with random opacity variations  
**Features:**
- Random opacity generation (0.92-1.0)
- Frame-by-frame opacity control
- Black background with overlay compositing
- 6 seconds duration (2s + 4s segments)
- 9:16 portrait format (1080x1920)
- 144 total frames at 24fps
- Cinematic atmosphere effect

### `wipe-transition-accelerating.sh`
**Original:** `create-subculture-video.sh`  
**Description:** Right-to-left wipe transitions with accelerating timing  
**Features:**
- Right-to-left directional wipe effect
- Accelerating transition timing (0.8s → 0.2s)
- 8 images with progressive speed increase
- 9:16 portrait format (1080x1920)
- 11 seconds total duration
- Mathematical easing curves
- Perfect for building momentum/energy

---

## 🔄 **Batch Processing Scripts**

### `framepack-image-to-video-batch.sh`
**Original:** `framepack_batch_process.sh`  
**Description:** Multi-video framepack processing with automatic concatenation  
**Features:**
- Processes multiple framepack transitions
- API integration for framepack generation
- Automatic file list creation for FFmpeg concat
- Error handling and progress tracking
- Final video stitching
- 11 transition sequence processing
- Stop-motion animation style
- Experimental handcrafted aesthetic

---

## 🛠️ **Utility Scripts** (Proposed)

### `ffmpeg-common-functions.sh`
**Description:** Shared utility functions for all FFmpeg scripts  
**Features:**
- Metadata generation templates
- Error handling functions
- File validation utilities
- Database sync helpers
- Common encoding presets

### `ffmpeg-config.sh`
**Description:** Centralized configuration for all scripts  
**Features:**
- Default paths and directories
- Quality and encoding settings
- Aspect ratio definitions
- Frame rate standards

---

## 📊 **Quick Reference Table**

| Script Name | Original Name | Duration | Aspect | Complexity | Use Case |
|-------------|---------------|----------|---------|------------|----------|
| `slideshow-ken-burns-advanced.sh` | `create-slideshow.sh` | ~22s | 16:9 | High | Professional presentations |
| `slideshow-ken-burns-simple.sh` | `create-slideshow-simple.sh` | ~27s | 16:9 | Medium | Basic slideshows |
| `slideshow-portrait-mobile.sh` | `create-slideshow-vertical.sh` | Variable | 9:16 | Medium | Social media content |
| `slideshow-music-sync-122bpm.sh` | `create-slideshow-122bpm.sh` | Variable | 16:9 | Low | Music videos |
| `slideshow-fast-processing.sh` | `create-slideshow-fast.sh` | Variable | 16:9 | Low | Quick previews |
| `slideshow-basic-minimal.sh` | `create-slideshow-basic.sh` | Variable | 16:9 | Low | Learning/templates |
| `slideshow-full-gallery-18images.sh` | `create-slideshow-all18.sh` | Variable | 16:9 | Medium | Auto-processing |
| `talking-heads-crossfade-advanced.sh` | `create-talking-heads-video.sh` | Variable | 9:16 | High | Professional portraits |
| `talking-heads-crossfade-simple.sh` | `create-talking-heads-fade.sh` | 8s | 9:16 | Medium | Simple portraits |
| `opacity-flicker-atmospheric.sh` | `create-flicker-video.sh` | 6s | 9:16 | Medium | Atmospheric effects |
| `wipe-transition-accelerating.sh` | `create-subculture-video.sh` | 11s | 9:16 | High | Dynamic presentations |
| `framepack-image-to-video-batch.sh` | `framepack_batch_process.sh` | Variable | 9:16 | Very High | Complex workflows |

---

## 🎯 **User-Friendly Descriptions for UI**

When these scripts are exposed in the frontend, use these descriptions:

### **Slideshow Category:**
- **"Ken Burns Slideshow (Advanced)"** - Professional slideshow with zoom and pan effects
- **"Ken Burns Slideshow (Simple)"** - Basic slideshow with gentle movement
- **"Portrait Slideshow"** - Mobile-friendly vertical format
- **"Music-Synced Slideshow"** - Timed to 122 BPM music tracks
- **"Fast Slideshow"** - Quick processing, minimal effects
- **"Basic Slideshow"** - Simple image sequence
- **"Full Gallery Slideshow"** - Uses all images automatically

### **Talking Heads Category:**
- **"Talking Heads (Advanced)"** - Professional crossfade transitions
- **"Talking Heads (Simple)"** - Basic fade between people

### **Effects Category:**
- **"Atmospheric Flicker"** - Cinematic lighting effects
- **"Accelerating Wipe"** - Dynamic right-to-left transitions

### **Batch Category:**
- **"Framepack Sequence"** - Complex multi-transition workflow

---

*This naming convention makes it immediately clear what each script does and how complex it is, helping users choose the right tool for their needs.* 