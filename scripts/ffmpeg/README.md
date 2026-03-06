# FFmpeg Video Generation Scripts

## 🎯 Overview

This directory contains a comprehensive collection of FFmpeg scripts for generating videos from still images. All scripts are **flexible** and accept any number of images as command-line arguments, replacing the old hardcoded image arrays.

## 📂 Directory Structure

```
scripts/ffmpeg/
├── slideshow/           # Image slideshow generators
├── transitions/         # Advanced transition effects  
├── talking-heads/       # People/portrait sequences
├── effects/            # Special visual effects
├── batch/              # Complex multi-step workflows
├── vibe-reel/          # Audio-synced vibe reel generators
└── utils/              # Shared utilities and configs
```

## 🚀 Quick Start

### Basic Usage Pattern
All scripts follow this pattern:
```bash
./script-name.sh [options] image1.jpg image2.jpg image3.jpg ...
```

### Example Commands
```bash
# Create slideshow with Ken Burns effects
./slideshow/slideshow-ken-burns-simple.sh --duration 2.0 *.jpg

# Create talking heads video with crossfades
./talking-heads/talking-heads-crossfade-simple.sh --fade 0.3 portraits/*.jpg

# Create slide transitions
./transitions/slide-transition-directional.sh --direction left images/*.jpg

# Create rhythmic cuts
./transitions/cut-transition-rhythmic.sh --rhythm fast action/*.jpg

# Create atmospheric flicker
./effects/opacity-flicker-atmospheric.sh moody1.jpg moody2.jpg

# Create vibe reel with audio sync
./vibe-reel/vibe-reel-ken-burns-beat-sync.sh \
  --audio music.wav \
  --bpm 118 \
  images/*.jpg
```

## 📋 Available Scripts

### 🎞️ Slideshow Scripts (`slideshow/`)

#### `slideshow-ken-burns-simple.sh`
**Purpose:** Creates slideshow with gentle Ken Burns zoom effects  
**Features:**
- Configurable zoom factor (default: 1.02x)
- Slide transitions between images
- 16:9 or 9:16 aspect ratio support
- Professional quality encoding

**Usage:**
```bash
./slideshow-ken-burns-simple.sh [options] [images...]

Options:
  --duration     Duration per image in seconds (default: 1.5)
  --transition   Transition duration in seconds (default: 0.3)
  --aspect       Aspect ratio (16:9|9:16) (default: 16:9)
  --fps          Frame rate (default: 25)
  --zoom         Ken Burns zoom factor (default: 1.02)
```

### 🔄 Transition Scripts (`transitions/`)

#### `slide-transition-directional.sh`
**Purpose:** Clean slide transitions in all directions  
**Features:**
- Slide left, right, up, down, or random
- Professional scaling and cropping
- Configurable timing and aspect ratios

**Usage:**
```bash
./slide-transition-directional.sh [options] [images...]

Options:
  --direction    Slide direction (left|right|up|down|random)
  --aspect       Aspect ratio (16:9|9:16)
  --duration     Duration per image in seconds (default: 1.2)
  --transition   Transition duration in seconds (default: 0.3)
```

#### `cut-transition-rhythmic.sh`
**Purpose:** Sharp cuts with rhythmic timing  
**Features:**
- Fast, medium, or slow rhythm options
- No transition effects - clean cuts
- Perfect for dynamic sequences

**Usage:**
```bash
./cut-transition-rhythmic.sh [options] [images...]

Options:
  --rhythm       Cut timing (fast|medium|slow)
  --aspect       Aspect ratio (16:9|9:16)
```

### 👥 Talking Heads Scripts (`talking-heads/`)

#### `talking-heads-crossfade-simple.sh`
**Purpose:** Portrait sequences with crossfade transitions  
**Features:**
- Simple crossfade between portraits
- Configurable fade duration
- Portrait-optimized (9:16 default)

**Usage:**
```bash
./talking-heads-crossfade-simple.sh [options] [images...]

Options:
  --duration     Duration per image in seconds (default: 1.5)
  --fade         Crossfade duration in seconds (default: 0.5)
  --aspect       Aspect ratio (16:9|9:16) (default: 9:16)
```

### ✨ Effects Scripts (`effects/`)

#### `opacity-flicker-atmospheric.sh`
**Purpose:** Atmospheric flicker effect with random opacity variations  
**Features:**
- Random opacity flicker (0.92-1.0)
- Frame-by-frame control
- Cinematic atmosphere

**Usage:**
```bash
./opacity-flicker-atmospheric.sh image1.jpg [image2.jpg] [image3.jpg] ...
```

### 🎵 Vibe Reel Scripts (`vibe-reel/`)

#### `vibe-reel-ken-burns-beat-sync.sh`
**Purpose:** Create Ken Burns style videos with beat-synced cuts and audio mixing  
**Features:**
- Automatic audio duration analysis
- Beat-synced cuts (BPM-based or auto-calculated)
- Ken Burns zoom effects on each image
- Automatic audio mixing
- Perfect for social media "vibe reels"

**Usage:**
```bash
./vibe-reel-ken-burns-beat-sync.sh --audio <audio_file> [options] [images...]

Required:
  --audio <file>        Audio file path (required)

Options:
  --bpm <number>         Explicit BPM for beat sync (overrides auto-calculation)
  --beats-per-image <n>  Number of beats per image (default: 1)
  --aspect <ratio>       Aspect ratio (16:9|9:16) (default: 9:16)
  --zoom <factor>        Ken Burns zoom factor (default: 1.02)
  --fps <rate>           Frame rate (default: 30)
  --output <path>        Output directory (default: public/videos/clips)
```

**Examples:**
```bash
# Auto-calculate timing from audio duration
./vibe-reel-ken-burns-beat-sync.sh \
  --audio "public/audio/song.wav" \
  public/images/*.jpg

# Explicit BPM sync (118 BPM, 1 beat per image)
./vibe-reel-ken-burns-beat-sync.sh \
  --audio "public/audio/song.wav" \
  --bpm 118 \
  --beats-per-image 1 \
  public/images/*.jpg

# 2 beats per image for slower pacing
./vibe-reel-ken-burns-beat-sync.sh \
  --audio "public/audio/song.wav" \
  --bpm 118 \
  --beats-per-image 2 \
  public/images/*.jpg
```

### 🔄 Batch Scripts (`batch/`)

#### `framepack-image-to-video-batch.sh`
**Purpose:** Complex multi-video framepack processing  
**Features:**
- API integration for framepack generation
- Automatic concatenation
- Stop-motion animation style

## 🛠️ Shared Utilities (`utils/`)

### `ffmpeg-common-functions.sh`
Shared utility functions for all scripts:
- Image validation
- Metadata generation
- Database synchronization
- Error handling
- Resolution calculations

### `ffmpeg-config.sh`
Centralized configuration:
- Quality settings
- Aspect ratios and resolutions
- Timing defaults
- Platform-specific settings

## 🎨 Features

### ✅ Flexible Input
- **Any number of images**: No more hardcoded arrays
- **Command-line arguments**: Professional CLI interface
- **File validation**: Automatic existence checking
- **Help system**: `--help` flag for all scripts

### ✅ Professional Quality
- **H.264 encoding**: Web-compatible format
- **Multiple aspect ratios**: 16:9, 9:16, 1:1, 4:5
- **Configurable quality**: CRF and preset options
- **Consistent frame rates**: 24fps, 25fps, 30fps options

### ✅ Comprehensive Metadata
- **JSON metadata files**: Complete generation parameters
- **Database integration**: Automatic sync to Forge database
- **Timestamp tracking**: Creation and modification times
- **Project association**: Tagged with current project ID

### ✅ Error Handling
- **File validation**: Check image existence before processing
- **FFmpeg monitoring**: Exit code checking
- **Clear messages**: Descriptive error and success messages
- **Graceful recovery**: Handle missing dependencies

## 📊 Output Specifications

| Script Category | Default Aspect | Resolution | FPS | Quality |
|-----------------|----------------|------------|-----|---------|
| Slideshow | 16:9 | 1920x1080 | 25 | CRF 23 |
| Transitions | 9:16 | 1080x1920 | 30 | CRF 23 |
| Talking Heads | 9:16 | 1080x1920 | 30 | CRF 23 |
| Effects | 9:16 | 1080x1920 | 24-30 | CRF 23 |
| Vibe Reel | 9:16 | 1080x1920 | 30 | CRF 23 |

## 🔧 Dependencies

### Required
- **FFmpeg**: Video processing engine
- **bc**: Mathematical calculations
- **bash**: Shell scripting environment

### Optional
- **jq**: JSON processing (for enhanced metadata)
- **curl**: Database synchronization
- **stat**: File size calculation

## 📝 Usage Examples

### Professional Slideshow
```bash
# Create a 16:9 slideshow with gentle Ken Burns effects
./slideshow/slideshow-ken-burns-simple.sh \
  --duration 2.0 \
  --zoom 1.05 \
  --aspect 16:9 \
  portfolio/*.jpg
```

### Dynamic Social Media Video
```bash
# Create fast-paced 9:16 video for Instagram/TikTok
./transitions/cut-transition-rhythmic.sh \
  --rhythm fast \
  --aspect 9:16 \
  social_media/*.jpg
```

### Professional Testimonials
```bash
# Create talking heads video with smooth crossfades
./talking-heads/talking-heads-crossfade-simple.sh \
  --duration 3.0 \
  --fade 0.5 \
  testimonials/*.jpg
```

### Atmospheric Content
```bash
# Create moody flicker effect
./effects/opacity-flicker-atmospheric.sh \
  dramatic1.jpg dramatic2.jpg dramatic3.jpg
```

### Audio-Synced Vibe Reel
```bash
# Create vibe reel with beat-synced cuts
./vibe-reel/vibe-reel-ken-burns-beat-sync.sh \
  --audio "public/audio/song.wav" \
  --bpm 118 \
  --aspect 9:16 \
  timeline_images/*.jpg
```

## 🔄 Migration from Old Scripts

The old hardcoded scripts have been **removed** and replaced with these flexible versions:

| Old Script | New Script | Location |
|------------|------------|----------|
| `create-slideshow*.sh` | `slideshow-ken-burns-simple.sh` | `slideshow/` |
| `create-talking-heads-fade.sh` | `talking-heads-crossfade-simple.sh` | `talking-heads/` |
| `create-subculture-video.sh` | `slide-transition-directional.sh` | `transitions/` |
| `create-flicker-video.sh` | `opacity-flicker-atmospheric.sh` | `effects/` |

## 🚀 Development

### Adding New Scripts
1. Use the shared utilities from `utils/`
2. Follow the naming convention: `category-description-variant.sh`
3. Include `--help` flag and comprehensive options
4. Generate metadata and sync to database
5. Add documentation to this README

### Testing Scripts
```bash
# Test with sample images
./script-name.sh --help
./script-name.sh test1.jpg test2.jpg test3.jpg
```

## 📚 Related Documentation

- [Video Generation System](../../docs/features/video-generation/README.md)
- [FFmpeg Functions Documentation](../../docs/features/video-generation/ffmpeg-functions-documentation.md)
- [Complete Script Catalog](../../docs/features/video-generation/ffmpeg-complete-script-catalog.md)

---

**All scripts are production-ready and integrate seamlessly with the Forge gallery system!** 🎬