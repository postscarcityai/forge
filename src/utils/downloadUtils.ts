/**
 * Utility functions for downloading images from the browser as a zip file
 */

import { ImageData } from '@/contexts/ImageContext';
import { getVideoUrl } from './videoPathUtils';

// We'll use JSZip for creating zip files in the browser
// First, let's check if we can import it, otherwise we'll use a simpler approach

/**
 * Download a single media file (image or video) as blob
 */
async function fetchMediaAsBlob(media: ImageData): Promise<{ blob: Blob; filename: string } | null> {
  try {
    // Get media URL - support both images and videos
    let mediaUrl: string;
    if (media.mediaType === 'video') {
      // For videos, use the proper video path utility which handles relative paths
      mediaUrl = getVideoUrl(media);
    } else {
      // For images, use the standard images directory
      mediaUrl = `/images/${media.filename}`;
    }

    console.log(`📥 Fetching ${media.mediaType}: ${mediaUrl}`);

    // Fetch the media file
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${media.mediaType}: ${response.statusText}`);
    }

    // Convert to blob
    const blob = await response.blob();
    return { blob, filename: media.filename };
  } catch (error) {
    console.error(`Failed to fetch ${media.filename}:`, error);
    return null;
  }
}

/**
 * Create and download a zip file with all timeline media (images and videos)
 */
export async function downloadTimelineImages(
  mediaItems: ImageData[], 
  onProgress?: (completed: number, total: number) => void
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Count media types for better logging
    const imageCount = mediaItems.filter(item => item.mediaType === 'image').length;
    const videoCount = mediaItems.filter(item => item.mediaType === 'video').length;
    
    console.log(`📥 Starting download of ${mediaItems.length} items (${imageCount} images, ${videoCount} videos) as zip...`);

    // Create a folder for timeline media
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const folderName = `forge-timeline-${timestamp}`;
    const folder = zip.folder(folderName);

    if (!folder) {
      throw new Error('Failed to create zip folder');
    }

    // Fetch and add each media item to the zip
    for (let i = 0; i < mediaItems.length; i++) {
      const mediaItem = mediaItems[i];
      
      console.log(`📥 Processing ${i + 1}/${mediaItems.length}: ${mediaItem.filename} (${mediaItem.mediaType})`);
      
      const mediaData = await fetchMediaAsBlob(mediaItem);
      
      if (mediaData) {
        // Create filename with order prefix
        const orderPrefix = String(i + 1).padStart(3, '0');
        const extension = mediaItem.filename.split('.').pop() || (mediaItem.mediaType === 'video' ? 'mp4' : 'jpg');
        const baseName = mediaItem.filename.replace(`.${extension}`, '');
        const prefixedFilename = `${orderPrefix}-${baseName}.${extension}`;
        
        // Add to zip
        folder.file(prefixedFilename, mediaData.blob);
        results.successful++;
        console.log(`✅ Added ${mediaItem.mediaType} to zip: ${prefixedFilename}`);
      } else {
        results.failed++;
        results.errors.push(`${mediaItem.filename}: Failed to fetch ${mediaItem.mediaType}`);
        console.error(`❌ Failed to fetch ${mediaItem.mediaType}: ${mediaItem.filename}`);
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, mediaItems.length);
      }
    }

    // Generate and download the zip file
    console.log('📦 Generating zip file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${folderName}.zip`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);

    console.log(`📦 Download completed: ${results.successful} items (${imageCount} images, ${videoCount} videos) in ${folderName}.zip`);
    
  } catch (error) {
    console.error('Download failed:', error);
    results.failed = mediaItems.length;
    results.successful = 0;
    results.errors.push(`Zip creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
}
