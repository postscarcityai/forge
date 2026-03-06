'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon, GripVertical, Link, Folder, Plus, X, Trash2, Eye, ChevronLeft, ChevronRight, Check } from '@/components/ui/Icon';
import { ImageData, useImageContext } from '@/contexts/ImageContext';
import { ImageModal } from './ImageModal';
import { getAspectRatioClass } from '@/utils/aspectRatioUtils';
import { getVideoUrl } from '@/utils/videoPathUtils';

interface ImageCardProps {
  image: ImageData;
  className?: string;
  width?: string;
  delay?: number;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image,
  className = "",
  width,
  delay = 0
}) => {
  const { clearNewlyAddedFlags, dispatch, getTimelineImages } = useImageContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFalUrlCopied, setIsFalUrlCopied] = useState(false);
  const [isPathCopied, setIsPathCopied] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  // Clear the newly added flag after animation completes
  useEffect(() => {
    if (image.isNewlyAdded) {
      const timer = setTimeout(() => {
        clearNewlyAddedFlags();
      }, 1000); // Clear after 1 second
      
      return () => clearTimeout(timer);
    }
  }, [image.isNewlyAdded, clearNewlyAddedFlags]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Enhanced animations for newly added images
  const animationProps = image.isNewlyAdded 
    ? {
        initial: { y: 30, opacity: 0, rotateY: -5 },
        animate: { y: 0, opacity: 1, rotateY: 0 },
        transition: { 
          delay: delay + 0.2, 
          duration: 0.5, 
          ease: [0.04, 0.62, 0.23, 0.98],
          rotateY: { duration: 0.6 }
        }
      }
    : {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay, duration: 0.3 }
      };

  const handleImageClick = (e: React.MouseEvent) => {
    // Don't open modal if we're dragging
    if (isDragging) return;
    
    // Don't open modal if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    setIsModalOpen(true);
  };

  const handleCopyFalUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const falUrl = (image.metadata?.fal_image_url || image.metadata?.fal_video_url) as string;
    if (falUrl) {
      try {
        await navigator.clipboard.writeText(falUrl);
        console.log('Fal URL copied to clipboard:', falUrl);
        
        // Show copied feedback
        setIsFalUrlCopied(true);
        setTimeout(() => setIsFalUrlCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy Fal URL:', err);
      }
    }
  };

  const handleCopyRelativePath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let relativePath: string;
    if (image.mediaType === 'video') {
      relativePath = getVideoUrl(image);
    } else {
      relativePath = `/images/${image.filename}`;
    }
    try {
      await navigator.clipboard.writeText(relativePath);
      console.log('Relative path copied to clipboard:', relativePath);
      
      // Show copied feedback
      setIsPathCopied(true);
      setTimeout(() => setIsPathCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy relative path:', err);
    }
  };

  const handleAddToTimeline = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'MOVE_TO_TIMELINE',
      payload: { imageId: image.id } // Adds to end of timeline
    });
  };

  const handleRemoveFromTimeline = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'MOVE_TO_GALLERY',
      payload: { imageId: image.id } // Moves to top of gallery
    });
  };

  const handleHideImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'HIDE_IMAGE',
      payload: { imageId: image.id, projectId: image.projectId }
    });
  };

  const handleRestoreImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'RESTORE_IMAGE',
      payload: { imageId: image.id, projectId: image.projectId }
    });
  };

  const handleMoveLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    const timelineImages = getTimelineImages(image.projectId);
    const currentIndex = timelineImages.findIndex(img => img.id === image.id);
    
    if (currentIndex > 0) {
      const newOrder = [...timelineImages];
      // Swap with previous item
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      
      dispatch({
        type: 'REORDER_TIMELINE',
        payload: { imageIds: newOrder.map(img => img.id) }
      });
    }
  };

  const handleMoveRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    const timelineImages = getTimelineImages(image.projectId);
    const currentIndex = timelineImages.findIndex(img => img.id === image.id);
    
    if (currentIndex < timelineImages.length - 1) {
      const newOrder = [...timelineImages];
      // Swap with next item
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      
      dispatch({
        type: 'REORDER_TIMELINE',
        payload: { imageIds: newOrder.map(img => img.id) }
      });
    }
  };

  // Detect if image is landscape
  const aspectRatioClass = getAspectRatioClass(image);

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={{ ...style, ...(width ? { width } : {}) }}
        {...animationProps}
        className={`group cursor-pointer flex-shrink-0 ${className} ${
          isDragging ? 'opacity-50' : ''
        } ${image.isNewlyAdded ? 'relative' : ''}`}
      >
      {/* Card Container */}
      <div className={`bg-background border border-solid rounded-lg overflow-hidden transition-all duration-500 ${
        image.isNewlyAdded 
          ? 'border-green-300 shadow-lg shadow-green-200/50' 
          : isDragging 
            ? 'border-blue-300 shadow-lg shadow-blue-200/50'
            : 'border-border hover:border-muted-foreground'
      } ${className?.includes('h-full') ? 'h-full flex flex-col' : ''} ${className?.includes('w-') ? '' : 'w-full'}`}>
        {/* Media Container - Responsive sizing */}
        <div 
          className={`relative bg-accent overflow-hidden cursor-pointer w-full ${aspectRatioClass}`}
          onClick={handleImageClick}
        >
          {image.mediaType === 'video' ? (
            <>
              {/* Video thumbnail - use generated thumbnail if available, otherwise use video */}
              {image.metadata?.thumbnailPath ? (
                <Image
                  src={image.metadata.thumbnailPath as string}
                  alt={image.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  onError={(e) => {
                    // Hide the image card if thumbnail fails to load
                    const card = (e.target as HTMLImageElement).closest('.group');
                    if (card) {
                      (card as HTMLElement).style.display = 'none';
                    }
                  }}
                />
              ) : (
                <video
                  src={getVideoUrl(image)}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  preload="metadata"
                  onError={(e) => {
                    // Hide the image card if video fails to load
                    const card = (e.target as HTMLVideoElement).closest('.group');
                    if (card) {
                      (card as HTMLElement).style.display = 'none';
                    }
                  }}
                />
              )}
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-black bg-opacity-70 rounded-full p-4 group-hover:bg-opacity-90 transition-all duration-200 shadow-lg">
                  <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </>
          ) : (
            /* Regular image */
            <Image 
              src={`/images/${image.filename}`} 
              alt={image.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              onError={(e) => {
                // Hide the image card if image fails to load
                const card = (e.target as HTMLImageElement).closest('.group');
                if (card) {
                  (card as HTMLElement).style.display = 'none';
                }
              }}
            />
          )}
          
          {/* Action Button - Top Right Corner */}
          {!isDragging && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
              {image.type === 'hidden' ? (
                <button 
                  className="p-2 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-all duration-200 cursor-pointer"
                  onClick={handleRestoreImage}
                  title="Restore image"
                >
                  <Icon icon={Eye} size="xs" />
                </button>
              ) : image.type === 'timeline' ? (
                <button 
                  className="p-2 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-all duration-200 cursor-pointer"
                  onClick={handleRemoveFromTimeline}
                  title="Remove from timeline"
                >
                  <Icon icon={X} size="xs" />
                </button>
              ) : (
                <button 
                  className="p-2 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-all duration-200 cursor-pointer"
                  onClick={handleHideImage}
                  title="Hide image"
                >
                  <Icon icon={Trash2} size="xs" />
                </button>
              )}
            </div>
          )}
          
          {/* Subtle hover overlay - only on hover */}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none z-0" />
        </div>
        
        {/* Card Footer with Action Buttons */}
        <div className="border-t border-border cursor-default flex-shrink-0 p-2">
          {/* Mobile Timeline Layout - Left/Right arrows + centered buttons */}
          {isMobile && image.type === 'timeline' ? (
            <div className="flex items-center justify-between">
              {/* Left Arrow */}
              <button 
                className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={handleMoveLeft}
                disabled={(() => {
                  const timelineImages = getTimelineImages(image.projectId);
                  const currentIndex = timelineImages.findIndex(img => img.id === image.id);
                  return currentIndex === 0;
                })()}
                title="Move left"
              >
                <Icon icon={ChevronLeft} size="xs" />
              </button>
              
              {/* Center Action Buttons */}
              <div className="flex items-center space-x-1">
                {/* Fal URL Copy Button */}
                {((image.metadata?.fal_image_url as string) || (image.metadata?.fal_video_url as string)) && (
                  <button 
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                    onClick={handleCopyFalUrl}
                    title="Copy Fal AI URL"
                  >
                    <Icon icon={isFalUrlCopied ? Check : Link} size="xs" />
                  </button>
                )}
                
                {/* Relative Path Copy Button */}
                <button 
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                  onClick={handleCopyRelativePath}
                  title="Copy relative path"
                >
                  <Icon icon={isPathCopied ? Check : Folder} size="xs" />
                </button>
              </div>
              
              {/* Right Arrow */}
              <button 
                className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={handleMoveRight}
                disabled={(() => {
                  const timelineImages = getTimelineImages(image.projectId);
                  const currentIndex = timelineImages.findIndex(img => img.id === image.id);
                  return currentIndex === timelineImages.length - 1;
                })()}
                title="Move right"
              >
                <Icon icon={ChevronRight} size="xs" />
              </button>
            </div>
          ) : (
            /* Desktop Layout or Non-Timeline Cards */
            <div className="flex items-center justify-between">
              {/* Drag Handle - Left Side - Hide on mobile */}
              {!isMobile && (
                <button 
                  {...attributes}
                  {...listeners}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-grab active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <Icon icon={GripVertical} size="xs" />
                </button>
              )}
              
              {/* Action Buttons - Right Side or Centered on mobile */}
              <div className={`flex items-center space-x-1 ${isMobile ? 'justify-center flex-1' : ''}`}>
                {/* Fal URL Copy Button - Always show if available */}
                {((image.metadata?.fal_image_url as string) || (image.metadata?.fal_video_url as string)) && (
                  <button 
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                    onClick={handleCopyFalUrl}
                    title="Copy Fal AI URL"
                  >
                    <Icon icon={isFalUrlCopied ? Check : Link} size="xs" />
                  </button>
                )}
                
                {/* Relative Path Copy Button */}
                <button 
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                  onClick={handleCopyRelativePath}
                  title="Copy relative path"
                >
                  <Icon icon={isPathCopied ? Check : Folder} size="xs" />
                </button>

                {/* Add to Timeline Button (only for gallery) */}
                {image.type === 'gallery' && (
                  <button 
                    className="p-1 text-muted-foreground hover:text-green-600 transition-colors duration-200 cursor-pointer"
                    onClick={handleAddToTimeline}
                    title="Add to timeline"
                  >
                    <Icon icon={Plus} size="xs" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </motion.div>

      {/* Image Modal */}
      <ImageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        image={image}
      />
    </>
  );
}; 