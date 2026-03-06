#!/bin/bash

# Talking Heads Crossfade Simple - Image to Video
# Takes multiple portrait images and creates video with simple crossfade transitions
# Usage: ./talking-heads-crossfade-simple.sh [options] [images...]

# Default settings
DURATION_PER_IMAGE=1.5
FADE_DURATION=0.5
OUTPUT_DIR="public/videos/clips"
ASPECT_RATIO="9:16"  # Default to 9:16 (portrait)
FPS=30

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --duration)
            DURATION_PER_IMAGE="$2"
            shift 2
            ;;
        --fade)
            FADE_DURATION="$2"
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
        --help)
            echo "Usage: $0 [options] [images...]"
            echo "Options:"
            echo "  --duration     Duration per image in seconds (default: 1.5)"
            echo "  --fade         Crossfade duration in seconds (default: 0.5)"
            echo "  --aspect       Aspect ratio (16:9|9:16) (default: 9:16)"
            echo "  --fps          Frame rate (default: 30)"
            echo ""
            echo "Examples:"
            echo "  $0 portrait1.jpg portrait2.jpg portrait3.jpg"
            echo "  $0 --duration 2.0 --fade 0.3 *.jpg"
            echo "  $0 --aspect 16:9 team/*.jpg"
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Collect image arguments
IMAGES=("$@")

# Validate inputs
if [ ${#IMAGES[@]} -lt 2 ]; then
    echo "❌ Error: Need at least 2 images for crossfade transitions"
    echo "Usage: $0 [options] [images...]"
    echo "Use --help for more options"
    exit 1
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
OUTPUT_FILE="$OUTPUT_DIR/talking-heads-crossfade-$(date +%Y-%m-%dT%H-%M-%S-%3NZ).mp4"

echo "🎬 Creating talking heads video with crossfade transitions..."
echo "📊 Settings:"
echo "   • Images: ${#IMAGES[@]}"
echo "   • Duration per image: ${DURATION_PER_IMAGE}s"
echo "   • Crossfade duration: ${FADE_DURATION}s"
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
    echo "✓ Found: $img"
done

# Build FFmpeg input arguments
FFMPEG_INPUTS=""
for img in "${IMAGES[@]}"; do
    FFMPEG_INPUTS="$FFMPEG_INPUTS -loop 1 -t $(echo "$DURATION_PER_IMAGE + $FADE_DURATION" | bc -l) -i \"$img\""
done

# Build filter complex for scaling and crossfades
FILTER_COMPLEX=""

# Scale all inputs
for i in $(seq 0 $((${#IMAGES[@]} - 1))); do
    FILTER_COMPLEX="$FILTER_COMPLEX[${i}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1,fps=${FPS}[v${i}];"
done

# Add crossfade transitions
CURRENT_STREAM="v0"
for i in $(seq 1 $((${#IMAGES[@]} - 1))); do
    # Calculate offset for this transition
    OFFSET=$(echo "($i * $DURATION_PER_IMAGE) - (($i - 1) * $FADE_DURATION)" | bc -l)
    
    # Add crossfade transition
    FILTER_COMPLEX="$FILTER_COMPLEX[${CURRENT_STREAM}][v${i}]xfade=transition=fade:duration=${FADE_DURATION}:offset=${OFFSET}[fade${i}];"
    CURRENT_STREAM="fade${i}"
done

# Remove trailing semicolon
FILTER_COMPLEX=${FILTER_COMPLEX%;}

echo "🎞️ Generating video with crossfade transitions..."

# Execute FFmpeg command
eval "ffmpeg -y $FFMPEG_INPUTS \
    -filter_complex \"$FILTER_COMPLEX\" \
    -map \"[${CURRENT_STREAM}]\" \
    -c:v libx264 \
    -preset medium \
    -crf 23 \
    -pix_fmt yuv420p \
    -r $FPS \
    \"$OUTPUT_FILE\""

# Check if FFmpeg succeeded
if [ $? -eq 0 ]; then
    echo "✅ Video created successfully!"
    echo "📁 Output: $OUTPUT_FILE"
    
    # Calculate total duration
    TOTAL_DURATION=$(echo "${#IMAGES[@]} * $DURATION_PER_IMAGE - (${#IMAGES[@]} - 1) * $FADE_DURATION" | bc -l)
    
    # Generate metadata file
    cat > "${OUTPUT_FILE}.meta.json" << EOF
{
  "concept": "Talking Heads Crossfade Simple",
  "prompt": "Portrait sequence with simple crossfade transitions between talking heads",
  "images_used": ${#IMAGES[@]},
  "duration_per_image": $DURATION_PER_IMAGE,
  "fade_duration": $FADE_DURATION,
  "total_duration": $TOTAL_DURATION,
  "transition_type": "crossfade",
  "aspect_ratio": "$ASPECT_RATIO",
  "resolution": "$RESOLUTION",
  "frame_rate": $FPS,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "script_used": "talking-heads-crossfade-simple.sh",
  "ffmpeg_settings": {
    "codec": "libx264",
    "preset": "medium",
    "crf": 23,
    "pixel_format": "yuv420p"
  },
  "input_images": [
$(printf '    "%s"' "${IMAGES[@]}" | sed 's/$/,/g' | sed '$s/,$//')
  ]
}
EOF
    
    echo "📊 Video Stats:"
    echo "   • Total duration: ${TOTAL_DURATION}s"
    echo "   • Number of crossfades: $((${#IMAGES[@]} - 1))"
    echo "   • Resolution: $RESOLUTION"
    echo "   • Metadata saved: ${OUTPUT_FILE}.meta.json"
    
else
    echo "❌ Error: FFmpeg failed to create video"
    exit 1
fi 