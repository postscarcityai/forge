import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
import { mediaSaverService } from '@/services/mediaSaver'
import { createVideoSaveRequest } from '@/types/mediaSaver'
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
      console.warn(`Failed to fetch project ${projectId}, using default landscape aspect ratio`);
      return '16:9';
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn(`No project data found for ${projectId}, using default landscape aspect ratio`);
      return '16:9';
    }
    
    // Extract orientation from project settings - now supports all aspect ratio formats
    const projectData = result.data;
    const orientation = projectData.settings?.defaultImageOrientation || projectData.defaultImageOrientation || '16:9';
    
    // Convert to API-compatible aspect ratio using the centralized config
    // Note: Sora 2 only supports 9:16 and 16:9, so we map to closest
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

// Type definitions for Sora 2 API response
interface Sora2VideoResponse {
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
  spritesheet?: {
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
      image_url,
      resolution = 'auto',
      aspect_ratio, // Will use project default if not provided
      duration = '4',
      delete_video = true,
      concept,
      save_to_disk = true
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required for image-to-video generation' }, { status: 400 })
    }

    // Validate duration (must be 4, 8, or 12 seconds)
    if (!['4', '8', '12'].includes(duration)) {
      return NextResponse.json({ 
        error: 'Duration must be "4", "8", or "12" seconds' 
      }, { status: 400 })
    }

    // Validate aspect_ratio (must be auto, 9:16, or 16:9)
    if (aspect_ratio && !['auto', '9:16', '16:9'].includes(aspect_ratio)) {
      return NextResponse.json({ 
        error: 'Aspect ratio must be "auto", "9:16", or "16:9"' 
      }, { status: 400 })
    }

    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Always use project default aspect ratio if not provided
    const finalAspectRatio = aspect_ratio === 'auto' ? await getProjectAspectRatio(currentProjectId) : (aspect_ratio || await getProjectAspectRatio(currentProjectId));
    console.log(`📐 Using aspect ratio: ${finalAspectRatio} (project default: ${!aspect_ratio || aspect_ratio === 'auto' ? 'yes' : 'no'})`);

    // Handle local file paths - upload to fal.ai storage
    let processedImageUrl = image_url
    if (image_url.startsWith('/images/') || image_url.startsWith('/videos/')) {
      console.log(`🔄 Detected local file path, uploading to fal.ai: ${image_url}`)
      processedImageUrl = await uploadLocalFileToFal(image_url)
    }

    const input = {
      prompt,
      image_url: processedImageUrl,
      resolution,
      aspect_ratio: finalAspectRatio === 'auto' ? 'auto' : finalAspectRatio,
      duration: Number(duration), // Convert to number as required by API
      delete_video
    }

    console.log('Generating video with Sora 2 image-to-video model:', { 
      concept: concept || 'Sora 2 Image-to-Video Generation',
      resolution,
      aspect_ratio: finalAspectRatio,
      duration,
      model: 'fal-ai/sora-2/image-to-video'
    })

    const result = await fal.subscribe('fal-ai/sora-2/image-to-video', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('🔄 Sora 2 image-to-video generation in progress...')
          if (update.logs) {
            update.logs.map((log: { message: string }) => log.message).forEach(console.log)
          }
        }
      },
    }) as Sora2VideoResponse

    let localPath = null
    let videoMetadata = null
    if (save_to_disk && result.video?.url) {
      // Extract dimensions from API response with aspect ratio fallback
      const dimensions = extractVideoDimensions(result, finalAspectRatio);
      const requestId = `sora-2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create generation parameters
      const generationParams = {
        prompt,
        image_url: processedImageUrl,
        resolution,
        aspect_ratio: finalAspectRatio,
        duration,
        delete_video,
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
        model_used: 'fal-ai/sora-2/image-to-video'
      }

      // Create save request using MediaSaverService
      const saveRequest = createVideoSaveRequest(
        result.video.url,
        concept || 'Sora 2 Image-to-Video Generation',
        prompt,
        prompt, // originalPrompt
        'fal', // provider
        'sora-2-image-to-video', // model
        '/api/sora-2', // apiRoute
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
            spritesheet_url: result.spritesheet?.url,
            source_image_url: image_url,
            processed_image_url: processedImageUrl
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
      model_used: 'fal-ai/sora-2/image-to-video'
    }, finalAspectRatio)

    console.log('✅ Sora 2 image-to-video generation completed successfully')

    return NextResponse.json({
      ...enhancedResponse,
      message: save_to_disk ? 'Sora 2 video generated and saved successfully' : 'Sora 2 video generated successfully',
      saved_to_disk: save_to_disk,
      project_id: currentProjectId,
      should_refresh_gallery: true
    })
  } catch (error) {
    console.error('❌ Sora 2 image-to-video generation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to generate video with Sora 2', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

