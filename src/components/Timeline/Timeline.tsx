'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { ImageCard } from '@/components/ui/ImageCard';
import { useImageContext } from '@/contexts/ImageContext';
import { useDragDropContext } from '@/contexts/DragDropContext';
import { Icon } from '@/components/ui/Icon';
import { ClearTimelineModal } from '@/components/ui/ClearTimelineModal';
import { DownloadTimelineModal } from '@/components/ui/DownloadTimelineModal';
import { Link, Folder, Check, Trash2, Download } from 'lucide-react';
import { getTimelineWidthClasses } from '@/utils/aspectRatioUtils';
import { getVideoLocalPath } from '@/utils/videoPathUtils';
import { downloadTimelineImages } from '@/utils/downloadUtils';

interface TimelineProps {
  timelineRef?: React.RefObject<HTMLDivElement | null>;
  projectId: string;
}

export const Timeline: React.FC<TimelineProps> = ({ timelineRef, projectId }) => {
    const { getTimelineImages, clearTimeline } = useImageContext();
    const { activeDrag } = useDragDropContext();
    const [isFalUrlCopied, setIsFalUrlCopied] = React.useState(false);
    const [isPathCopied, setIsPathCopied] = React.useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = React.useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);
    
    const timelineImages = React.useMemo(() => {
      const images = getTimelineImages(projectId);
      // Deduplicate images by ID to prevent React key conflicts
      const uniqueImages = images.filter((image, index, array) => 
        array.findIndex(img => img.id === image.id) === index
      );
      return uniqueImages;
    }, [getTimelineImages, projectId]);

    // Copy all Fal AI links from timeline
    const handleCopyAllFalLinks = async () => {
      try {
        const falLinks: string[] = [];
        
        timelineImages.forEach((image) => {
          const falImageUrl = image.metadata?.fal_image_url as string;
          const falVideoUrl = image.metadata?.fal_video_url as string;
          const falUrl = falVideoUrl || falImageUrl;
          
          if (falUrl) {
            falLinks.push(falUrl);
          }
        });

        if (falLinks.length === 0) {
          console.log('No Fal AI links found in timeline');
          return;
        }

        await navigator.clipboard.writeText(JSON.stringify(falLinks, null, 2));
        console.log(`✅ Copied ${falLinks.length} Fal AI links to clipboard`);
        
        // Show copied feedback
        setIsFalUrlCopied(true);
        setTimeout(() => setIsFalUrlCopied(false), 2000);
        
      } catch (error) {
        console.error('Failed to copy Fal AI links:', error);
      }
    };

    // Copy all local paths from timeline
    const handleCopyAllPaths = async () => {
      try {
        const paths: string[] = [];
        
        timelineImages.forEach((image) => {
          let relativePath: string;
          if (image.mediaType === 'video') {
            relativePath = getVideoLocalPath(image);
          } else {
            relativePath = `/images/${image.filename}`;
          }
          paths.push(relativePath);
        });

        await navigator.clipboard.writeText(JSON.stringify(paths, null, 2));
        console.log(`✅ Copied ${paths.length} local paths to clipboard`);
        
        // Show copied feedback
        setIsPathCopied(true);
        setTimeout(() => setIsPathCopied(false), 2000);
        
      } catch (error) {
        console.error('Failed to copy local paths:', error);
      }
    };

    // Handle clear timeline
    const handleClearTimeline = () => {
      setIsClearModalOpen(true);
    };

    const handleConfirmClearTimeline = () => {
      clearTimeline();
      console.log(`🗑️ Cleared ${timelineImages.length} items from timeline`);
    };

    // Handle download timeline
    const handleDownloadTimeline = () => {
      console.log('🔍 Download button clicked!', { imageCount: timelineImages.length });
      setIsDownloadModalOpen(true);
    };

    const handleConfirmDownloadTimeline = async () => {
      console.log('🔍 Download confirmed!', { imageCount: timelineImages.length });
      setIsDownloading(true);
      try {
        const results = await downloadTimelineImages(timelineImages, (completed, total) => {
          console.log(`📥 Downloaded ${completed}/${total} images`);
        });

        console.log(`📦 Download completed: ${results.successful} successful, ${results.failed} failed`);
        
        if (results.errors.length > 0) {
          console.warn('Download errors:', results.errors);
        }
      } catch (error) {
        console.error('Download failed:', error);
      } finally {
        setIsDownloading(false);
      }
    };

    const { setNodeRef, isOver } = useDroppable({
      id: 'timeline-droppable',
    });

    // Only show drop zone styling when dragging from another container (not from timeline)
    const showDropZone = isOver && activeDrag && activeDrag.type !== 'timeline';

    return (
      <div className="relative pt-2 md:pt-4 lg:pt-6 w-full max-w-full overflow-x-hidden">
        {/* Left Gradient Fade */}
        <div className="absolute left-0 top-2 md:top-4 lg:top-6 bottom-12 w-4 md:w-6 lg:w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        
        {/* Right Gradient Fade */}
        <div className="absolute right-0 top-2 md:top-4 lg:top-6 bottom-12 w-4 md:w-6 lg:w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Horizontal Scrolling Timeline - Flexible Container */}
        <div 
          ref={(node) => {
            setNodeRef(node);
            if (timelineRef?.current !== node) {
              (timelineRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          className={`transition-colors duration-200 pl-3 md:pl-4 lg:pl-6 pr-6 md:pr-8 lg:pr-10 pb-3 md:pb-4 lg:pb-6 
            min-h-[220px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[400px] xl:min-h-[420px]
            w-full max-w-full overflow-x-auto overflow-y-hidden ${
            showDropZone ? 'bg-green-50 dark:bg-green-950/20 border border-dashed border-green-300 dark:border-green-700 rounded-lg mx-2 md:mx-3 lg:mx-4' : ''
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {timelineImages.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full min-h-[180px] sm:min-h-[240px] md:min-h-[280px] lg:min-h-[350px]">
              <div className="text-center space-y-2">
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">No images in timeline</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted opacity-60">Drag images here to add them to the timeline</p>
              </div>
            </div>
          ) : (
            <SortableContext 
              items={timelineImages.map(img => img.id)} 
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 h-full w-max min-w-full">
                {timelineImages.map((image) => {
                  const widthClasses = getTimelineWidthClasses(image);
                  
                  return (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0 h-full"
                    >
                      <ImageCard 
                        image={image} 
                        className={widthClasses}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </SortableContext>
          )}
        </div>

        {/* Timeline Toolbar - Bottom */}
        {timelineImages.length > 0 && (
          <div className="border-t border-border">
            <div className="flex items-center justify-between px-4 md:px-6 py-1">
              {/* Action Buttons - Left */}
              <div className="flex items-center space-x-2">
                <button 
                  className="p-1 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDownloadTimeline}
                  title="Download timeline images"
                  disabled={isDownloading}
                >
                  <Icon icon={Download} size="xs" />
                </button>
                <button 
                  className="p-1 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 cursor-pointer"
                  onClick={handleClearTimeline}
                  title="Clear timeline"
                >
                  <Icon icon={Trash2} size="xs" />
                </button>
              </div>
              
              {/* Utility Buttons - Right */}
              <div className="flex items-center space-x-2">
                <button 
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                  onClick={handleCopyAllFalLinks}
                  title="Copy all Fal AI URLs"
                >
                  <Icon icon={isFalUrlCopied ? Check : Link} size="xs" />
                </button>
                <button 
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                  onClick={handleCopyAllPaths}
                  title="Copy all local paths"
                >
                  <Icon icon={isPathCopied ? Check : Folder} size="xs" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Clear Timeline Confirmation Modal */}
        <ClearTimelineModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          onConfirm={handleConfirmClearTimeline}
          imageCount={timelineImages.length}
        />

        {/* Download Timeline Confirmation Modal */}
        <DownloadTimelineModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          onConfirm={handleConfirmDownloadTimeline}
          imageCount={timelineImages.length}
        />
      </div>
    );
};

Timeline.displayName = 'Timeline'; 