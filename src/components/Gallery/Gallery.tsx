'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ImageCard } from '@/components/ui/ImageCard';
import { ImageUploadModal } from '@/components/ui/ImageUploadModal';
import { GalleryMenuBar } from './GalleryMenuBar';
import { useImageContext } from '@/contexts/ImageContext';
import { ImageData } from '@/contexts/ImageContext';
import { useDragDropContext } from '@/contexts/DragDropContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useFileWatcher } from '@/hooks/useFileWatcher';
import { getGalleryColumnSpan } from '@/utils/aspectRatioUtils';
import { extractModel, extractVideoType } from '@/utils/mediaMetadataUtils';

export const Gallery: React.FC = () => {
  const { getGalleryImages, isLoading, error } = useImageContext();
  const { activeDrag } = useDragDropContext();
  const { currentProject } = useProjectContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = React.useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  
  // Initialize filter state from URL params
  const [selectedModel, setSelectedModel] = React.useState<string | null>(
    searchParams.get('model') || null
  );
  const [selectedVideoType, setSelectedVideoType] = React.useState<string | null>(
    searchParams.get('videoType') || null
  );
  const [selectedMediaType, setSelectedMediaType] = React.useState<'image' | 'video' | null>(
    (searchParams.get('mediaType') as 'image' | 'video' | null) || null
  );
  
  // Re-enable file watcher with safe DB-sync-and-reload behavior
  useFileWatcher({
    pollInterval: 5000,
    enabled: true,
    onNewMedia: (imageCount, videoCount) => {
      if (imageCount > 0 && videoCount > 0) {
        console.log(`📁 ${imageCount} new images and ${videoCount} new videos detected`) 
      } else if (imageCount > 0) {
        console.log(`📁 ${imageCount} new images detected`)
      } else if (videoCount > 0) {
        console.log(`📁 ${videoCount} new videos detected`)
      }
    }
  });
  
  // ALL HOOKS MUST BE AT THE TOP LEVEL - before any returns
  const { setNodeRef, isOver } = useDroppable({
    id: 'gallery-droppable',
  });
  
  // Handle hydration
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Update URL params when filters change
  const updateURLParams = React.useCallback((
    model: string | null,
    videoType: string | null,
    mediaType: 'image' | 'video' | null
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (model) {
      params.set('model', model);
    } else {
      params.delete('model');
    }
    
    if (videoType) {
      params.set('videoType', videoType);
    } else {
      params.delete('videoType');
    }
    
    if (mediaType) {
      params.set('mediaType', mediaType);
    } else {
      params.delete('mediaType');
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  // Handlers that update both state and URL
  const handleModelChange = React.useCallback((model: string | null) => {
    setSelectedModel(model);
    updateURLParams(model, selectedVideoType, selectedMediaType);
  }, [selectedVideoType, selectedMediaType, updateURLParams]);

  const handleVideoTypeChange = React.useCallback((videoType: string | null) => {
    setSelectedVideoType(videoType);
    updateURLParams(selectedModel, videoType, selectedMediaType);
  }, [selectedModel, selectedMediaType, updateURLParams]);

  const handleMediaTypeChange = React.useCallback((mediaType: 'image' | 'video' | null) => {
    setSelectedMediaType(mediaType);
    updateURLParams(selectedModel, selectedVideoType, mediaType);
  }, [selectedModel, selectedVideoType, updateURLParams]);

  // Sync state with URL params when they change externally (e.g., browser back/forward)
  React.useEffect(() => {
    const model = searchParams.get('model');
    const videoType = searchParams.get('videoType');
    const mediaType = searchParams.get('mediaType') as 'image' | 'video' | null;
    
    // Only update state if URL params differ from current state
    if (model !== selectedModel) {
      setSelectedModel(model);
    }
    if (videoType !== selectedVideoType) {
      setSelectedVideoType(videoType);
    }
    if (mediaType !== selectedMediaType) {
      setSelectedMediaType(mediaType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const galleryImages = React.useMemo(() => {
    let images = getGalleryImages(currentProject?.id || '');
    
    // Deduplicate images by ID to prevent React key conflicts
    const uniqueImages = images.filter((image, index, array) => 
      array.findIndex(img => img.id === image.id) === index
    );

    // Apply filters
    let filtered = uniqueImages;

    // Filter by media type (image/video)
    if (selectedMediaType) {
      filtered = filtered.filter(image => image.mediaType === selectedMediaType);
    }

    // Filter by model
    if (selectedModel) {
      filtered = filtered.filter(image => {
        const model = extractModel(image);
        return model === selectedModel;
      });
    }

    // Filter by video type
    if (selectedVideoType) {
      filtered = filtered.filter(image => {
        const videoType = extractVideoType(image);
        return videoType === selectedVideoType;
      });
    }

    // Sort: If video type filter is active, group videos by type, then by date
    if (selectedVideoType) {
      filtered.sort((a, b) => {
        // Videos first, then images
        if (a.mediaType === 'video' && b.mediaType !== 'video') return -1;
        if (a.mediaType !== 'video' && b.mediaType === 'video') return 1;
        
        // Within same media type, sort by date (newest first)
        return b.createdAt - a.createdAt;
      });
    } else {
      // Default: sort by date (newest first)
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  }, [getGalleryImages, currentProject?.id, selectedModel, selectedVideoType, selectedMediaType]);





  // Show loading during hydration
  if (!isClient) {
    return (
      <section className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b border-foreground mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Initializing...</p>
          </div>
        </div>
      </section>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <section className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b border-foreground mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading images...</p>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-sm text-red-500 mb-2">Failed to load images</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  // Only show drop zone styling when dragging from another container (not from gallery)
  const showDropZone = isOver && activeDrag && activeDrag.type !== 'gallery';

  return (
    <section className="w-full max-w-full overflow-x-hidden">
      {/* Gallery Menu Bar */}
      <GalleryMenuBar
        onAddImage={() => setIsUploadModalOpen(true)}
        images={getGalleryImages(currentProject?.id || '')}
        selectedModel={selectedModel}
        selectedVideoType={selectedVideoType}
        selectedMediaType={selectedMediaType}
        onModelChange={handleModelChange}
        onVideoTypeChange={handleVideoTypeChange}
        onMediaTypeChange={handleMediaTypeChange}
      />

      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-4 md:py-8 max-w-full">
        <div 
          ref={setNodeRef}
          className={`min-h-[200px] transition-colors duration-200 w-full max-w-full overflow-x-hidden ${
            showDropZone ? 'bg-accent/20 border border-dashed border-border rounded-lg' : ''
          }`}
        >
        <SortableContext 
          items={galleryImages.map(img => img.id)} 
          strategy={rectSortingStrategy}
        >
          {/* Base 12 Column Grid System */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 w-full max-w-full">
            {galleryImages.map((image, index) => {
              const columnSpan = getGalleryColumnSpan(image);
              
              return (
                <ImageCard 
                  key={image.id}
                  image={image}
                  delay={index * 0.02}
                  className={`w-full ${columnSpan}`}
                />
              );
            })}
          </div>
        </SortableContext>
        
        {/* Empty State */}
        {galleryImages.length === 0 && (
          <div className="flex items-center justify-center h-32 md:h-48 text-muted-foreground">
            <div className="text-center">
              <p className="text-xs md:text-sm font-medium">No media found</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Generate some images or videos to get started</p>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Image Upload Modal */}
      <ImageUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </section>
  );
}; 