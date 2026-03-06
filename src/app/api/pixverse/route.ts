import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { VideoMetadata } from '@/services/videoService'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
import { databaseService } from '@/services/databaseService'
import fs from 'fs'
import path from 'path'

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
    const filename = `pixverse-${timestamp}.mp4`
    
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
      title: `PixVerse - ${(generationParams.prompt as string).substring(0, 50)}...`,
      description: generationParams.prompt as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: projectId,
      fileSize: Buffer.from(videoBuffer).length,
      metadata: {
        // Generation parameters
        prompt: generationParams.prompt,
        negative_prompt: generationParams.negative_prompt,
        image_url: generationParams.image_url,
        model: 'fal-ai/pixverse/v4/image-to-video/fast',
        resolution: generationParams.resolution,
        aspect_ratio: generationParams.aspect_ratio,
        style: generationParams.style,
        
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
      image_url,
      negative_prompt = "",
      aspect_ratio = "16:9",
      resolution = "720p",
      style,
      seed,
      save_to_disk = true
    } = body

    // Validate required parameters
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
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

    // Prepare the input for fal.ai API
    const input = {
      prompt: prompt.trim(),
      image_url,
      negative_prompt,
      aspect_ratio,
      resolution,
      ...(style && { style }),
      ...(seed && { seed })
    }

    console.log('Generating PixVerse video:', { 
      prompt_length: prompt.length,
      resolution,
      aspect_ratio,
      style: style || 'default',
      image: image_url.substring(image_url.lastIndexOf('/') + 1)
    })

    const result = await fal.subscribe('fal-ai/pixverse/v4/image-to-video/fast', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('PixVerse generation in progress...')
          update.logs.map((log) => log.message).forEach(console.log)
        }
      }
    }) as FalVideoResult

    let localPath: string | null = null
    
    if (save_to_disk && result.video?.url) {
      const userAgent = request.headers.get('user-agent')
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      
      // Extract dimensions from API response with aspect ratio fallback
      const dimensions = extractVideoDimensions(result, aspect_ratio);
      
      const generationParams = {
        prompt: input.prompt,
        negative_prompt: input.negative_prompt,
        image_url: input.image_url,
        model: 'fal-ai/pixverse/v4/image-to-video/fast',
        resolution: input.resolution,
        aspect_ratio: input.aspect_ratio,
        style: input.style,
        width: dimensions.width,
        height: dimensions.height,
        seed: result.video.file_size, // PixVerse doesn't return seed, using file size as unique identifier
        api_response: {
          ...result,
          request_input: input,
          request_timestamp: new Date().toISOString(),
          model_used: 'fal-ai/pixverse/v4/image-to-video/fast'
        },
        user_agent: userAgent || undefined,
        ip_address: ipAddress || undefined,
        request_id: `pixverse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      localPath = await saveVideoWithMetadata(result.video.url, generationParams, currentProjectId)
      ;(result.video as Record<string, unknown>).local_path = localPath
    }

    // Try to append to timeline (after save and before respond)
    try {
      const newVideoId = generationParams.request_id as string
      const appended = await databaseService.appendToTimeline(newVideoId, 'video')
      if (appended) {
        console.log(`🧩 Added new video ${newVideoId} to the end of the timeline`)
      }
    } catch (e) {
      console.warn('⚠️ Error appending new PixVerse video to timeline:', e)
    }

    // Enhance the result with dimensions for consistent API response
    const enhancedResult = enhanceVideoApiResponse(result, aspect_ratio);
    
    const response = {
      ...enhancedResult,
      message: save_to_disk ? 'PixVerse video generated and saved successfully' : 'PixVerse video generated successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      generation_data: {
        model_used: 'fal-ai/pixverse/v4/image-to-video/fast',
        input_parameters: {
          resolution: input.resolution,
          aspect_ratio: input.aspect_ratio,
          style: input.style || 'default'
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating PixVerse video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate PixVerse video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 