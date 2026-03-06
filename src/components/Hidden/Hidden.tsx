'use client';

import React from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { ImageCard } from '@/components/ui/ImageCard';
import { useImageContext, ImageData } from '@/contexts/ImageContext';
import { useDragDropContext } from '@/contexts/DragDropContext';
import { useProjectContext } from '@/contexts/ProjectContext';

// Helper function to detect if an image is landscape
const isLandscape = (image: ImageData): boolean => {
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

export const Hidden: React.FC = () => {
  const { getHiddenImages, isLoading } = useImageContext();
  const { activeDrag } = useDragDropContext();
  const { currentProject } = useProjectContext();
  const [isClient, setIsClient] = React.useState(false);
  
  // ALL HOOKS MUST BE AT THE TOP LEVEL - before any returns
  const { setNodeRef, isOver } = useDroppable({
    id: 'hidden-droppable',
  });
  
  // Handle hydration
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const hiddenImages = React.useMemo(() => {
    const images = getHiddenImages(currentProject?.id || '');
    // Deduplicate images by ID to prevent React key conflicts
    const uniqueImages = images.filter((image, index, array) => 
      array.findIndex(img => img.id === image.id) === index
    );
    return uniqueImages;
  }, [getHiddenImages, currentProject?.id]);
  
  // Only show drop zone styling when dragging from another container (not from hidden)
  const showDropZone = isOver && activeDrag && activeDrag.type !== 'hidden';

  // Show loading during hydration
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading hidden images...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading hidden images...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hidden Images</h1>
        <p className="text-gray-600">
          {hiddenImages.length} hidden {hiddenImages.length === 1 ? 'image' : 'images'}
        </p>
      </div>

      <div 
        ref={setNodeRef}
        className={`min-h-[200px] transition-colors duration-200 ${
          showDropZone ? 'bg-red-50 border-2 border-dashed border-red-300 rounded-lg' : ''
        }`}
      >
        <SortableContext 
          items={hiddenImages.map(img => img.id)} 
          strategy={rectSortingStrategy}
        >
          {/* Base 12 Column Grid System */}
          <div className="grid grid-cols-12 gap-4">
            {hiddenImages.map((image, index) => {
              const imageIsLandscape = isLandscape(image);
              // Portrait: col-span-6 (mobile), col-span-4 (tablet), col-span-3 (desktop), col-span-2 (xl)
              // Landscape: col-span-12 (mobile), col-span-8 (tablet), col-span-6 (desktop), col-span-4 (xl)
              const columnSpan = imageIsLandscape 
                ? 'col-span-12 sm:col-span-8 md:col-span-6 xl:col-span-4'
                : 'col-span-6 sm:col-span-4 md:col-span-3 xl:col-span-2';
              
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
        {hiddenImages.length === 0 && (
          <div className="flex items-center justify-center h-48 text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No hidden images</p>
              <p className="text-sm text-gray-400 mt-1">
                Images you hide will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}; 