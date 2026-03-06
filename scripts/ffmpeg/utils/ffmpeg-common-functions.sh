#!/bin/bash

# FFmpeg Common Functions - Shared utilities for all video generation scripts
# Source this file in other scripts: source scripts/ffmpeg/utils/ffmpeg-common-functions.sh

# =============================================================================
# CONFIGURATION DEFAULTS
# =============================================================================

DEFAULT_OUTPUT_DIR="public/videos/clips"
DEFAULT_FPS=30
DEFAULT_CRF=23
DEFAULT_PRESET="medium"

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

# Validate that images exist
validate_images() {
    local images=("$@")
    local missing_count=0
    
    echo "🔍 Validating ${#images[@]} image(s)..."
    
    for img in "${images[@]}"; do
        if [ ! -f "$img" ]; then
            echo "❌ Error: Image not found: $img"
            missing_count=$((missing_count + 1))
        else
            echo "✓ Found: $(basename "$img")"
        fi
    done
    
    if [ $missing_count -gt 0 ]; then
        echo "❌ $missing_count image(s) not found. Exiting."
        exit 1
    fi
    
    echo "✅ All images validated successfully"
}

# Validate aspect ratio
validate_aspect_ratio() {
    local aspect="$1"
    case $aspect in
        "16:9"|"9:16"|"1:1"|"4:5")
            return 0
            ;;
        *)
            echo "❌ Error: Unsupported aspect ratio '$aspect'"
            echo "Supported: 16:9, 9:16, 1:1, 4:5"
            return 1
            ;;
    esac
}

# =============================================================================
# RESOLUTION FUNCTIONS
# =============================================================================

# Get resolution from aspect ratio
get_resolution() {
    local aspect="$1"
    case $aspect in
        "16:9")
            echo "1920x1080"
            ;;
        "9:16")
            echo "1080x1920"
            ;;
        "1:1")
            echo "1080x1080"
            ;;
        "4:5")
            echo "1080x1350"
            ;;
        *)
            echo "1920x1080"  # Default fallback
            ;;
    esac
}

# Get width from aspect ratio
get_width() {
    local aspect="$1"
    case $aspect in
        "16:9")
            echo "1920"
            ;;
        "9:16"|"1:1"|"4:5")
            echo "1080"
            ;;
        *)
            echo "1920"  # Default fallback
            ;;
    esac
}

# Get height from aspect ratio
get_height() {
    local aspect="$1"
    case $aspect in
        "16:9")
            echo "1080"
            ;;
        "9:16")
            echo "1920"
            ;;
        "1:1")
            echo "1080"
            ;;
        "4:5")
            echo "1350"
            ;;
        *)
            echo "1080"  # Default fallback
            ;;
    esac
}

# =============================================================================
# METADATA FUNCTIONS
# =============================================================================

# Generate standard metadata template
generate_metadata() {
    local output_file="$1"
    local concept="$2"
    local prompt="$3"
    local script_name="$4"
    local additional_metadata="$5"  # JSON string for additional fields
    
    local filename=$(basename "$output_file")
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
    local current_project=$(curl -s "http://localhost:3000/api/current-project" 2>/dev/null | jq -r '.currentProject // "default"' 2>/dev/null || echo "default")
    local file_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null || echo "0")
    
    cat > "${output_file}.meta.json" << EOF
{
  "id": "$(echo "$concept" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')-$(date +%s)000-generated",
  "filename": "$filename",
  "title": "$concept",
  "description": "$prompt",
  "createdAt": "$timestamp",
  "updatedAt": "$timestamp",
  "projectId": "$current_project",
  "fileSize": $file_size,
  "metadata": {
    "script_used": "$script_name",
    "created_at": "$timestamp",
    "ffmpeg_settings": {
      "codec": "libx264",
      "preset": "$DEFAULT_PRESET",
      "crf": $DEFAULT_CRF,
      "pixel_format": "yuv420p"
    }$([ -n "$additional_metadata" ] && echo ",$additional_metadata" || echo "")
  }
}
EOF
}

# Add images array to metadata
add_images_to_metadata() {
    local metadata_file="$1"
    shift
    local images=("$@")
    
    # Create images array
    local images_json=""
    for i in "${!images[@]}"; do
        if [ $i -eq 0 ]; then
            images_json="\"${images[$i]}\""
        else
            images_json="$images_json, \"${images[$i]}\""
        fi
    done
    
    # Use jq to add images array to metadata if jq is available
    if command -v jq >/dev/null 2>&1; then
        local temp_file=$(mktemp)
        jq --argjson images "[$images_json]" '.metadata.input_images = $images' "$metadata_file" > "$temp_file"
        mv "$temp_file" "$metadata_file"
    else
        # Fallback: manually add to metadata (less robust but works)
        sed -i.bak 's/}$/,\n    "input_images": ['"$images_json"']\n  }\n}/' "$metadata_file"
        rm -f "${metadata_file}.bak"
    fi
}

# =============================================================================
# DIRECTORY FUNCTIONS
# =============================================================================

# Ensure output directory exists
ensure_output_dir() {
    local output_dir="${1:-$DEFAULT_OUTPUT_DIR}"
    mkdir -p "$output_dir"
    mkdir -p "$output_dir/video-info"
    echo "$output_dir"
}

# Generate timestamped filename
generate_output_filename() {
    local output_dir="$1"
    local prefix="$2"
    local extension="${3:-.mp4}"
    
    local timestamp=$(date +%Y-%m-%dT%H-%M-%S-%3NZ)
    echo "$output_dir/${prefix}-${timestamp}${extension}"
}

# =============================================================================
# FFMPEG HELPER FUNCTIONS
# =============================================================================

# Build standard scaling filter
build_scale_filter() {
    local width="$1"
    local height="$2"
    local input_index="$3"
    local fps="$4"
    
    echo "[${input_index}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=${fps}[v${input_index}]"
}

# Build loop input arguments
build_loop_inputs() {
    local duration="$1"
    shift
    local images=("$@")
    
    local inputs=""
    for img in "${images[@]}"; do
        inputs="$inputs -loop 1 -t $duration -i \"$img\""
    done
    echo "$inputs"
}

# =============================================================================
# DATABASE SYNC FUNCTIONS
# =============================================================================

# Sync video to database
sync_video_to_database() {
    local force_sync="${1:-false}"
    local project_id="${2:-}"
    
    echo "🔄 Syncing video to database..."
    
    if command -v curl >/dev/null 2>&1; then
        local sync_data="{\"forceSync\": $force_sync"
        [ -n "$project_id" ] && sync_data="$sync_data, \"projectId\": \"$project_id\""
        sync_data="$sync_data}"
        
        local sync_result=$(curl -s -X POST "http://localhost:3000/api/database/sync/videos" \
            -H "Content-Type: application/json" \
            -d "$sync_data" 2>/dev/null)
        
        if echo "$sync_result" | grep -q '"success":true' 2>/dev/null; then
            echo "✅ Video synced to database successfully"
            echo "🎬 Video should now appear in the gallery!"
            return 0
        else
            echo "⚠️ Database sync may have failed, but video and metadata are ready"
            return 1
        fi
    else
        echo "⚠️ curl not available - video will sync automatically on next page load"
        return 1
    fi
}

# =============================================================================
# CALCULATION FUNCTIONS
# =============================================================================

# Calculate total duration with transitions
calculate_total_duration() {
    local num_images="$1"
    local duration_per_image="$2"
    local transition_duration="$3"
    
    echo "scale=2; $num_images * $duration_per_image - ($num_images - 1) * $transition_duration" | bc -l
}

# Calculate transition offset
calculate_transition_offset() {
    local transition_index="$1"
    local duration_per_image="$2"
    local transition_duration="$3"
    
    echo "scale=3; ($transition_index * $duration_per_image) - (($transition_index - 1) * $transition_duration)" | bc -l
}

# =============================================================================
# ERROR HANDLING FUNCTIONS
# =============================================================================

# Check FFmpeg exit code and handle errors
check_ffmpeg_result() {
    local exit_code="$1"
    local output_file="$2"
    
    if [ $exit_code -eq 0 ] && [ -f "$output_file" ]; then
        echo "✅ Video created successfully!"
        echo "📁 Output: $output_file"
        return 0
    else
        echo "❌ Error: FFmpeg failed to create video (exit code: $exit_code)"
        [ ! -f "$output_file" ] && echo "   Output file was not created"
        return 1
    fi
}

# =============================================================================
# DISPLAY FUNCTIONS
# =============================================================================

# Show video statistics
show_video_stats() {
    local output_file="$1"
    local total_duration="$2"
    local num_images="$3"
    local resolution="$4"
    local additional_stats="$5"
    
    local file_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null || echo "0")
    local file_size_kb=$(echo "scale=1; $file_size/1024" | bc -l)
    
    echo ""
    echo "📊 Video Stats:"
    echo "   • Total duration: ${total_duration}s"
    echo "   • Number of images: $num_images"
    echo "   • Resolution: $resolution"
    echo "   • File size: ${file_size_kb}KB"
    [ -n "$additional_stats" ] && echo "$additional_stats"
    echo "   • Metadata saved: ${output_file}.meta.json"
}

# =============================================================================
# USAGE MESSAGE HELPERS
# =============================================================================

# Standard usage header
show_usage_header() {
    local script_name="$1"
    local description="$2"
    local usage_pattern="$3"
    
    echo "# $script_name"
    echo "# $description"
    echo "# Usage: $usage_pattern"
    echo ""
}

# Standard help footer
show_help_footer() {
    echo ""
    echo "Notes:"
    echo "  • All images must exist before running"
    echo "  • Output saved to $DEFAULT_OUTPUT_DIR"
    echo "  • Metadata automatically generated"
    echo "  • Videos auto-sync to database if server running"
}

# =============================================================================
# INITIALIZATION
# =============================================================================

# Check for required dependencies
check_dependencies() {
    local missing_deps=""
    
    command -v ffmpeg >/dev/null 2>&1 || missing_deps="$missing_deps ffmpeg"
    command -v bc >/dev/null 2>&1 || missing_deps="$missing_deps bc"
    
    if [ -n "$missing_deps" ]; then
        echo "❌ Error: Missing required dependencies:$missing_deps"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
}

# Initialize common functions (call this at the start of scripts)
init_ffmpeg_common() {
    check_dependencies
    echo "🎬 FFmpeg Video Generation Script"
    echo "📁 Output directory: $DEFAULT_OUTPUT_DIR"
    echo ""
}

# =============================================================================
# EXPORT FUNCTIONS
# =============================================================================

# Export all functions for use in other scripts
export -f validate_images validate_aspect_ratio
export -f get_resolution get_width get_height
export -f generate_metadata add_images_to_metadata
export -f ensure_output_dir generate_output_filename
export -f build_scale_filter build_loop_inputs
export -f sync_video_to_database
export -f calculate_total_duration calculate_transition_offset
export -f check_ffmpeg_result show_video_stats
export -f show_usage_header show_help_footer
export -f check_dependencies init_ffmpeg_common 