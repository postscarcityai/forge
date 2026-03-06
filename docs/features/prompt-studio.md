# Prompt Studio - Technical Documentation

## Overview

The Prompt Studio is a sophisticated prompt building interface that provides granular control over AI image generation prompts. It features a collapsible dropdown interface with real-time prompt assembly, parameter validation, and a strict 392-word budget enforcement system.

## Architecture

### Core Components

#### 1. PromptDrawer Component (`src/components/ui/PromptDrawer.tsx`)
The main interface component with the following key features:
- **Real-time prompt assembly** with live word count tracking
- **Collapsible dropdown sections** for organized parameter control
- **Multi-character support** (up to 3 characters)
- **Granular parameter controls** for each component
- **Responsive design** with mobile/desktop adaptations

#### 2. Prompt Components System (`src/utils/promptComponents.ts`)
Backend logic for prompt assembly:
- **10 distinct prompt components** with individual word budgets
- **Fallback system** for missing project data
- **Word count validation** and trimming utilities
- **Component assembly** with proper ordering and formatting

### Data Flow

```
Project Context → PromptDrawer → Parameter Controls → Prompt Assembly → Generated Output
```

1. **Project Loading**: Current project data is fetched from context
2. **Character/Scene Fetching**: API calls retrieve project-specific entities
3. **Parameter Control**: User toggles individual parameter visibility
4. **Real-time Assembly**: Changes trigger immediate prompt regeneration
5. **Output Generation**: Final prompt respects 392-word budget

## Component Structure

### Word Budget Allocation (392 words total)

| Component | Budget | Description |
|-----------|--------|-------------|
| Master Prompt | 60w | Core brand and project foundation |
| User Input | 16w | Custom user phrase and direction |
| Character Description | 80w | Physical appearance, demographics, outfit |
| Scene Foundation | 64w | Setting, lighting, mood, environment |
| Technical Photography | 48w | Camera settings, lens type, lighting specs |
| Visual Style & Aesthetic | 48w | Overall style, color palette, artistic references |
| Atmospheric & Environmental | 32w | Weather, time of day, environmental atmosphere |
| Supporting Elements | 24w | Props, textures, materials, background elements |
| Post-Processing & Effects | 12w | Final visual effects and post-processing |
| LoRA Trigger Words | 8w | LoRA trigger words for style enhancement |

### Dropdown Sections

#### 1. Master Prompt Component
- **Purpose**: Project-specific foundation prompt
- **Data Source**: `currentProject.imagePrompting.masterPrompt`
- **Fallback**: Database default values
- **User Control**: Enable/disable toggle only

#### 2. Custom Prompt (User Input)
- **Purpose**: User's creative direction
- **Input**: Text field with real-time validation
- **User Control**: Full text editing + enable/disable

#### 3. Characters (up to 3)
- **Multi-character support**: Independent parameter controls per character
- **Parameter Controls**:
  - Age, Gender, Race, Height
  - Hair Color, Eye Color, Physical Appearance
  - Profession, Outfit Selection
- **Data Sources**: Character database + outfit variations
- **Real-time Display**: Shows actual values from database

#### 4. Scene Foundation
- **Dual Toggle System**: Scene selection + component enable/disable
- **Parameter Controls**:
  - Setting, Time of Day, Lighting, Mood
  - Camera Angle, Atmosphere, Props
- **Props Handling**: Displays up to 3 props with validation

#### 5. Technical Photography
- **Backend Integration**: `currentProject.imagePrompting` technical parameters
- **Parameter Controls**:
  - Camera Angle, Shot Type, Lens Type, Focal Length
  - Lighting Style, Light Direction
- **Value Display**: Shows actual backend values or "not set"

#### 6. Visual Style & Aesthetic
- **Style Parameters**:
  - Overall Style, Color Palette
  - Artistic References, Visual Effects
- **Backend Source**: Project image prompting settings

#### 7-10. Additional Components
- **Atmospheric & Environmental**: Weather and environmental data
- **Supporting Elements**: Props and background elements
- **Post-Processing & Effects**: Visual effects from backend
- **LoRA Trigger Words**: LoRA configuration with trigger word display

## State Management

### Core State Variables

```typescript
// Component toggles with word budgets
const [componentToggles, setComponentToggles] = useState<PromptComponentToggle[]>([]);

// Multi-character state (up to 3)
const [selectedCharacters, setSelectedCharacters] = useState<{
  character: Character | null;
  outfitIndex: number;
  enabled: boolean;
}[]>([...]);

// Granular parameter controls per character
const [characterControls, setCharacterControls] = useState([
  { age: true, gender: true, race: true, height: true, ... },
  { age: true, gender: true, race: true, height: true, ... },
  { age: true, gender: true, race: true, height: true, ... }
]);

// Scene and technical parameter controls
const [sceneControls, setSceneControls] = useState({...});
const [technicalControls, setTechnicalControls] = useState({...});
const [styleControls, setStyleControls] = useState({...});
```

### Real-time Updates

#### Prompt Generation Trigger
```typescript
useEffect(() => {
  // Triggers on any state change:
  // - Component toggles
  // - Character selection/parameters
  // - Scene selection/parameters
  // - User input changes
  generatePrompt();
}, [selectedCharacters, selectedScene, userInput, componentToggles, ...]);
```

#### Character Component Building
```typescript
const buildControlledCharacterComponent = useCallback((character, outfitIndex, controlIndex) => {
  const controls = characterControls[controlIndex];
  const parts: string[] = [];
  
  // Only include enabled parameters
  if (controls.age && character.age) parts.push(`${character.age} year old`);
  if (controls.gender && character.gender?.trim()) parts.push(character.gender.toLowerCase());
  // ... additional parameter checks
  
  return parts.filter(part => part.trim()).join(', ');
}, [characterControls]);
```

## Data Validation & Safety

### Empty Value Checking
```typescript
// Comprehensive validation prevents empty commas
if (controls.hairColor && character.hairColor && character.hairColor.trim()) {
  parts.push(`${character.hairColor.toLowerCase()} hair`);
}

// Filter out empty parts before joining
return parts.filter(part => part.trim()).join(', ');
```

### Word Count Compliance
```typescript
const getComplianceColor = (totalWords: number) => {
  if (totalWords <= 350) return 'text-green-600';
  if (totalWords <= 392) return 'text-yellow-600';
  return 'text-red-600';
};
```

### API Error Handling
```typescript
try {
  const charactersResponse = await fetch(`/api/database/characters?projectId=${currentProject.id}`);
  const charactersData = await charactersResponse.json();
  if (charactersData.success && charactersData.data) {
    // Handle successful response
  }
} catch (error) {
  console.error('Error fetching project data:', error);
}
```

## UI/UX Features

### Responsive Design
- **Desktop**: 384px width (w-96) sidebar overlay
- **Mobile**: Full-width overlay (w-full)
- **Animation**: Smooth slide-in/out transitions using Framer Motion

### Visual Feedback
- **Word Count Colors**: Green (≤350), Yellow (351-392), Red (>392)
- **Component Status**: Visual toggles show enabled/disabled state
- **Parameter Display**: Real-time value preview with "not set" fallbacks
- **Loading States**: Skeleton loading during data fetching

### Accessibility
- **Keyboard Navigation**: Full keyboard support for all controls
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order

## Integration Points

### Project Context
```typescript
const { currentProject } = useProjectContext();
```

### API Endpoints
- **Characters**: `/api/database/characters?projectId=${projectId}`
- **Scenes**: `/api/database/scenes?projectId=${projectId}`

### Backend Data Sources
- **Project Settings**: `currentProject.imagePrompting`
- **LoRA Configuration**: `currentProject.loras`
- **Character Database**: Individual character records with outfits
- **Scene Database**: Scene records with props and parameters

## Performance Optimizations

### Memoization
```typescript
const buildControlledCharacterComponent = useCallback((character, outfitIndex, controlIndex) => {
  // Expensive character building logic
}, [characterControls]);

const buildControlledSceneComponent = useCallback((scene) => {
  // Scene building logic
}, [sceneControls]);
```

### Conditional Rendering
```typescript
{componentToggles.find(t => t.id === 'masterPrompt') && (
  <ComponentSection />
)}
```

### Debounced Updates
- Real-time prompt generation with efficient re-rendering
- State batching for multiple simultaneous parameter changes

## Security Considerations

### Input Sanitization
- User input is trimmed and validated before processing
- Word count limits prevent prompt injection attacks
- No direct HTML rendering of user content

### API Security
- Project-scoped data fetching prevents cross-project access
- Error boundaries prevent system crashes from malformed data

## Browser Compatibility

### Supported Features
- **ES6+ Features**: Modern JavaScript with proper polyfills
- **CSS Grid/Flexbox**: Modern layout techniques
- **Framer Motion**: Hardware-accelerated animations
- **Responsive Design**: Works on all screen sizes

### Fallbacks
- Graceful degradation for older browsers
- CSS variable fallbacks for theming
- No-JavaScript fallback messages 