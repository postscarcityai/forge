#!/bin/bash

# Slide Transition Directional - Image to Video
# Takes multiple still images and creates video with sliding transitions
# Usage: ./slide-transition-directional.sh --direction left [images...]

# Default settings
DIRECTION="right"
DURATION_PER_IMAGE=1.2
TRANSITION_DURATION=0.3
OUTPUT_DIR="public/videos/clips"
ASPECT_RATIO="9:16"  # Default to 9:16 (mobile/portrait), can be changed to 16:9
FPS=30

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --direction)
            DIRECTION="$2"
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
        --duration)
            DURATION_PER_IMAGE="$2"
            shift 2
            ;;
        --transition)
            TRANSITION_DURATION="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 --direction [left|right|up|down|random] [options] [images...]"
            echo "Options:"
            echo "  --direction    Slide direction (left|right|up|down|random)"
            echo "  --aspect       Aspect ratio (16:9|9:16)"
            echo "  --fps          Frame rate (default: 30)"
            echo "  --duration     Duration per image in seconds (default: 1.2)"
            echo "  --transition   Transition duration in seconds (default: 0.3)"
            echo ""
            echo "Examples:"
            echo "  $0 --direction left img1.jpg img2.jpg img3.jpg"
            echo "  $0 --direction random --aspect 9:16 *.jpg"
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
    echo "❌ Error: Need at least 2 images to create transitions"
    echo "Usage: $0 --direction [left|right|up|down|random] [images...]"
    echo "Use --help for more options"
    exit 1
fi

# Validate direction
case $DIRECTION in
    left|right|up|down|random)
        ;;
    *)
        echo "❌ Error: Invalid direction '$DIRECTION'"
        echo "Valid directions: left, right, up, down, random"
        exit 1
        ;;
esac

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
OUTPUT_FILE="$OUTPUT_DIR/slide-transition-${DIRECTION}-$(date +%Y-%m-%dT%H-%M-%S-%3NZ).mp4"

echo "🎬 Creating slide transition video..."
echo "📊 Settings:"
echo "   • Direction: $DIRECTION"
echo "   • Images: ${#IMAGES[@]}"
echo "   • Duration per image: ${DURATION_PER_IMAGE}s"
echo "   • Transition duration: ${TRANSITION_DURATION}s"
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
    FFMPEG_INPUTS="$FFMPEG_INPUTS -loop 1 -t $(echo "$DURATION_PER_IMAGE + $TRANSITION_DURATION" | bc -l) -i \"$img\""
done

# Generate transition directions for random mode
DIRECTIONS=("slideleft" "slideright" "slideup" "slidedown")
if [ "$DIRECTION" = "random" ]; then
    echo "🎲 Using random slide directions..."
fi

# Build filter complex for scaling and transitions
FILTER_COMPLEX=""

# Scale all inputs
for i in $(seq 0 $((${#IMAGES[@]} - 1))); do
    FILTER_COMPLEX="$FILTER_COMPLEX[${i}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1[v${i}];"
done

# Add transitions
CURRENT_STREAM="v0"
for i in $(seq 1 $((${#IMAGES[@]} - 1))); do
    # Calculate offset for this transition
    OFFSET=$(echo "($i * $DURATION_PER_IMAGE) - (($i - 1) * $TRANSITION_DURATION)" | bc -l)
    
    # Determine transition direction
    if [ "$DIRECTION" = "random" ]; then
        # Pick random direction
        RANDOM_INDEX=$((RANDOM % 4))
        TRANSITION_DIR=${DIRECTIONS[$RANDOM_INDEX]}
        echo "   Transition $i: $TRANSITION_DIR"
    else
        # Use specified direction
        case $DIRECTION in
            left) TRANSITION_DIR="slideleft" ;;
            right) TRANSITION_DIR="slideright" ;;
            up) TRANSITION_DIR="slideup" ;;
            down) TRANSITION_DIR="slidedown" ;;
        esac
    fi
    
    # Add transition to filter complex
    FILTER_COMPLEX="$FILTER_COMPLEX[${CURRENT_STREAM}][v${i}]xfade=transition=${TRANSITION_DIR}:duration=${TRANSITION_DURATION}:offset=${OFFSET}[t${i}];"
    CURRENT_STREAM="t${i}"
done

# Remove trailing semicolon
FILTER_COMPLEX=${FILTER_COMPLEX%;}

echo "🎞️ Generating video with slide transitions..."

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
    TOTAL_DURATION=$(echo "${#IMAGES[@]} * $DURATION_PER_IMAGE - (${#IMAGES[@]} - 1) * $TRANSITION_DURATION" | bc -l)
    
    # Generate metadata file
    DIRECTION_CAPS=$(echo "$DIRECTION" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
    cat > "${OUTPUT_FILE}.meta.json" << EOF
{
  "concept": "Slide Transition $DIRECTION_CAPS",
  "prompt": "Image-to-video slide transition sequence with ${DIRECTION} directional movement",
  "images_used": ${#IMAGES[@]},
  "duration_per_image": $DURATION_PER_IMAGE,
  "transition_duration": $TRANSITION_DURATION,
  "total_duration": $TOTAL_DURATION,
  "direction": "$DIRECTION",
  "aspect_ratio": "$ASPECT_RATIO",
  "resolution": "$RESOLUTION",
  "frame_rate": $FPS,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "script_used": "slide-transition-directional.sh",
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
    echo "   • Transitions: $((${#IMAGES[@]} - 1))"
    echo "   • Direction: $DIRECTION"
    echo "   • Resolution: $RESOLUTION"
    echo "   • Metadata saved: ${OUTPUT_FILE}.meta.json"
    
else
    echo "❌ Error: FFmpeg failed to create video"
    exit 1
fi

echo ""
echo "🎬 Slide transition video complete! 🎞️" 