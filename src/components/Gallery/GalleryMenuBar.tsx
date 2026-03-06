'use client';

import React from 'react';
import { Icon, Plus, Sliders, Camera, Video } from '@/components/ui/Icon';
import { ImageData } from '@/contexts/ImageContext';
import { extractModel, extractVideoType, getModelDisplayName, getVideoTypeDisplayName } from '@/utils/mediaMetadataUtils';

interface GalleryMenuBarProps {
  onAddImage: () => void;
  images: ImageData[];
  selectedModel: string | null;
  selectedVideoType: string | null;
  selectedMediaType: 'image' | 'video' | null;
  onModelChange: (model: string | null) => void;
  onVideoTypeChange: (videoType: string | null) => void;
  onMediaTypeChange: (mediaType: 'image' | 'video' | null) => void;
}

export const GalleryMenuBar: React.FC<GalleryMenuBarProps> = ({
  onAddImage,
  images,
  selectedModel,
  selectedVideoType,
  selectedMediaType,
  onModelChange,
  onVideoTypeChange,
  onMediaTypeChange,
}) => {
  // Extract unique models and video types from images
  const uniqueModels = React.useMemo(() => {
    const models = new Set<string>();
    images.forEach(image => {
      const model = extractModel(image);
      if (model) models.add(model);
    });
    return Array.from(models).sort();
  }, [images]);

  const uniqueVideoTypes = React.useMemo(() => {
    const types = new Set<string>();
    images.forEach(image => {
      const videoType = extractVideoType(image);
      if (videoType) types.add(videoType);
    });
    return Array.from(types).sort();
  }, [images]);

  return (
    <div className="w-full border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 h-10 md:h-12">
        {/* Left side - Add Image Button */}
        <button
          onClick={onAddImage}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-foreground bg-accent/10 hover:bg-accent/20 dark:bg-accent/5 dark:hover:bg-accent/10 border border-border rounded-md transition-all duration-200 hover:border-muted-foreground/50"
          title="Add Image"
        >
          <Icon icon={Plus} size="xs" />
          <span className="hidden sm:inline">Add Image</span>
        </button>

        {/* Right side - Filters */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Media Type Filter */}
          <select
            value={selectedMediaType || ''}
            onChange={(e) => onMediaTypeChange((e.target.value as 'image' | 'video' | null) || null)}
            className="px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[100px] h-7"
          >
            <option value="">All Media</option>
            <option value="image">Images Only</option>
            <option value="video">Videos Only</option>
          </select>

          {/* Video Type Sort */}
          {uniqueVideoTypes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Icon icon={Sliders} size="xs" className="text-muted-foreground" />
              <select
                value={selectedVideoType || ''}
                onChange={(e) => onVideoTypeChange(e.target.value || null)}
                className="px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[120px] h-7"
              >
                <option value="">All Videos</option>
                {uniqueVideoTypes.map((type) => (
                  <option key={type} value={type}>
                    {getVideoTypeDisplayName(type)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Model Filter */}
          {uniqueModels.length > 0 && (
            <select
              value={selectedModel || ''}
              onChange={(e) => onModelChange(e.target.value || null)}
              className="px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[140px] h-7"
            >
              <option value="">All Models</option>
              {uniqueModels.map((model) => (
                <option key={model} value={model}>
                  {getModelDisplayName(model)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

