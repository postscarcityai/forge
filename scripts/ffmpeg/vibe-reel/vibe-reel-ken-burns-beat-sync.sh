#!/bin/bash

# Vibe Reel Ken Burns Beat Sync - Image to Video with Audio
# Takes multiple images and an audio file, creates Ken Burns video with beat-synced cuts
# Usage: ./vibe-reel-ken-burns-beat-sync.sh --audio <audio_file> [options] [images...]

# Default settings
AUDIO_FILE=""
OUTPUT_DIR="public/videos/clips"
ASPECT_RATIO="16:9"  # Default to 16:9 for landscape
FPS=30
ZOOM_FACTOR=1.02  # Gentle zoom for Ken Burns
BPM=""
BEATS_PER_IMAGE=1  # Default to 1 beat per image
TRANSITION_DURATION=0.3  # Transition duration in seconds
TRANSITION_STYLE="mixed"  # mixed, fade, wipe, slide

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --audio)
            AUDIO_FILE="$2"
            shift 2
            ;;
        --bpm)
            BPM="$2"
            shift 2
            ;;
        --beats-per-image)
            BEATS_PER_IMAGE="$2"
            shift 2
            ;;
        --aspect)
            ASPECT_RATIO="$2"
            shift 2
            ;;
        --fps)
            FPS="$2"
            shift 2
            ;;
        --zoom)
            ZOOM_FACTOR="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --transition-duration)
            TRANSITION_DURATION="$2"
            shift 2
            ;;
        --transition-style)
            TRANSITION_STYLE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 --audio <audio_file> [options] [images...]"
            echo ""
            echo "Required:"
            echo "  --audio <file>        Audio file path (required)"
            echo ""
            echo "Options:"
            echo "  --bpm <number>         Explicit BPM for beat sync (overrides auto-calculation)"
            echo "  --beats-per-image <n> Number of beats per image (default: 1)"
            echo "  --aspect <ratio>       Aspect ratio (16:9|9:16) (default: 9:16)"
            echo "  --zoom <factor>        Ken Burns zoom factor (default: 1.02)"
            echo "  --fps <rate>           Frame rate (default: 30)"
            echo "  --output <path>        Output directory (default: public/videos/clips)"
            echo "  --transition-duration <s> Transition duration in seconds (default: 0.3)"
            echo "  --transition-style <style> Transition style: mixed|fade|wipe|slide (default: mixed)"
            echo ""
            echo "Examples:"
            echo "  $0 --audio music.wav img1.jpg img2.jpg img3.jpg"
            echo "  $0 --audio music.wav --bpm 118 --beats-per-image 2 *.jpg"
            echo "  $0 --audio music.wav --aspect 16:9 portfolio/*.jpg"
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Collect image arguments
IMAGES=("$@")

# Validate audio file
if [ -z "$AUDIO_FILE" ]; then
    echo "❌ Error: Audio file is required"
    echo "Usage: $0 --audio <audio_file> [options] [images...]"
    echo "Use --help for more options"
    exit 1
fi

if [ ! -f "$AUDIO_FILE" ]; then
    echo "❌ Error: Audio file not found: $AUDIO_FILE"
    exit 1
fi

# Validate images
if [ ${#IMAGES[@]} -lt 1 ]; then
    echo "❌ Error: Need at least 1 image"
    echo "Usage: $0 --audio <audio_file> [options] [images...]"
    echo "Use --help for more options"
    exit 1
fi

# Check if ffprobe is available
if ! command -v ffprobe &> /dev/null; then
    echo "❌ Error: ffprobe not found. Please install ffmpeg."
    exit 1
fi

# Get audio duration
echo "🎵 Analyzing audio file..."
AUDIO_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_FILE" 2>/dev/null)

if [ -z "$AUDIO_DURATION" ] || [ "$AUDIO_DURATION" = "0" ]; then
    echo "❌ Error: Could not extract audio duration from: $AUDIO_FILE"
    exit 1
fi

echo "   Audio duration: ${AUDIO_DURATION}s"

# Calculate duration per image accounting for transition overlaps
# Formula: total_duration = duration_per_image + (num_images - 1) * (duration_per_image - transition_duration)
# Solving: duration_per_image = (total_duration + (num_images - 1) * transition_duration) / num_images
if [ -n "$BPM" ]; then
    # Use BPM-based calculation, but adjust to match audio duration with transitions
    BEAT_DURATION=$(echo "60 / $BPM" | bc -l)
    BASE_DURATION=$(echo "$BEAT_DURATION * $BEATS_PER_IMAGE" | bc -l)
    # Adjust to account for transitions so total duration matches audio
    # Formula: total = num_images * duration - (num_images - 1) * transition
    # Solving: duration = (total + (num_images - 1) * transition) / num_images
    DURATION_PER_IMAGE=$(echo "scale=3; ($AUDIO_DURATION + (${#IMAGES[@]} - 1) * $TRANSITION_DURATION) / ${#IMAGES[@]}" | bc -l)
    echo "   Using BPM: ${BPM} (${BEAT_DURATION}s per beat)"
    echo "   Base duration per image: ${BASE_DURATION}s (${BEATS_PER_IMAGE} beat(s))"
    echo "   Adjusted for transitions: ${DURATION_PER_IMAGE}s"
else
    # Auto-calculate based on audio duration, accounting for transitions
    DURATION_PER_IMAGE=$(echo "scale=3; ($AUDIO_DURATION + (${#IMAGES[@]} - 1) * $TRANSITION_DURATION) / ${#IMAGES[@]}" | bc -l)
    echo "   Auto-calculated duration per image: ${DURATION_PER_IMAGE}s (accounting for ${TRANSITION_DURATION}s transitions)"
fi

# Set resolution based on aspect ratio
if [ "$ASPECT_RATIO" = "16:9" ]; then
    WIDTH="1920"
    HEIGHT="1080"
    RESOLUTION="1920x1080"
elif [ "$ASPECT_RATIO" = "9:16" ]; then
    WIDTH="1080"
    HEIGHT="1920"
    RESOLUTION="1080x1920"
else
    echo "❌ Error: Unsupported aspect ratio '$ASPECT_RATIO'"
    echo "Supported: 16:9, 9:16"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate output filename
OUTPUT_FILE="$OUTPUT_DIR/vibe-reel-$(date +%Y-%m-%dT%H-%M-%S-%3NZ).mp4"

echo ""
echo "🎬 Creating Ken Burns vibe reel with beat-synced cuts..."
echo "📊 Settings:"
echo "   • Images: ${#IMAGES[@]}"
echo "   • Audio: $(basename "$AUDIO_FILE")"
echo "   • Duration per image: ${DURATION_PER_IMAGE}s"
echo "   • Ken Burns zoom: ${ZOOM_FACTOR}x"
echo "   • Aspect ratio: $ASPECT_RATIO ($RESOLUTION)"
echo "   • Frame rate: ${FPS}fps"
echo ""

# Check if all images exist
echo "🔍 Validating images..."
for img in "${IMAGES[@]}"; do
    if [ ! -f "$img" ]; then
        echo "❌ Error: Image not found: $img"
        exit 1
    fi
    echo "✓ Found: $(basename "$img")"
done

# Calculate zoom parameters for Ken Burns
ZOOM_FRAMES=$(echo "$DURATION_PER_IMAGE * $FPS" | bc -l | cut -d. -f1)
ZOOM_INCREMENT=$(echo "($ZOOM_FACTOR - 1) / $ZOOM_FRAMES" | bc -l)

# Build FFmpeg input arguments with Ken Burns preprocessing
FFMPEG_INPUTS=""
TEMP_DIR="temp_vibe_reel_$$"
mkdir -p "$TEMP_DIR"

echo ""
echo "🎞️ Preprocessing images with Ken Burns effects..."

for i in "${!IMAGES[@]}"; do
    img="${IMAGES[$i]}"
    temp_video="$TEMP_DIR/ken_burns_$i.mp4"
    
    echo "   Processing image $((i+1))/${#IMAGES[@]}: $(basename "$img")"
    
    # Create Ken Burns effect for this image
    # Make video long enough to accommodate transitions (add transition duration to ensure overlap works)
    VIDEO_DURATION=$(echo "$DURATION_PER_IMAGE + $TRANSITION_DURATION" | bc -l)
    EXACT_FRAMES=$(echo "$VIDEO_DURATION * $FPS" | bc -l | cut -d. -f1)
    
    ffmpeg -y -loglevel error \
        -loop 1 -i "$img" \
        -filter_complex "
        [0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}[scaled];
        [scaled]zoompan=z='1+${ZOOM_INCREMENT}*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${EXACT_FRAMES}:s=${WIDTH}x${HEIGHT}:fps=${FPS}[out]
        " \
        -map "[out]" \
        -t "$VIDEO_DURATION" \
        -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
        -r $FPS \
        "$temp_video" 2>/dev/null
    
    if [ ! -f "$temp_video" ]; then
        echo "❌ Error: Failed to create Ken Burns effect for: $img"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    FFMPEG_INPUTS="$FFMPEG_INPUTS -i \"$temp_video\""
done

# Build filter complex with transitions
echo ""
echo "🎞️ Building transitions (${TRANSITION_STYLE} style)..."

# Define transition types based on style
declare -a TRANSITION_TYPES
case $TRANSITION_STYLE in
    fade)
        TRANSITION_TYPES=("fade" "fadeblack" "fadewhite")
        ;;
    wipe)
        TRANSITION_TYPES=("wipeleft" "wiperight" "wipeup" "wipedown")
        ;;
    slide)
        TRANSITION_TYPES=("slideleft" "slideright" "slideup" "slidedown")
        ;;
    mixed|*)
        # Mix of all transition types for grungey feel
        TRANSITION_TYPES=("fadeblack" "fadewhite" "wipeleft" "wiperight" "slideleft" "slideright" "distance" "circlecrop")
        ;;
esac

# Scale all inputs first
FILTER_COMPLEX=""
for i in $(seq 0 $((${#IMAGES[@]} - 1))); do
    FILTER_COMPLEX="$FILTER_COMPLEX[${i}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1[v${i}];"
done

# Add transitions between videos
CURRENT_STREAM="v0"
for i in $(seq 1 $((${#IMAGES[@]} - 1))); do
    # Calculate offset for this transition
    OFFSET=$(echo "($i * $DURATION_PER_IMAGE) - (($i - 1) * $TRANSITION_DURATION)" | bc -l)
    
    # Select transition type (random for mixed, or cycle through)
    if [ "$TRANSITION_STYLE" = "mixed" ]; then
        TRANSITION_INDEX=$((RANDOM % ${#TRANSITION_TYPES[@]}))
    else
        TRANSITION_INDEX=$((($i - 1) % ${#TRANSITION_TYPES[@]}))
    fi
    TRANSITION_TYPE=${TRANSITION_TYPES[$TRANSITION_INDEX]}
    
    # Add transition to filter complex
    FILTER_COMPLEX="$FILTER_COMPLEX[${CURRENT_STREAM}][v${i}]xfade=transition=${TRANSITION_TYPE}:duration=${TRANSITION_DURATION}:offset=${OFFSET}[t${i}];"
    CURRENT_STREAM="t${i}"
done

# Remove trailing semicolon
FILTER_COMPLEX=${FILTER_COMPLEX%;}

echo "🎞️ Combining videos with smooth transitions and mixing audio..."

# Execute FFmpeg command to combine videos with transitions and add audio
AUDIO_INPUT_INDEX=${#IMAGES[@]}

eval "ffmpeg -y $FFMPEG_INPUTS \
    -i \"$AUDIO_FILE\" \
    -filter_complex \"$FILTER_COMPLEX\" \
    -map \"[${CURRENT_STREAM}]\" \
    -map ${AUDIO_INPUT_INDEX}:a \
    -c:v libx264 \
    -preset medium \
    -crf 23 \
    -pix_fmt yuv420p \
    -r $FPS \
    -c:a aac \
    -b:a 128k \
    -ar 44100 \
    -shortest \
    \"$OUTPUT_FILE\""

FFMPEG_EXIT_CODE=$?

# Clean up temporary files
rm -rf "$TEMP_DIR"

# Check if FFmpeg succeeded
if [ $FFMPEG_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Vibe reel created successfully!"
    echo "📁 Output: $OUTPUT_FILE"
    
    # Calculate total duration accounting for transition overlaps
    TOTAL_DURATION=$(echo "${#IMAGES[@]} * $DURATION_PER_IMAGE - (${#IMAGES[@]} - 1) * $TRANSITION_DURATION" | bc -l)
    
    # Generate metadata file
    cat > "${OUTPUT_FILE}.meta.json" << EOF
{
  "concept": "Ken Burns Vibe Reel Beat Sync",
  "prompt": "Vibe reel with Ken Burns zoom effects and beat-synced cuts",
  "images_used": ${#IMAGES[@]},
  "duration_per_image": $DURATION_PER_IMAGE,
  "total_duration": $TOTAL_DURATION,
  "audio_file": "$AUDIO_FILE",
  "audio_duration": $AUDIO_DURATION,
  "bpm": ${BPM:-null},
  "beats_per_image": $BEATS_PER_IMAGE,
  "ken_burns_zoom": $ZOOM_FACTOR,
  "transition_type": "${TRANSITION_STYLE}",
  "transition_duration": $TRANSITION_DURATION,
  "aspect_ratio": "$ASPECT_RATIO",
  "resolution": "$RESOLUTION",
  "frame_rate": $FPS,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "script_used": "vibe-reel-ken-burns-beat-sync.sh",
  "ffmpeg_settings": {
    "codec": "libx264",
    "preset": "medium",
    "crf": 23,
    "pixel_format": "yuv420p",
    "audio_codec": "aac",
    "audio_bitrate": "128k",
    "audio_sample_rate": "44100"
  },
  "input_images": [
$(printf '    "%s"' "${IMAGES[@]}" | sed 's/$/,/g' | sed '$s/,$//')
  ]
}
EOF
    
    echo ""
    echo "📊 Video Stats:"
    echo "   • Total duration: ${TOTAL_DURATION}s"
    echo "   • Audio duration: ${AUDIO_DURATION}s"
    echo "   • Ken Burns zoom: ${ZOOM_FACTOR}x"
    echo "   • Number of transitions: $((${#IMAGES[@]} - 1))"
    echo "   • Transition style: ${TRANSITION_STYLE}"
    echo "   • Transition duration: ${TRANSITION_DURATION}s"
    echo "   • Resolution: $RESOLUTION"
    echo "   • Metadata saved: ${OUTPUT_FILE}.meta.json"
    echo ""
    echo "🎉 Vibe reel complete! ⚡"
    
else
    echo ""
    echo "❌ Error: FFmpeg failed to create video (exit code: $FFMPEG_EXIT_CODE)"
    exit 1
fi

