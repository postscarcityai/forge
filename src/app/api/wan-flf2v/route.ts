import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { VideoMetadata } from '@/services/videoService'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
import { toApiAspectRatio } from '@/config/aspectRatios'
import fs from 'fs'
import path from 'path'

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
    const orientation = projectData.settings?.defaultImageOrientation || projectData.defaultImageOrientation || '9:16';
    
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
  seed: number
}

async function saveVideoWithMetadata(
  videoUrl: string, 
  generationParams: Record<string, unknown>, 
  projectId: string = 'default'
): Promise<string> {
  try {
    // Ensure directories exist
    const videoDir = path.join(process.cwd(), 'public', 'videos', 'clips')
    const infoDir = path.join(process.cwd(), 'public', 'videos', 'clips', 'video-info')
    
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true })
    }
    if (!fs.existsSync(infoDir)) {
      fs.mkdirSync(infoDir, { recursive: true })
    }

    // Generate filename based on timestamp and request ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `wan-flf2v-${timestamp}.mp4`
    
    // Download video
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }
    
    const videoBuffer = await response.arrayBuffer()
    const videoPath = path.join(videoDir, filename)
    
    // Save video
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer))
    
    // Create metadata object that matches VideoMetadata interface for database
    const metadataObject: VideoMetadata = {
      id: generationParams.request_id as string,
      filename: filename,
      title: `Wan FLF2V - ${(generationParams.prompt as string).substring(0, 50)}...`,
      description: generationParams.prompt as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: projectId,
      fileSize: Buffer.from(videoBuffer).length,
      metadata: {
        // Generation parameters
        prompt: generationParams.prompt,
        negative_prompt: generationParams.negative_prompt,
        first_frame_url: generationParams.first_frame_url,
        last_frame_url: generationParams.last_frame_url,
        model: 'fal-ai/wan-flf2v',
        width: generationParams.width,
        height: generationParams.height,
        num_frames: generationParams.num_frames,
        fps: generationParams.fps,
        guide_scale: generationParams.guide_scale,
        
        // Generation results
        seed: generationParams.seed,
        
        // URLs and references
        fal_video_url: videoUrl,
        
        // Complete API response
        api_response: generationParams.api_response,
        
        // Request metadata
        user_agent: generationParams.user_agent,
        ip_address: generationParams.ip_address,
        request_id: generationParams.request_id
      }
    }
    
    // Save metadata file to video-info directory (legacy format)
    const metadataPath = path.join(infoDir, `${filename}.meta.json`)
    fs.writeFileSync(metadataPath, JSON.stringify(metadataObject, null, 2))
    
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
    
    return path.join('videos', 'clips', filename)
  } catch (error) {
    console.error('Error saving video with metadata:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      first_frame_url,
      last_frame_url,
      negative_prompt = "bright colors, overexposed, static, blurred details, subtitles, style, artwork, painting, picture, still, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, malformed limbs, fused fingers, still picture, cluttered background, three legs, many people in the background, walking backwards",
      seed,
      resolution = "720p",
      num_frames = 81,
      frames_per_second,
      fps = frames_per_second || 16,
      guide_scale = 5,
      num_inference_steps = 30,
      enable_safety_checker = false,
      save_to_disk = true
    } = body

    // Validate required parameters
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (!first_frame_url) {
      return NextResponse.json({ error: 'First frame URL is required' }, { status: 400 })
    }
    if (!last_frame_url) {
      return NextResponse.json({ error: 'Last frame URL is required' }, { status: 400 })
    }

    // Get current project
    const currentProjectId = getCurrentProjectFromServerSync()
    
    // Get FAL_KEY from database-stored environment variables
    const falKey = await getEnvVar('FAL_KEY', currentProjectId)
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
    }
    
    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    console.log(`🔑 Using FAL_KEY: ${falKey.substring(0, 8)}...${falKey.substring(falKey.length - 8)}`)
    
    // Configure fal.ai client with database credentials
    fal.config({
      credentials: falKey
    })

    // Get project aspect ratio and convert to dimensions
    const projectAspectRatio = await getProjectAspectRatio(currentProjectId);
    console.log(`📐 Using project default aspect ratio: ${projectAspectRatio}`);
    
    let width: number
    let height: number
    
    // Convert resolution and aspect ratio to dimensions
    switch (resolution) {
      case '1080p':
        if (projectAspectRatio === '16:9') {
          width = 1920
          height = 1080
        } else if (projectAspectRatio === '9:16') {
          width = 608
          height = 1080
        } else if (projectAspectRatio === '1:1') {
          width = 1080
          height = 1080
        } else {
          width = 608
          height = 1080
        }
        break
      case '720p':
        if (projectAspectRatio === '16:9') {
          width = 1280
          height = 720
        } else if (projectAspectRatio === '9:16') {
          width = 405
          height = 720
        } else if (projectAspectRatio === '1:1') {
          width = 720
          height = 720
        } else {
          width = 405
          height = 720
        }
        break
      case '480p':
        if (projectAspectRatio === '16:9') {
          width = 854
          height = 480
        } else if (projectAspectRatio === '9:16') {
          width = 270
          height = 480
        } else if (projectAspectRatio === '1:1') {
          width = 480
          height = 480
        } else {
          width = 270
          height = 480
        }
        break
      default:
        if (projectAspectRatio === '16:9') {
          width = 1280
          height = 720
        } else if (projectAspectRatio === '9:16') {
          width = 405
          height = 720
        } else if (projectAspectRatio === '1:1') {
          width = 720
          height = 720
        } else {
          width = 405
          height = 720
        }
    }

    // Prepare the input for fal.ai API
    const input = {
      prompt: prompt.trim(),
      negative_prompt,
      start_image_url: first_frame_url,
      end_image_url: last_frame_url,
      ...(seed && { seed }),
      num_frames,
      frames_per_second: fps,
      guide_scale,
      num_inference_steps,
      enable_safety_checker,
      width,
      height,
      aspect_ratio: "auto"
    }

    console.log('Generating Wan FLF2V video:', { 
      prompt_length: prompt.length,
      dimensions: `${width}x${height}`,
      num_frames,
      fps,
      first_frame: first_frame_url.substring(first_frame_url.lastIndexOf('/') + 1),
      last_frame: last_frame_url.substring(last_frame_url.lastIndexOf('/') + 1)
    })

    const result = await fal.subscribe('fal-ai/wan-flf2v', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Wan FLF2V generation in progress...')
          update.logs.map((log) => log.message).forEach(console.log)
        }
      }
    }) as FalVideoResult

    let localPath: string | null = null
    
    if (save_to_disk && result.video?.url) {
      const userAgent = request.headers.get('user-agent')
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      
      // Extract dimensions from API response with input dimensions as fallback
      const dimensions = extractVideoDimensions(result as unknown as Record<string, unknown>) || { width, height };
      
      const generationParams = {
        prompt: input.prompt,
        negative_prompt: input.negative_prompt,
        first_frame_url: input.start_image_url,
        last_frame_url: input.end_image_url,
        model: 'fal-ai/wan-flf2v',
        width: dimensions.width,
        height: dimensions.height,
        num_frames: input.num_frames,
        fps: input.frames_per_second,
        guide_scale: input.guide_scale,
        num_inference_steps: input.num_inference_steps,
        seed: result.seed,
        api_response: {
          ...result,
          request_input: input,
          request_timestamp: new Date().toISOString(),
          model_used: 'fal-ai/wan-flf2v'
        },
        user_agent: userAgent || undefined,
        ip_address: ipAddress || undefined,
        request_id: `wan-flf2v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      localPath = await saveVideoWithMetadata(result.video.url, generationParams, currentProjectId)
      ;(result.video as Record<string, unknown>).local_path = localPath
    }

    // Enhance the result with dimensions for consistent API response
    const enhancedResult = enhanceVideoApiResponse(result as unknown as Record<string, unknown>);
    
    const response = {
      ...enhancedResult,
      message: save_to_disk ? 'Wan FLF2V video generated and saved successfully' : 'Wan FLF2V video generated successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      generation_data: {
        seed: result.seed,
        model_used: 'fal-ai/wan-flf2v',
        input_parameters: {
          dimensions: `${width}x${height}`,
          num_frames: input.num_frames,
          fps: input.frames_per_second,
          guide_scale: input.guide_scale,
          num_inference_steps: input.num_inference_steps,
          aspect_ratio: input.aspect_ratio
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating Wan FLF2V video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate Wan FLF2V video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 