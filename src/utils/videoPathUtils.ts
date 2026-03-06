/**
 * Utility functions for resolving video file paths consistently across the application
 */

import { ImageData } from '@/contexts/ImageContext';

/**
 * Get the correct video URL for a given video image data
 * Handles different video storage locations and relative paths consistently
 */
export function getVideoUrl(image: ImageData): string {
  // Extract relative path from metadata
  const videoRelativePath = (image.metadata?.relativePath as string) || '';
  
  // If we have a relative path, use it; otherwise default to 'clips'
  if (videoRelativePath && videoRelativePath.trim() !== '') {
    return `/videos/${videoRelativePath}/${image.filename}`;
  } else {
    // Default to clips directory for backward compatibility
    return `/videos/clips/${image.filename}`;
  }
}

/**
 * Get the correct local file path for copying/downloading purposes
 * Returns the path as it should appear in file listings or for copying to clipboard
 */
export function getVideoLocalPath(image: ImageData): string {
  const videoRelativePath = (image.metadata?.relativePath as string) || '';
  
  if (videoRelativePath && videoRelativePath.trim() !== '') {
    return `/videos/${videoRelativePath}/${image.filename}`;
  } else {
    return `/videos/clips/${image.filename}`;
  }
}

/**
 * Get video file system path for server-side operations
 * Returns the actual path on disk relative to the public directory
 */
export function getVideoFilePath(filename: string, relativePath?: string): string {
  const path = relativePath && relativePath.trim() !== '' ? relativePath : 'clips';
  return `videos/${path}/${filename}`;
}

/**
 * Check if a video file exists in the expected locations
 * Useful for error handling and fallback logic
 */
export function getVideoUrlWithFallback(image: ImageData): string {
  // Try the primary path first
  const primaryUrl = getVideoUrl(image);
  
  // For client-side usage, we'll just return the primary URL
  // The actual fallback logic would need to be implemented with error handling
  // in the component that uses this URL
  return primaryUrl;
}

/**
 * Extract video directory from metadata or provide default
 */
export function getVideoDirectory(image: ImageData): string {
  const relativePath = (image.metadata?.relativePath as string) || '';
  return relativePath && relativePath.trim() !== '' ? relativePath : 'clips';
}
