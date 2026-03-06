# Drag & Drop System Plan

## Overview
Implement a flexible drag and drop system that allows moving images between the timeline and main photo gallery, with local storage persistence.

## Technical Stack
- **Drag & Drop Library**: `@dnd-kit/core` + `@dnd-kit/sortable` (modern, flexible, touch-friendly)
- **State Management**: React Context + useReducer for complex state logic
- **Persistence**: localStorage with automatic saves
- **Data Structure**: Normalized state with separate timeline and gallery arrays

## Data Structure

```typescript
interface ImageData {
  id: string;
  title: string;
  index: number; // original index for fallback
  type: 'timeline' | 'gallery';
  createdAt: number;
}

interface AppState {
  timeline: string[]; // ordered array of image IDs in timeline
  gallery: string[]; // array of image IDs in main gallery
  images: Record<string, ImageData>; // normalized image lookup
  lastModified: number;
}

type AppAction = 
  | { type: 'MOVE_TO_TIMELINE'; payload: { imageId: string; position: number } }
  | { type: 'MOVE_TO_GALLERY'; payload: { imageId: string } }
  | { type: 'REORDER_TIMELINE'; payload: { imageIds: string[] } }
  | { type: 'REORDER_GALLERY'; payload: { imageIds: string[] } }
  | { type: 'LOAD_FROM_STORAGE'; payload: AppState }
  | { type: 'RESET_TO_DEFAULT' };
```

## Implementation Steps

### Phase 1: Core Infrastructure
1. **Install Dependencies**
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. **Create Context & Reducer**
   - `src/contexts/ImageContext.tsx` - State management
   - `src/hooks/useLocalStorage.ts` - Persistence logic
   - `src/utils/imageState.ts` - State utilities

3. **LocalStorage Integration**
   - Auto-save on every state change
   - Load on app initialization
   - Fallback to default state if corrupted

### Phase 2: Draggable Components
1. **Update ImageCard Component**
   - Add drag handle (subtle grip icon)
   - Visual feedback during drag
   - Preview state while dragging

2. **Create Drop Zones**
   - Timeline drop zone with position indicators
   - Gallery drop zone with insertion indicators
   - Visual feedback for valid/invalid drops

### Phase 3: Drag & Drop Logic
1. **Timeline Interactions**
   - Reorder within timeline
   - Remove from timeline (move to gallery)
   - Insert at specific positions

2. **Gallery Interactions**
   - Add to timeline at end or specific position
   - Reorder within gallery
   - Batch operations

3. **Cross-Container Drops**
   - Timeline → Gallery (remove from timeline)
   - Gallery → Timeline (add to timeline at position)
   - Visual indicators for drop zones

### Phase 4: UX Enhancements
1. **Visual Feedback**
   - Drag preview with image thumbnail
   - Drop zone highlighting
   - Smooth animations for reordering

2. **Touch Support**
   - Mobile-friendly drag interactions
   - Long press to initiate drag
   - Touch scrolling while dragging

## File Structure

```
src/
├── contexts/
│   ├── ImageContext.tsx          # Main state context
│   └── DragDropContext.tsx       # DnD-specific context
├── hooks/
│   ├── useLocalStorage.ts        # Persistence logic
│   ├── useImageState.ts          # State management hook
│   └── useDragDrop.ts            # Drag & drop utilities
├── components/
│   ├── ui/
│   │   ├── ImageCard.tsx         # Updated with drag support
│   │   ├── DragPreview.tsx       # Custom drag preview
│   │   └── DropZone.tsx          # Reusable drop zone
│   ├── Timeline/
│   │   ├── Timeline.tsx          # Timeline container
│   │   └── TimelineDropZone.tsx  # Timeline-specific drops
│   └── Gallery/
│       ├── Gallery.tsx           # Main gallery container
│       └── GalleryDropZone.tsx   # Gallery-specific drops
└── utils/
    ├── imageState.ts             # State utilities
    ├── localStorage.ts           # Storage utilities
    └── dragDrop.ts               # DnD utilities
```

## Key Features

### 1. Flexible Positioning
- Drop between any two items in timeline
- Visual insertion indicators
- Snap-to-position feedback

### 2. Smart Defaults
- New items added to gallery by default
- Timeline maintains chronological order when possible
- Fallback ordering for edge cases

### 3. Instant Persistence
- Every drag operation auto-saves to localStorage
- Debounced writes to prevent performance issues
- Optimistic updates with rollback on failure

### 4. Visual Polish
- Smooth animations using Framer Motion
- Subtle drag handles (⋮⋮ icon)
- Color-coded drop zones
- Loading states during operations

## Technical Considerations

### Performance
- Use React.memo for ImageCard components
- Virtualization for large image sets (if needed)
- Debounced localStorage writes

### Accessibility
- Keyboard navigation for drag operations
- Screen reader announcements
- Focus management during operations

### Error Handling
- Graceful fallback if localStorage is unavailable
- State validation and sanitization
- Recovery from corrupted state

## Usage Examples

```typescript
// Move image from gallery to timeline position 3
dispatch({
  type: 'MOVE_TO_TIMELINE',
  payload: { imageId: 'img-5', position: 3 }
});

// Reorder timeline items
dispatch({
  type: 'REORDER_TIMELINE',
  payload: { imageIds: ['img-1', 'img-3', 'img-2', 'img-4'] }
});

// Move from timeline back to gallery
dispatch({
  type: 'MOVE_TO_GALLERY',
  payload: { imageId: 'img-2' }
});
```

This architecture provides maximum flexibility while maintaining data integrity and persistence across browser sessions. 