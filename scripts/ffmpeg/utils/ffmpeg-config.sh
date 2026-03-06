#!/bin/bash

# FFmpeg Configuration - Centralized settings for all video generation scripts
# Source this file in other scripts: source scripts/ffmpeg/utils/ffmpeg-config.sh

# =============================================================================
# DIRECTORY CONFIGURATION
# =============================================================================

# Output directories
export FFMPEG_OUTPUT_DIR="public/videos/clips"
export FFMPEG_TEMP_DIR="temp_ffmpeg"
export FFMPEG_METADATA_DIR="public/videos/clips/video-info"

# Input directories (common image locations)
export FFMPEG_IMAGES_DIR="public/images"
export FFMPEG_GALLERY_DIR="public/images"

# =============================================================================
# VIDEO ENCODING SETTINGS
# =============================================================================

# Quality settings
export FFMPEG_DEFAULT_CRF=23           # Constant Rate Factor (18-28, lower = higher quality)
export FFMPEG_HIGH_QUALITY_CRF=18      # High quality setting
export FFMPEG_WEB_QUALITY_CRF=23       # Web-optimized quality
export FFMPEG_PREVIEW_CRF=28           # Preview/draft quality

# Encoding presets (speed vs compression)
export FFMPEG_DEFAULT_PRESET="medium"  # Balanced speed/quality
export FFMPEG_FAST_PRESET="fast"       # Faster encoding
export FFMPEG_SLOW_PRESET="slow"       # Better compression
export FFMPEG_ULTRAFAST_PRESET="ultrafast"  # Fastest encoding

# Pixel format
export FFMPEG_PIXEL_FORMAT="yuv420p"   # Standard compatibility

# =============================================================================
# FRAME RATE SETTINGS
# =============================================================================

export FFMPEG_DEFAULT_FPS=30           # Standard frame rate
export FFMPEG_CINEMA_FPS=24            # Cinematic frame rate
export FFMPEG_SMOOTH_FPS=60            # High frame rate
export FFMPEG_SLIDESHOW_FPS=25         # Slideshow frame rate

# =============================================================================
# ASPECT RATIO & RESOLUTION SETTINGS
# =============================================================================

# Aspect ratios
export FFMPEG_LANDSCAPE_ASPECT="16:9"
export FFMPEG_PORTRAIT_ASPECT="9:16"
export FFMPEG_SQUARE_ASPECT="1:1"
export FFMPEG_INSTAGRAM_ASPECT="4:5"

# Resolutions for 16:9 (landscape)
export FFMPEG_4K_WIDTH=3840
export FFMPEG_4K_HEIGHT=2160
export FFMPEG_1080P_WIDTH=1920
export FFMPEG_1080P_HEIGHT=1080
export FFMPEG_720P_WIDTH=1280
export FFMPEG_720P_HEIGHT=720

# Resolutions for 9:16 (portrait)
export FFMPEG_PORTRAIT_1080_WIDTH=1080
export FFMPEG_PORTRAIT_1080_HEIGHT=1920
export FFMPEG_PORTRAIT_720_WIDTH=720
export FFMPEG_PORTRAIT_720_HEIGHT=1280

# Resolutions for 1:1 (square)
export FFMPEG_SQUARE_1080_WIDTH=1080
export FFMPEG_SQUARE_1080_HEIGHT=1080
export FFMPEG_SQUARE_720_WIDTH=720
export FFMPEG_SQUARE_720_HEIGHT=720

# Resolutions for 4:5 (Instagram)
export FFMPEG_INSTAGRAM_WIDTH=1080
export FFMPEG_INSTAGRAM_HEIGHT=1350

# =============================================================================
# TIMING SETTINGS
# =============================================================================

# Default durations (in seconds)
export FFMPEG_DEFAULT_IMAGE_DURATION=1.5
export FFMPEG_FAST_IMAGE_DURATION=0.5
export FFMPEG_SLOW_IMAGE_DURATION=2.0
export FFMPEG_SLIDESHOW_IMAGE_DURATION=1.2

# Default transition durations
export FFMPEG_DEFAULT_TRANSITION=0.3
export FFMPEG_QUICK_TRANSITION=0.2
export FFMPEG_SLOW_TRANSITION=0.5
export FFMPEG_CROSSFADE_DURATION=0.5

# Ken Burns settings
export FFMPEG_GENTLE_ZOOM=1.02
export FFMPEG_MEDIUM_ZOOM=1.05
export FFMPEG_STRONG_ZOOM=1.1

# =============================================================================
# TRANSITION TYPES
# =============================================================================

export FFMPEG_TRANSITIONS=(
    "fade"
    "fadeblack"
    "fadewhite"
    "distance"
    "wipeleft"
    "wiperight"
    "wipeup"
    "wipedown"
    "slideleft"
    "slideright"
    "slideup"
    "slidedown"
    "circlecrop"
    "rectcrop"
    "dissolve"
)

# =============================================================================
# AUDIO SETTINGS (for future use)
# =============================================================================

export FFMPEG_AUDIO_CODEC="aac"
export FFMPEG_AUDIO_BITRATE="128k"
export FFMPEG_AUDIO_SAMPLE_RATE="44100"

# =============================================================================
# METADATA SETTINGS
# =============================================================================

export FFMPEG_METADATA_FORMAT="json"
export FFMPEG_AUTO_SYNC_DATABASE=true
export FFMPEG_GENERATE_THUMBNAILS=false

# =============================================================================
# PERFORMANCE SETTINGS
# =============================================================================

# Thread settings (0 = auto-detect)
export FFMPEG_THREADS=0

# Memory settings
export FFMPEG_MAX_MUXING_QUEUE_SIZE=1024

# =============================================================================
# ENVIRONMENT-SPECIFIC SETTINGS
# =============================================================================

# Development vs Production
if [ "${NODE_ENV:-development}" = "production" ]; then
    export FFMPEG_LOG_LEVEL="error"
    export FFMPEG_DEFAULT_PRESET="medium"
    export FFMPEG_DEFAULT_CRF=23
else
    export FFMPEG_LOG_LEVEL="info"
    export FFMPEG_DEFAULT_PRESET="fast"
    export FFMPEG_DEFAULT_CRF=23
fi

# =============================================================================
# PLATFORM-SPECIFIC SETTINGS
# =============================================================================

# Detect operating system
case "$(uname -s)" in
    Darwin*)
        export FFMPEG_PLATFORM="mac"
        export FFMPEG_STAT_SIZE_FLAG="-f%z"
        ;;
    Linux*)
        export FFMPEG_PLATFORM="linux"
        export FFMPEG_STAT_SIZE_FLAG="-c%s"
        ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)
        export FFMPEG_PLATFORM="windows"
        export FFMPEG_STAT_SIZE_FLAG="-c%s"
        ;;
    *)
        export FFMPEG_PLATFORM="unknown"
        export FFMPEG_STAT_SIZE_FLAG="-c%s"
        ;;
esac

# =============================================================================
# SOCIAL MEDIA PRESETS
# =============================================================================

# YouTube
export YOUTUBE_LANDSCAPE_WIDTH=1920
export YOUTUBE_LANDSCAPE_HEIGHT=1080
export YOUTUBE_PORTRAIT_WIDTH=1080
export YOUTUBE_PORTRAIT_HEIGHT=1920

# Instagram
export INSTAGRAM_SQUARE_WIDTH=1080
export INSTAGRAM_SQUARE_HEIGHT=1080
export INSTAGRAM_STORY_WIDTH=1080
export INSTAGRAM_STORY_HEIGHT=1920
export INSTAGRAM_FEED_WIDTH=1080
export INSTAGRAM_FEED_HEIGHT=1350

# TikTok
export TIKTOK_WIDTH=1080
export TIKTOK_HEIGHT=1920

# Twitter/X
export TWITTER_WIDTH=1280
export TWITTER_HEIGHT=720

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Get resolution for aspect ratio and quality
get_resolution_for_aspect() {
    local aspect="$1"
    local quality="${2:-1080p}"
    
    case "$aspect:$quality" in
        "16:9:4k")     echo "${FFMPEG_4K_WIDTH}x${FFMPEG_4K_HEIGHT}" ;;
        "16:9:1080p")  echo "${FFMPEG_1080P_WIDTH}x${FFMPEG_1080P_HEIGHT}" ;;
        "16:9:720p")   echo "${FFMPEG_720P_WIDTH}x${FFMPEG_720P_HEIGHT}" ;;
        "9:16:1080p")  echo "${FFMPEG_PORTRAIT_1080_WIDTH}x${FFMPEG_PORTRAIT_1080_HEIGHT}" ;;
        "9:16:720p")   echo "${FFMPEG_PORTRAIT_720_WIDTH}x${FFMPEG_PORTRAIT_720_HEIGHT}" ;;
        "1:1:1080p")   echo "${FFMPEG_SQUARE_1080_WIDTH}x${FFMPEG_SQUARE_1080_HEIGHT}" ;;
        "1:1:720p")    echo "${FFMPEG_SQUARE_720_WIDTH}x${FFMPEG_SQUARE_720_HEIGHT}" ;;
        "4:5:1080p")   echo "${FFMPEG_INSTAGRAM_WIDTH}x${FFMPEG_INSTAGRAM_HEIGHT}" ;;
        *)             echo "${FFMPEG_1080P_WIDTH}x${FFMPEG_1080P_HEIGHT}" ;;  # Default
    esac
}

# Get preset for performance preference
get_preset_for_performance() {
    local performance="${1:-balanced}"
    
    case "$performance" in
        "fast"|"preview"|"draft")     echo "$FFMPEG_FAST_PRESET" ;;
        "balanced"|"default")         echo "$FFMPEG_DEFAULT_PRESET" ;;
        "quality"|"final")            echo "$FFMPEG_SLOW_PRESET" ;;
        "ultrafast"|"realtime")       echo "$FFMPEG_ULTRAFAST_PRESET" ;;
        *)                            echo "$FFMPEG_DEFAULT_PRESET" ;;
    esac
}

# Get CRF for quality preference
get_crf_for_quality() {
    local quality="${1:-web}"
    
    case "$quality" in
        "high"|"archive"|"final")     echo "$FFMPEG_HIGH_QUALITY_CRF" ;;
        "web"|"default"|"standard")   echo "$FFMPEG_WEB_QUALITY_CRF" ;;
        "preview"|"draft"|"low")      echo "$FFMPEG_PREVIEW_CRF" ;;
        *)                            echo "$FFMPEG_WEB_QUALITY_CRF" ;;
    esac
}

# =============================================================================
# INITIALIZATION MESSAGE
# =============================================================================

if [ "${FFMPEG_CONFIG_LOADED:-}" != "true" ]; then
    export FFMPEG_CONFIG_LOADED="true"
    # Uncomment for debugging
    # echo "📋 FFmpeg configuration loaded for $FFMPEG_PLATFORM platform"
fi 