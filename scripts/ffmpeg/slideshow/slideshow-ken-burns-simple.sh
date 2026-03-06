#!/bin/bash

# Slideshow Ken Burns Simple - Image to Video
# Takes multiple images and creates slideshow with Ken Burns zoom effects
# Usage: ./slideshow-ken-burns-simple.sh [options] [images...]

# Default settings
DURATION_PER_IMAGE=1.5
TRANSITION_DURATION=0.3
OUTPUT_DIR="public/videos/clips"
ASPECT_RATIO="16:9"  # Default to 16:9 (landscape)
FPS=25
ZOOM_FACTOR=1.02  # Gentle zoom for Ken Burns

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --duration)
            DURATION_PER_IMAGE="$2"
            shift 2
            ;;
        --transition)
            TRANSITION_DURATION="$2"
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
        --help)
            echo "Usage: $0 [options] [images...]"
            echo "Options:"
            echo "  --duration     Duration per image in seconds (default: 1.5)"
            echo "  --transition   Transition duration in seconds (default: 0.3)"
            echo "  --aspect       Aspect ratio (16:9|9:16) (default: 16:9)"
            echo "  --fps          Frame rate (default: 25)"
            echo "  --zoom         Ken Burns zoom factor (default: 1.02)"
            echo ""
            echo "Examples:"
            echo "  $0 img1.jpg img2.jpg img3.jpg"
            echo "  $0 --duration 2.0 --zoom 1.05 *.jpg"
            echo "  $0 --aspect 9:16 portfolio/*.jpg"
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
    echo "❌ Error: Need at least 2 images for slideshow"
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
OUTPUT_FILE="$OUTPUT_DIR/slideshow-ken-burns-$(date +%Y-%m-%dT%H-%M-%S-%3NZ).mp4"

echo "🎬 Creating Ken Burns slideshow..."
echo "📊 Settings:"
echo "   • Images: ${#IMAGES[@]}"
echo "   • Duration per image: ${DURATION_PER_IMAGE}s"
echo "   • Transition duration: ${TRANSITION_DURATION}s"
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
    echo "✓ Found: $img"
done

# Calculate zoom parameters for Ken Burns
ZOOM_FRAMES=$(echo "$DURATION_PER_IMAGE * $FPS" | bc -l | cut -d. -f1)
ZOOM_INCREMENT=$(echo "($ZOOM_FACTOR - 1) / $ZOOM_FRAMES" | bc -l)

# Build FFmpeg input arguments with Ken Burns preprocessing
FFMPEG_INPUTS=""
TEMP_DIR="temp_ken_burns"
mkdir -p "$TEMP_DIR"

echo "🎞️ Preprocessing images with Ken Burns effects..."

for i in "${!IMAGES[@]}"; do
    img="${IMAGES[$i]}"
    temp_video="$TEMP_DIR/ken_burns_$i.mp4"
    
    echo "   Processing image $((i+1))/${#IMAGES[@]}: $(basename "$img")"
    
    # Create Ken Burns effect for this image
    ffmpeg -y -loglevel error \
        -loop 1 -t "$DURATION_PER_IMAGE" -i "$img" \
        -filter_complex "
        [0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}[scaled];
        [scaled]zoompan=z='1+${ZOOM_INCREMENT}*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${ZOOM_FRAMES}:s=${WIDTH}x${HEIGHT}:fps=${FPS}[out]
        " \
        -map "[out]" \
        -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
        "$temp_video"
    
    FFMPEG_INPUTS="$FFMPEG_INPUTS -i \"$temp_video\""
done

# Build filter complex for slide transitions between Ken Burns videos
FILTER_COMPLEX=""
CURRENT_STREAM="0:v"

for i in $(seq 1 $((${#IMAGES[@]} - 1))); do
    # Calculate offset for this transition
    OFFSET=$(echo "($i * $DURATION_PER_IMAGE) - (($i - 1) * $TRANSITION_DURATION)" | bc -l)
    
    # Add slide transition
    FILTER_COMPLEX="$FILTER_COMPLEX[${CURRENT_STREAM}][${i}:v]xfade=transition=slideright:duration=${TRANSITION_DURATION}:offset=${OFFSET}[slide${i}];"
    CURRENT_STREAM="slide${i}"
done

# Remove trailing semicolon if exists
FILTER_COMPLEX=${FILTER_COMPLEX%;}

echo "🎞️ Combining Ken Burns videos with slide transitions..."

# Execute FFmpeg command to combine with transitions
if [ ${#IMAGES[@]} -eq 1 ]; then
    # Single image - just copy the Ken Burns video
    eval "ffmpeg -y $FFMPEG_INPUTS -c copy \"$OUTPUT_FILE\""
else
    # Multiple images - add transitions
    eval "ffmpeg -y $FFMPEG_INPUTS \
        -filter_complex \"$FILTER_COMPLEX\" \
        -map \"[${CURRENT_STREAM}]\" \
        -c:v libx264 \
        -preset medium \
        -crf 23 \
        -pix_fmt yuv420p \
        -r $FPS \
        \"$OUTPUT_FILE\""
fi

# Clean up temporary files
rm -rf "$TEMP_DIR"

# Check if FFmpeg succeeded
if [ $? -eq 0 ]; then
    echo "✅ Video created successfully!"
    echo "📁 Output: $OUTPUT_FILE"
    
    # Calculate total duration
    TOTAL_DURATION=$(echo "${#IMAGES[@]} * $DURATION_PER_IMAGE - (${#IMAGES[@]} - 1) * $TRANSITION_DURATION" | bc -l)
    
    # Generate metadata file
    cat > "${OUTPUT_FILE}.meta.json" << EOF
{
  "concept": "Ken Burns Slideshow Simple",
  "prompt": "Slideshow with gentle Ken Burns zoom effects and slide transitions",
  "images_used": ${#IMAGES[@]},
  "duration_per_image": $DURATION_PER_IMAGE,
  "transition_duration": $TRANSITION_DURATION,
  "total_duration": $TOTAL_DURATION,
  "ken_burns_zoom": $ZOOM_FACTOR,
  "transition_type": "slide",
  "aspect_ratio": "$ASPECT_RATIO",
  "resolution": "$RESOLUTION",
  "frame_rate": $FPS,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "script_used": "slideshow-ken-burns-simple.sh",
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
    echo "   • Ken Burns zoom: ${ZOOM_FACTOR}x"
    echo "   • Number of transitions: $((${#IMAGES[@]} - 1))"
    echo "   • Resolution: $RESOLUTION"
    echo "   • Metadata saved: ${OUTPUT_FILE}.meta.json"
    
else
    echo "❌ Error: FFmpeg failed to create video"
    exit 1
fi 