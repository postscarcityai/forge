# Video Editing: Audio-Synced Image Slideshow

## Overview

This feature creates professional video commercials by syncing a series of generated images to a voiceover audio track. The result is a polished slideshow with transitions timed to match specific dialogue beats.

**Best for:**
- Social media reels (TikTok, Instagram, YouTube Shorts)
- Promotional commercials
- Explainer videos with visual metaphors
- Any content where you want rapid cuts synced to narration

---

## What You Need to Provide

### 1. Audio File (Required)
- **Format:** MP3, WAV, or AAC
- **Location:** Place in `public/audio/`
- **Duration:** Any length (script will match it)
- **Content:** Voiceover narration with clear dialogue beats

### 2. Script with Timing (Required)
A breakdown of your voiceover with approximate timestamps:
```
0-1.5s    → "Look."
1.5-3.5s  → "You've watched the tutorials"
3.5-5.5s  → "bookmarked the threads"
...
```

### 3. Visual Concepts (Required)
A description for each image that should appear during each line:
- What character/scene should be shown
- Any visual gags or metaphors (e.g., "Ted on a ship" for "doesn't ship")
- Style requirements (Neo-Print, color palette, etc.)

---

## The Process

### Step 1: Generate Images with Nano-Banana

Use the batch generation endpoint to create all frames at once:

```bash
curl -X POST http://localhost:4900/api/nano-banana/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      { "prompt": "...", "concept": "scene-1", "resolution": "1K" },
      { "prompt": "...", "concept": "scene-2", "resolution": "1K" },
      ...
    ],
    "save_to_disk": true
  }'
```

**Key considerations:**
- Use consistent style across all prompts (same palette, texture, aesthetic)
- Keep aspect ratio consistent (9:16 for portrait/social, 16:9 for landscape)
- Name concepts clearly for easy identification

### Step 2: Get Audio Duration

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  public/audio/your-audio.mp3
```

### Step 3: Calculate Timing

**The Math:**
- Each xfade transition "eats" time from both clips
- Formula: `Total Video Duration = Sum of Image Durations - (Number of Transitions × Transition Duration)`

**Example with 10 images:**
- Audio duration: 18.75s
- Transitions: 9 (one between each pair)
- Transition duration: 0.3s each
- Total overlap: 9 × 0.3 = 2.7s
- **Required total image time:** 18.75 + 2.7 = 21.45s

### Step 4: Create the FFmpeg Script

```bash
#!/bin/bash

IMAGES_DIR="/path/to/images"
AUDIO="/path/to/audio.mp3"
OUTPUT="/path/to/output.mp4"

# Image files in sequence order
IMG1="$IMAGES_DIR/scene-1.jpg"
IMG2="$IMAGES_DIR/scene-2.jpg"
# ... etc

# Duration for each image (must sum to audio + overlap)
D1=1.5   # Scene 1 duration
D2=2.0   # Scene 2 duration
# ... etc

# Transition duration
TRANS=0.3

# Resolution (9:16 portrait for social)
WIDTH=1080
HEIGHT=1920

# Calculate transition offsets
O1=$(echo "$D1 - $TRANS" | bc)
O2=$(echo "$D1 + $D2 - 2*$TRANS" | bc)
# ... etc

ffmpeg -y \
  -loop 1 -t $D1 -i "$IMG1" \
  -loop 1 -t $D2 -i "$IMG2" \
  # ... more inputs \
  -i "$AUDIO" \
  -filter_complex "
    [0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v0];
    [1:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v1];
    # ... more scaling \
    [v0][v1]xfade=transition=fadeblack:duration=${TRANS}:offset=${O1}[x1];
    [x1][v2]xfade=transition=slideleft:duration=${TRANS}:offset=${O2}[x2];
    # ... more transitions \
  " \
  -map "[vout]" -map N:a \  # N = number of video inputs (audio is last input)
  -c:v libx264 -preset fast -crf 18 \
  -c:a aac -b:a 192k \
  -pix_fmt yuv420p \
  -t 18.76 \
  "$OUTPUT"
```

### Step 5: Iterate on Timing

After the first render:
1. Watch the video and note where images don't align with dialogue
2. Adjust individual durations (increase where it's early, decrease where it's late)
3. Re-run the script
4. Repeat until perfect sync

---

## Available Transitions

FFmpeg xfade supports many transitions:

| Transition | Effect | Best For |
|------------|--------|----------|
| `fade` | Simple crossfade | Smooth, subtle changes |
| `fadeblack` | Fade through black | Scene changes, emphasis |
| `fadewhite` | Fade through white | Dream sequences, reveals |
| `slideleft` | Slide incoming from right | Quick cuts, energy |
| `slideright` | Slide incoming from left | Quick cuts, energy |
| `wiperight` | Wipe to the right | Reveals, direction changes |
| `wipeleft` | Wipe to the left | Reveals, direction changes |
| `circleopen` | Circle reveal from center | Dramatic reveals |
| `circleclose` | Circle closing to center | Endings, focus |
| `dissolve` | Pixel dissolve | Stylized transitions |

---

## Timing Tips

### Common Issues

**Video ends before audio:**
- Your total image durations (minus overlaps) are shorter than audio
- Solution: Extend later image durations

**Video cuts too fast at the end:**
- Early timings are correct but compress toward the end
- Solution: Keep early timings, add time only to final 2-3 images

**Transitions feel rushed:**
- Transition duration too short
- Solution: Increase `TRANS` from 0.3 to 0.4 or 0.5 (recalculate totals)

### Alignment Strategy

1. **First pass:** Use equal durations, check overall length
2. **Second pass:** Match the beginning precisely (usually more important)
3. **Third pass:** Adjust ending images to fill remaining time
4. **Final pass:** Fine-tune any specific beats that feel off

---

## Example: Old Spice Style Commercial

### Script
```
Look.
You've watched the tutorials... bookmarked the threads...
told yourself you'll get to it... eventually.
But eventually doesn't ship.
We built something different. Not another course.
Something else.
thevibejam.com
...You coming?
```

### Visual Gags
| Line | Visual |
|------|--------|
| "Look." | Ted (bear) looking up from book |
| "watched tutorials" | Hank (lizard) watching TV showing "TUTORIALS" |
| "bookmarked threads" | Pearl (owl) tangled in literal threads holding bookmark |
| "get to it eventually" | Milo (fox) sitting on giant clock |
| "Eventually" | Greta (turtle) flipping calendar, every day says "EVENTUALLY" |
| "doesn't ship" | Ted standing on a ship that's not moving |
| "built something different" | Ted in hard hat, actually building |
| "Not another course" | Student surrounded by books labeled "COURSE" |
| "thevibejam.com" | Bold typography |
| "You coming?" | Hank holding door open |

### Final Timing (18.75s audio)
```
D1=1.5    # Ted chair
D2=2.0    # Hank TV
D3=2.0    # Pearl threads
D4=2.5    # Milo clock
D5=2.0    # Greta calendar
D6=3.0    # Ted ship
D7=2.0    # Ted construction
D8=2.0    # Not another course
D9=2.5    # Logo
D10=1.95  # Hank door

Total: 21.45s
After 9 transitions (0.3s each): 18.75s ✓
```

---

## Output Specs

| Setting | Value | Notes |
|---------|-------|-------|
| Codec | H.264 (libx264) | Universal compatibility |
| CRF | 18 | High quality, reasonable file size |
| Audio | AAC 192kbps | Good quality audio |
| Pixel format | yuv420p | Required for most players |
| FPS | 30 | Standard for social media |

### Resolution Presets

| Platform | Orientation | Resolution |
|----------|-------------|------------|
| TikTok/Reels | Portrait | 1080x1920 |
| YouTube Shorts | Portrait | 1080x1920 |
| YouTube/Web | Landscape | 1920x1080 |
| Square (Instagram) | Square | 1080x1080 |

---

## Quick Reference Script

A complete working script is maintained at:
```
scripts/create-tvj-commercial.sh
```

To run:
```bash
./scripts/create-tvj-commercial.sh
```

Output location:
```
public/videos/clips/tvj-commercial-[timestamp].mp4
```

---

## Future Enhancements

- [ ] Automatic beat detection from audio
- [ ] Ken Burns effect (subtle pan/zoom on images)
- [ ] Text overlay support for captions
- [ ] Multiple transition patterns per video
- [ ] Auto-thumbnail extraction

---

*Last Updated: 2026-01-03*
*Related: [nano-banana.md](../../.cursor/commands/nano-banana.md), [vibe-jam.md](../projects/vibe-jam.md)*
