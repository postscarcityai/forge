#!/bin/bash

# Cut Transition Rhythmic - Image to Video
# Takes multiple still images or directories and creates video with sharp cuts and rhythmic timing
# Usage: ./cut-transition-rhythmic.sh --rhythm fast [images_or_directories...]

# Default settings
RHYTHM="medium"
OUTPUT_DIR="public/videos/clips"
ASPECT_RATIO="9:16"  # Default to 9:16 (mobile/portrait), can be changed to 16:9
FPS=30

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rhythm)
            RHYTHM="$2"
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
            echo "Usage: $0 --rhythm [fast|medium|slow] [options] [images_or_directories...]"
            echo "Options:"
            echo "  --rhythm       Cut timing (fast|medium|slow)"
            echo "  --aspect       Aspect ratio (16:9|9:16)"
            echo "  --fps          Frame rate (default: 30)"
            echo ""
            echo "Rhythm timings:"
            echo "  fast    - 0.5s per image (high energy)"
            echo "  medium  - 1.0s per image (balanced)"
            echo "  slow    - 1.5s per image (contemplative)"
            echo ""
            echo "Examples:"
            echo "  $0 --rhythm fast img1.jpg img2.jpg img3.jpg"
            echo "  $0 --rhythm slow --aspect 9:16 *.jpg"
            echo "  $0 --rhythm fast /path/to/images/ /another/path/"
            echo "  $0 --rhythm medium dir1/ dir2/ img3.jpg"
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Collect image and directory arguments
INPUT_ARGS=("$@")

# Function to find all image files in a directory
find_images_in_dir() {
    local dir="$1"
    find "$dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.bmp" -o -iname "*.tiff" -o -iname "*.webp" \) | sort
}

# Process inputs and build image list
IMAGES=()
echo "🔍 Processing inputs..."

for input in "${INPUT_ARGS[@]}"; do
    if [ -d "$input" ]; then
        echo "📁 Processing directory: $input"
        # It's a directory - find all images
        while IFS= read -r -d '' image; do
            IMAGES+=("$image")
        done < <(find "$input" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.bmp" -o -iname "*.tiff" -o -iname "*.webp" \) -print0 | sort -z)
        
        # Count images found in this directory
        dir_count=$(find "$input" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.bmp" -o -iname "*.tiff" -o -iname "*.webp" \) | wc -l)
        echo "   Found $dir_count images in $input"
        
    elif [ -f "$input" ]; then
        # It's a file - check if it's an image
        if [[ "$input" =~ \.(jpg|jpeg|png|bmp|tiff|webp)$ ]]; then
            echo "🖼️  Adding image file: $input"
            IMAGES+=("$input")
        else
            echo "⚠️  Skipping non-image file: $input"
        fi
    else
        echo "❌ Warning: Not found or not accessible: $input"
    fi
done

# Validate inputs
if [ ${#IMAGES[@]} -lt 3 ]; then
    echo "❌ Error: Need at least 3 images for rhythmic cuts"
    echo "Found ${#IMAGES[@]} images total"
    echo "Usage: $0 --rhythm [fast|medium|slow] [images_or_directories...]"
    echo "Use --help for more options"
    exit 1
fi

echo "✅ Total images collected: ${#IMAGES[@]}"

# Set duration based on rhythm
case $RHYTHM in
    fast)
        DURATION_PER_IMAGE=0.5
        ;;
    medium)
        DURATION_PER_IMAGE=1.0
        ;;
    slow)
        DURATION_PER_IMAGE=1.5
        ;;
    *)
        echo "❌ Error: Invalid rhythm '$RHYTHM'"
        echo "Valid rhythms: fast, medium, slow"
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
OUTPUT_FILE="$OUTPUT_DIR/cut-transition-${RHYTHM}-$(date +%Y-%m-%dT%H-%M-%S-%3NZ).mp4"

echo "🎬 Creating rhythmic cut transition video..."
echo "📊 Settings:"
echo "   • Rhythm: $RHYTHM"
echo "   • Images: ${#IMAGES[@]}"
echo "   • Duration per image: ${DURATION_PER_IMAGE}s"
echo "   • No transition effects (sharp cuts)"
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
    FFMPEG_INPUTS="$FFMPEG_INPUTS -loop 1 -t $DURATION_PER_IMAGE -i \"$img\""
done

# Build filter complex for scaling (no transitions - just cuts)
FILTER_COMPLEX=""

# Scale all inputs
for i in $(seq 0 $((${#IMAGES[@]} - 1))); do
    FILTER_COMPLEX="$FILTER_COMPLEX[${i}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1[v${i}];"
done

# Concatenate all scaled videos (sharp cuts, no transitions)
CONCAT_INPUTS=""
for i in $(seq 0 $((${#IMAGES[@]} - 1))); do
    CONCAT_INPUTS="$CONCAT_INPUTS[v${i}]"
done

FILTER_COMPLEX="${FILTER_COMPLEX}${CONCAT_INPUTS}concat=n=${#IMAGES[@]}:v=1:a=0[out]"

echo "🎞️ Generating video with rhythmic cuts..."

# Execute FFmpeg command
eval "ffmpeg -y $FFMPEG_INPUTS \
    -filter_complex \"$FILTER_COMPLEX\" \
    -map \"[out]\" \
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
    TOTAL_DURATION=$(echo "${#IMAGES[@]} * $DURATION_PER_IMAGE" | bc -l)
    
    # Generate metadata file
    RHYTHM_CAPS=$(echo "$RHYTHM" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
    cat > "${OUTPUT_FILE}.meta.json" << EOF
{
  "concept": "Rhythmic Cut Transition $RHYTHM_CAPS",
  "prompt": "Image-to-video rhythmic cut sequence with $RHYTHM pacing and sharp transitions",
  "images_used": ${#IMAGES[@]},
  "duration_per_image": $DURATION_PER_IMAGE,
  "total_duration": $TOTAL_DURATION,
  "rhythm": "$RHYTHM",
  "transition_type": "sharp_cuts",
  "aspect_ratio": "$ASPECT_RATIO",
  "resolution": "$RESOLUTION",
  "frame_rate": $FPS,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "script_used": "cut-transition-rhythmic.sh",
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
    echo "   • Number of cuts: $((${#IMAGES[@]} - 1))"
    echo "   • Rhythm: $RHYTHM (${DURATION_PER_IMAGE}s per image)"
    echo "   • Resolution: $RESOLUTION"
    echo "   • Metadata saved: ${OUTPUT_FILE}.meta.json"
    
else
    echo "❌ Error: FFmpeg failed to create video"
    exit 1
fi

echo ""
echo "🎬 Rhythmic cut video complete! ⚡" 