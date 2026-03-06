import { NextRequest, NextResponse } from 'next/server';
import { getSavedVideos } from '@/utils/video-utils';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  index: number;
  type: 'timeline' | 'gallery';
  createdAt: number;
  filename: string;
  projectId: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  mediaType: 'video';
}

/**
 * Convert video metadata to VideoData format for frontend
 */
function convertVideoMetadataToVideoData(videoMetadata: any, index: number): VideoData {
  return {
    id: videoMetadata.id,
    title: videoMetadata.title || videoMetadata.filename,
    description: videoMetadata.description,
    index,
    type: 'gallery', // New videos go to gallery by default
    createdAt: new Date(videoMetadata.createdAt).getTime(),
    filename: videoMetadata.filename,
    projectId: videoMetadata.projectId || 'default',
    tags: videoMetadata.tags || [],
    metadata: videoMetadata.metadata,
    mediaType: 'video'
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for delta sync support
    const url = new URL(request.url);
    const lastSync = url.searchParams.get('lastSync'); // ISO timestamp
    const includeAll = url.searchParams.get('includeAll') === 'true'; // Get all videos
    
    // Get all saved videos using the utility function
    const savedVideos = getSavedVideos();
    
    // Filter for new videos since last sync (unless includeAll is true)
    let newVideos = savedVideos;
    if (lastSync && !includeAll) {
      const lastSyncTime = new Date(lastSync).getTime();
      newVideos = savedVideos.filter(video => {
        const videoTime = new Date(video.createdAt).getTime();
        return videoTime > lastSyncTime;
      });
    }
    
    // Convert to VideoData format for frontend
    const videoData = newVideos.map((video, index) => 
      convertVideoMetadataToVideoData(video, index)
    );
    
    return NextResponse.json({
      success: true,
      newVideos: videoData,
      count: videoData.length,
      lastChecked: new Date().toISOString(),
      message: includeAll 
        ? `Retrieved ${videoData.length} total videos`
        : videoData.length > 0 
          ? `Found ${videoData.length} new videos` 
          : 'No new videos found'
    });
  } catch (error) {
    console.error('Error loading videos:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 