# Prompt Studio - Creative Workflow Guide

## Introduction

The Prompt Studio empowers you to create highly targeted, on-brand AI-generated images by providing granular control over every aspect of your prompt. This guide will walk you through the creative workflow to maximize the potential of your image generation.

## Getting Started

### Opening the Prompt Studio
1. Navigate to your project's main interface
2. Click the **Prompt Studio** button in the toolbar
3. The studio opens as a sidebar with all your project's assets loaded

### Understanding the Interface
- **Generated Prompt**: Live preview of your assembled prompt (top)
- **Word Count**: Real-time tracking (392-word maximum)
- **Collapsible Sections**: Each component has its own expandable card
- **Parameter Controls**: Fine-tune what gets included in your prompt

## Creative Workflow

### Step 1: Foundation Setup

#### Master Prompt Component
Your project's core brand identity and style foundation automatically loads here. This ensures consistency across all generated images.

**What it includes:**
- Brand-specific styling guidelines
- Project aesthetic foundations  
- Core photographic style preferences

**User Action:** Simply enable/disable - no editing needed

#### Custom Prompt Input
Add your creative direction and specific requirements.

**Best Practices:**
- Use descriptive, specific language
- Focus on mood, activity, or scene specifics
- Keep it concise (16-word budget)

**Examples:**
- "dynamic action shot with dramatic lighting"
- "intimate portrait with warm natural lighting"
- "editorial fashion photography with bold contrast"

### Step 2: Character Development

The studio supports up to **3 characters** simultaneously, each with independent parameter controls.

#### Character Selection Process
1. **Choose Your Character**: Select from your project's character database
2. **Select Outfit**: Pick from available outfit variations
3. **Enable/Disable**: Toggle character inclusion
4. **Fine-tune Parameters**: Control which attributes appear in the prompt

#### Parameter Control Strategy

**Essential Parameters (Always Include):**
- **Age & Gender**: Core demographic information
- **Physical Appearance**: Key visual characteristics
- **Outfit**: Current clothing selection

**Contextual Parameters (Include When Relevant):**
- **Race & Height**: Include for specific representation needs
- **Hair/Eye Color**: Important for close-up portraits
- **Profession**: Adds context for business/professional shots

#### Multi-Character Compositions
When using multiple characters:
- **Character 1**: Primary subject (most detail)
- **Character 2**: Secondary subject (selective parameters)
- **Character 3**: Background character (minimal parameters)

**Parameter Distribution Example:**
```
Character 1: All parameters enabled (main subject)
Character 2: Age, gender, outfit only (supporting role)
Character 3: Outfit only (background presence)
```

### Step 3: Scene Foundation

#### Scene Selection
Choose from your project's pre-designed scenes or create new compositions.

**Scene Components:**
- **Setting**: Physical location and environment
- **Time of Day**: Lighting context and mood
- **Lighting Quality**: Technical lighting specifications
- **Mood & Atmosphere**: Emotional tone
- **Camera Angle**: Perspective and framing
- **Props**: Additional scene elements

#### Strategic Scene Parameter Control

**Always Include:**
- **Setting**: Core environmental context
- **Lighting**: Essential for proper mood

**Include When Relevant:**
- **Time of Day**: For outdoor or window-lit scenes
- **Camera Angle**: For specific compositional needs
- **Props**: When scene context requires specific objects
- **Atmosphere**: For emotional or thematic scenes

### Step 4: Technical Photography

Fine-tune the technical aspects of your image generation.

#### Camera & Lens Controls
- **Camera Angle**: Compositional perspective
- **Shot Type**: Close-up, medium, wide, etc.
- **Lens Type**: 85mm portrait, 24mm wide, macro, etc.
- **Focal Length**: Specific technical requirements

#### Lighting Technical Specifications
- **Lighting Style**: Studio, natural, dramatic, soft
- **Light Direction**: Front, side, back, top lighting

**When to Use Technical Controls:**
- **Professional Photography**: Enable all technical parameters
- **Artistic/Creative Shots**: Focus on lighting style and direction
- **Quick Generation**: Use minimal technical parameters

### Step 5: Style & Aesthetic

#### Visual Style Components
- **Overall Style**: Photography genre (portrait, fashion, street, etc.)
- **Color Palette**: Color scheme and mood
- **Artistic References**: Specific artistic influences
- **Visual Effects**: Post-processing style preferences

#### Style Strategy by Use Case

**Brand Photography:**
- Enable Overall Style + Color Palette
- Use Artistic References for consistency
- Minimal Visual Effects for clean look

**Creative/Artistic Work:**
- Enable all style parameters
- Experiment with Visual Effects
- Use Artistic References for inspiration

**Marketing/Commercial:**
- Focus on Overall Style + Color Palette
- Strategic use of Visual Effects
- Brand-aligned Artistic References

### Step 6: Environmental & Supporting Elements

#### Atmospheric Controls
- **Weather Conditions**: Clear, cloudy, dramatic skies
- **Environmental Atmosphere**: Urban, natural, industrial
- **Time-based Lighting**: Golden hour, blue hour, midday

#### Supporting Elements
- **Props & Textures**: Additional scene materials
- **Background Elements**: Environmental details
- **Material Specifications**: Surface textures and finishes

**Use These For:**
- **Complex Scenes**: Enable atmospheric controls
- **Product Photography**: Focus on supporting elements
- **Environmental Portraits**: Balance both categories

### Step 7: Final Polish

#### Post-Processing & Effects
Fine-tune the final image characteristics:
- **Visual Effects**: Film grain, bokeh, lens flares
- **Post-Processing Style**: Clean, vintage, high-contrast

#### LoRA Trigger Words
Your project's LoRA configurations automatically add style-specific trigger words:
- **LoRA 1**: Primary style enhancement
- **LoRA 2**: Secondary style modifiers

## Advanced Techniques

### Word Budget Management

**Budget Allocation Strategy:**
1. **Core Components (60%)**: Characters + Scene + Master Prompt
2. **Technical Refinement (25%)**: Photography + Style parameters  
3. **Creative Enhancement (15%)**: Atmospheric + Effects + LoRA

### Parameter Combination Strategies

#### Portrait Photography
```
✓ Master Prompt (brand consistency)
✓ Custom Input (specific direction)
✓ Character 1 (all parameters)
✓ Scene (setting + lighting only)
✓ Technical (camera angle + lighting style)
✓ Style (overall style + color palette)
✗ Atmospheric (save words)
✗ Supporting Elements (focus on subject)
✓ LoRA Triggers (style enhancement)
```

#### Environmental/Lifestyle Photography
```
✓ Master Prompt (brand consistency)
✓ Custom Input (scene direction)
✓ Character 1 (age, gender, outfit, profession)
✓ Character 2 (minimal parameters)
✓ Scene (all parameters)
✓ Technical (minimal parameters)
✓ Style (overall style only)
✓ Atmospheric (weather + environment)
✓ Supporting Elements (props)
✓ LoRA Triggers (style enhancement)
```

#### Product/Commercial Photography
```
✓ Master Prompt (brand consistency)
✓ Custom Input (product focus)
✗ Characters (not needed)
✓ Scene (setting + lighting + props)
✓ Technical (all parameters)
✓ Style (overall style + color palette)
✓ Atmospheric (minimal)
✓ Supporting Elements (textures + materials)
✓ Post-Processing (clean finish)
✓ LoRA Triggers (product style)
```

## Quality Optimization Tips

### 1. Parameter Prioritization
- **Always include**: Master Prompt + primary character/scene
- **Contextually include**: Technical specifications based on shot type
- **Sparingly include**: Atmospheric elements for specific needs

### 2. Word Count Management
- **Green Zone (≤350 words)**: Optimal range for detailed prompts
- **Yellow Zone (351-392 words)**: Maximum detail but monitor carefully
- **Red Zone (>392 words)**: Reduce parameters to stay within budget

### 3. Iterative Refinement
1. **Start Broad**: Enable core components first
2. **Add Specificity**: Include technical parameters for precision
3. **Enhance Style**: Add atmospheric and effect parameters
4. **Fine-tune**: Adjust parameter selection based on results

### 4. A/B Testing Strategies
- **Test Character Parameters**: Compare full vs. selective parameter sets
- **Test Technical Settings**: Compare minimal vs. full technical controls
- **Test Style Combinations**: Experiment with different style parameter mixes

## Troubleshooting Common Issues

### Poor Character Representation
- **Check Parameter Selection**: Ensure relevant character attributes are enabled
- **Verify Character Data**: Confirm character database has complete information
- **Adjust Outfit Selection**: Try different outfit variations

### Inconsistent Scene Quality
- **Enable Core Scene Parameters**: Setting + Lighting minimum
- **Check Scene Database**: Verify scene has proper attribute data
- **Balance Scene vs. Character Words**: Adjust parameter selection

### Over-Budget Word Count
- **Prioritize Core Elements**: Disable non-essential atmospheric parameters
- **Reduce Character Parameters**: Use selective character attribute control
- **Simplify Technical Settings**: Use minimal technical photography parameters

### Bland/Generic Results
- **Enable Creative Parameters**: Include artistic references and visual effects
- **Add Atmospheric Elements**: Include weather and environmental atmosphere
- **Check LoRA Configuration**: Ensure LoRA trigger words are being included

## Best Practices Summary

1. **Start with Foundation**: Always enable Master Prompt + primary character/scene
2. **Build Systematically**: Add parameters in order of importance
3. **Monitor Word Count**: Stay in green/yellow zones for best results
4. **Test Iteratively**: Make incremental changes to see impact
5. **Document Successful Combinations**: Save parameter sets that work well
6. **Adapt to Content Type**: Use different strategies for portraits vs. lifestyle vs. product photography
7. **Leverage Real-time Preview**: Watch the generated prompt as you make changes
8. **Understand Your Brand**: Align parameter choices with brand guidelines and aesthetic goals 