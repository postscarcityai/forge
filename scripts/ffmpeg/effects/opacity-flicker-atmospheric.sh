#!/bin/bash

# Function to show usage
show_usage() {
    echo "Usage: $0 <image1> [image2] [image3] ..."
    echo ""
    echo "Arguments:"
    echo "  <image1>     Required: Path to first image (relative to workspace root)"
    echo "  [image2]     Optional: Path to second image"
    echo "  [image3+]    Optional: Additional images"
    echo ""
    echo "Examples:"
    echo "  $0 public/images/photo1.jpg"
    echo "  $0 public/images/photo1.jpg public/images/photo2.jpg"
    echo "  $0 images/photo1.jpg images/photo2.jpg images/photo3.jpg"
    echo ""
    echo "Notes:"
    echo "  • Each image gets 2 seconds in the flicker sequence"
    echo "  • Output format: 9:16 portrait (1080x1920)"
    echo "  • Effect: Random opacity flicker (0.92-1.0)"
    exit 1
}

# Check if at least one image is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: No images provided"
    show_usage
fi

# Validate that all image files exist
for img in "$@"; do
    if [ ! -f "$img" ]; then
        echo "❌ Error: Image file not found: $img"
        exit 1
    fi
done

echo "🎬 Creating flicker video with $# image(s):"
img_counter=1
for img in "$@"; do
    echo "   $img_counter. $img"
    img_counter=$((img_counter + 1))
done
echo ""

# Create a temporary directory for the frames
mkdir -p temp_frames

# Set dimensions for 9:16 aspect ratio (1080x1920 is standard)
width=1080
height=1920

# Output directory for videos and metadata
OUTPUT_DIR="public/videos/clips"
mkdir -p "$OUTPUT_DIR/video-info"

# Generate frames dynamically based on provided images
# Each image gets 48 frames (2 seconds at 24fps)
frame_counter=1
total_images=$#

echo "🎬 Generating frames for $total_images image(s)..."

for img_index in $(seq 1 $total_images); do
    current_image=${!img_index}
    start_frame=$frame_counter
    end_frame=$((frame_counter + 47))
    
    echo "   Processing image $img_index/$total_images: $current_image (frames $start_frame-$end_frame)"
    
    # Generate 48 frames for this image (2 seconds)
    for i in $(seq $start_frame $end_frame); do
        # Generate random opacity between 0.92 and 1.0
        opacity=$(awk -v min=0.92 -v max=1.0 'BEGIN{srand(); print min+rand()*(max-min)}')
        
        # Create frame with black background and overlaid image with random opacity
        ffmpeg -y -loglevel error \
            -f lavfi -i color=c=black:s=${width}x${height} \
            -i "$current_image" \
            -filter_complex "[1:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},format=rgba,colorchannelmixer=aa=$opacity[overlay];[0:v][overlay]overlay=0:0" \
            -frames:v 1 "temp_frames/frame_$(printf "%03d" $i).png"
    done
    
    frame_counter=$((end_frame + 1))
done

total_frames=$((frame_counter - 1))
total_duration=$(echo "scale=1; $total_frames / 24" | bc -l)
echo "✅ Generated $total_frames frames for ${total_duration}s video"

# Generate output filename with timestamp
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
OUTPUT_FILE="$OUTPUT_DIR/flicker_effect_$TIMESTAMP.mp4"

# Combine all frames into a video at 24fps
ffmpeg -y \
  -framerate 24 \
  -i "temp_frames/frame_%03d.png" \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -crf 23 \
  "$OUTPUT_FILE"

# Check if FFmpeg succeeded
if [ $? -eq 0 ]; then
    echo "✅ Flicker effect video created successfully!"
    echo "📁 Output: $OUTPUT_FILE"
    
    # Get video info for metadata
    VIDEO_INFO=$(ffprobe -v quiet -print_format json -show_format -show_streams "$OUTPUT_FILE")
    DURATION=$(echo "$VIDEO_INFO" | jq -r '.format.duration // .streams[0].duration // "6.0"')
    WIDTH=$(echo "$VIDEO_INFO" | jq -r '.streams[0].width // 1080')
    HEIGHT=$(echo "$VIDEO_INFO" | jq -r '.streams[0].height // 1920')
    FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
    FILENAME=$(basename "$OUTPUT_FILE")
    ISO_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    UNIQUE_ID="flicker-atmospheric-$(date +%s)000-custom"
    
    # Get current project ID
    CURRENT_PROJECT=$(curl -s "http://localhost:3000/api/current-project" | jq -r '.currentProject // "default"')
    
    # Create metadata file
    METADATA_FILE="$OUTPUT_DIR/video-info/$FILENAME.meta.json"
    
    echo "📝 Creating metadata file: $METADATA_FILE"
    # Create source images array for metadata
    SOURCE_IMAGES=""
    img_counter=1
    for img in "$@"; do
        if [ $img_counter -eq 1 ]; then
            SOURCE_IMAGES="\"$img\""
        else
            SOURCE_IMAGES="$SOURCE_IMAGES, \"$img\""
        fi
        img_counter=$((img_counter + 1))
    done
    
    cat > "$METADATA_FILE" << EOF
{
  "id": "$UNIQUE_ID",
  "filename": "$FILENAME",
  "title": "Atmospheric Flicker Effect - Dynamic opacity animation",
  "description": "Atmospheric flicker effect video with random opacity variations creating mesmerizing glow effect from $total_images image(s)",
  "createdAt": "$ISO_TIMESTAMP",
  "updatedAt": "$ISO_TIMESTAMP",
  "projectId": "$CURRENT_PROJECT",
  "fileSize": $FILE_SIZE,
  "metadata": {
    "type": "atmospheric_flicker_video",
    "duration": "${DURATION} seconds",
    "resolution": "${WIDTH}x${HEIGHT}",
    "aspect_ratio": "9:16",
    "fps": 24,
    "effect": "random_opacity_flicker",
    "opacity_range": "0.92-1.0",
    "background": "black",
    "total_frames": $total_frames,
    "sequence_structure": "${total_images} images × 2s each",
    "source_images": [$SOURCE_IMAGES],
    "images_count": $total_images,
    "generation_date": "$ISO_TIMESTAMP",
    "video_type": "atmospheric",
    "source": "flicker-script-dynamic"
  },
  "tags": ["flicker", "atmospheric", "opacity", "glow", "animation", "multi-image"]
}
EOF
    
    echo "✅ Metadata file created successfully"
    
    # Sync to database
    echo "🔄 Syncing video to database..."
    if command -v curl >/dev/null 2>&1; then
        SYNC_RESULT=$(curl -s -X POST "http://localhost:3000/api/database/sync/videos" \
            -H "Content-Type: application/json" \
            -d '{"forceSync": false}' 2>/dev/null)
        
        if echo "$SYNC_RESULT" | grep -q '"success":true'; then
            echo "✅ Video synced to database successfully"
            echo "🎬 Video should now appear in the gallery!"
        else
            echo "⚠️ Database sync may have failed, but video and metadata are ready"
        fi
    else
        echo "⚠️ curl not available - video will sync automatically on next page load"
    fi
    
    echo ""
    echo "📊 Video Stats:"
    echo "   • Duration: ${DURATION}s"
    echo "   • Resolution: ${WIDTH}x${HEIGHT}"
    echo "   • File size: $(echo "scale=1; $FILE_SIZE/1024" | bc -l)KB"
    echo "   • Effect: Atmospheric flicker with random opacity"
    echo "🎬 Video ready at: $OUTPUT_FILE"
    echo "📝 Metadata ready at: $METADATA_FILE"
else
    echo "❌ Error creating flicker video"
    exit 1
fi

# Clean up temporary frames
rm -rf temp_frames 