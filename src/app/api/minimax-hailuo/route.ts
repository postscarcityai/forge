import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import fs from 'fs'
import path from 'path'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
import { VideoMetadata } from '@/services/videoService'
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
    const orientation = projectData.settings?.defaultImageOrientation || '9:16';
    
    // Convert to API-compatible aspect ratio using the centralized config
    return toApiAspectRatio(orientation);
  } catch (error) {
    console.error(`Error fetching project image orientation for ${projectId}:`, error);
    return '9:16';
  }
}

// Type definitions for fal API response
interface FalVideoResult {
  video: {
    url: string
    content_type?: string
    file_name?: string
    file_size?: number
  }
}

async function saveVideoWithMetadata(
  videoUrl: string, 
  generationParams: Record<string, unknown>, 
  projectId: string = 'default'
): Promise<string> {
  try {
    // Ensure directories exist
    const publicDir = path.join(process.cwd(), 'public')
    const videosDir = path.join(publicDir, 'videos', 'clips')
    const videoInfoDir = path.join(publicDir, 'videos', 'clips', 'video-info')
    fs.mkdirSync(videosDir, { recursive: true })
    fs.mkdirSync(videoInfoDir, { recursive: true })

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const videoFileName = `minimax-hailuo-${timestamp}.mp4`
    const videoPath = path.join(videosDir, videoFileName)
    const metaFileName = `${videoFileName}.meta.json`
    const metaPath = path.join(videoInfoDir, metaFileName)

    // Download video
    const response = await fetch(videoUrl)
    const buffer = await response.arrayBuffer()
    fs.writeFileSync(videoPath, Buffer.from(buffer))

    // Create metadata object for database
    const metadataObject: VideoMetadata = {
      id: generationParams.request_id as string,
      filename: videoFileName,
      title: `MiniMax Hailuo-02 - ${(generationParams.prompt as string).substring(0, 50)}...`,
      description: generationParams.prompt as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: projectId,
      fileSize: Buffer.from(buffer).length,
      metadata: {
        // Generation parameters
        prompt: generationParams.prompt,
        image_url: generationParams.image_url,
        duration: generationParams.duration,
        prompt_optimizer: generationParams.prompt_optimizer,
        aspect_ratio: generationParams.aspect_ratio,
        width: generationParams.width,
        height: generationParams.height,
        model: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
        
        // Complete API response
        api_response: generationParams.api_response,
        
        // Request metadata
        user_agent: generationParams.user_agent,
        ip_address: generationParams.ip_address,
        request_id: generationParams.request_id
      }
    }

    // Save filesystem metadata (legacy format)
    const legacyMetadata: VideoMetadata = {
      fileName: videoFileName,
      generatedAt: new Date().toISOString(),
      model: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
      projectId,
      generationParams,
    }
    fs.writeFileSync(metaPath, JSON.stringify(legacyMetadata, null, 2))

    // Save to database
    try {
      const { databaseService } = await import('@/services/databaseService')
      if (databaseService) {
        const success = await databaseService.saveVideo(metadataObject)
        if (success) {
          console.log(`✅ Video saved to database: ${metadataObject.id}`)
        } else {
          console.warn(`⚠️ Failed to save video to database: ${metadataObject.id}`)
        }
      }
    } catch (error) {
      console.error('Error saving video to database:', error)
    }

    return videoFileName
  } catch (error) {
    console.error('Error saving video:', error)
    throw error
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
      image_url,
      duration = "6",
      prompt_optimizer = true,
      save_to_disk = true
    } = body

    // Validate required parameters
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required for video generation' }, { status: 400 })
    }

    // Validate duration (must be 6 or 10 seconds)
    if (!['6', '10'].includes(duration)) {
      return NextResponse.json({ 
        error: 'Duration must be either "6" or "10" seconds' 
      }, { status: 400 })
    }

    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Always use project default aspect ratio
    const finalAspectRatio = await getProjectAspectRatio(currentProjectId);
    console.log(`📐 Using project default aspect ratio: ${finalAspectRatio}`);

    const input = {
      prompt,
      image_url,
      duration,
      prompt_optimizer,
      aspect_ratio: finalAspectRatio
    }

    console.log('Generating video with MiniMax Hailuo-02 model:', { 
      prompt_length: prompt.length,
      duration,
      prompt_optimizer,
      aspect_ratio: finalAspectRatio,
      image: image_url.substring(image_url.lastIndexOf('/') + 1)
    })

    const result = await fal.subscribe('fal-ai/minimax/hailuo-02/standard/image-to-video', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('MiniMax Hailuo-02 generation in progress...')
          update.logs.map((log) => log.message).forEach(console.log)
        }
      }
    }) as FalVideoResult

    if (!result?.video?.url) {
      return NextResponse.json(
        { error: 'Failed to generate video' },
        { status: 500 }
      )
    }

    let localPath: string | null = null
    
    if (save_to_disk && result.video?.url) {
      const userAgent = request.headers.get('user-agent')
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      
      // Extract dimensions from API response with aspect ratio fallback
      const dimensions = extractVideoDimensions(result as unknown as Record<string, unknown>, finalAspectRatio);
      
      const generationParams = {
        prompt: input.prompt,
        image_url: input.image_url,
        duration: input.duration,
        prompt_optimizer: input.prompt_optimizer,
        aspect_ratio: finalAspectRatio,
        width: dimensions.width,
        height: dimensions.height,
        model: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
        api_response: {
          ...result,
          request_input: input,
          request_timestamp: new Date().toISOString(),
          model_used: 'fal-ai/minimax/hailuo-02/standard/image-to-video'
        },
        user_agent: userAgent || undefined,
        ip_address: ipAddress || undefined,
        request_id: `minimax-hailuo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      localPath = await saveVideoWithMetadata(result.video.url, generationParams, currentProjectId)
    }

    // Enhance the result with dimensions for consistent API response
    const enhancedResult = enhanceVideoApiResponse(result as unknown as Record<string, unknown>, finalAspectRatio);
    
    const response = {
      ...enhancedResult,
      message: save_to_disk 
        ? 'MiniMax Hailuo-02 video generated and saved successfully' 
        : 'MiniMax Hailuo-02 video generated successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      generation_data: {
        model_used: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
        input_parameters: {
          aspect_ratio: finalAspectRatio,
          duration: input.duration,
          prompt_optimizer: input.prompt_optimizer
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in MiniMax Hailuo-02 video generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate video with MiniMax Hailuo-02' },
      { status: 500 }
    )
  }
} 