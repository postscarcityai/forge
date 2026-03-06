import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
import { mediaSaverService } from '@/services/mediaSaver'
import { createVideoSaveRequest } from '@/types/mediaSaver'

/**
 * Upload video from URL to fal.ai storage
 */
async function uploadVideoUrlToFal(videoUrl: string): Promise<string> {
  try {
    console.log(`📤 Downloading video from URL: ${videoUrl}`)
    
    // Download video
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }
    
    const videoBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'video/mp4'
    
    // Create a File object for fal.ai
    const filename = videoUrl.split('/').pop() || 'video.mp4'
    const file = new File([videoBuffer], filename, { type: contentType })
    
    console.log(`📤 Uploading ${file.name} (${file.type}, ${file.size} bytes) to fal.ai storage...`)
    
    const uploadedUrl = await fal.storage.upload(file)
    console.log(`✅ Uploaded to fal.ai storage: ${uploadedUrl}`)
    
    return uploadedUrl
  } catch (error) {
    console.error('❌ Failed to upload video URL to fal.ai:', error)
    throw error
  }
}

/**
 * Fetch project image orientation setting from database and convert to API-compatible aspect ratio
 */
async function getProjectAspectRatio(projectId: string): Promise<string> {
  // Import dynamically to avoid circular dependencies
  const { toApiAspectRatio } = await import('@/config/aspectRatios');
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/projects?id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch project ${projectId}, using default landscape aspect ratio`);
      return '16:9';
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn(`No project data found for ${projectId}, using default landscape aspect ratio`);
      return '16:9';
    }
    
    const projectData = result.data;
    const orientation = projectData.settings?.defaultImageOrientation || projectData.defaultImageOrientation || '16:9';
    
    // Convert to API-compatible aspect ratio using the centralized config
    // Note: Sora 2 remix only supports 9:16 and 16:9, so we map to closest
    const apiRatio = toApiAspectRatio(orientation);
    
    // Sora 2 only supports portrait (9:16) or landscape (16:9)
    if (['9:16', '2:3', '3:4', '4:5'].includes(apiRatio)) {
      return '9:16';
    }
    return '16:9';
  } catch (error) {
    console.error(`Error fetching project image orientation for ${projectId}:`, error);
    return '16:9';
  }
}

// Type definitions for Sora 2 Video-to-Video API response
interface Sora2RemixResponse {
  video: {
    url: string
    content_type?: string
    file_name?: string
    file_size?: number
    width?: number
    height?: number
    fps?: number
    duration?: number
    num_frames?: number
  }
  video_id: string
  thumbnail?: {
    url: string
    content_type?: string
    file_name?: string
    file_size?: number
    width?: number
    height?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current project from server state
    const currentProjectId = getCurrentProjectFromServerSync()
    
    // Get FAL_KEY from database-stored environment variables
    const falKey = await getEnvVar('FAL_KEY', currentProjectId)
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
    }
    
    // Configure fal.ai client with database credentials
    fal.config({
      credentials: falKey
    })

    const body = await request.json()
    const { 
      prompt, 
      video_id,
      video_url,
      concept,
      save_to_disk = true
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Sora 2 remix API only accepts video_id from previous Sora 2 generations
    // If video_url is provided, try to find the video_id in our database
    let finalVideoId = video_id
    
    if (!finalVideoId && video_url) {
      console.log('🔍 Looking up video_id from video URL in database...')
      try {
        // Try to find the video in our database by URL
        const { databaseService } = await import('@/services/databaseService')
        const videos = await databaseService.getVideos(currentProjectId)
        
        const matchingVideo = videos.find((v: any) => 
          v.fal_video_url === video_url || 
          v.metadata?.fal_video_url === video_url ||
          v.metadata?.providerSpecificData?.falVideoUrl === video_url ||
          v.metadata?.api_response?.video?.url === video_url
        )
        
        if (matchingVideo?.metadata?.providerSpecificData?.video_id) {
          finalVideoId = matchingVideo.metadata.providerSpecificData.video_id
          console.log(`✅ Found video_id in database: ${finalVideoId}`)
        } else if (matchingVideo?.metadata?.video_id) {
          finalVideoId = matchingVideo.metadata.video_id
          console.log(`✅ Found video_id in database metadata: ${finalVideoId}`)
        } else if (matchingVideo?.metadata?.api_response?.video_id) {
          finalVideoId = matchingVideo.metadata.api_response.video_id
          console.log(`✅ Found video_id in API response: ${finalVideoId}`)
        } else {
          console.warn('⚠️ Could not find video_id in database for URL:', video_url)
          console.warn('⚠️ Note: Sora 2 remix only works with videos generated by Sora 2 (text-to-video or image-to-video)')
        }
      } catch (error) {
        console.error('❌ Error looking up video_id:', error)
      }
    }

    if (!finalVideoId) {
      return NextResponse.json({ 
        error: 'video_id is required for Sora 2 video-to-video remix. Note: Only videos generated by Sora 2 (via text-to-video or image-to-video endpoints) can be remixed. If you have a video URL, please provide the video_id from the original generation response.' 
      }, { status: 400 })
    }

    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Get project aspect ratio for dimension fallback
    const finalAspectRatio = await getProjectAspectRatio(currentProjectId);
    console.log(`📐 Using aspect ratio: ${finalAspectRatio} for dimension fallback`);

    // Prepare input - Sora 2 remix only accepts video_id
    const input: Record<string, unknown> = {
      prompt: prompt.trim(),
      video_id: finalVideoId
    }

    console.log('Generating video remix with Sora 2 video-to-video:', { 
      concept: concept || 'Sora 2 Video-to-Video Remix',
      prompt_length: prompt.length,
      video_id: video_id || 'none',
      video_url: video_url ? video_url.substring(0, 50) + '...' : 'none',
      model: 'fal-ai/sora-2/video-to-video/remix'
    })

    const result = await fal.subscribe('fal-ai/sora-2/video-to-video/remix', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('🔄 Sora 2 video-to-video remix generation in progress...')
          if (update.logs) {
            update.logs.map((log: { message: string }) => log.message).forEach(console.log)
          }
        }
      },
    }) as Sora2RemixResponse

    let localPath = null
    let videoMetadata = null
    if (save_to_disk && result.video?.url) {
      // Extract dimensions from API response with aspect ratio fallback
      const dimensions = extractVideoDimensions(result, finalAspectRatio);
      const requestId = `sora-2-remix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create generation parameters
      const generationParams = {
        prompt,
        video_id: video_id || null,
        video_url: video_url || null,
        width: dimensions.width,
        height: dimensions.height
      }

      // Create generation results
      const generationResults = {
        video_id: result.video_id,
        video_duration: result.video.duration,
        video_fps: result.video.fps,
        video_num_frames: result.video.num_frames
      }

      // Create API response for standardized metadata
      const apiResponse = {
        ...result,
        request_input: input,
        request_timestamp: new Date().toISOString(),
        model_used: 'fal-ai/sora-2/video-to-video/remix'
      }

      // Create save request using MediaSaverService
      const saveRequest = createVideoSaveRequest(
        result.video.url,
        concept || 'Sora 2 Video-to-Video Remix',
        prompt,
        prompt, // originalPrompt
        'fal', // provider
        'sora-2-video-to-video-remix', // model
        '/api/sora-2-remix', // apiRoute
        requestId,
        currentProjectId,
        generationParams,
        generationResults,
        apiResponse,
        {
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          providerSpecificData: {
            falVideoUrl: result.video.url,
            video_id: result.video_id,
            thumbnail_url: result.thumbnail?.url,
            source_video_id: video_id || null,
            source_video_url: video_url || null
          }
        }
      )

      // Save using MediaSaverService (handles thumbnail generation automatically)
      console.log('💾 Saving remixed video with MediaSaverService (with thumbnail generation)...')
      const saveResult = await mediaSaverService.saveMedia(saveRequest)

      if (saveResult.success && saveResult.metadata) {
        localPath = saveResult.filePath
        videoMetadata = saveResult.metadata
        console.log('✅ Remixed video saved successfully with thumbnail')
        if (saveResult.metadata.thumbnailPath) {
          console.log(`🖼️  Thumbnail: ${saveResult.metadata.thumbnailPath}`)
        }
      } else {
        console.error('⚠️ Failed to save remixed video:', saveResult.error)
        throw new Error(saveResult.error || 'Failed to save remixed video')
      }
    }

    // Enhanced response with video dimensions and metadata
    const enhancedResponse = enhanceVideoApiResponse({
      ...result,
      local_path: localPath,
      video_metadata: videoMetadata,
      model_used: 'fal-ai/sora-2/video-to-video/remix'
    }, finalAspectRatio)

    console.log('✅ Sora 2 video-to-video remix generation completed successfully')

    return NextResponse.json({
      ...enhancedResponse,
      message: save_to_disk ? 'Sora 2 video remix generated and saved successfully' : 'Sora 2 video remix generated successfully',
      saved_to_disk: save_to_disk,
      project_id: currentProjectId,
      should_refresh_gallery: true
    })
  } catch (error) {
    console.error('❌ Sora 2 video-to-video remix generation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to generate video remix with Sora 2', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

