# FFmpeg Phase 1: Simple Image-to-Video Transitions

## 🎯 **Overview**

Phase 1 focuses on **simple, essential transitions** that turn **still images into videos** in a stop-motion format. Each script takes multiple still images and creates smooth video transitions between them.

---

## 📋 **Phase 1 Scripts (7 Total)**

### ✅ **EXISTING SCRIPTS** (3 scripts)

#### 1. `fade-transition-simple.sh` (EXISTING: `talking-heads-crossfade-simple.sh`)
**Purpose:** Basic crossfade between images  
**Input:** 2-10 still images  
**Output:** 9:16 video with smooth fades  
**Features:**
- Simple crossfade transitions (0.5s)
- 1.5s per image display time
- Clean, professional fade effect

#### 2. `wipe-transition-accelerating.sh` (EXISTING: `create-subculture-video.sh`)
**Purpose:** Right-to-left wipe transitions with speed progression  
**Input:** 2-8 still images  
**Output:** 9:16 video with directional wipes  
**Features:**
- Accelerating wipe timing (0.8s → 0.2s)
- Mathematical easing curves
- Dynamic energy building

#### 3. `flicker-atmospheric.sh` (EXISTING: `create-flicker-video.sh`)
**Purpose:** Atmospheric flicker effect between images  
**Input:** 1-3 still images  
**Output:** 9:16 video with opacity flicker  
**Features:**
- Random opacity variations (0.92-1.0)
- Frame-by-frame control
- Cinematic mood lighting

---

### 🆕 **NEW SIMPLE SCRIPTS** (4 scripts)

#### 4. `slide-transition-directional.sh` (NEW)
**Purpose:** Clean slide transitions in all directions  
**Input:** 2-15 still images  
**Output:** 16:9 or 9:16 video  
**Features:**
- Slide left, right, up, down
- Consistent timing (1.2s per image, 0.3s transition)
- Professional presentation style

**README:**
```bash
# Usage: ./slide-transition-directional.sh --direction left [images...]
# Options: --direction [left|right|up|down|random]
# Creates clean sliding transitions between images
# Perfect for professional presentations
```

#### 5. `zoom-transition-ken-burns.sh` (NEW)
**Purpose:** Zoom-based transitions with Ken Burns movement  
**Input:** 2-12 still images  
**Output:** 16:9 video  
**Features:**
- Zoom in/out between images
- Subtle Ken Burns pan during zoom
- Smooth scaling transitions

**README:**
```bash
# Usage: ./zoom-transition-ken-burns.sh --zoom in [images...]
# Options: --zoom [in|out|alternate]
# Creates dynamic zoom transitions with subtle movement
# Great for storytelling and engagement
```

#### 6. `dissolve-transition-soft.sh` (NEW)
**Purpose:** Soft dissolve transitions with gentle blending  
**Input:** 2-20 still images  
**Output:** Any aspect ratio  
**Features:**
- Gentle dissolve effect (0.8s transition)
- Soft blending algorithm
- Consistent timing across sequence

**README:**
```bash
# Usage: ./dissolve-transition-soft.sh [images...]
# Creates gentle dissolve transitions between images
# Perfect for romantic, peaceful, or reflective content
# Consistent 1.5s per image with 0.8s dissolve
```

#### 7. `cut-transition-rhythmic.sh` (NEW)
**Purpose:** Sharp cuts with rhythmic timing  
**Input:** 3-25 still images  
**Output:** Any aspect ratio  
**Features:**
- No transition effects - clean cuts
- Configurable rhythm (fast/medium/slow)
- Perfect for dynamic, energetic sequences

**README:**
```bash
# Usage: ./cut-transition-rhythmic.sh --rhythm fast [images...]
# Options: --rhythm [fast|medium|slow] (0.5s|1.0s|1.5s per image)
# Creates dynamic sequences with sharp cuts
# Perfect for action, energy, or music videos
```

---

## 🎬 **Image-to-Video Process**

All scripts follow this pattern:

1. **Input:** Multiple still images (JPG/PNG)
2. **Process:** Apply transition effects using FFmpeg
3. **Output:** Single video file with smooth transitions
4. **Format:** Stop-motion style video from still frames

### **Basic FFmpeg Pattern:**
```bash
# Take still images and create video with transitions
ffmpeg -i image1.jpg -i image2.jpg -i image3.jpg \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=1.0[v01]; \
                   [v01][2:v]xfade=transition=fade:duration=0.5:offset=2.0[out]" \
  -map "[out]" -c:v libx264 -r 30 output.mp4
```

---

## 📊 **Phase 1 Script Matrix**

| Script Name | Transition Type | Complexity | Timing | Best For |
|-------------|----------------|------------|---------|----------|
| `fade-transition-simple.sh` | Crossfade | Low | 1.5s + 0.5s fade | Portraits, testimonials |
| `wipe-transition-accelerating.sh` | Directional wipe | Medium | 0.8s → 0.2s | Building energy |
| `flicker-atmospheric.sh` | Opacity flicker | Medium | 6s total | Dramatic, moody |
| `slide-transition-directional.sh` | Slide movement | Low | 1.2s + 0.3s slide | Presentations |
| `zoom-transition-ken-burns.sh` | Zoom + pan | Medium | 1.5s + 0.4s zoom | Storytelling |
| `dissolve-transition-soft.sh` | Soft dissolve | Low | 1.5s + 0.8s dissolve | Peaceful, romantic |
| `cut-transition-rhythmic.sh` | Sharp cuts | Low | 0.5s-1.5s | Dynamic, energetic |

---

## 🎯 **Implementation Order**

### **Week 1: Core Transitions**
1. ✅ Rename existing scripts to clear names
2. 🆕 Create `slide-transition-directional.sh`
3. 🆕 Create `cut-transition-rhythmic.sh`

### **Week 2: Enhanced Effects**
4. 🆕 Create `dissolve-transition-soft.sh`
5. 🆕 Create `zoom-transition-ken-burns.sh`

### **Week 3: Polish & Integration**
6. Add command-line arguments to all scripts
7. Create shared utility functions
8. Test with various image sets

---

## 🚀 **Usage Examples**

### **Basic Fade Slideshow:**
```bash
./fade-transition-simple.sh image1.jpg image2.jpg image3.jpg
# Output: Smooth crossfades between 3 images
```

### **Dynamic Presentation:**
```bash
./slide-transition-directional.sh --direction random *.jpg
# Output: Random slide directions for all images in folder
```

### **Energetic Sequence:**
```bash
./cut-transition-rhythmic.sh --rhythm fast action1.jpg action2.jpg action3.jpg
# Output: Fast-paced cuts perfect for action sequences
```

### **Atmospheric Mood:**
```bash
./flicker-atmospheric.sh moody1.jpg moody2.jpg
# Output: Flickering atmospheric effect between images
```

---

## 🎨 **Creative Applications**

- **Testimonials:** Use fade transitions for professional talking heads
- **Product Showcases:** Use slide transitions for clean presentations  
- **Storytelling:** Use zoom transitions for narrative engagement
- **Music Videos:** Use rhythmic cuts synced to beat
- **Atmospheric Content:** Use flicker for dramatic mood
- **Peaceful Content:** Use dissolve for gentle, calming effects

---

This Phase 1 gives you a solid foundation of **7 simple but versatile image-to-video transition scripts** that cover the most essential needs for turning still images into engaging stop-motion style videos. 