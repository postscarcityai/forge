'use client';

import { ImageData } from '@/contexts/ImageContext';

export interface AspectRatioInfo {
  isLandscape: boolean;
  isPortrait: boolean;
  isSquare: boolean;
  ratio: number;
  width?: number;
  height?: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

/**
 * Enhanced aspect ratio detection that works for both images and videos
 */
export function getAspectRatioInfo(media: ImageData): AspectRatioInfo {
  const dimensions = extractDimensions(media);
  
  // Debug logging for videos to help identify issues
  if (media.mediaType === 'video' && !dimensions) {
    console.log(`🐛 Video ${media.filename} has no dimensions detected:`, {
      dbWidth: media.width,
      dbHeight: media.height,
      metadataKeys: media.metadata ? Object.keys(media.metadata) : [],
      hasApiResponse: !!media.metadata?.api_response,
      hasGenerationParams: !!media.metadata?.generationParams
    });
  }
  
  if (!dimensions || !dimensions.width || !dimensions.height) {
    // Default to portrait if no dimensions available
    return {
      isLandscape: false,
      isPortrait: true,
      isSquare: false,
      ratio: 9/16,
      orientation: 'portrait'
    };
  }

  const { width, height } = dimensions;
  const ratio = width / height;
  
  // Define thresholds for orientation detection
  const SQUARE_THRESHOLD = 0.05; // 5% tolerance for square detection
  const isSquare = Math.abs(ratio - 1) < SQUARE_THRESHOLD;
  const isLandscape = ratio > (1 + SQUARE_THRESHOLD);
  const isPortrait = ratio < (1 - SQUARE_THRESHOLD);

  let orientation: 'landscape' | 'portrait' | 'square';
  if (isSquare) {
    orientation = 'square';
  } else if (isLandscape) {
    orientation = 'landscape';
  } else {
    orientation = 'portrait';
  }

  return {
    isLandscape,
    isPortrait,
    isSquare,
    ratio,
    width,
    height,
    orientation
  };
}

/**
 * Legacy helper function for backward compatibility
 */
export function isLandscape(media: ImageData): boolean {
  return getAspectRatioInfo(media).isLandscape;
}

/**
 * Extract dimensions from various metadata sources
 */
function extractDimensions(media: ImageData): { width: number; height: number } | null {
  // Priority 1: Direct width/height properties on ImageData (from database)
  if (media.width && media.height) {
    return { width: media.width, height: media.height };
  }

  // Priority 2: Direct dimensions from metadata
  const directDimensions = media.metadata?.dimensions as { width: number; height: number } | undefined;
  if (directDimensions?.width && directDimensions?.height) {
    return { width: directDimensions.width, height: directDimensions.height };
  }

  // Priority 3: For videos, check width/height directly in metadata (multiple locations)
  if (media.mediaType === 'video') {
    const metadata = media.metadata;
    
    // Check direct width/height in metadata
    if (metadata?.width && metadata?.height) {
      return { 
        width: metadata.width as number, 
        height: metadata.height as number 
      };
    }
    
    // Check video-specific API response
    const apiResponse = metadata?.api_response as Record<string, unknown>;
    if (apiResponse?.video && typeof apiResponse.video === 'object') {
      const video = apiResponse.video as Record<string, unknown>;
      if (typeof video.width === 'number' && typeof video.height === 'number') {
        return { width: video.width, height: video.height };
      }
    }
    
    // Check generation parameters (common in video APIs)
    const generationParams = metadata?.generationParams as Record<string, unknown>;
    if (generationParams?.width && generationParams?.height) {
      return { 
        width: generationParams.width as number, 
        height: generationParams.height as number 
      };
    }
  }

  // Priority 4: Check API response for images
  const apiResponse = media.metadata?.api_response as Record<string, unknown>;
  if (apiResponse?.images && Array.isArray(apiResponse.images) && apiResponse.images[0]) {
    const firstImage = apiResponse.images[0] as Record<string, unknown>;
    if (typeof firstImage.width === 'number' && typeof firstImage.height === 'number') {
      return { width: firstImage.width, height: firstImage.height };
    }
  }

  // Priority 5: Check API response for videos
  if (apiResponse?.video && typeof apiResponse.video === 'object') {
    const video = apiResponse.video as Record<string, unknown>;
    if (typeof video.width === 'number' && typeof video.height === 'number') {
      return { width: video.width, height: video.height };
    }
  }

  // Priority 6: Check generation parameters (common in video APIs)
  const generationParams = media.metadata?.generationParams as Record<string, unknown>;
  if (generationParams?.width && generationParams?.height) {
    return { 
      width: generationParams.width as number, 
      height: generationParams.height as number 
    };
  }

  // Priority 7: Infer from aspect ratio parameters if available
  const aspectRatio = media.metadata?.aspect_ratio as string;
  if (aspectRatio) {
    return inferDimensionsFromAspectRatio(aspectRatio);
  }

  // Priority 8: Check for aspect ratio in generation parameters
  const genAspectRatio = generationParams?.aspect_ratio as string;
  if (genAspectRatio) {
    return inferDimensionsFromAspectRatio(genAspectRatio);
  }

  return null;
}

/**
 * Infer standard dimensions from aspect ratio string
 */
function inferDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } | null {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1920, height: 1080 };
    case '9:16':
      return { width: 1080, height: 1920 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '4:5':
      return { width: 1080, height: 1350 };
    case '3:4':
      return { width: 1080, height: 1440 };
    case '4:3':
      return { width: 1440, height: 1080 };
    default:
      // Try to parse custom ratios like "1.77:1" or "0.56:1"
      const parts = aspectRatio.split(':');
      if (parts.length === 2) {
        const w = parseFloat(parts[0]);
        const h = parseFloat(parts[1]);
        if (!isNaN(w) && !isNaN(h) && h > 0) {
          const ratio = w / h;
          // Use standard resolution based on ratio
          if (ratio > 1.5) {
            // Landscape
            return { width: 1920, height: Math.round(1920 / ratio) };
          } else if (ratio < 0.7) {
            // Portrait
            return { width: Math.round(1920 * ratio), height: 1920 };
          } else {
            // Square-ish
            return { width: 1080, height: 1080 };
          }
        }
      }
      return null;
  }
}

/**
 * Get responsive column spans for gallery grid based on aspect ratio
 */
export function getGalleryColumnSpan(media: ImageData): string {
  const aspectInfo = getAspectRatioInfo(media);
  
  if (aspectInfo.isLandscape) {
    return 'col-span-12 sm:col-span-8 md:col-span-6 xl:col-span-4';
  } else if (aspectInfo.isSquare) {
    return 'col-span-6 sm:col-span-6 md:col-span-4 xl:col-span-3';
  } else {
    // Portrait
    return 'col-span-6 sm:col-span-4 md:col-span-3 xl:col-span-2';
  }
}

/**
 * Get responsive width classes for timeline based on aspect ratio
 */
export function getTimelineWidthClasses(media: ImageData): string {
  const aspectInfo = getAspectRatioInfo(media);
  
  if (aspectInfo.isLandscape) {
    return "h-full w-[300px] sm:w-[420px] md:w-[540px] lg:w-[630px] xl:w-[720px]";
  } else if (aspectInfo.isSquare) {
    return "h-full w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px] xl:w-[320px]";
  } else {
    // Portrait
    return "h-full w-[120px] sm:w-[160px] md:w-[200px] lg:w-[240px] xl:w-[260px]";
  }
}

/**
 * Get CSS aspect ratio class
 */
export function getAspectRatioClass(media: ImageData): string {
  const aspectInfo = getAspectRatioInfo(media);
  
  if (aspectInfo.isLandscape) {
    return 'aspect-video'; // 16:9
  } else if (aspectInfo.isSquare) {
    return 'aspect-square'; // 1:1
  } else {
    return 'aspect-[9/16]'; // 9:16 portrait
  }
}

/**
 * Get drag preview container classes
 */
export function getDragPreviewClasses(media: ImageData): string {
  const aspectInfo = getAspectRatioInfo(media);
  
  if (aspectInfo.isLandscape) {
    return "w-[360px]"; // Landscape: wider container
  } else if (aspectInfo.isSquare) {
    return "w-[280px]"; // Square: medium container
  } else {
    return "w-[240px]"; // Portrait: original width
  }
}
