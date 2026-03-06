import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
import { mediaSaverService } from '@/services/mediaSaver'
import { createVideoSaveRequest } from '@/types/mediaSaver'
import { extractLastFrameForChaining, saveFrameToDatabase } from '@/utils/videoFrameExtractor'
import fs from 'fs'
import path from 'path'


/**
 * Upload local file to fal.ai storage
 */
async function uploadLocalFileToFal(localPath: string): Promise<string> {
  try {
    // Remove leading slash if present and construct full path
    const cleanPath = localPath.startsWith('/') ? localPath.substring(1) : localPath
    const fullPath = path.join(process.cwd(), 'public', cleanPath)

    console.log(`📤 Uploading local file to fal.ai: ${fullPath}`)

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(fullPath)

    // Determine content type from file extension
    const ext = path.extname(fullPath).toLowerCase()
    const contentType = ext === '.png' ? 'image/png' :
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.webp' ? 'image/webp' :
                       'application/octet-stream'

    // Create a proper File object for fal.ai
    const file = new File([fileBuffer], path.basename(fullPath), { type: contentType })

    console.log(`📤 Uploading ${file.name} (${file.type}, ${file.size} bytes) to fal.ai...`)

    const uploadedUrl = await fal.storage.upload(file)
    console.log(`✅ Uploaded to fal.ai: ${uploadedUrl}`)

    return uploadedUrl
  } catch (error) {
    console.error('❌ Failed to upload file to fal.ai:', error)
    throw error
  }
}

/**
 * Upload external image URL to fal.ai storage
 */
async function uploadImageUrlToFal(imageUrl: string): Promise<string> {
  try {
    console.log(`📤 Downloading image from URL: ${imageUrl.substring(0, 80)}...`)
    
    // Download image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Create a File object for fal.ai
    const filename = imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg'
    const file = new File([imageBuffer], filename, { type: contentType })
    
    console.log(`📤 Uploading ${file.name} (${file.type}, ${file.size} bytes) to fal.ai storage...`)
    
    const uploadedUrl = await fal.storage.upload(file)
    console.log(`✅ Uploaded to fal.ai storage: ${uploadedUrl}`)
    
    return uploadedUrl
  } catch (error) {
    console.error('❌ Failed to upload image URL to fal.ai:', error)
    throw error
  }
}

// Type definitions for Veo 3.1 Fast API response
interface Veo31FastVideoResponse {
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
      // Single image mode (image-to-video with audio support)
      image_url,
      // First/last frame mode (frame interpolation)
      first_frame_url,
      last_frame_url,
      // Common options
      aspect_ratio, // Optional - if not provided, uses input image dimensions automatically
      duration = '8s',
      generate_audio = true,
      resolution = '720p',
      concept,
      save_to_disk = true
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Determine which mode we're in
    const isImageToVideo = !!image_url && !first_frame_url && !last_frame_url
    const isFrameToFrame = !!first_frame_url && !!last_frame_url

    if (!isImageToVideo && !isFrameToFrame) {
      return NextResponse.json({ 
        error: 'Either image_url (for image-to-video) OR both first_frame_url and last_frame_url (for frame interpolation) are required' 
      }, { status: 400 })
    }

    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Use provided aspect_ratio or let API use input image dimensions automatically
    const finalAspectRatio = aspect_ratio // If undefined, API will use input image dimensions
    if (finalAspectRatio) {
      console.log(`📐 Using specified aspect ratio: ${finalAspectRatio}`)
    } else {
      console.log(`📐 Using input image dimensions automatically`)
    }

    let endpoint: string
    let input: Record<string, unknown>
    let modelName: string

    if (isImageToVideo) {
      // ========================================
      // MODE 1: Image-to-Video (with audio/speech support)
      // Endpoint: fal-ai/veo3.1/fast/image-to-video
      // ========================================
      endpoint = 'fal-ai/veo3.1/fast/image-to-video'
      modelName = 'veo3.1-fast-i2v'

      // Process image URL
      let processedImageUrl = image_url
      if (image_url.startsWith('/images/') || image_url.startsWith('/videos/')) {
        console.log(`🔄 Detected local file path, uploading to fal.ai: ${image_url}`)
        processedImageUrl = await uploadLocalFileToFal(image_url)
      } else if (image_url.startsWith('http://') || image_url.startsWith('https://')) {
        // Upload external URLs to fal.ai storage for better compatibility
        console.log(`🔄 Uploading external image to fal.ai storage...`)
        processedImageUrl = await uploadImageUrlToFal(image_url)
      }

      // Validate duration for image-to-video (4s, 6s, 8s)
      const validDurations = ['4s', '6s', '8s']
      const finalDuration = validDurations.includes(duration) ? duration : '8s'

      // Validate resolution (720p, 1080p)
      const validResolutions = ['720p', '1080p']
      const finalResolution = validResolutions.includes(resolution) ? resolution : '720p'

      input = {
        prompt,
        image_url: processedImageUrl,
        duration: finalDuration,
        generate_audio,
        resolution: finalResolution
      }

      // Only add aspect_ratio if explicitly provided - otherwise API uses input image dimensions
      if (finalAspectRatio) {
        input.aspect_ratio = finalAspectRatio
      }

      console.log('🎬 Generating video with Veo 3.1 Fast Image-to-Video:', { 
        concept: concept || 'Veo 3.1 Fast Image-to-Video',
        model: endpoint,
        duration: finalDuration,
        generate_audio,
        resolution: finalResolution
      })

    } else {
      // ========================================
      // MODE 2: First-Last-Frame-to-Video (interpolation)
      // Endpoint: fal-ai/veo3.1/fast/first-last-frame-to-video
      // ========================================
      endpoint = 'fal-ai/veo3.1/fast/first-last-frame-to-video'
      modelName = 'veo3.1-fast-flf'

      // Process first frame URL
      let processedFirstFrameUrl = first_frame_url
      if (first_frame_url.startsWith('/images/') || first_frame_url.startsWith('/videos/')) {
        console.log(`🔄 Detected local file path for first frame, uploading to fal.ai: ${first_frame_url}`)
        processedFirstFrameUrl = await uploadLocalFileToFal(first_frame_url)
      }

      // Process last frame URL
      let processedLastFrameUrl = last_frame_url
      if (last_frame_url.startsWith('/images/') || last_frame_url.startsWith('/videos/')) {
        console.log(`🔄 Detected local file path for last frame, uploading to fal.ai: ${last_frame_url}`)
        processedLastFrameUrl = await uploadLocalFileToFal(last_frame_url)
      }

      // Validate duration for first-last-frame (4s, 6s, 8s)
      const validDurationsFlf = ['4s', '6s', '8s']
      const finalDurationFlf = validDurationsFlf.includes(duration) ? duration : '8s'

      input = {
        prompt,
        first_frame_url: processedFirstFrameUrl,
        last_frame_url: processedLastFrameUrl,
        duration: finalDurationFlf
      }

      console.log('🎬 Generating video with Veo 3.1 Fast First-Last-Frame:', { 
        concept: concept || 'Veo 3.1 Fast Frame Interpolation',
        model: endpoint,
        duration: finalDurationFlf
      })
    }

    // Call fal.ai API
    const result = await fal.subscribe(endpoint, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`🔄 ${modelName} video generation in progress...`)
          if (update.logs) {
            update.logs.map((log: { message: string }) => log.message).forEach(console.log)
          }
        }
      },
    }) as Veo31FastVideoResponse

    let localPath = null
    let videoMetadata = null
    if (save_to_disk && result.video?.url) {
      // Extract dimensions from API response (will use API response dimensions or aspect ratio if provided)
      const dimensions = extractVideoDimensions(result, finalAspectRatio || undefined)
      const requestId = `veo3.1-fast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create generation parameters
      const generationParams = {
        prompt,
        ...input,
        width: dimensions.width,
        height: dimensions.height
      }

      // Create generation results
      const generationResults = {
        video_duration: result.video.duration,
        video_fps: result.video.fps,
        video_num_frames: result.video.num_frames
      }

      // Create API response for standardized metadata
      const apiResponse = {
        ...result,
        request_input: input,
        request_timestamp: new Date().toISOString(),
        model_used: endpoint
      }

      // Create save request using MediaSaverService
      const saveRequest = createVideoSaveRequest(
        result.video.url,
        concept || `Veo 3.1 Fast ${isImageToVideo ? 'Image-to-Video' : 'Frame Interpolation'}`,
        prompt,
        prompt, // originalPrompt
        'fal', // provider
        modelName, // model
        '/api/veo3-fast', // apiRoute
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
            mode: isImageToVideo ? 'image-to-video' : 'first-last-frame',
            ...input
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

    // Auto-extract last frame for video chaining
    let nextFramePath: string | null = null
    if (save_to_disk && localPath) {
      console.log('🎞️  Auto-extracting last frame for video chaining...')
      const frameResult = await extractLastFrameForChaining(localPath, currentProjectId)
      
      if (frameResult.success && frameResult.framePath) {
        nextFramePath = frameResult.framePath
        console.log(`✅ Last frame extracted: ${nextFramePath}`)
        
        // Save frame to database for gallery visibility
        const frameSaved = await saveFrameToDatabase(
          frameResult.framePath,
          localPath,
          currentProjectId,
          { width: frameResult.width || 1920, height: frameResult.height || 1080 },
          {
            source_prompt: prompt,
            video_model: modelName,
            video_concept: concept || `Veo 3.1 Fast ${isImageToVideo ? 'Image-to-Video' : 'Frame Interpolation'}`
          }
        )
        
        if (frameSaved) {
          console.log('💾 Extracted frame registered in gallery database')
        }
      } else {
        console.warn('⚠️ Failed to extract last frame:', frameResult.error)
      }
    }

    // Enhanced response with video dimensions and metadata
    const enhancedResponse = enhanceVideoApiResponse({
      ...result,
      local_path: localPath,
      video_metadata: videoMetadata,
      model_used: endpoint
    }, finalAspectRatio || undefined)

    console.log(`✅ Veo 3.1 Fast ${isImageToVideo ? 'image-to-video' : 'frame interpolation'} completed successfully`)

    return NextResponse.json({
      ...enhancedResponse,
      message: save_to_disk ? 'Veo 3.1 Fast video generated and saved successfully' : 'Veo 3.1 Fast video generated successfully',
      saved_to_disk: save_to_disk,
      project_id: currentProjectId,
      mode: isImageToVideo ? 'image-to-video' : 'first-last-frame',
      next_frame_path: nextFramePath, // NEW: Path to extracted last frame for chaining
      should_refresh_gallery: true
    })
  } catch (error) {
    console.error('❌ Veo 3.1 Fast video generation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to generate video with Veo 3.1 Fast', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
