'use client';

import React, { createContext, useContext, ReactNode, useRef } from 'react';
import Image from 'next/image';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { getDragPreviewClasses, getAspectRatioClass } from '@/utils/aspectRatioUtils';
import { getVideoUrl } from '@/utils/videoPathUtils';
import { useImageContext } from './ImageContext';

// Types for drag operations
export interface ActiveDragData {
  id: string;
  type: 'timeline' | 'gallery' | 'hidden';
  index: number;
}

export interface DropTargetData {
  containerId: 'timeline' | 'gallery' | 'hidden';
  index: number;
}

interface DragDropContextType {
  activeDrag: ActiveDragData | null;
  dropTarget: DropTargetData | null;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

interface DragDropProviderProps {
  children: ReactNode;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ children }) => {
  const { state, dispatch } = useImageContext();
  const [activeDrag, setActiveDrag] = React.useState<ActiveDragData | null>(null);
  const [dropTarget, setDropTarget] = React.useState<DropTargetData | null>(null);
  
  // Debounce timer for real-time reordering
  const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHoverTime = useRef<number>(0);
  const REORDER_DELAY = 0; // no delay required for now

  // Configure sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Slightly increased to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const clearReorderTimeout = () => {
    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
      reorderTimeoutRef.current = null;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    // Clear any existing timeouts
    clearReorderTimeout();
    
    // Determine which container the item is from
    const isInTimeline = state.timeline.includes(activeId);
    const isInGallery = state.gallery.includes(activeId);
    const isInHidden = state.hidden.includes(activeId);
    
    if (isInTimeline) {
      setActiveDrag({
        id: activeId,
        type: 'timeline',
        index: state.timeline.indexOf(activeId)
      });
    } else if (isInGallery) {
      setActiveDrag({
        id: activeId,
        type: 'gallery',
        index: state.gallery.indexOf(activeId)
      });
    } else if (isInHidden) {
      setActiveDrag({
        id: activeId,
        type: 'hidden',
        index: state.hidden.indexOf(activeId)
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDropTarget(null);
      clearReorderTimeout();
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Handle cross-container drops (timeline <-> gallery <-> hidden)
    const activeInTimeline = state.timeline.includes(activeId);
    const activeInGallery = state.gallery.includes(activeId);
    const activeInHidden = state.hidden.includes(activeId);
    const overInTimeline = state.timeline.includes(overId) || overId === 'timeline-droppable';
    const overInGallery = state.gallery.includes(overId) || overId === 'gallery-droppable';
    const overInHidden = state.hidden.includes(overId) || overId === 'hidden-droppable';
    
    // Set drop target for insertion indicator
    if (overInTimeline) {
      if (overId === 'timeline-droppable') {
        setDropTarget({
          containerId: 'timeline',
          index: state.timeline.length
        });
      } else {
        const overIndex = state.timeline.indexOf(overId);
        setDropTarget({
          containerId: 'timeline',
          index: overIndex
        });
      }
    } else if (overInGallery) {
      if (overId === 'gallery-droppable') {
        setDropTarget({
          containerId: 'gallery',
          index: state.gallery.length
        });
      } else {
        const overIndex = state.gallery.indexOf(overId);
        setDropTarget({
          containerId: 'gallery',
          index: overIndex
        });
      }
    } else if (overInHidden) {
      if (overId === 'hidden-droppable') {
        setDropTarget({
          containerId: 'hidden',
          index: state.hidden.length
        });
      } else {
        const overIndex = state.hidden.indexOf(overId);
        setDropTarget({
          containerId: 'hidden',
          index: overIndex
        });
      }
    } else {
      setDropTarget(null);
    }
    
    // Real-time reordering with delay - only within the same container
    const currentTime = Date.now();
    lastHoverTime.current = currentTime;
    
    // Clear existing timeout
    clearReorderTimeout();
    
    // For same-container reordering, wait for delay before actually reordering
    if ((activeInTimeline && overInTimeline && overId !== 'timeline-droppable') ||
        (activeInGallery && overInGallery && overId !== 'gallery-droppable') ||
        (activeInHidden && overInHidden && overId !== 'hidden-droppable')) {
      
      reorderTimeoutRef.current = setTimeout(() => {
        // Check if we're still hovering over the same item
        if (Date.now() - lastHoverTime.current >= REORDER_DELAY - 50) {
          if (activeInTimeline && overInTimeline) {
            const oldIndex = state.timeline.indexOf(activeId);
            const newIndex = state.timeline.indexOf(overId);
            if (oldIndex !== newIndex) {
              const newOrder = arrayMove(state.timeline, oldIndex, newIndex);
              dispatch({
                type: 'REORDER_TIMELINE',
                payload: { imageIds: newOrder }
              });
            }
          } else if (activeInGallery && overInGallery) {
            const oldIndex = state.gallery.indexOf(activeId);
            const newIndex = state.gallery.indexOf(overId);
            if (oldIndex !== newIndex) {
              const newOrder = arrayMove(state.gallery, oldIndex, newIndex);
              dispatch({
                type: 'REORDER_GALLERY',
                payload: { imageIds: newOrder }
              });
            }
          }
        }
      }, REORDER_DELAY);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);
    setDropTarget(null);
    clearReorderTimeout();
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;
    
    // Handle cross-container moves (these are immediate, not delayed)
    const activeInTimeline = state.timeline.includes(activeId);
    const activeInGallery = state.gallery.includes(activeId);
    const activeInHidden = state.hidden.includes(activeId);
    const overInTimeline = state.timeline.includes(overId) || overId === 'timeline-droppable';
    const overInGallery = state.gallery.includes(overId) || overId === 'gallery-droppable';
    const overInHidden = state.hidden.includes(overId) || overId === 'hidden-droppable';
    
    // Cross-container moves
    if (activeInGallery && overInTimeline) {
      if (overId === 'timeline-droppable') {
        dispatch({
          type: 'MOVE_TO_TIMELINE',
          payload: { imageId: activeId }
        });
      } else {
        const overIndex = state.timeline.indexOf(overId);
        dispatch({
          type: 'MOVE_TO_TIMELINE',
          payload: { imageId: activeId, position: overIndex }
        });
      }
    } else if (activeInTimeline && overInGallery) {
      dispatch({
        type: 'MOVE_TO_GALLERY',
        payload: { imageId: activeId }
      });
    } else if (activeInGallery && overInHidden) {
      dispatch({
        type: 'HIDE_IMAGE',
        payload: { imageId: activeId, projectId: state.images[activeId]?.projectId }
      });
    } else if (activeInHidden && overInGallery) {
      dispatch({
        type: 'RESTORE_IMAGE',
        payload: { imageId: activeId, projectId: state.images[activeId]?.projectId }
      });
    }
    
    // Same-container final reordering (if not already done by the timeout)
    else if (activeInTimeline && overInTimeline && overId !== 'timeline-droppable') {
      const oldIndex = state.timeline.indexOf(activeId);
      const newIndex = state.timeline.indexOf(overId);
      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(state.timeline, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_TIMELINE',
          payload: { imageIds: newOrder }
        });
      }
    } else if (activeInGallery && overInGallery && overId !== 'gallery-droppable') {
      const oldIndex = state.gallery.indexOf(activeId);
      const newIndex = state.gallery.indexOf(overId);
      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(state.gallery, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_GALLERY',
          payload: { imageIds: newOrder }
        });
      }
    }
  };

  const value: DragDropContextType = {
    activeDrag,
    dropTarget
  };

  return (
    <DragDropContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeDrag ? (
            <DragPreview dragData={activeDrag} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
};

// Helper function to detect if an image is landscape
const isLandscape = (image: any): boolean => {
  // First check dimensions from metadata
  const dimensions = image.metadata?.dimensions as { width: number; height: number } | undefined;
  if (dimensions && dimensions.width && dimensions.height) {
    return dimensions.width > dimensions.height;
  }
  
  // Fallback: check API response for dimensions
  const apiResponse = image.metadata?.api_response as Record<string, unknown>;
  if (apiResponse?.images && Array.isArray(apiResponse.images) && apiResponse.images[0]) {
    const firstImage = apiResponse.images[0] as Record<string, unknown>;
    if (typeof firstImage.width === 'number' && typeof firstImage.height === 'number') {
      return firstImage.width > firstImage.height;
    }
  }
  
  // Default to false if no dimensions available
  return false;
};

// Drag preview component
interface DragPreviewProps {
  dragData: ActiveDragData;
}

const DragPreview: React.FC<DragPreviewProps> = ({ dragData }) => {
  const { state } = useImageContext();
  const image = state.images[dragData.id];
  
  if (!image) return null;
  
  const containerClasses = getDragPreviewClasses(image);
  const aspectRatio = getAspectRatioClass(image);
  
  return (
    <div className="pointer-events-none transform rotate-2 scale-105 opacity-90">
      <div className={`bg-background border rounded-lg overflow-hidden shadow-xl ${containerClasses}`}>
        {/* Media Container */}
        <div className={`relative bg-accent overflow-hidden w-full ${aspectRatio}`}>
          {image.mediaType === 'video' ? (
            <>
              <video 
                src={getVideoUrl(image)}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                preload="metadata"
              />
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-60 rounded-full p-3">
                  <div className="w-6 h-6 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
                </div>
              </div>
            </>
          ) : (
            <Image 
              src={`/images/${image.filename}`} 
              alt={image.title}
              fill
              className="object-cover"
            />
          )}
        </div>
        
        {/* Card Footer */}
        <div className="p-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="p-1 text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="2" cy="2" r="1"/>
                <circle cx="6" cy="2" r="1"/>
                <circle cx="10" cy="2" r="1"/>
                <circle cx="2" cy="6" r="1"/>
                <circle cx="6" cy="6" r="1"/>
                <circle cx="10" cy="6" r="1"/>
                <circle cx="2" cy="10" r="1"/>
                <circle cx="6" cy="10" r="1"/>
                <circle cx="10" cy="10" r="1"/>
              </svg>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-muted-foreground/20 rounded"></div>
              <div className="w-3 h-3 bg-muted-foreground/20 rounded"></div>
              <div className="w-3 h-3 bg-muted-foreground/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to use the drag drop context
export const useDragDropContext = () => {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDropContext must be used within a DragDropProvider');
  }
  return context;
}; 