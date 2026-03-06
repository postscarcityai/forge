'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { getAllImagesFromDatabase } from '@/services/imageService';
import { getAllVideosFromDatabase, VideoMetadata } from '@/services/videoService';
import { ImageMetadata } from '@/data/images';
import { defaultTimelineConfig } from '@/data/timeline';
import { dbCache } from '@/lib/indexedDB';
import { useProjectContext } from '@/contexts/ProjectContext';

// Data structures
export interface ImageData {
  id: string;
  title: string;
  description?: string;
  index: number; // original index for fallback
  type: 'timeline' | 'gallery' | 'hidden';
  createdAt: number;
  filename: string; // filename for real images/videos
  projectId: string; // Project association - defaults to 'default' if not specified
  tags?: string[];
  metadata?: Record<string, unknown>;
  isNewlyAdded?: boolean; // Track if image was just added for enhanced animations
  mediaType: 'image' | 'video'; // Track whether this is an image or video
  width?: number; // Media width for aspect ratio calculation
  height?: number; // Media height for aspect ratio calculation
  duration?: number; // Video duration in seconds (for videos only)
}

export interface AppState {
  timeline: string[]; // ordered array of image IDs in timeline
  gallery: string[]; // array of image IDs in main gallery  
  hidden: string[]; // array of image IDs that are hidden
  images: Record<string, ImageData>; // normalized image lookup
  lastModified: number;
}

export type AppAction = 
  | { type: 'MOVE_TO_TIMELINE'; payload: { imageId: string; position?: number } }
  | { type: 'MOVE_TO_GALLERY'; payload: { imageId: string } }
  | { type: 'REORDER_TIMELINE'; payload: { imageIds: string[] } }
  | { type: 'RESTORE_TIMELINE'; payload: { imageIds: string[] } } // For loading saved state without saving
  | { type: 'REORDER_GALLERY'; payload: { imageIds: string[] } }
  | { type: 'HIDE_IMAGE'; payload: { imageId: string; projectId?: string } }
  | { type: 'RESTORE_IMAGE'; payload: { imageId: string; projectId?: string } }
  | { type: 'RESTORE_HIDDEN'; payload: { imageIds: string[] } } // For loading saved hidden state without saving
  | { type: 'CLEAR_TIMELINE' } // Clear all images from timeline and move them to gallery

  | { type: 'LOAD_IMAGES_SUCCESS'; payload: { images: ImageData[] } }
  | { type: 'LOAD_IMAGES_ERROR'; payload: { error: string } }
  | { type: 'ADD_NEW_IMAGE'; payload: { image: ImageData; addToTimeline?: boolean } }
  | { type: 'ADD_GENERATED_IMAGES'; payload: { images: ImageData[] } }
  | { type: 'CLEAR_NEWLY_ADDED_FLAGS' }
  | { type: 'RESET_TO_DEFAULT' };

// Helper to convert API ImageMetadata to internal ImageData
const convertToImageData = (metadata: ImageMetadata, index: number, currentTimeline: string[] = []): ImageData => {
  // Determine type: use database hidden/timeline_order if available, otherwise check currentTimeline
  let type: 'timeline' | 'gallery' | 'hidden' = 'gallery';
  if (metadata.hidden) {
    type = 'hidden';
  } else if (metadata.timelineOrder !== null && metadata.timelineOrder !== undefined) {
    type = 'timeline';
  } else if (currentTimeline.includes(metadata.id)) {
    type = 'timeline';
  }

  return {
    id: metadata.id,
    title: metadata.title,
    description: metadata.description,
    // Use timeline_order from database for timeline sorting, fallback to array index
    index: (metadata.timelineOrder !== null && metadata.timelineOrder !== undefined) 
      ? metadata.timelineOrder 
      : index,
    type,
    createdAt: new Date(metadata.createdAt).getTime(),
    filename: metadata.filename,
    projectId: metadata.projectId || 'default', // Default to 'default' project if not specified
    tags: metadata.tags,
    metadata: metadata.metadata,
    mediaType: 'image',
    width: metadata.dimensions?.width,
    height: metadata.dimensions?.height
  };
};

// Helper to convert API VideoMetadata to internal ImageData
const convertVideoToImageData = (metadata: VideoMetadata, index: number, currentTimeline: string[] = []): ImageData => {
  // Determine type: use database hidden/timeline_order if available, otherwise check currentTimeline
  let type: 'timeline' | 'gallery' | 'hidden' = 'gallery';
  if (metadata.hidden) {
    type = 'hidden';
  } else if (metadata.timelineOrder !== null && metadata.timelineOrder !== undefined) {
    type = 'timeline';
  } else if (currentTimeline.includes(metadata.id)) {
    type = 'timeline';
  }

  const imageData = {
    id: metadata.id,
    title: metadata.title,
    description: metadata.description,
    // Use timeline_order from database for timeline sorting, fallback to array index
    index: (metadata.timelineOrder !== null && metadata.timelineOrder !== undefined) 
      ? metadata.timelineOrder 
      : index,
    type,
    createdAt: new Date(metadata.createdAt).getTime(),
    filename: metadata.filename,
    projectId: metadata.projectId || 'default', // Default to 'default' project if not specified
    tags: metadata.tags,
    metadata: metadata.metadata,
    mediaType: 'video' as const,
    width: metadata.width,
    height: metadata.height,
    duration: metadata.duration
  };
  
  // Special logging for talking heads videos
  if (metadata.filename.includes('talking-heads')) {
    console.log(`🎬 Converting talking heads video to ImageData: ${metadata.filename}`);
    console.log(`   ID: ${imageData.id}`);
    console.log(`   Type: ${imageData.type}`);
    console.log(`   Project: ${imageData.projectId}`);
  }
  
  return imageData;
};

const createInitialState = (): AppState => {
  return {
    timeline: [], // Will be loaded from IndexedDB or default config
    gallery: [], // Will be populated from API
    hidden: [], // Will be populated from API
    images: {}, // Will be populated from API
    lastModified: Date.now()
  };
};

// State reducer
const imageReducer = (state: AppState, action: AppAction): AppState => {
  const newState = { ...state, lastModified: Date.now() };

  switch (action.type) {
    case 'MOVE_TO_TIMELINE': {
      const { imageId, position } = action.payload;
      const image = state.images[imageId];
      
      if (!image) return state;

      // Remove from gallery if it was there
      const newGallery = state.gallery.filter(id => id !== imageId);
      
      // Add to timeline at position (or end if no position specified)
      const newTimeline = [...state.timeline.filter(id => id !== imageId)];
      const insertPosition = position !== undefined ? position : newTimeline.length;
      newTimeline.splice(insertPosition, 0, imageId);

      // Update image type
      const updatedImages = {
        ...state.images,
        [imageId]: { ...image, type: 'timeline' as const }
      };

      // Save timeline order to IndexedDB
      dbCache.saveTimelineOrder(newTimeline).catch(err => 
        console.warn('Failed to save timeline order:', err)
      );

      return {
        ...newState,
        timeline: newTimeline,
        gallery: newGallery,
        images: updatedImages
      };
    }

    case 'MOVE_TO_GALLERY': {
      const { imageId } = action.payload;
      const image = state.images[imageId];
      
      if (!image) return state;

      // Remove from timeline if it was there
      const newTimeline = state.timeline.filter(id => id !== imageId);
      
      // Add to gallery (at beginning for newest-first)
      const newGallery = [imageId, ...state.gallery.filter(id => id !== imageId)];

      // Update image type
      const updatedImages = {
        ...state.images,
        [imageId]: { ...image, type: 'gallery' as const }
      };

      // Save timeline order to IndexedDB
      dbCache.saveTimelineOrder(newTimeline).catch(err => 
        console.warn('Failed to save timeline order:', err)
      );

      return {
        ...newState,
        timeline: newTimeline,
        gallery: newGallery,
        images: updatedImages
      };
    }

    case 'REORDER_TIMELINE': {
      const newTimelineIds = action.payload.imageIds;
      
      // Save timeline order to IndexedDB
      dbCache.saveTimelineOrder(newTimelineIds).catch(err => 
        console.warn('Failed to save timeline order:', err)
      );

      return {
        ...newState,
        timeline: newTimelineIds
      };
    }

    case 'RESTORE_TIMELINE': {
      // Restore timeline without saving (used during initialization)
      return {
        ...newState,
        timeline: action.payload.imageIds
      };
    }

    case 'RESTORE_HIDDEN': {
      // Restore hidden state without saving (used during initialization)
      return {
        ...newState,
        hidden: action.payload.imageIds
      };
    }

    case 'REORDER_GALLERY': {
      return {
        ...newState,
        gallery: action.payload.imageIds
      };
    }

    case 'HIDE_IMAGE': {
      const { imageId, projectId } = action.payload;
      const image = state.images[imageId];
      
      console.log(`🙈 HIDE_IMAGE action - imageId: ${imageId}, projectId: ${projectId}, image found:`, !!image);
      
      if (!image) return state;

      // Remove from timeline or gallery
      const newTimeline = state.timeline.filter(id => id !== imageId);
      const newGallery = state.gallery.filter(id => id !== imageId);
      
      // Add to hidden
      const newHidden = [...state.hidden, imageId];

      console.log(`🙈 Hiding image - newHidden array:`, newHidden);

      // Update image type
      const updatedImages = {
        ...state.images,
        [imageId]: { ...image, type: 'hidden' as const }
      };

      // Save hidden state to IndexedDB
      if (projectId) {
        console.log(`💾 Saving hidden images to IndexedDB for project "${projectId}":`, newHidden);
        dbCache.saveHiddenImages(projectId, newHidden).catch(err => 
          console.warn('Failed to save hidden images:', err)
        );
      } else {
        console.warn('⚠️ No projectId provided, skipping IndexedDB save');
      }

      // Update hidden state in database
      const updateDatabase = async () => {
        try {
          const endpoint = image.mediaType === 'video' ? '/api/database/videos' : '/api/database/images';
          const idField = image.mediaType === 'video' ? 'videoId' : 'imageId';
          
          console.log(`🗄️ Updating database - endpoint: ${endpoint}, ${idField}: ${imageId}, hidden: true`);
          
          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              [idField]: imageId,
              hidden: true
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.warn(`❌ Failed to update hidden state in database for ${image.mediaType} ${imageId}:`, errorData);
          } else {
            const result = await response.json();
            console.log(`✅ Successfully updated database for ${image.mediaType} ${imageId}:`, result);
          }
        } catch (error) {
          console.warn(`❌ Error updating hidden state in database for ${image.mediaType} ${imageId}:`, error);
        }
      };
      
      // Call database update asynchronously
      updateDatabase();

      return {
        ...newState,
        timeline: newTimeline,
        gallery: newGallery,
        hidden: newHidden,
        images: updatedImages
      };
    }

    case 'RESTORE_IMAGE': {
      const { imageId, projectId } = action.payload;
      const image = state.images[imageId];
      
      if (!image) return state;

      // Remove from hidden
      const newHidden = state.hidden.filter(id => id !== imageId);
      
      // Add to gallery (at beginning for newest-first)
      const newGallery = [imageId, ...state.gallery.filter(id => id !== imageId)];

      // Update image type
      const updatedImages = {
        ...state.images,
        [imageId]: { ...image, type: 'gallery' as const }
      };

      // Save hidden state to IndexedDB
      if (projectId) {
        dbCache.saveHiddenImages(projectId, newHidden).catch(err => 
          console.warn('Failed to save hidden images:', err)
        );
      }

      // Update hidden state in database
      const updateDatabase = async () => {
        try {
          const endpoint = image.mediaType === 'video' ? '/api/database/videos' : '/api/database/images';
          const idField = image.mediaType === 'video' ? 'videoId' : 'imageId';
          
          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              [idField]: imageId,
              hidden: false
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.warn(`❌ Failed to update hidden state in database for ${image.mediaType} ${imageId}:`, errorData);
          } else {
            const result = await response.json();
            console.log(`✅ Successfully updated database for ${image.mediaType} ${imageId}:`, result);
          }
        } catch (error) {
          console.warn(`Error updating hidden state in database for ${image.mediaType} ${imageId}:`, error);
        }
      };
      
      // Call database update asynchronously
      updateDatabase();

      return {
        ...newState,
        gallery: newGallery,
        hidden: newHidden,
        images: updatedImages
      };
    }

    case 'LOAD_IMAGES_SUCCESS': {
      const { images } = action.payload;
      const imageRecord: Record<string, ImageData> = {};
      const galleryImages: ImageData[] = [];
      const timelineImages: ImageData[] = [];
      const hiddenImages: ImageData[] = [];
      
      // Count talking heads videos in the payload
      const talkingHeadsInPayload = images.filter(img => img.filename.includes('talking-heads'));
      if (talkingHeadsInPayload.length > 0) {
        console.log(`🎬 Found ${talkingHeadsInPayload.length} talking heads videos in payload:`);
        talkingHeadsInPayload.forEach(video => {
          console.log(`   - ${video.filename} (ID: ${video.id})`);
        });
      }
      
      // Process images - type is already set from database in convertToImageData/convertVideoToImageData
      // But also check current state to preserve any client-side changes
      images.forEach(image => {
        // First check if client state already has this image categorized
        const isInClientTimeline = state.timeline.includes(image.id);
        const isInClientHidden = state.hidden.includes(image.id);
        
        // Determine final type: prefer client state if set, otherwise use database state
        let finalType: 'timeline' | 'gallery' | 'hidden' = image.type;
        if (isInClientTimeline) {
          finalType = 'timeline';
        } else if (isInClientHidden) {
          finalType = 'hidden';
        }
        
        const updatedImage = {
          ...image,
          type: finalType
        };
        
        imageRecord[image.id] = updatedImage;
        
        // Sort into appropriate array based on final type
        if (finalType === 'timeline') {
          timelineImages.push(updatedImage);
        } else if (finalType === 'hidden') {
          hiddenImages.push(updatedImage);
        } else {
          galleryImages.push(updatedImage);
        }
        
        // Special logging for talking heads videos
        if (image.filename.includes('talking-heads')) {
          console.log(`🎬 Processing talking heads video ${image.filename}: type=${finalType}`);
        }
      });
      
      // Sort gallery by creation date (newest first)
      const sortedGalleryIds = galleryImages
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(image => image.id);

      // Build timeline array - preserve existing client timeline order if any, 
      // otherwise sort by database timeline_order
      let finalTimeline: string[];
      if (state.timeline.length > 0) {
        // Keep existing timeline order, just filter out any removed images
        finalTimeline = state.timeline.filter(id => imageRecord[id]);
      } else {
        // Use database timeline order
        finalTimeline = timelineImages
          .sort((a, b) => {
            // Sort by index which holds timeline_order from database
            return a.index - b.index;
          })
          .map(image => image.id);
      }

      // Build hidden array - merge database and client state
      const finalHidden = hiddenImages.map(image => image.id);
      
      // Count talking heads videos in final gallery
      const talkingHeadsInGallery = galleryImages.filter(img => img.filename.includes('talking-heads'));
      if (talkingHeadsInGallery.length > 0) {
        console.log(`🎬 ${talkingHeadsInGallery.length} talking heads videos added to gallery`);
      }

      console.log(`📊 Image state loaded: ${sortedGalleryIds.length} gallery, ${finalTimeline.length} timeline, ${finalHidden.length} hidden`);

      return {
        ...newState,
        gallery: sortedGalleryIds,
        timeline: finalTimeline,
        hidden: finalHidden,
        images: imageRecord
      };
    }

    case 'LOAD_IMAGES_ERROR': {
      return state; // Keep current state on error
    }

    case 'ADD_NEW_IMAGE': {
      const { image, addToTimeline = false } = action.payload;
      
      // Add image to the images lookup
      const updatedImages = {
        ...state.images,
        [image.id]: { ...image, type: addToTimeline ? 'timeline' as const : 'gallery' as const }
      };

      // Add to timeline or gallery
      if (addToTimeline) {
        return {
          ...newState,
          timeline: [...state.timeline, image.id],
          images: updatedImages
        };
      } else {
        return {
          ...newState,
          gallery: [image.id, ...state.gallery], // Add to beginning for newest-first
          images: updatedImages
        };
      }
    }

    case 'ADD_GENERATED_IMAGES': {
      const { images } = action.payload;
      
      // Create updated images lookup with newly added flag
      const newImages = images.reduce((acc, image) => {
        acc[image.id] = { 
          ...image, 
          type: 'gallery' as const, // Add to gallery by default
          isNewlyAdded: true // Mark as newly added for enhanced animations
        };
        return acc;
      }, {} as Record<string, ImageData>);

      const updatedImages = {
        ...state.images,
        ...newImages
      };

      // Add all new image IDs to the gallery (newest first)
      const newImageIds = images.map(img => img.id);
      
      return {
        ...newState,
        gallery: [...newImageIds, ...state.gallery], // Add to beginning for newest-first
        images: updatedImages
      };
    }

    case 'CLEAR_NEWLY_ADDED_FLAGS': {
      const clearedImages = Object.keys(state.images).reduce((acc, id) => {
        acc[id] = { ...state.images[id], isNewlyAdded: false };
        return acc;
      }, {} as Record<string, ImageData>);

      return {
        ...newState,
        images: clearedImages
      };
    }

    case 'CLEAR_TIMELINE': {
      // Move all timeline images back to gallery
      const timelineImageIds = state.timeline;
      
      if (timelineImageIds.length === 0) {
        return state; // Nothing to clear
      }

      // Update image types to gallery
      const updatedImages = { ...state.images };
      timelineImageIds.forEach(imageId => {
        if (updatedImages[imageId]) {
          updatedImages[imageId] = { ...updatedImages[imageId], type: 'gallery' as const };
        }
      });

      // Add timeline images to gallery (at beginning for newest-first)
      const newGallery = [...timelineImageIds, ...state.gallery.filter(id => !timelineImageIds.includes(id))];

      // Save empty timeline to IndexedDB
      dbCache.saveTimelineOrder([]).catch(err => 
        console.warn('Failed to save timeline order:', err)
      );

      return {
        ...newState,
        timeline: [],
        gallery: newGallery,
        images: updatedImages
      };
    }

    case 'RESET_TO_DEFAULT': {
      return createInitialState();
    }

    default:
      return state;
  }
};

// Context
interface ImageContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getTimelineImages: (projectId?: string) => ImageData[];
  getGalleryImages: (projectId?: string) => ImageData[];
  getHiddenImages: (projectId?: string) => ImageData[];
  getImagesByProject: (projectId: string) => ImageData[];
  getImageCountByProject: (projectId: string) => number;

  loadImages: () => Promise<void>;
  forceReloadImages: () => void;
  addNewImage: (image: ImageData, addToTimeline?: boolean) => void;
  addGeneratedImages: (images: ImageData[]) => void;
  clearNewlyAddedFlags: () => void;
  clearTimeline: () => void;
  isLoading: boolean;
  error: string | null;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

// Provider component
interface ImageProviderProps {
  children: ReactNode;
}

export const ImageProvider: React.FC<ImageProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(imageReducer, createInitialState());
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastSyncTimeRef = React.useRef<string | null>(null);
  
  // Get project context to access current project
  const { currentProject } = useProjectContext();

  // Load images and videos from database
  const loadImages = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current project ID for loading
      const projectId = currentProject?.id || 'default';
      
      const [images, videos] = await Promise.all([
        getAllImagesFromDatabase(projectId),
        getAllVideosFromDatabase(projectId)
      ]);
      
      let allMedia: ImageData[] = [];
      
      const imageData = images.map((metadata, index) => 
        convertToImageData(metadata, index, [])
      );
      allMedia = [...allMedia, ...imageData];
      
      // Add videos to allMedia
      const videoData = videos.map((metadata, index) => 
        convertVideoToImageData(metadata, index + images.length, [])
      );
      allMedia = [...allMedia, ...videoData];
      
      // Sort by creation date (newest first)
      allMedia.sort((a, b) => b.createdAt - a.createdAt);
      
      if (allMedia.length > 0) {
        console.log(`✅ Loaded ${allMedia.length} media items (${images.length} images, ${videos.length} videos) for project: ${projectId}`);
      }
      
      // Count talking heads videos
      const talkingHeadsCount = allMedia.filter(item => item.filename.includes('talking-heads')).length;
      if (talkingHeadsCount > 0) {
        console.log(`🎬 Found ${talkingHeadsCount} talking heads videos in allMedia`);
      }
      
      // Update last sync time
      lastSyncTimeRef.current = new Date().toISOString();
      
      // Load all media into state
      dispatch({ type: 'LOAD_IMAGES_SUCCESS', payload: { images: allMedia } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load media';
      setError(errorMessage);
      dispatch({ type: 'LOAD_IMAGES_ERROR', payload: { error: errorMessage } });
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]); // Include currentProject dependency so it can access the current project

  // Helper function to sync timeline to database
  const syncTimelineToDatabase = React.useCallback(async (timelineIds: string[], projectId: string) => {
    try {
      const response = await fetch('/api/timeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, timelineIds })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save timeline to database');
      }
      
      console.log(`✅ Synced ${timelineIds.length} items to database timeline`);
    } catch (error) {
      console.warn('Failed to sync timeline to database:', error);
      // Don't throw - allow UI to continue working
    }
  }, []);

  // Load saved timeline configuration
  const loadTimelineConfig = React.useCallback(async () => {
    try {
      const projectId = currentProject?.id;
      if (!projectId) {
        // No project yet, fall back to IndexedDB
        const savedConfig = await dbCache.loadTimelineConfig();
        if (savedConfig && savedConfig.timeline.length > 0) {
          dispatch({ 
            type: 'RESTORE_TIMELINE', 
            payload: { imageIds: savedConfig.timeline } 
          });
        }
        return;
      }

      // Try to load from database first (source of truth)
      try {
        isRestoringRef.current = true;
        const response = await fetch(`/api/timeline/sync-from-db?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.timelineIds && data.timelineIds.length > 0) {
            // Database has timeline - use it
            dispatch({ 
              type: 'RESTORE_TIMELINE', 
              payload: { imageIds: data.timelineIds } 
            });
            
            // Save to IndexedDB for offline/cache
            await dbCache.saveTimelineOrder(data.timelineIds);
            console.log(`✅ Loaded ${data.timelineIds.length} items from database timeline`);
            // Reset restore flag after a short delay to allow state to settle
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 1000);
            return;
          }
        }
        isRestoringRef.current = false;
      } catch (dbError) {
        console.warn('Failed to load timeline from database, falling back to IndexedDB:', dbError);
        isRestoringRef.current = false;
      }

      // Fall back to IndexedDB if database is empty or fails
      const savedConfig = await dbCache.loadTimelineConfig();
      if (savedConfig && savedConfig.timeline.length > 0) {
        dispatch({ 
          type: 'RESTORE_TIMELINE', 
          payload: { imageIds: savedConfig.timeline } 
        });
        console.log(`✅ Loaded ${savedConfig.timeline.length} items from IndexedDB timeline`);
      }
    } catch (error) {
      console.warn('Failed to load timeline config:', error);
    }
  }, [currentProject?.id]);

  // Load hidden images for current project only
  const loadHiddenConfig = React.useCallback(async (projectId?: string) => {
    try {
      // Use passed projectId or current project
      const targetProjectId = projectId || currentProject?.id;
      
      // Only load hidden images if we have a project ID
      if (!targetProjectId) {
        return;
      }
      
      const hidden = await dbCache.loadHiddenImages(targetProjectId);
      
      if (hidden.length > 0) {
        // Restore saved hidden configuration without triggering save
        dispatch({ 
          type: 'RESTORE_HIDDEN', 
          payload: { imageIds: hidden } 
        });
      }
    } catch (error) {
      console.warn('Failed to load hidden config:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove currentProject dependency to prevent cascade - currentProject is accessed via closure

  // Load images when current project is available or changes
  // IMPORTANT: loadTimelineConfig must run AFTER loadImages completes to avoid race conditions
  useEffect(() => {
    if (currentProject?.id) {
      loadImages().then(() => {
        // Load timeline AFTER images are loaded to ensure proper state initialization
        loadTimelineConfig();
      }).catch(err => {
        console.warn('Failed to load images:', err);
      });
    }
  }, [currentProject?.id, loadImages, loadTimelineConfig]);

  // Separate effect to reload hidden images when project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadHiddenConfig(currentProject.id);
    }
  }, [currentProject?.id, loadHiddenConfig]);

  // Sync timeline to database when it changes (but not on initial load)
  const isInitialLoadRef = React.useRef(true);
  const isRestoringRef = React.useRef(false);
  
  useEffect(() => {
    if (isInitialLoadRef.current) {
      // Skip first render - timeline was just loaded from database
      isInitialLoadRef.current = false;
      return;
    }
    
    // Don't sync if we're currently restoring timeline from database
    if (isRestoringRef.current) {
      return;
    }

    if (currentProject?.id && state.timeline.length > 0) {
      // Only sync non-empty timelines to prevent clearing database
      syncTimelineToDatabase(state.timeline, currentProject.id);
    }
  }, [state.timeline, currentProject?.id, syncTimelineToDatabase]);

  // Helper functions with project filtering
  const getTimelineImages = (projectId?: string): ImageData[] => {
    // Defensive filter: ensure images are not in gallery or hidden arrays
    const timelineIds = state.timeline.filter(id => 
      !state.gallery.includes(id) && !state.hidden.includes(id)
    );
    const images = timelineIds.map(id => state.images[id]).filter(Boolean);
    return projectId ? images.filter(img => img.projectId === projectId) : images;
  };

  const getGalleryImages = (projectId?: string): ImageData[] => {
    // Defensive filter: ensure images are not in timeline or hidden arrays
    const galleryIds = state.gallery.filter(id => 
      !state.timeline.includes(id) && !state.hidden.includes(id)
    );
    const images = galleryIds.map(id => state.images[id]).filter(Boolean);
    return projectId ? images.filter(img => img.projectId === projectId) : images;
  };

  const getHiddenImages = (projectId?: string): ImageData[] => {
    const images = state.hidden.map(id => state.images[id]).filter(Boolean);
    return projectId ? images.filter(img => img.projectId === projectId) : images;
  };

  const getImagesByProject = (projectId: string): ImageData[] => {
    return Object.values(state.images).filter(img => img.projectId === projectId);
  };

  const getImageCountByProject = (projectId: string): number => {
    return Object.values(state.images).filter(img => img.projectId === projectId).length;
  };

  // Helper to force reload images from database (for when new images are generated)
  const forceReloadImages = () => {
    loadImages();
  };

  // Helper to add a single new image
  const addNewImage = (image: ImageData, addToTimeline = false) => {
    dispatch({ type: 'ADD_NEW_IMAGE', payload: { image, addToTimeline } });
  };

  // Helper to add multiple generated images
  const addGeneratedImages = (images: ImageData[]) => {
    dispatch({ type: 'ADD_GENERATED_IMAGES', payload: { images } });
  };

  // Helper to clear newly added flags (after animations complete)
  const clearNewlyAddedFlags = () => {
    dispatch({ type: 'CLEAR_NEWLY_ADDED_FLAGS' });
  };

  // Helper to clear timeline (move all timeline images back to gallery)
  const clearTimeline = () => {
    dispatch({ type: 'CLEAR_TIMELINE' });
  };

  const value: ImageContextType = {
    state,
    dispatch,
    getTimelineImages,
    getGalleryImages,
    getHiddenImages,
    getImagesByProject,
    getImageCountByProject,
    loadImages,
    forceReloadImages,
    addNewImage,
    addGeneratedImages,
    clearNewlyAddedFlags,
    clearTimeline,
    isLoading,
    error
  };

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
};

// Hook to use the context
export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error('useImageContext must be used within an ImageProvider');
  }
  return context;
}; 