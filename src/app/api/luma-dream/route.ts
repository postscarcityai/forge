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
    const publicDir = path.join(process.cwd(), 'public')
    const videosDir = path.join(publicDir, 'videos', 'clips')
    const videoInfoDir = path.join(publicDir, 'videos', 'clips', 'video-info')
    fs.mkdirSync(videosDir, { recursive: true })
    fs.mkdirSync(videoInfoDir, { recursive: true })

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const videoFileName = `luma-ray-${timestamp}.mp4`
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
      title: `Luma Ray - ${(generationParams.prompt as string).substring(0, 50)}...`,
      description: generationParams.prompt as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: projectId,
      fileSize: Buffer.from(buffer).length,
      metadata: {
        // Generation parameters
        prompt: generationParams.prompt,
        image_url: generationParams.image_url,
        model: 'fal-ai/luma-dream-machine/ray-2-flash/image-to-video',
        
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
      model: 'fal-ai/luma-dream-machine/ray-2-flash/image-to-video',
      projectId,
      generationParams,
    }
    fs.writeFileSync(metaPath, JSON.stringify(legacyMetadata, null, 2))

    // Save to database
    try {
      const { databaseService } = await import('@/services/databaseService')
      const success = await databaseService.saveVideo(metadataObject)
      if (success) {
        console.log(`✅ Video saved to database: ${metadataObject.id}`)
      } else {
        console.warn(`⚠️ Failed to save video to database: ${metadataObject.id}`)
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
    const { prompt, image_url } = await request.json()

    if (!prompt || !image_url) {
      return NextResponse.json(
        { error: 'Missing required parameters: prompt and image_url' },
        { status: 400 }
      )
    }

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

    // Call fal API
    const result = await fal.subscribe('fal-ai/luma-dream-machine/ray-2-flash/image-to-video', {
      input: {
        prompt,
        image_url,
      },
    })

    if (!result?.video?.url) {
      return NextResponse.json(
        { error: 'Failed to generate video' },
        { status: 500 }
      )
    }

    // Save video and metadata with proper request tracking
    const userAgent = request.headers.get('user-agent')
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    
    // Extract dimensions from API response (no aspect ratio available for this route)
    const dimensions = extractVideoDimensions(result);
    
    const generationParams = {
      prompt,
      image_url,
      width: dimensions.width,
      height: dimensions.height,
      api_response: {
        ...result,
        request_timestamp: new Date().toISOString(),
        model_used: 'fal-ai/luma-dream-machine/ray-2-flash/image-to-video'
      },
      user_agent: userAgent || undefined,
      ip_address: ipAddress || undefined,
      request_id: `luma-ray-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    const localPath = await saveVideoWithMetadata(
      result.video.url,
      generationParams,
      currentProjectId
    )

    // Try to append to timeline
    try {
      const newVideoId = (generationParams as Record<string, unknown>).request_id as string
      const appended = await databaseService.appendToTimeline(newVideoId, 'video')
      if (appended) {
        console.log(`🧩 Added new Luma video ${newVideoId} to the end of the timeline`)
      }
    } catch (e) {
      console.warn('⚠️ Error appending new Luma video to timeline:', e)
    }

    // Enhance the result with dimensions for consistent API response
    const enhancedResult = enhanceVideoApiResponse(result);
    
    return NextResponse.json({
      ...enhancedResult,
      video: {
        ...enhancedResult.video,
        local_path: `videos/clips/${localPath}`,
      },
      message: 'Luma Ray video generated and saved successfully',
      saved_to_disk: true,
      local_path: `videos/clips/${localPath}`,
      generation_data: {
        model_used: 'fal-ai/luma-dream-machine/ray-2-flash/image-to-video',
        input_parameters: {
          prompt,
          image_url,
        },
      },
    })
  } catch (error) {
    console.error('Error in Luma Ray video generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    )
  }
} 