import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import fs from 'fs'
import path from 'path'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'
import { enhanceVideoApiResponse, extractVideoDimensions } from '@/utils/videoDimensionUtils'
import { databaseService } from '@/services/databaseService'
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
    const orientation = projectData.settings?.defaultImageOrientation || projectData.defaultImageOrientation || '9:16';
    
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
    url: string
    content_type?: string
    file_name?: string
    file_size?: number
  }
  seed?: number
  timings?: {
    inference?: number
  }
  has_nsfw_concepts?: boolean[]
  prompt?: string
  model?: string
  config?: Record<string, unknown>
}

interface VideoMetadata {
  prompt: string;
  images: Array<{ image_url: string }>;
  aspect_ratio: string;
  resolution: string;
  duration: number;
  ingredients_mode: string;
  negative_prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  inference_time?: number;
  has_nsfw_concepts?: boolean[];
  api_response: Record<string, unknown>;
  user_agent?: string | null;
  ip_address?: string | null;
  request_id: string;
}

async function saveVideoWithMetadata(
  videoUrl: string,
  metadata: VideoMetadata,
  concept: string,
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

    // Generate filename based on concept and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeConcept = concept.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const filename = `pika-scenes-${safeConcept}-${timestamp}.mp4`
    
    // Download video
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }
    
    const videoBuffer = await response.arrayBuffer()
    const videoPath = path.join(videoDir, filename)
    
    // Save video
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer))
    
    // Create metadata object
    const metadataObject = {
      id: metadata.request_id,
      filename: filename,
      title: concept,
      description: metadata.prompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: projectId,
      fileSize: Buffer.from(videoBuffer).length,
      metadata: {
        ...metadata,
        fal_video_url: videoUrl,
        local_path: path.join('videos', 'clips', filename),
        model: 'fal-ai/pika/v2.2/pikascenes'
      }
    }
    
    // Save metadata file
    const metadataPath = path.join(infoDir, `${filename}.meta.json`)
    fs.writeFileSync(metadataPath, JSON.stringify(metadataObject, null, 2))
    
    // Save to database
    try {
      const { databaseService } = await import('@/services/databaseService');
      const success = await databaseService.saveVideo(metadataObject);
      if (success) {
        console.log(`✅ Pika Scenes video saved to database: ${metadataObject.id}`);
      } else {
        console.warn(`⚠️ Failed to save Pika Scenes video to database: ${metadataObject.id}`);
      }
    } catch (error) {
      console.error('Error saving Pika Scenes video to database:', error);
    }
    
    console.log(`Pika Scenes video saved: ${videoPath}`)
    console.log(`Metadata saved: ${metadataPath}`)
    
    return path.join('videos', 'clips', filename)
    
  } catch (error) {
    console.error('Error saving Pika Scenes video with metadata:', error)
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
      images = [], // Array of image URLs
      seed,
      negative_prompt = "",
      aspect_ratio, // Will be ignored - always use project default
      resolution = "720p",
      duration = 5,
      ingredients_mode = "creative", // "creative" or "precise"
      concept,
      save_to_disk = true
    } = body

    // Validation
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'At least one image URL is required' }, { status: 400 })
    }

    if (images.length > 5) {
      return NextResponse.json({ error: 'Maximum of 5 images allowed' }, { status: 400 })
    }

    // Validate that all images have valid URLs
    const validImages = images.filter(img => img && typeof img === 'string' && img.trim().length > 0)
    if (validImages.length === 0) {
      return NextResponse.json({ error: 'At least one valid image URL is required' }, { status: 400 })
    }

    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Always use project default aspect ratio
    const finalAspectRatio = await getProjectAspectRatio(currentProjectId);
    console.log(`📐 Using project default aspect ratio: ${finalAspectRatio}`);
    
    // Log if someone tried to override the aspect ratio
    if (aspect_ratio) {
      console.log(`⚠️ Ignoring provided aspect_ratio (${aspect_ratio}) - using project default instead`);
    }

    // Convert image URLs to the format expected by Pika Scenes
    const pikaImages = validImages.map(imageUrl => ({ image_url: imageUrl }))

    const input = {
      images: pikaImages,
      prompt,
      ...(seed && { seed }),
      negative_prompt,
      aspect_ratio: finalAspectRatio,
      resolution,
      duration,
      ingredients_mode
    }

    console.log('Generating video with Pika Scenes:', { 
      concept: concept || 'Pika Scenes Generation',
      imageCount: pikaImages.length,
      aspect_ratio: finalAspectRatio,
      resolution,
      duration,
      ingredients_mode
    })

    const result = await fal.subscribe('fal-ai/pika/v2.2/pikascenes', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Pika Scenes video generation in progress...')
        }
      },
    }) as FalVideoResponse

    let localPath = null
    let videoMetadata = null
    if (save_to_disk && result.video?.url) {
      // Extract dimensions from API response with aspect ratio fallback
      const dimensions = extractVideoDimensions(result, finalAspectRatio);
      
      const metadata = {
        prompt,
        images: pikaImages,
        aspect_ratio: finalAspectRatio,
        resolution,
        duration,
        ingredients_mode,
        negative_prompt,
        width: dimensions.width,
        height: dimensions.height,
        seed: result.seed,
        inference_time: result.timings?.inference,
        has_nsfw_concepts: result.has_nsfw_concepts,
        api_response: {
          ...result,
          request_input: input,
          request_timestamp: new Date().toISOString(),
          model_used: 'fal-ai/pika/v2.2/pikascenes'
        },
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        request_id: `pika-scenes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      localPath = await saveVideoWithMetadata(
        result.video.url,
        metadata,
        concept || 'Pika Scenes Generation',
        currentProjectId
      )

      // Create video metadata for immediate UI update
      videoMetadata = {
        id: metadata.request_id,
        title: concept || 'Pika Scenes Generation',
        description: prompt,
        filename: localPath.split('/').pop(),
        projectId: currentProjectId,
        createdAt: new Date().toISOString(),
        mediaType: 'video',
        local_path: localPath,
        fal_video_url: result.video.url,
        imageCount: pikaImages.length
      }

      // Immediately sync this specific video to database
      try {
        console.log('🔄 Immediately syncing new Pika Scenes video to database...')
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/sync/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            forceSync: false,
            projectId: currentProjectId
          })
        })
        
        if (syncResponse.ok) {
          const syncResult = await syncResponse.json()
          console.log('✅ Pika Scenes video immediately synced to database:', syncResult.message)
          // Append to timeline
          try {
            const newVideoId = metadata.request_id as string
            const appended = await databaseService.appendToTimeline(newVideoId, 'video')
            if (appended) {
              console.log(`🧩 Added new video ${newVideoId} to the end of the timeline`)
            } else {
              console.warn(`⚠️ Failed to add new video ${newVideoId} to the timeline`)
            }
          } catch (e) {
            console.warn('⚠️ Error appending new video to timeline:', e)
          }
        } else {
          console.warn('⚠️ Failed to immediately sync Pika Scenes video to database')
        }
      } catch (error) {
        console.warn('⚠️ Error immediately syncing Pika Scenes video to database:', error)
      }
    }

    // Enhance the result with dimensions for consistent API response
    const enhancedResult = enhanceVideoApiResponse(result, finalAspectRatio);
    
    return NextResponse.json({
      ...enhancedResult,
      message: save_to_disk ? 'Pika Scenes video generated and saved successfully' : 'Pika Scenes video generated successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      video_metadata: videoMetadata,
      project_id: currentProjectId,
      should_refresh_gallery: true,
      generation_data: {
        seed: result.seed,
        inference_time: result.timings?.inference,
        images_used: pikaImages.length,
        model_used: 'fal-ai/pika/v2.2/pikascenes'
      }
    })
  } catch (error) {
    console.error('Error generating Pika Scenes video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate Pika Scenes video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
} 