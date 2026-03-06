import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { VideoMetadata } from '@/services/videoService'
import { getEnvVar } from '@/lib/envUtils'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
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
  seed: number
}



/**
 * Downloads a video from a URL and saves it with metadata
 * @param videoUrl The URL of the video to download
 * @param generationParams The parameters used for generation
 * @param projectId The project ID to associate with this video
 * @returns The local file path of the saved video
 */
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

    // Generate filename based on timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `framepack-${timestamp}.mp4`
    
    // Download video
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }
    
    const videoBuffer = await response.arrayBuffer()
    const videoPath = path.join(videoDir, filename)
    
    // Save video
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer))
    
    // Create metadata object that matches VideoMetadata interface
    const metadataObject: VideoMetadata = {
      id: generationParams.request_id as string,
      filename: filename,
      title: `Framepack Video - ${(generationParams.prompt as string).substring(0, 50)}...`,
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
        end_image_url: generationParams.end_image_url,
        model: generationParams.model,
        aspect_ratio: generationParams.aspect_ratio,
        resolution: generationParams.resolution,
        cfg_scale: generationParams.cfg_scale,
        guidance_scale: generationParams.guidance_scale,
        num_frames: generationParams.num_frames,
        strength: generationParams.strength,
        
        // Generation results
        seed: generationParams.seed,
        inference_time: generationParams.inference_time,
        
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
    
    // Save metadata file to video-info directory
    const metadataPath = path.join(infoDir, `${filename}.meta.json`)
    fs.writeFileSync(metadataPath, JSON.stringify(metadataObject, null, 2))
    
    // Save to database (non-blocking)
    setImmediate(async () => {
      try {
        const { databaseService } = await import('@/services/databaseService');
        const success = await databaseService.saveVideo(metadataObject);
        if (success) {
          console.log(`✅ Video saved to database: ${metadataObject.id}`);
        } else {
          console.warn(`⚠️ Failed to save video to database: ${metadataObject.id}`);
        }
      } catch (error) {
        console.error('Error saving video to database:', error);
      }
    });
    
    console.log(`Video saved: ${videoPath}`)
    console.log(`Metadata saved: ${metadataPath}`)
    
    return path.join('videos', 'clips', filename)
    
  } catch (error) {
    console.error('Error saving video with metadata:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Configure fal client with database-stored credentials
    const falKey = await getEnvVar('FAL_KEY')
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
    }
    
    fal.config({
      credentials: falKey,
    })

    const body = await request.json()
    const { 
      prompt, 
      image_url, 
      end_image_url,
      negative_prompt = "",
      seed,
      aspect_ratio = "16:9",
      resolution = "480p",
      cfg_scale = 1,
      guidance_scale = 10,
      num_frames = 240,
      strength = 0.8,
      enable_safety_checker = false,
      save_to_disk = true
    } = body

    // Validate required parameters
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (!image_url) {
      return NextResponse.json({ error: 'First frame image URL (image_url) is required' }, { status: 400 })
    }
    if (!end_image_url) {
      return NextResponse.json({ error: 'Last frame image URL (end_image_url) is required' }, { status: 400 })
    }

    // Validate prompt length (max 500 characters per API spec)
    if (prompt.length > 500) {
      return NextResponse.json({ 
        error: 'Prompt must be 500 characters or less' 
      }, { status: 400 })
    }

    // Get current project
    const currentProjectId = getCurrentProjectFromServerSync()

    // Prepare the input for fal.ai API
    const input = {
      prompt: prompt.trim(),
      negative_prompt: negative_prompt,
      image_url: image_url,
      end_image_url: end_image_url,
      ...(seed && { seed }),
      aspect_ratio: aspect_ratio,
      resolution: resolution,
      cfg_scale: cfg_scale,
      guidance_scale: guidance_scale,
      num_frames: num_frames,
      strength: strength,
      enable_safety_checker: enable_safety_checker
    }

    // Validate aspect ratio to prevent 16:9 when 9:16 is requested
    if (aspect_ratio !== "16:9" && aspect_ratio !== "9:16") {
      return NextResponse.json({ 
        error: 'Invalid aspect ratio. Must be "16:9" or "9:16"' 
      }, { status: 400 })
    }

    console.log('Generating framepack video:', { 
      prompt_length: prompt.length,
      aspect_ratio: aspect_ratio,
      resolution: resolution,
      num_frames: num_frames,
      first_frame: image_url.substring(image_url.lastIndexOf('/') + 1),
      last_frame: end_image_url.substring(end_image_url.lastIndexOf('/') + 1)
    })

    console.log('📐 ASPECT RATIO CHECK:', {
      received_aspect_ratio: aspect_ratio,
      input_object_aspect_ratio: input.aspect_ratio,
      type_of_aspect_ratio: typeof aspect_ratio
    })

    const result = await fal.subscribe('fal-ai/framepack/flf2v', {
      input,
      logs: false
    }) as FalVideoResult

    let localPath: string | null = null
    
    if (save_to_disk && result.video?.url) {
      const userAgent = request.headers.get('user-agent')
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      
      // Extract dimensions from API response with aspect ratio fallback
      const dimensions = extractVideoDimensions(result, input.aspect_ratio);
      
      const generationParams = {
        prompt: input.prompt,
        negative_prompt: input.negative_prompt,
        image_url: input.image_url,
        end_image_url: input.end_image_url,
        model: 'fal-ai/framepack/flf2v',
        aspect_ratio: input.aspect_ratio,
        resolution: input.resolution,
        cfg_scale: input.cfg_scale,
        guidance_scale: input.guidance_scale,
        num_frames: input.num_frames,
        strength: input.strength,
        width: dimensions.width,
        height: dimensions.height,
        seed: result.seed,
        api_response: {
          ...result,
          request_input: input,
          request_timestamp: new Date().toISOString(),
          model_used: 'fal-ai/framepack/flf2v'
        },
        user_agent: userAgent || undefined,
        ip_address: ipAddress || undefined,
        request_id: `framepack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      localPath = await saveVideoWithMetadata(result.video.url, generationParams, currentProjectId)
      ;(result.video as Record<string, unknown>).local_path = localPath
    }

    // Enhance the result with dimensions for consistent API response
    const enhancedResult = enhanceVideoApiResponse(result, input.aspect_ratio);
    
    const response = {
      ...enhancedResult,
      message: save_to_disk ? 'Framepack video generated and saved successfully' : 'Framepack video generated successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      generation_data: {
        seed: result.seed,
        model_used: 'fal-ai/framepack/flf2v',
        input_parameters: {
          aspect_ratio: input.aspect_ratio,
          resolution: input.resolution,
          num_frames: input.num_frames,
          strength: input.strength
        }
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating framepack video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate framepack video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
} 