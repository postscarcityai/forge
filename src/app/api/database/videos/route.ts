import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const videoId = searchParams.get('id');
    const hiddenOnly = searchParams.get('hidden') === 'true';
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

    if (videoId) {
      // Get single video
      const video = await databaseService.getVideo(videoId);
      
      if (!video) {
        return NextResponse.json({
          success: false,
          error: 'Video not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: video
      });
    } else if (hiddenOnly) {
      // Get only hidden videos for project
      const videos = await databaseService.getHiddenVideos(projectId);
      
      return NextResponse.json({
        success: true,
        data: videos,
        message: `Retrieved ${videos.length} hidden videos`
      });
    } else if (includeHidden) {
      // Get ALL videos for project (including hidden) - used by frontend for complete state
      const videos = await databaseService.getAllVideos(projectId);
      
      return NextResponse.json({
        success: true,
        data: videos,
        message: `Retrieved ${videos.length} videos (including hidden)`
      });
    } else if (limit !== undefined || offset !== undefined) {
      const videos = await databaseService.getRecentVideos(projectId, limit, offset);

      return NextResponse.json({
        success: true,
        data: videos,
        limit,
        offset: offset ?? 0,
        message: `Retrieved ${videos.length} videos`
      });
    } else {
      // Get all visible videos for project (excludes hidden)
      const videos = await databaseService.getVideos(projectId);
      
      return NextResponse.json({
        success: true,
        data: videos,
        message: `Retrieved ${videos.length} videos`
      });
    }
  } catch (error) {
    console.error('Error in videos API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const body = await request.json();
    const { video, videos } = body;

    if (videos && Array.isArray(videos)) {
      // Save multiple videos
      let savedCount = 0;
      const errors: string[] = [];

      for (const vid of videos) {
        try {
          const success = await databaseService.saveVideo(vid);
          if (success) {
            savedCount++;
          } else {
            errors.push(`Failed to save video: ${vid.id}`);
          }
        } catch (error) {
          errors.push(`Failed to save video: ${vid.id} - ${error instanceof Error ? error.message : 'unknown error'}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Saved ${savedCount} videos to database`,
        savedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } else if (video) {
      // Save single video
      const success = await databaseService.saveVideo(video);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to save video to database'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Video saved to database'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No video or videos provided'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error saving videos to database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save videos to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({
        success: false,
        error: 'Video ID is required'
      }, { status: 400 });
    }

    const success = await databaseService.deleteVideo(videoId);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete video or video not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!databaseService) {
      return NextResponse.json({
        success: false,
        error: 'Database service not available'
      }, { status: 500 });
    }

    const body = await request.json();
    const { videoId, hidden, items } = body;

    if (items && Array.isArray(items)) {
      // Batch update hidden state for multiple items (filter for videos only)
      const videoItems = items.filter(item => item.type === 'video');
      const success = await databaseService.batchUpdateHiddenState(videoItems);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to update hidden state for videos'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated hidden state for ${videoItems.length} videos`
      });
    } else if (videoId !== undefined && hidden !== undefined) {
      // Single video hidden state update
      
      // First check if video exists
      const existingVideo = await databaseService.getVideo(videoId);
      if (!existingVideo) {
        console.log(`❌ Video ${videoId} not found in database`);
        return NextResponse.json({
          success: false,
          error: `Video ${videoId} not found in database`
        }, { status: 404 });
      }
      
      const success = await databaseService.updateVideoHiddenState(videoId, hidden);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to update video hidden state'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Video ${videoId} ${hidden ? 'hidden' : 'restored'} successfully`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: videoId and hidden, or items array'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating video hidden state:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update video hidden state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 