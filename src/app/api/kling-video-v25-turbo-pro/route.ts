import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
import { mediaSaverService } from '@/services/mediaSaver'
import { createVideoSaveRequest } from '@/types/mediaSaver'
import { toApiAspectRatio } from '@/config/aspectRatios'

/**
 * Fetch project image orientation setting from database and convert to API-compatible aspect ratio
 */
async function getProjectAspectRatio(projectId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/projects?id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch project ${projectId}, using default portrait aspect ratio`);
      return '9:16';
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn(`No project data found for ${projectId}, using default portrait aspect ratio`);
      return '9:16';
    }
    
    // Extract orientation from project settings - now supports all aspect ratio formats
    const projectData = result.data;
    const orientation = projectData.defaultImageOrientation || projectData.settings?.defaultImageOrientation || '9:16';
    
    // Convert to API-compatible aspect ratio using the centralized config
    return toApiAspectRatio(orientation);
  } catch (error) {
    console.error(`Error fetching project image orientation for ${projectId}:`, error);
    return '9:16';
  }
}

// Type definitions for fal API response
interface FalVideoResponse {
  video: {
    url: string;
  };
  seed?: number;
  timings?: {
    inference?: number;
  };
  has_nsfw_concepts?: boolean[];
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
      image_url,
      duration = "5",
      negative_prompt = "blur, distort, and low quality",
      cfg_scale = 0.5,
      concept,
      save_to_disk = true
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required for video generation' }, { status: 400 })
    }

    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Get project aspect ratio for proper video dimensions
    const projectAspectRatio = await getProjectAspectRatio(currentProjectId);
    console.log(`📐 Using project aspect ratio: ${projectAspectRatio}`);
    
    // Calculate proper dimensions based on project aspect ratio
    let width: number, height: number;
    switch (projectAspectRatio) {
      case '16:9': // Landscape
        width = 1920;
        height = 1080;
        break;
      case '1:1': // Square
        width = 1080;
        height = 1080;
        break;
      case '9:16': // Portrait (vertical)
      default:
        width = 576;
        height = 1024;
        break;
    }

    const input = {
      prompt,
      image_url,
      duration,
      negative_prompt,
      cfg_scale
    }

    console.log('Generating video with Kling v2.5 Turbo Pro model:', { 
      concept: concept || 'Kling v2.5 Turbo Pro Video Generation',
      duration,
      aspect_ratio: projectAspectRatio,
      dimensions: `${width}x${height}`,
      model: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video'
    })

    const result = await fal.subscribe('fal-ai/kling-video/v2.5-turbo/pro/image-to-video', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Kling v2.5 Turbo Pro video generation in progress...')
        }
      },
    }) as FalVideoResponse

    let localPath = null
    let videoMetadata = null
    if (save_to_disk && result.video?.url) {
      // Use project-based dimensions for proper vertical/horizontal video generation
      const dimensions = { width, height };
      const requestId = `kling-v25-turbo-pro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create generation parameters
      const generationParams = {
        duration,
        negative_prompt,
        cfg_scale,
        aspect_ratio: projectAspectRatio,
        width: dimensions.width,
        height: dimensions.height
      }

      // Create generation results
      const generationResults = {
        seed: result.seed,
        inference_time: result.timings?.inference,
        has_nsfw_concepts: result.has_nsfw_concepts
      }

      // Create API response for standardized metadata
      const apiResponse = {
        ...result,
        request_input: input,
        request_timestamp: new Date().toISOString(),
        model_used: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video'
      }

      // Create save request using MediaSaverService
      const saveRequest = createVideoSaveRequest(
        result.video.url,
        concept || 'Kling v2.5 Turbo Pro Video Generation',
        prompt,
        prompt, // originalPrompt
        'fal', // provider
        'kling-video-v2.5-turbo-pro', // model
        '/api/kling-video-v25-turbo-pro', // apiRoute
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
            image_url
          }
        }
      )

      // Save using MediaSaverService (handles thumbnail generation automatically)
      console.log('💾 Saving video with MediaSaverService (with thumbnail generation)...')
      const saveResult = await mediaSaverService.saveMedia(saveRequest)

      if (saveResult.success && saveResult.metadata) {
        localPath = saveResult.filePath
        videoMetadata = saveResult.metadata
        console.log('✅ Video saved successfully with thumbnail')
        if (saveResult.metadata.thumbnailPath) {
          console.log(`🖼️  Thumbnail: ${saveResult.metadata.thumbnailPath}`)
        }
      } else {
        console.error('⚠️ Failed to save video:', saveResult.error)
        throw new Error(saveResult.error || 'Failed to save video')
      }
    }

    // Enhanced response with video dimensions and metadata
    const enhancedResponse = enhanceVideoApiResponse({
      ...result,
      local_path: localPath,
      video_metadata: videoMetadata,
      model_used: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video'
    })

    console.log('✅ Kling v2.5 Turbo Pro video generation completed successfully')

    return NextResponse.json(enhancedResponse)
  } catch (error) {
    console.error('❌ Kling v2.5 Turbo Pro video generation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to generate video with Kling v2.5 Turbo Pro', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
