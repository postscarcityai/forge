/**
 * Utility functions for extracting video dimensions from various sources
 * with fallback to aspect ratio strings
 */

/**
 * Convert aspect ratio string to pixel dimensions
 */
export function aspectRatioToPixelDimensions(aspectRatio: string): { width: number; height: number } | null {
  const aspectRatioMap: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '1:1': { width: 1080, height: 1080 },
    '4:3': { width: 1440, height: 1080 },
    '3:4': { width: 1080, height: 1440 },
    '21:9': { width: 2560, height: 1080 },
  };

  return aspectRatioMap[aspectRatio] || null;
}

/**
 * Extract dimensions from various video metadata sources
 * Priority: API response > aspect ratio string > default portrait
 */
export function extractVideoDimensions(
  apiResponse: Record<string, unknown>,
  aspectRatio?: string
): { width: number; height: number } {
  // Try to extract from API response first
  
  // Pattern 1: video object with width/height
  if (apiResponse.video && typeof apiResponse.video === 'object') {
    const video = apiResponse.video as Record<string, unknown>;
    if (typeof video.width === 'number' && typeof video.height === 'number') {
      return { width: video.width, height: video.height };
    }
  }
  
  // Pattern 2: direct width/height properties
  if (typeof apiResponse.width === 'number' && typeof apiResponse.height === 'number') {
    return { width: apiResponse.width, height: apiResponse.height };
  }
  
  // Pattern 3: nested in result/data object
  if (apiResponse.result && typeof apiResponse.result === 'object') {
    const result = apiResponse.result as Record<string, unknown>;
    if (typeof result.width === 'number' && typeof result.height === 'number') {
      return { width: result.width, height: result.height };
    }
    if (result.video && typeof result.video === 'object') {
      const video = result.video as Record<string, unknown>;
      if (typeof video.width === 'number' && typeof video.height === 'number') {
        return { width: video.width, height: video.height };
      }
    }
  }
  
  // Fallback to aspect ratio string conversion
  if (aspectRatio) {
    const dimensions = aspectRatioToPixelDimensions(aspectRatio);
    if (dimensions) {
      return dimensions;
    }
  }
  
  // Final fallback to portrait (most common for videos)
  return { width: 1080, height: 1920 };
}

/**
 * Enhanced video metadata interface that includes dimensions
 */
export interface VideoMetadataWithDimensions {
  width: number;
  height: number;
  aspect_ratio: string;
  // ... other metadata fields
}

/**
 * Enhance existing video metadata with extracted dimensions
 */
export function enhanceVideoMetadata<T extends Record<string, unknown>>(
  metadata: T,
  apiResponse: Record<string, unknown>
): T & { width: number; height: number } {
  const aspectRatio = metadata.aspect_ratio as string;
  const dimensions = extractVideoDimensions(apiResponse, aspectRatio);
  
  return {
    ...metadata,
    width: dimensions.width,
    height: dimensions.height
  };
}

/**
 * Add dimensions to video API response
 */
export function enhanceVideoApiResponse(
  response: Record<string, unknown>,
  aspectRatio?: string
): Record<string, unknown> {
  const dimensions = extractVideoDimensions(response, aspectRatio);
  
  // Add dimensions to the video object if it exists
  if (response.video && typeof response.video === 'object') {
    return {
      ...response,
      video: {
        ...response.video,
        width: dimensions.width,
        height: dimensions.height
      }
    };
  }
  
  // Otherwise add dimensions at the top level
  return {
    ...response,
    width: dimensions.width,
    height: dimensions.height
  };
}
