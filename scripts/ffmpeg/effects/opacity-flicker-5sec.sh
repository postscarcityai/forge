#!/bin/bash

# Custom 5-second flicker effect script for Sam Altman image

# Function to show usage
show_usage() {
    echo "Usage: $0 <image>"
    echo ""
    echo "Arguments:"
    echo "  <image>      Required: Path to image (relative to workspace root)"
    echo ""
    echo "Example:"
    echo "  $0 public/images/sam-altman-text-edit-2025-06-22T22-46-22-785Z-00.jpg"
    echo ""
    echo "Notes:"
    echo "  • Creates exactly 5 seconds of flicker effect"
    echo "  • Output format: 9:16 portrait (1080x1920)"
    echo "  • Effect: Random opacity flicker (0.92-1.0)"
    exit 1
}

# Check if image is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: No image provided"
    show_usage
fi

# Validate that image file exists
img="$1"
if [ ! -f "$img" ]; then
    echo "❌ Error: Image file not found: $img"
    exit 1
fi

echo "🎬 Creating 5-second flicker video from: $img"
echo ""

# Create a temporary directory for the frames
mkdir -p temp_frames

# Set dimensions for 9:16 aspect ratio (1080x1920 is standard)
width=1080
height=1920

# Output directory for videos and metadata
OUTPUT_DIR="public/videos/clips"
mkdir -p "$OUTPUT_DIR/video-info"

# Generate 120 frames (5 seconds at 24fps)
total_frames=120
echo "🎬 Generating $total_frames frames for 5-second video..."

for i in $(seq 1 $total_frames); do
    # Generate random opacity between 0.92 and 1.0
    opacity=$(awk -v min=0.92 -v max=1.0 'BEGIN{srand(); print min+rand()*(max-min)}')
    
    # Create frame with black background and overlaid image with random opacity
    ffmpeg -y -loglevel error \
        -f lavfi -i color=c=black:s=${width}x${height} \
        -i "$img" \
        -filter_complex "[1:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},format=rgba,colorchannelmixer=aa=$opacity[overlay];[0:v][overlay]overlay=0:0" \
        -frames:v 1 "temp_frames/frame_$(printf "%03d" $i).png"
    
    # Progress indicator
    if [ $((i % 24)) -eq 0 ]; then
        seconds=$((i / 24))
        echo "   Progress: ${seconds}s / 5s complete"
    fi
done

echo "✅ Generated $total_frames frames for 5.0s video"

# Generate output filename with timestamp
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
BASENAME=$(basename "$img" | sed 's/\.[^.]*$//')
OUTPUT_FILE="$OUTPUT_DIR/${BASENAME}_flicker_5sec_$TIMESTAMP.mp4"

# Combine all frames into a video at 24fps
echo "🎬 Creating final video..."
ffmpeg -y \
  -framerate 24 \
  -i "temp_frames/frame_%03d.png" \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -crf 23 \
  "$OUTPUT_FILE"

# Check if FFmpeg succeeded
if [ $? -eq 0 ]; then
    echo "✅ 5-second flicker effect video created successfully!"
    echo "📁 Output: $OUTPUT_FILE"
    
    # Get video info for metadata
    VIDEO_INFO=$(ffprobe -v quiet -print_format json -show_format -show_streams "$OUTPUT_FILE")
    DURATION=$(echo "$VIDEO_INFO" | jq -r '.format.duration // "5.0"')
    WIDTH=$(echo "$VIDEO_INFO" | jq -r '.streams[0].width // 1080')
    HEIGHT=$(echo "$VIDEO_INFO" | jq -r '.streams[0].height // 1920')
    FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
    FILENAME=$(basename "$OUTPUT_FILE")
    ISO_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    UNIQUE_ID="flicker-5sec-$(date +%s)000-custom"
    
    # Get current project ID
    CURRENT_PROJECT=$(curl -s "http://localhost:3000/api/current-project" | jq -r '.currentProject // "default"')
    
    # Create metadata file
    METADATA_FILE="$OUTPUT_DIR/video-info/$FILENAME.meta.json"
    
    echo "📝 Creating metadata file: $METADATA_FILE"
    
    cat > "$METADATA_FILE" << EOF
{
  "id": "$UNIQUE_ID",
  "filename": "$FILENAME",
  "title": "5-Second Flicker Effect - Sam Altman",
  "description": "5-second atmospheric flicker effect video with random opacity variations creating mesmerizing glow effect",
  "createdAt": "$ISO_TIMESTAMP",
  "updatedAt": "$ISO_TIMESTAMP",
  "projectId": "$CURRENT_PROJECT",
  "fileSize": $FILE_SIZE,
  "metadata": {
    "type": "atmospheric_flicker_video",
    "duration": "5.0 seconds",
    "resolution": "${WIDTH}x${HEIGHT}",
    "aspect_ratio": "9:16",
    "fps": 24,
    "effect": "random_opacity_flicker",
    "opacity_range": "0.92-1.0",
    "background": "black",
    "total_frames": $total_frames,
    "source_image": "$img",
    "generation_date": "$ISO_TIMESTAMP",
    "video_type": "atmospheric",
    "source": "flicker-5sec-custom"
  },
  "tags": ["flicker", "atmospheric", "opacity", "sam-altman", "5-second", "glow", "animation"]
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
    echo "   • Duration: 5.0s"
    echo "   • Resolution: ${WIDTH}x${HEIGHT}"
    echo "   • File size: $(echo "scale=1; $FILE_SIZE/1024" | bc -l)KB"
    echo "   • Effect: Atmospheric flicker with random opacity"
    echo "🎬 Video ready at: $OUTPUT_FILE"
    echo "📝 Metadata ready at: $METADATA_FILE"
    
    # Clean up temporary frames
    echo "🧹 Cleaning up temporary files..."
    rm -rf temp_frames
    echo "✅ Cleanup complete!"
else
    echo "❌ Error creating flicker video"
    rm -rf temp_frames
    exit 1
fi 