'use client';

import { useImageContext } from '@/contexts/ImageContext';

export const useDebugImageState = () => {
  const { state, dispatch, loadImages, isLoading, error } = useImageContext();

  const debugActions = {
    // Move first gallery item to timeline
    moveFirstGalleryToTimeline: () => {
      const firstGalleryId = state.gallery[0];
      if (firstGalleryId) {
        dispatch({
          type: 'MOVE_TO_TIMELINE',
          payload: { imageId: firstGalleryId, position: 0 }
        });
      }
    },

    // Move first timeline item to gallery
    moveFirstTimelineToGallery: () => {
      const firstTimelineId = state.timeline[0];
      if (firstTimelineId) {
        dispatch({
          type: 'MOVE_TO_GALLERY',
          payload: { imageId: firstTimelineId }
        });
      }
    },

    // Reset to default state
    resetToDefault: () => {
      dispatch({ type: 'RESET_TO_DEFAULT' });
    },

    // Shuffle timeline order
    shuffleTimeline: () => {
      const shuffled = [...state.timeline].sort(() => Math.random() - 0.5);
      dispatch({
        type: 'REORDER_TIMELINE',
        payload: { imageIds: shuffled }
      });
    },

    // Shuffle gallery order
    shuffleGallery: () => {
      const shuffled = [...state.gallery].sort(() => Math.random() - 0.5);
      dispatch({
        type: 'REORDER_GALLERY',
        payload: { imageIds: shuffled }
      });
    },

    // Clear localStorage and reset to API images
    clearAndReset: () => {
      dispatch({ type: 'RESET_TO_DEFAULT' });
      loadImages();
    },

    // Reload images from API
    reloadImages: async () => {
      await loadImages();
    },

    // Log current state
    logState: () => {
      console.log('Current State:', {
        timelineCount: state.timeline.length,
        galleryCount: state.gallery.length,
        totalImages: Object.keys(state.images).length,
        lastModified: new Date(state.lastModified).toLocaleTimeString(),
        isLoading,
        error,
        timeline: state.timeline,
        gallery: state.gallery,
        imageDetails: Object.values(state.images).map(img => ({
          id: img.id,
          title: img.title,
          filename: img.filename,
          type: img.type,
          description: img.description,
          tags: img.tags
        }))
      });
    }
  };

  return {
    state,
    dispatch,
    debugActions
  };
}; 