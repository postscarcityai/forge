# Video Editing V2: Storyboard to Animated Video (Planning Doc)

> **Status:** Planning / Sketch
> **Prerequisite:** [video-editing.md](./video-editing.md) (static image slideshow)

---

## Overview

This document outlines the next evolution of our video editing workflow. Instead of stitching static images together, we generate **animated video clips** for each storyboard segment using Veo 3.1, then combine them into a cohesive final video.

**The difference:**
- **V1 (Current):** Static images + transitions + voiceover audio
- **V2 (This Doc):** Animated clips per segment + seamless stitching + optional embedded audio

---

## Why This Approach?

1. **More engaging** — Animated characters > static images
2. **Character consistency** — Start each clip from a generated image (image-to-video)
3. **Modular generation** — Each 4-8s clip is independent, easier to iterate
4. **Audio flexibility** — Can embed audio per clip OR layer single VO on top
5. **Visual gags come alive** — Ted on the ship can actually NOT be moving

---

## The Workflow

```
┌─────────────────┐
│  1. SCRIPT      │  Write voiceover, identify beats
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. STORYBOARD  │  Visual concept for each beat (with timing)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. IMAGES      │  Generate static frames (nano-banana)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. CLIPS       │  Animate each image (veo3.1) ← NEW
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. STITCH      │  Combine clips (ffmpeg)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. AUDIO       │  Layer voiceover OR use embedded
└─────────────────┘
```

---

## Step-by-Step Process

### Step 1: Script & Timing (Same as V1)

Write the voiceover with timing beats:

```
0-1.5s    → "Look."
1.5-3.5s  → "You've watched the tutorials"
3.5-5.5s  → "bookmarked the threads"
5.5-8s    → "told yourself you'll get to it"
8-10s     → "[sighs] Eventually"
10-13s    → "But eventually doesn't ship"
13-15s    → "We built something different"
15-17s    → "Not another course. Something else."
17-18.75s → "thevibejam.com... You coming?"
```

### Step 2: Storyboard (Same as V1)

Define visual concepts with animation notes:

| Beat | Duration | Visual Concept | Animation Notes |
|------|----------|----------------|-----------------|
| "Look." | 1.5s | Ted in chair | Looks up from book, slight head tilt |
| "watched tutorials" | 2s | Hank watching TV | Bored slouch, maybe TV flickers |
| "bookmarked threads" | 2s | Pearl tangled | Struggling with threads, annoyed |
| "get to it eventually" | 2.5s | Milo on clock | Checking watch impatiently, clock ticks |
| "Eventually" | 2s | Greta with calendar | Flipping pages slowly, resigned sigh |
| "doesn't ship" | 3s | Ted on ship | Standing still, ship clearly NOT moving, water still |
| "built something different" | 2s | Ted construction | Proud nod, gestures to building |
| "Not another course" | 2s | Student overwhelmed | Slumping under book pile |
| "thevibejam.com" | 2s | Logo/Typography | Could be static or animated reveal |
| "You coming?" | 1.75s | Hank at door | Holding door, eyebrow raise, waiting |

### Step 3: Generate Static Images (Same as V1)

Use nano-banana batch generation for all frames:

```bash
curl -X POST http://localhost:4900/api/nano-banana/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      { "prompt": "Ted bear in chair...", "concept": "beat-01-ted-chair" },
      { "prompt": "Hank lizard watching TV...", "concept": "beat-02-hank-tv" },
      ...
    ]
  }'
```

### Step 4: Animate Each Image (NEW - Veo 3.1)

This is where V2 diverges. For each static image, generate an animated clip.

#### Option A: Silent Clips (Audio Layered Later)

Generate video without embedded audio, add VO in post:

```bash
curl -X POST http://localhost:4900/api/veo3-fast \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "An anthropomorphic brown bear in black turtleneck sits in cozy reading chair. ACTION: Bear is reading a book, slowly looks up at camera with warm knowing expression, slight head tilt, settling into attention. Movement is minimal but present - the subtle rise of eyes from book to camera, a gentle tilt of the head suggesting \"ah, you are here.\" The lighting is warm and consistent. Hold on the knowing look at the end. NO DIALOGUE - silent animation only.",
    "image_url": "/images/beat-01-ted-chair.jpg",
    "duration": "4s",
    "generate_audio": false,
    "resolution": "1080p",
    "concept": "beat-01-ted-chair-animated"
  }'
```

#### Option B: Embedded Audio Per Clip

Generate video WITH the character speaking their line:

```bash
curl -X POST http://localhost:4900/api/veo3-fast \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "An anthropomorphic brown bear in black turtleneck sits in cozy reading chair. ACTION: Bear is reading a book, slowly looks up at camera with warm knowing expression, slight head tilt, then speaks directly to camera. VOICE: Male, mid-50s. Very deep bass voice, rich and rumbling, bumbly and rounded like a big bear. Kentucky accent, warm Southern drawl. The timbre is deep and resonant with honey-like quality. Unhurried delivery, each word given space to breathe. DELIVERY: Low volume, warm presence. Slow and deliberate pacing. Patient pauses. DIALOGUE: Look.",
    "image_url": "/images/beat-01-ted-chair.jpg",
    "duration": "4s",
    "generate_audio": true,
    "resolution": "1080p",
    "concept": "beat-01-ted-chair-speaking"
  }'
```

#### Full Example: All 10 Beats

**Beat 1: Ted Chair - "Look."**
```json
{
  "prompt": "An anthropomorphic brown bear in black turtleneck in cozy reading chair. ACTION: Reading book, slowly looks up at camera, warm knowing expression, slight head tilt. Minimal movement, settling into attention. Neo-Print style, linocut texture, black and cream with faint blue tint. Hold on knowing look.",
  "image_url": "/images/beat-01-ted-chair.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-01-ted-look"
}
```

**Beat 2: Hank TV - "You've watched the tutorials"**
```json
{
  "prompt": "An anthropomorphic lizard in aviator sunglasses and bucket hat slouched in front of TV. The TV screen shows the word TUTORIALS in bold letters. ACTION: Hank sits bored, maybe shifts slightly in seat, TV might flicker subtly. Sardonic exhaustion in posture. Neo-Print style, ink black spot red cream. Minimal movement, the exhaustion IS the movement.",
  "image_url": "/images/beat-02-hank-tv.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-02-hank-tutorials"
}
```

**Beat 3: Pearl Threads - "bookmarked the threads"**
```json
{
  "prompt": "An anthropomorphic owl woman with round glasses tangled in sewing threads while holding a bookmark. ACTION: Pearl struggles with the threads, looking increasingly annoyed. One wing tries to untangle while the other holds the useless bookmark. Exasperated head shake. Neo-Print style dusty blue palette. Comedy of frustration.",
  "image_url": "/images/beat-03-pearl-threads.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-03-pearl-threads"
}
```

**Beat 4: Milo Clock - "told yourself you'll get to it"**
```json
{
  "prompt": "An anthropomorphic fox in hoodie sitting on a giant clock minute hand. ACTION: Milo sits cross-legged on the clock hand, looking at his wristwatch impatiently. The giant clock hand moves slowly beneath him. He taps his foot, checks the watch again. Waiting forever energy. Neo-Print ochre and black.",
  "image_url": "/images/beat-04-milo-clock.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-04-milo-waiting"
}
```

**Beat 5: Greta Calendar - "[sighs] Eventually"**
```json
{
  "prompt": "An anthropomorphic elderly turtle woman at desk with wall calendar where every day says EVENTUALLY. ACTION: Greta slowly flips calendar pages. Each page revealed also says EVENTUALLY. She sighs with patient resignation, adjusts her reading glasses. The endless postponement made physical. Neo-Print forest green palette.",
  "image_url": "/images/beat-05-greta-calendar.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-05-greta-eventually"
}
```

**Beat 6: Ted Ship - "But eventually doesn't ship" (KEY VISUAL PUN)**
```json
{
  "prompt": "An anthropomorphic brown bear in black turtleneck standing on wooden ship deck. THE SHIP IS COMPLETELY STILL - not moving at all. Water is perfectly calm. Ropes still tied to dock. ACTION: Ted stands with arms crossed, looking at camera with deadpan expression. He does not move. The ship does not move. Nothing moves. A seagull might land on the mast. The visual joke is the stillness - it literally does not ship. Neo-Print black cream with blue tint for water.",
  "image_url": "/images/beat-06-ted-ship.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-06-ted-not-shipping"
}
```

**Beat 7: Ted Construction - "We built something different"**
```json
{
  "prompt": "An anthropomorphic brown bear in black turtleneck wearing yellow construction hard hat, holding blueprints, standing in front of wooden house frame being built. ACTION: Ted nods with satisfaction, gestures proudly to the building behind him with one paw. The building is actually being built - maybe a beam is being placed. Constructive energy. Neo-Print ochre and black.",
  "image_url": "/images/beat-07-ted-construction.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-07-ted-building"
}
```

**Beat 8: Not Another Course - "Not another course"**
```json
{
  "prompt": "An anthropomorphic animal student at school desk overwhelmed by towering stacks of books labeled COURSE. ACTION: Student slumps deeper under the weight of courses, maybe one more book drops onto the pile. Exhaustion, information overload. The courses keep piling. Neo-Print ink black spot red cream. The fatigue is real.",
  "image_url": "/images/beat-08-not-another-course.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-08-course-fatigue"
}
```

**Beat 9: Logo - "Something else. thevibejam.com"**
```json
{
  "prompt": "Bold typography thevibejam.com on cream background. Neo-Print linocut style, ink black with subtle red accent. ACTION: The text could be static OR have a subtle reveal - letters appearing one by one, or a gentle pulse of confidence. The typography has presence. Clean, confident, grounded.",
  "image_url": "/images/beat-09-logo.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-09-logo"
}
```

**Beat 10: Hank Door - "You coming?"**
```json
{
  "prompt": "An anthropomorphic lizard in aviator sunglasses and bucket hat standing at open doorway, holding door open, looking back over shoulder at camera. Warm inviting light glows through the doorway. ACTION: Hank holds the door, raises an eyebrow (if visible), slight head tilt of invitation. He is waiting for you. The invitation hangs in the air. After a beat, maybe a small shrug - your move. Neo-Print ink black spot red cream with warm glow.",
  "image_url": "/images/beat-10-hank-door.jpg",
  "duration": "4s",
  "generate_audio": false,
  "concept": "clip-10-hank-invitation"
}
```

### Step 5: Stitch Clips Together (ffmpeg)

Once all clips are generated, combine them:

```bash
#!/bin/bash

# Concatenate video clips
CLIPS_DIR="/path/to/clips"
OUTPUT="final-commercial.mp4"

# Create file list
cat > /tmp/clips.txt << EOF
file '$CLIPS_DIR/clip-01-ted-look.mp4'
file '$CLIPS_DIR/clip-02-hank-tutorials.mp4'
file '$CLIPS_DIR/clip-03-pearl-threads.mp4'
file '$CLIPS_DIR/clip-04-milo-waiting.mp4'
file '$CLIPS_DIR/clip-05-greta-eventually.mp4'
file '$CLIPS_DIR/clip-06-ted-not-shipping.mp4'
file '$CLIPS_DIR/clip-07-ted-building.mp4'
file '$CLIPS_DIR/clip-08-course-fatigue.mp4'
file '$CLIPS_DIR/clip-09-logo.mp4'
file '$CLIPS_DIR/clip-10-hank-invitation.mp4'
EOF

# Option A: Simple concatenation (clips already have transitions in animation)
ffmpeg -y -f concat -safe 0 -i /tmp/clips.txt \
  -c:v libx264 -preset fast -crf 18 \
  -pix_fmt yuv420p \
  "$OUTPUT"

# Option B: Concatenate with crossfades between clips
# (more complex, requires xfade filter chain like V1)
```

### Step 6: Layer Audio

If clips were generated silent, add the voiceover:

```bash
ffmpeg -y \
  -i final-commercial-silent.mp4 \
  -i voiceover.mp3 \
  -c:v copy \
  -c:a aac -b:a 192k \
  -map 0:v -map 1:a \
  -shortest \
  final-commercial-with-audio.mp4
```

---

## Duration Considerations

### The Math Changes

With static images, we had:
- Total video = Sum of durations - (transitions × overlap)

With animated clips:
- Each clip has a fixed duration (4s, 6s, or 8s from Veo 3.1)
- Transitions between clips add/subtract time
- Need to plan clip durations to match VO timing

### Suggested Approach

For an 18.75s commercial with 10 beats:

| Beat | Target Duration | Veo Duration | Notes |
|------|-----------------|--------------|-------|
| 1 | 1.5s | 4s | Trim to 1.5s in post |
| 2 | 2s | 4s | Trim to 2s |
| 3 | 2s | 4s | Trim to 2s |
| 4 | 2.5s | 4s | Trim to 2.5s |
| 5 | 2s | 4s | Trim to 2s |
| 6 | 3s | 4s | Trim to 3s |
| 7 | 2s | 4s | Trim to 2s |
| 8 | 2s | 4s | Trim to 2s |
| 9 | 2s | 4s | Trim to 2s |
| 10 | 1.75s | 4s | Trim to 1.75s |

**Strategy:** Generate all clips at 4s, trim each to exact duration in ffmpeg.

```bash
# Trim clip to exact duration
ffmpeg -i clip-01-full.mp4 -t 1.5 -c copy clip-01-trimmed.mp4
```

---

## Animation Guidelines for This Style

### What Works

- **Minimal movement** — These are illustrated characters, not realistic ones
- **Subtle gestures** — Head tilts, nods, slight hand movements
- **Stillness as comedy** — Ted on the ship NOT moving is funnier animated
- **Expressions** — Eyebrow raises, sighs, knowing looks
- **Environmental motion** — Clock ticking, calendar pages, TV flicker

### What to Avoid

- **Too much movement** — Characters walking across scenes, dramatic actions
- **Lip sync expectations** — The Neo-Print style doesn't need perfect sync
- **Complex camera moves** — Keep cameras relatively static
- **Realistic physics** — Embrace the illustrated, handmade quality

---

## Open Questions

1. **Audio Strategy:** Embed per clip OR layer single VO? 
   - Embedded = more consistent per-clip, but harder to adjust timing
   - Layered = more flexible in post, but requires silent clips + sync work

2. **Clip Duration:** Generate at target length OR generate long and trim?
   - Target length = less wasted generation, but risky if off
   - Generate long = more flexibility, but more generation cost

3. **Transitions:** Use animated transitions within clips OR xfade between?
   - Within clips = each clip is self-contained
   - xfade between = more control over pacing, familiar V1 workflow

4. **Iteration:** How to handle clips that don't work?
   - Regenerate the whole clip?
   - Use frame extraction and blend?
   - Accept some variation as "handmade charm"?

5. **Cost:** 10 clips × 4s × $X per generation = ?
   - Need to understand cost per clip before scaling

---

## Future Automation Ideas

1. **Storyboard Parser** — Take a structured storyboard doc, auto-generate all prompts
2. **Batch Clip Generation** — Queue all Veo generations at once
3. **Auto-Trim Script** — Take timing doc, auto-trim all clips to target durations
4. **Smart Stitching** — Detect scene boundaries, apply appropriate transitions
5. **Audio Alignment** — Analyze VO waveform, auto-adjust clip timing

---

## Next Steps

1. [ ] Test Veo 3.1 generation with one of the existing images
2. [ ] Evaluate quality/style consistency between static and animated
3. [ ] Test silent generation vs embedded audio
4. [ ] Build trim + concatenate ffmpeg workflow
5. [ ] Create one full animated commercial as proof of concept
6. [ ] Document cost per clip
7. [ ] Decide on audio strategy based on results

---

*Status: Planning Document — Not Yet Implemented*
*Last Updated: 2026-01-03*
*Related: [video-editing.md](./video-editing.md), [veo3.1.md](../../.cursor/commands/veo3.1.md)*
