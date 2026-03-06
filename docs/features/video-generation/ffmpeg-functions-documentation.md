# FFmpeg Functions Documentation for Forge

## 🎬 Overview

This document catalogs all FFmpeg functions and scripts used in the Forge (World Culture Wars) project for video generation, editing, and post-processing workflows.

## 📂 Core FFmpeg Scripts

### 1. **Slideshow Generation Scripts**

#### `create-slideshow.sh` - Advanced Ken Burns Slideshow
- **Purpose**: Creates professional slideshows with Ken Burns effects and directional slide transitions
- **Aspect Ratio**: 16:9 (1920x1080)
- **Tempo**: 122 BPM (1.2 seconds per image)
- **Features**:
  - Individual Ken Burns preprocessing for each image
  - Dynamic zoom and pan effects using `zoompan` filter
  - Multiple transition types: `slideleft`, `slideright`, `slideup`, `slidedown`
  - 18 images total
  - 0.2 second transition duration
  - ~22 seconds total duration

**FFmpeg Functions Used**:
```bash
# Ken Burns preprocessing
zoompan=z='min(zoom+0.0015,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'

# Multi-directional xfade transitions
xfade=transition=slideleft:duration=0.2:offset=1.0
```

#### `create-slideshow-simple.sh` - Simple Ken Burns Slideshow
- **Purpose**: Simplified slideshow with basic Ken Burns and slide transitions
- **Aspect Ratio**: 16:9 (1920x1080)
- **Tempo**: 100 BPM (1.5 seconds per image)
- **Features**:
  - Subtle Ken Burns effect
  - Sequential slide transitions
  - File list input method using `-f concat`
  - 18 images, ~27 seconds total

#### `create-slideshow-basic.sh` - Basic Slideshow
- **Purpose**: Minimal slideshow implementation
- **Features**: Simple concatenation without advanced effects

#### `create-slideshow-fast.sh` - High Performance Slideshow
- **Purpose**: Fast processing slideshow with minimal effects
- **Features**: Optimized for speed with `hide_banner` and `loglevel error`

#### `create-slideshow-vertical.sh` - Portrait Slideshow
- **Purpose**: 9:16 aspect ratio slideshow for mobile/vertical content

#### `create-slideshow-122bpm.sh` - Music-Synced Slideshow
- **Purpose**: Slideshow specifically timed to 122 BPM music tracks

#### `create-slideshow-all18.sh` - Full Gallery Slideshow
- **Purpose**: Processes all 18 images in the gallery with standardized settings

### 2. **Talking Heads Video Generation**

#### `create-talking-heads-video.sh` - Dynamic Crossfade Sequence
- **Purpose**: Creates professional talking heads videos with sophisticated crossfade transitions
- **Aspect Ratio**: 9:16 (1080x1920) portrait
- **Features**:
  - Dynamic crossfade calculation with mathematical precision
  - Variable duration per image (1.5s) with configurable fade (0.3s)
  - Automatic metadata generation
  - Database sync integration
  - Professional scaling and cropping

**Advanced FFmpeg Features**:
```bash
# Dynamic filter complex building
FILTER_COMPLEX="[$CURRENT_STREAM][v${i}]xfade=transition=fade:duration=$FADE_DURATION:offset=$OFFSET[fade${i}];"

# Professional video encoding
-r $FPS -pix_fmt yuv420p -c:v libx264 -crf 18
```

#### `create-talking-heads-fade.sh` - Simple Crossfade Sequence
- **Purpose**: Simplified talking heads video with basic crossfade
- **Aspect Ratio**: 9:16 (1080x1920)
- **Features**:
  - 7 images with 1.5s display time
  - 0.5s crossfade transitions
  - 8 seconds total duration
  - Metadata generation included

### 3. **Special Effects and Creative Videos**

#### `create-flicker-video.sh` - Opacity Flicker Effect
- **Purpose**: Creates atmospheric flicker effect with random opacity variations
- **Aspect Ratio**: 9:16 (1080x1920)
- **Duration**: 6 seconds (2s + 4s)
- **Features**:
  - Random opacity generation (0.92-1.0)
  - Frame-by-frame opacity control
  - Black background with overlay compositing
  - 48 + 96 frame generation (144 total frames at 24fps)

**Special FFmpeg Techniques**:
```bash
# Random opacity generation in bash
opacity=$(awk -v min=0.92 -v max=1.0 'BEGIN{srand(); print min+rand()*(max-min)}')

# Alpha channel manipulation
colorchannelmixer=aa=$opacity
```

#### `create-subculture-video.sh` - Right-to-Left Wipe Transitions
- **Purpose**: Creates videos with complex wipe transition effects
- **Features**: Complex filter chains for directional wipe effects

### 4. **Batch Processing and Concatenation**

#### `framepack_batch_process.sh` - Multi-Video Concatenation
- **Purpose**: Processes multiple framepack transitions and concatenates them
- **Features**:
  - API integration for framepack generation
  - Automatic file list creation for FFmpeg concat
  - Error handling and progress tracking
  - Final video stitching

**FFmpeg Concatenation**:
```bash
# File-based concatenation
ffmpeg -f concat -safe 0 -i "$concat_file" -c copy "$final_output"
```

## 🔧 Core FFmpeg Techniques Used

### 1. **Video Scaling and Cropping**
```bash
scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920
```
- Ensures consistent aspect ratios
- Prevents distortion during scaling
- Crops to exact dimensions

### 2. **Ken Burns Effects**
```bash
zoompan=z='min(zoom+0.0015,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=1920x1080:fps=25
```
- Slow zoom and pan effects
- Mathematical zoom progression
- Configurable duration and movement

### 3. **Crossfade Transitions**
```bash
xfade=transition=fade:duration=0.5:offset=1.0
```
- Smooth transitions between clips
- Multiple transition types: fade, slide, wipe
- Precise timing control

### 4. **Complex Filter Chains**
```bash
-filter_complex "[0:v]scale...[v0]; [v0][v1]xfade...[f0]; [f0][v2]xfade...[f1]"
```
- Chained video processing
- Multiple input handling
- Dynamic filter graph construction

### 5. **Frame Rate and Quality Control**
```bash
-r 30 -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p
```
- Consistent frame rates
- H.264 encoding with quality control
- Compatible pixel format for web delivery

## 📊 Video Specifications by Script

| Script | Aspect Ratio | Resolution | FPS | Duration | Features |
|--------|-------------|------------|-----|----------|----------|
| `create-slideshow.sh` | 16:9 | 1920x1080 | 25 | ~22s | Ken Burns + Slides |
| `create-slideshow-simple.sh` | 16:9 | 1920x1080 | 25 | ~27s | Basic Ken Burns |
| `create-talking-heads-video.sh` | 9:16 | 1080x1920 | 30 | Variable | Dynamic Crossfade |
| `create-talking-heads-fade.sh` | 9:16 | 1080x1920 | 30 | 8s | Simple Crossfade |
| `create-flicker-video.sh` | 9:16 | 1080x1920 | 24 | 6s | Opacity Effects |

## 🎯 Common FFmpeg Patterns

### 1. **Input Handling**
```bash
# Multiple file inputs
-i "file1.jpg" -i "file2.jpg" -i "file3.jpg"

# File list method
-f concat -safe 0 -i filelist.txt

# Loop single image
-loop 1 -t 5 -i "image.jpg"
```

### 2. **Professional Encoding Settings**
```bash
# High quality settings
-c:v libx264 -crf 18 -preset slow

# Web-optimized settings  
-c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p

# Fast processing
-hide_banner -loglevel error
```

### 3. **Metadata Integration**
- All scripts generate JSON metadata files
- Automatic database synchronization
- File size and duration extraction
- Timestamp and project ID tracking

## 🔄 Automation Features

### 1. **Error Handling**
- File existence validation
- FFmpeg exit code checking
- Graceful failure recovery

### 2. **Cleanup and Organization**
- Temporary file management
- Automatic directory creation
- File naming conventions with timestamps

### 3. **API Integration**
- Database sync endpoints
- Gallery refresh triggers
- Metadata standardization

## 📝 Usage Examples

### Basic Slideshow Creation
```bash
./create-slideshow-simple.sh
# Generates: forge-slideshow-YYYYMMDD-HHMMSS.mp4
```

### Talking Heads with Custom Images
```bash
# Edit IMAGES array in create-talking-heads-video.sh
./create-talking-heads-video.sh
# Generates: talking-heads-sequence-YYYY-MM-DD.mp4
```

### Batch Video Processing
```bash
./framepack_batch_process.sh
# Processes multiple transitions and concatenates final video
```

## 🚀 Performance Optimizations

1. **Parallel Processing**: Multiple FFmpeg processes for batch operations
2. **Preset Selection**: Balanced quality/speed with `-preset medium`
3. **Memory Management**: Temporary file cleanup and efficient filter chains
4. **Quality Control**: CRF values optimized for web delivery (18-23 range)

## 🎨 Creative Effects Arsenal

- **Ken Burns**: Dynamic zoom and pan for static images
- **Crossfade**: Smooth transitions between clips
- **Slide Transitions**: Directional wipe effects
- **Opacity Flicker**: Atmospheric lighting effects
- **Complex Compositing**: Multi-layer video composition
- **Aspect Ratio Conversion**: 16:9 ↔ 9:16 transformations

---

*This documentation covers all FFmpeg functionality as of the current codebase state. Each script includes comprehensive error handling, metadata generation, and integration with the Forge gallery system.* 