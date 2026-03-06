import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { databaseService } from '@/services/databaseService'
import { VideoMetadata } from '@/services/videoService'
import { extractVideoDimensions, enhanceVideoApiResponse } from '@/utils/videoDimensionUtils'
import { llmFeedback } from '@/utils/llmFeedback'
import { toApiAspectRatio } from '@/config/aspectRatios'
import fs from 'fs/promises'
import path from 'path'

/**
 * Convert project aspect ratio format to PixVerse V5 format
 */
function convertToPixVerseAspectRatio(projectRatio: string): string {
  // PixVerse V5 supports: 16:9, 4:3, 1:1, 3:4, 9:16
  // First convert using our centralized config
  const apiRatio = toApiAspectRatio(projectRatio)
  
  switch (apiRatio) {
    case '16:9':
    case '21:9':
      return '16:9'
    case '4:3':
    case '3:2':
    case '5:4':
      return '4:3'
    case '1:1':
      return '1:1'
    case '3:4':
    case '4:5':
      return '3:4'
    case '9:16':
    case '2:3':
      return '9:16'
    default:
      console.warn(`⚠️ Unknown aspect ratio: ${projectRatio}, defaulting to 9:16`)
      return '9:16'
  }
}

/**
 * Get project default aspect ratio from settings
 */
async function getProjectAspectRatio(projectId: string): Promise<string> {
  try {
    const project = await databaseService.getProject(projectId)
    const aspectRatio = project?.settings?.videoPrompting?.aspectRatio || 
                        project?.settings?.imagePrompting?.aspectRatio ||
                        project?.settings?.defaultImageOrientation
    
    if (aspectRatio) {
      console.log(`📐 Using project aspect ratio: ${aspectRatio}`)
      return toApiAspectRatio(aspectRatio)
    }
    
    // Default fallback
    console.log(`📐 No project aspect ratio found, using default: 9:16`)
    return '9:16'
  } catch (error) {
    console.error('Error getting project aspect ratio:', error)
    return '9:16'
  }
}

interface GenerationMetadata {
  filename?: string
  width?: number
  height?: number
  duration?: number
  model?: string
  api_response?: Record<string, unknown>
  generationParams?: Record<string, unknown>
  user_agent?: string
  ip_address?: string
  request_id?: string
}

/**
 * Save video to local filesystem with metadata
 */
async function saveVideoWithMetadata(
  videoUrl: string,
  metadata: GenerationMetadata,
  concept: string,
  projectId: string = 'default'
): Promise<string> {
  try {
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    const videoBuffer = Buffer.from(buffer)
    
    // Generate filename with concept and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const sanitizedConcept = concept.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const filename = `${sanitizedConcept}-transition-${timestamp}.mp4`
    
    // Save to filesystem
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const videosDir = path.join(process.cwd(), 'public', 'videos', 'clips')
    await fs.mkdir(videosDir, { recursive: true })
    
    const filePath = path.join(videosDir, filename)
    await fs.writeFile(filePath, videoBuffer)
    
    console.log(`💾 Video saved to: ${filePath}`)
    
    // Save metadata to database
    const videoId = metadata.request_id as string
    const videoMetadata: VideoMetadata = {
      id: videoId,
      filename,
      title: `PixVerse V5 Transition - ${concept}`,
      description: `PixVerse V5 transition video generated from two images`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: projectId,
      fileSize: videoBuffer.length,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      metadata: {
        model: 'fal-ai/pixverse/v5/transition',
        api_response: metadata.api_response,
        generationParams: metadata.generationParams,
        user_agent: metadata.user_agent,
        ip_address: metadata.ip_address,
        request_id: metadata.request_id
      }
    }
    
    const saved = await databaseService.saveVideo(videoMetadata)
    if (saved) {
      console.log(`✅ Video metadata saved to database: ${filename}`)
    }
    
    return filename
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
      first_image_url,
      last_image_url,
      duration = "5",
      resolution = "720p",
      aspect_ratio, // Will be ignored - always use project default
      negative_prompt = "",
      style,
      seed,
      concept,
      save_to_disk = true
    } = body

    // Validate required parameters
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (!first_image_url) {
      return NextResponse.json({ error: 'First image URL is required' }, { status: 400 })
    }
    if (!last_image_url) {
      return NextResponse.json({ error: 'Last image URL is required' }, { status: 400 })
    }

    // Validate duration (must be 5 or 8 seconds)
    if (!['5', '8'].includes(duration)) {
      return NextResponse.json({ 
        error: 'Duration must be either "5" or "8" seconds' 
      }, { status: 400 })
    }

    // Validate resolution
    if (!['360p', '540p', '720p', '1080p'].includes(resolution)) {
      return NextResponse.json({ 
        error: 'Resolution must be one of: 360p, 540p, 720p, 1080p' 
      }, { status: 400 })
    }

    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Always use project default aspect ratio, but convert to PixVerse format
    const projectAspectRatio = await getProjectAspectRatio(currentProjectId);
    
    // Convert from project format (e.g., "9:16") to PixVerse format (e.g., "9:16")
    const finalAspectRatio = convertToPixVerseAspectRatio(projectAspectRatio);
    console.log(`📐 Using project aspect ratio: ${projectAspectRatio} -> PixVerse format: ${finalAspectRatio}`);
    
    // Log if someone tried to override the aspect ratio
    if (aspect_ratio && aspect_ratio !== finalAspectRatio) {
      console.warn(`⚠️ IGNORING provided aspect_ratio parameter: "${aspect_ratio}" - using project setting: "${finalAspectRatio}"`);
      llmFeedback({
        title: 'IGNORING PROVIDED ASPECT_RATIO PARAMETER',
        technicalDetails: `Requested: ${aspect_ratio} | Using project default: ${finalAspectRatio}`,
        futureInstructions: 'Do not include aspect_ratio in future API calls. It is always ignored in favor of project settings.'
      });
    }

    // Build input object with exact parameter names from FAL API documentation
    const input: Record<string, unknown> = {
      prompt,
      first_image_url,
      last_image_url,
      aspect_ratio: finalAspectRatio,
      resolution,
      duration,
      negative_prompt
    }
    
    // Add optional parameters only if provided
    if (style) input.style = style
    if (seed) input.seed = seed

    console.log('🚀 PixVerse V5 Transition API Input:', JSON.stringify(input, null, 2))

    console.log('Generating transition video with PixVerse V5:', { 
      concept: concept || 'PixVerse Transition',
      aspect_ratio: finalAspectRatio,
      duration,
      resolution,
      style: style || 'default',
      first_image: first_image_url.substring(first_image_url.lastIndexOf('/') + 1),
      last_image: last_image_url.substring(last_image_url.lastIndexOf('/') + 1)
    })

    console.log('🚀 About to call FAL API with endpoint: fal-ai/pixverse/v5/transition')
    console.log('🚀 Input object:', JSON.stringify(input, null, 2))
    
    const result = await fal.subscribe('fal-ai/pixverse/v5/transition', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('PixVerse V5 transition generation in progress...')
          update.logs.map((log) => log.message).forEach(console.log)
        }
      }
    })
    
    console.log('🚀 FAL API Response:', JSON.stringify(result, null, 2))

    if (!result?.video?.url) {
      return NextResponse.json(
        { error: 'Failed to generate transition video' },
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
        first_image_url: input.first_image_url,
        last_image_url: input.last_image_url,
        duration: input.duration,
        resolution: input.resolution,
        aspect_ratio: finalAspectRatio,
        negative_prompt: input.negative_prompt,
        style: input.style,
        seed: input.seed,
        width: dimensions.width,
        height: dimensions.height,
        model: 'fal-ai/pixverse/v5/transition',
        api_response: {
          ...result,
          request_input: input,
          request_timestamp: new Date().toISOString(),
          model_used: 'fal-ai/pixverse/v5/transition'
        },
        user_agent: userAgent || undefined,
        ip_address: ipAddress || undefined,
        request_id: `pixverse-transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      localPath = await saveVideoWithMetadata(
        result.video.url, 
        generationParams, 
        concept || 'PixVerse Transition',
        currentProjectId
      )

      // Try to append to timeline (after save and before respond)
      try {
        const newVideoId = generationParams.request_id as string
        const appended = await databaseService.appendToTimeline(newVideoId, 'video')
        if (appended) {
          console.log(`🧩 Added new PixVerse transition video ${newVideoId} to the end of the timeline`)
        } else {
          console.warn(`⚠️ Failed to add PixVerse transition video ${newVideoId} to timeline`)
        }
      } catch (e) {
        console.warn('⚠️ Error appending new PixVerse transition video to timeline:', e)
      }
    }

    // Enhance the result with dimensions for consistent API response
    const enhancedResult = enhanceVideoApiResponse(result as unknown as Record<string, unknown>, finalAspectRatio);
    
    const response = {
      ...enhancedResult,
      message: save_to_disk ? 'PixVerse V5 transition video generated and saved successfully' : 'PixVerse V5 transition video generated successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      generation_data: {
        model_used: 'fal-ai/pixverse/v5/transition',
        input_parameters: {
          prompt: input.prompt,
          first_image_url: input.first_image_url,
          last_image_url: input.last_image_url,
          duration: input.duration,
          resolution: input.resolution,
          aspect_ratio: finalAspectRatio,
          style: input.style || 'default'
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating PixVerse V5 transition video:', error)
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Check if it's a FAL API specific error
    let errorMessage = 'Failed to generate PixVerse V5 transition video'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorDetails = error.message
      
      // Parse FAL API specific errors
      if (error.message.includes('Unprocessable Entity')) {
        errorMessage = 'Invalid request parameters for PixVerse V5 Transition API'
        errorDetails = 'The provided parameters are not compatible with the PixVerse V5 Transition model. Please check image URLs, prompt format, and parameter values.'
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'API authentication failed'
        errorDetails = 'FAL_KEY is invalid or expired'
      } else if (error.message.includes('Not Found')) {
        errorMessage = 'PixVerse V5 Transition model not found'
        errorDetails = 'The model endpoint may have changed or is temporarily unavailable'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}
