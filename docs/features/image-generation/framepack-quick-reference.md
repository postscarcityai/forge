 do thi# Framepack Quick Reference

## 🚀 Quick Start

```bash
# Single transition (1.5 seconds)
npm run framepack 1.5 "start-image.jpg" "end-image.jpg"

# Multi-image sequence (auto-calculated timing)
npm run framepack 2.0 "img1.jpg" "img2.jpg" "img3.jpg"

# Custom sequence with options
npm run framepack 3.0 "img1" "img2" "img3" --filename "my-animation"
```

## 📋 Command Structure

```
npm run framepack <duration> <image1> [image2] [image3] ... [options]
```

### Parameters
- **`duration`**: Total desired duration in seconds
- **`imageN`**: Image URLs (2+ required, auto-detected from Supabase)
- **`--filename`**: Custom output filename prefix
- **`--no-download`**: Skip local download (stream URLs only)

## ⚡ Common Patterns

### Perfect Timing Examples
```bash
# 2 images → 1 transition → 1.5s
npm run framepack 1.5 "img1" "img2"

# 3 images → 2 transitions → 2.0s  
npm run framepack 2.0 "img1" "img2" "img3"

# 4 images → 3 transitions → 3.0s
npm run framepack 3.0 "img1" "img2" "img3" "img4"
```

### Duration Adjustments
```bash
# Requested: 2s, Actual: 3s (minimum 1s per transition)
npm run framepack 2.0 "img1" "img2" "img3" "img4"  # 4→3 transitions = 3s

# Solution: Use fewer images for shorter duration
npm run framepack 2.0 "img1" "img2" "img3"          # 3→2 transitions = 2s
```

## 🎯 File Outputs

### Individual Transitions
```
public/videos/fal/framepack-transition-30f-1s-2025-06-01T17-34-04-707Z.mp4
```

### Final Merged Videos (Manual Step)
```
public/videos/fal/clips/merged-4-transitions-4s-2025-06-01T17-34-04.mp4
```

## 🔧 Required FFmpeg Merging Step

⚠️ **Important**: After framepack generation, you MUST manually merge the individual transitions using FFmpeg to create the final video.

### Quick Merge (Recommended)
```bash
cd public/videos/fal

# Create clips directory if it doesn't exist
mkdir -p clips

# Auto-generate file list from most recent transitions
ls -t framepack-transition-*.mp4 | head -3 > filelist.txt
sed -i '' 's/^/file /' filelist.txt

# Merge transitions into final clip
ffmpeg -f concat -safe 0 -i filelist.txt -c copy clips/merged-sequence-$(date +%Y-%m-%d-%H%M%S).mp4

# Clean up
rm filelist.txt
```

### Manual Merge (Full Control)
```bash
cd public/videos/fal
mkdir -p clips

# Create file list manually
echo "file 'framepack-transition-40f-1.33s-2025-06-01T19-50-33-518Z.mp4'" > list.txt
echo "file 'framepack-transition-40f-1.33s-2025-06-01T19-51-32-907Z.mp4'" >> list.txt
echo "file 'framepack-transition-40f-1.33s-2025-06-01T19-52-32-949Z.mp4'" >> list.txt

# Concatenate with custom naming
ffmpeg -f concat -safe 0 -i list.txt -c copy clips/my-custom-sequence.mp4
```

### With Speed Adjustment
```bash
# If you need to adjust final video speed
ffmpeg -f concat -safe 0 -i list.txt -filter:v "setpts=0.75*PTS" -c:v libx264 clips/speed-adjusted-sequence.mp4
```

## 🚨 Troubleshooting

### Issue: "Duration adjusted from X to Y"
- **Cause**: Minimum 1-second per transition
- **Solution**: Use fewer images or accept longer duration

### Issue: "Invalid image URL"
- **Cause**: Malformed or inaccessible URL
- **Solution**: Verify URL accessibility and format

### Issue: "Generation failed"
- **Cause**: fal.ai API issues or invalid parameters
- **Solution**: Check API key, retry after delay

### Issue: "FFmpeg concatenation failed"
- **Cause**: Missing source files or format mismatch
- **Solution**: Verify all source videos exist and are valid MP4

### Issue: "clips directory doesn't exist"
- **Cause**: Directory not created
- **Solution**: `mkdir -p public/videos/fal/clips`

## 📊 Duration Calculator

| Images | Transitions | Min Duration | Recommended |
|--------|-------------|--------------|-------------|
| 2      | 1          | 1.0s         | 1.5s        |
| 3      | 2          | 2.0s         | 2.5s        |
| 4      | 3          | 3.0s         | 3.5s        |
| 5      | 4          | 4.0s         | 4.5s        |
| 6      | 5          | 5.0s         | 5.5s        |

## 📁 File Structure

```
public/videos/fal/
├── framepack-transition-*.mp4     # Individual transitions
└── clips/                         # Final merged videos
    ├── merged-sequence-*.mp4      # Auto-generated merges
    └── custom-name.mp4            # Manual named merges
```

## 🎨 Quality Tips

1. **Use high-resolution source images** (1024px+ recommended)
2. **Maintain consistent aspect ratios** across sequence
3. **Order images logically** for natural visual flow
4. **Preview individual transitions** before merging
5. **Test with 2-3 images first** before longer sequences
6. **Always merge transitions with FFmpeg** for final usable video

## 🔗 Related Files

- **Main utility**: `utils/framepack.js`
- **CLI script**: `scripts/framepack-cli.js`
- **Example usage**: `scripts/example-framepack-usage.js`
- **Full documentation**: `docs/framepack-video-generation.md` 