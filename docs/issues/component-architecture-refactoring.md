# Component Architecture Refactoring Issue

## Problem Statement

The Forge application has **monolithic components** that violate the Single Responsibility Principle, making them difficult to maintain, test, and reuse.

## Current Problems

### Oversized Components

1. **PromptDrawer.tsx** - ~1000+ lines
   - Handles prompt generation logic
   - Manages state for 10+ sections  
   - Contains validation logic
   - Handles API calls
   - Manages UI state

2. **ProjectSettingsModal.tsx** - ~800+ lines
   - Manages 8 different tabs
   - Handles form validation
   - Contains save logic for each tab
   - Manages complex state synchronization

3. **UserSettingsModal.tsx** - ~900+ lines
   - User profile management
   - Environment variables
   - LoRA management
   - Theme settings

### Issues with Current Architecture

```typescript
// ❌ BAD: One component doing everything
export const PromptDrawer = () => {
  // 50+ state variables
  const [userInput, setUserInput] = useState('');
  const [characters, setCharacters] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  // ... 45+ more state variables

  // Multiple responsibilities mixed together
  const generatePrompt = () => { /* 100+ lines */ };
  const handleGeneration = () => { /* 150+ lines */ };
  const validateInput = () => { /* 50+ lines */ };
  const renderSections = () => { /* 500+ lines */ };

  return (
    <div>{/* 400+ lines of JSX */}</div>
  );
};
```

## Impact

- ❌ **Difficult to test** - Can't test individual features in isolation
- ❌ **Hard to maintain** - Changes in one area break other areas  
- ❌ **Poor performance** - Large components re-render unnecessarily
- ❌ **Code duplication** - Similar logic repeated across components
- ❌ **Difficult onboarding** - New developers overwhelmed by complexity

## Solution: Modular Component Architecture

### Design Principles

1. **Single Responsibility** - Each component has one clear purpose
2. **Composition over Inheritance** - Build complex UIs from simple parts
3. **Separation of Concerns** - Logic, state, and UI separated
4. **Reusability** - Components can be used in multiple contexts

### Refactoring Strategy

#### 1. PromptDrawer Refactoring

```typescript
// ✅ GOOD: Modular architecture

// Main orchestrator (100-150 lines)
export const PromptDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const promptState = usePromptState();
  
  return (
    <DrawerShell isOpen={isOpen} onClose={onClose}>
      <PromptHeader />
      <PromptSections state={promptState} />
      <PromptPreview prompt={promptState.generated} />
      <PromptActions onGenerate={promptState.generate} />
    </DrawerShell>
  );
};

// Focused section components (100-200 lines each)
export const PromptSections: React.FC<Props> = ({ state }) => {
  return (
    <SectionContainer>
      <UserInputSection 
        value={state.userInput} 
        onChange={state.setUserInput} 
      />
      <CharacterSection 
        characters={state.characters}
        selected={state.selectedCharacter}
        onSelect={state.setSelectedCharacter}
      />
      <SceneSection 
        scenes={state.scenes}
        selected={state.selectedScene}
        onSelect={state.setSelectedScene}
      />
      <TechnicalSection 
        settings={state.technical}
        onChange={state.updateTechnical}
      />
    </SectionContainer>
  );
};

// Custom hook for state management
export const usePromptState = () => {
  const [userInput, setUserInput] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  // ... focused state management
  
  const generate = useCallback(() => {
    // Prompt generation logic
  }, [userInput, selectedCharacter]);
  
  return {
    userInput,
    setUserInput,
    selectedCharacter,
    setSelectedCharacter,
    generate,
    // ... other state and actions
  };
};
```

#### 2. ProjectSettingsModal Refactoring

```typescript
// ✅ GOOD: Tab-based architecture

// Main container (150-200 lines)
export const ProjectSettingsModal: React.FC<Props> = ({ project, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const settingsState = useProjectSettings(project);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <SettingsHeader project={project} />
      <SettingsTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        errors={settingsState.errors}
      />
      <SettingsContent 
        tab={activeTab}
        state={settingsState}
      />
      <SettingsActions 
        onSave={settingsState.saveAll}
        onCancel={onClose}
        isSaving={settingsState.isSaving}
      />
    </Modal>
  );
};

// Individual tab components (150-250 lines each)
export const GeneralSettingsTab: React.FC<Props> = ({ settings, onChange }) => {
  return (
    <TabContainer>
      <FieldGroup label="Basic Information">
        <TextField 
          label="Project Name"
          value={settings.name}
          onChange={(value) => onChange('name', value)}
        />
        <ColorPicker 
          label="Theme Color"
          value={settings.color}
          onChange={(value) => onChange('color', value)}
        />
      </FieldGroup>
    </TabContainer>
  );
};
```

### Component Hierarchy

```
PromptDrawer/
├── PromptDrawer.tsx           (Main orchestrator)
├── components/
│   ├── PromptHeader.tsx       (Title, close button)
│   ├── PromptSections.tsx     (Section container)
│   ├── PromptPreview.tsx      (Generated prompt display)
│   └── PromptActions.tsx      (Generate, copy buttons)
├── sections/
│   ├── UserInputSection.tsx   (Text input area)
│   ├── CharacterSection.tsx   (Character selection)
│   ├── SceneSection.tsx       (Scene selection)
│   ├── TechnicalSection.tsx   (Camera, lighting settings)
│   └── StyleSection.tsx       (Visual style options)
├── hooks/
│   ├── usePromptState.ts      (Main state management)
│   ├── usePromptGeneration.ts (Generation logic)
│   └── usePromptValidation.ts (Validation logic)
└── types/
    └── promptTypes.ts         (TypeScript interfaces)
```

## Implementation Plan

### Phase 1: PromptDrawer Refactoring (Week 1)
- [ ] Extract state management into custom hooks
- [ ] Create base component structure
- [ ] Split into 5-6 section components
- [ ] Migrate existing functionality

### Phase 2: ProjectSettingsModal (Week 2)  
- [ ] Create tab-based architecture
- [ ] Extract individual tab components
- [ ] Implement unified state management
- [ ] Add proper validation per tab

### Phase 3: UserSettingsModal (Week 3)
- [ ] Apply same modular pattern
- [ ] Extract reusable form components
- [ ] Create focused feature components
- [ ] Improve state management

### Phase 4: Shared Components (Week 4)
- [ ] Extract common UI components
- [ ] Create reusable form elements
- [ ] Implement design system patterns
- [ ] Add comprehensive testing

## Reusable Component Library

### Form Components
```typescript
// Reusable form building blocks
export const TextField: React.FC<TextFieldProps> = ({ ... });
export const SelectField: React.FC<SelectFieldProps> = ({ ... });
export const ColorPicker: React.FC<ColorPickerProps> = ({ ... });
export const TagInput: React.FC<TagInputProps> = ({ ... });
export const FileUpload: React.FC<FileUploadProps> = ({ ... });
```

### Layout Components  
```typescript
// Consistent layout patterns
export const Modal: React.FC<ModalProps> = ({ ... });
export const Drawer: React.FC<DrawerProps> = ({ ... });
export const TabContainer: React.FC<TabContainerProps> = ({ ... });
export const FieldGroup: React.FC<FieldGroupProps> = ({ ... });
```

### Business Components
```typescript
// Domain-specific reusable components
export const CharacterSelector: React.FC<CharacterSelectorProps> = ({ ... });
export const SceneSelector: React.FC<SceneSelectorProps> = ({ ... });
export const LoRASelector: React.FC<LoRASelectorProps> = ({ ... });
```

## Success Metrics

- ✅ No component exceeds 300 lines
- ✅ Each component has single, clear responsibility  
- ✅ 90%+ code reuse across similar features
- ✅ Comprehensive unit tests for each component
- ✅ Improved performance (measured re-renders)

## Benefits

- 🚀 **Faster development** - Reusable components
- 🧪 **Better testing** - Isolated, focused tests
- 🔧 **Easier maintenance** - Changes contained to single purpose
- 📈 **Better performance** - Smaller, optimized re-renders
- 👥 **Team productivity** - Easier for multiple developers

## Files to Refactor

### Immediate Priority
- `src/components/ui/PromptDrawer.tsx` (1000+ lines)
- `src/components/ui/ProjectSettingsModal.tsx` (800+ lines)  
- `src/components/ui/UserSettingsModal.tsx` (900+ lines)

### Secondary Priority
- `src/components/ui/CreateProjectModal.tsx` (400+ lines)
- `src/components/ui/ProjectSettingsPage.tsx` (300+ lines)

### Create New Structure
- `src/components/shared/` - Reusable UI components
- `src/components/forms/` - Form-specific components  
- `src/components/business/` - Domain-specific components
- `src/hooks/` - Custom hooks for state management 