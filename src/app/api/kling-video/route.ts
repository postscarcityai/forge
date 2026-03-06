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
    url: string
    width?: number
    height?: number
    content_type?: string
  }
  seed?: number
  timings?: {
    inference?: number
  }
  has_nsfw_concepts?: boolean[]
  // Additional fields that may come from the API
  prompt?: string
  model?: string
  config?: Record<string, unknown>
}

interface VideoMetadata {
  prompt: string;
  duration: string;
  aspect_ratio: string;
  negative_prompt: string;
  cfg_scale: number;
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
    const filename = `${safeConcept}-${timestamp}.mp4`
    
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
        local_path: path.join('videos', 'clips', filename)
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
        console.log(`✅ Video saved to database: ${metadataObject.id}`);
      } else {
        console.warn(`⚠️ Failed to save video to database: ${metadataObject.id}`);
      }
    } catch (error) {
      console.error('Error saving video to database:', error);
    }
    
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
      aspect_ratio, // Will be ignored - always use project default
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
    
    // Always use project default aspect ratio
    const finalAspectRatio = await getProjectAspectRatio(currentProjectId);
    console.log(`📐 Using project default aspect ratio: ${finalAspectRatio}`);
    
    // Log if someone tried to override the aspect ratio
    if (aspect_ratio) {
      console.log(`⚠️ Ignoring provided aspect_ratio (${aspect_ratio}) - using project default instead`);
    }

    const input = {
      prompt,
      image_url,
      duration,
      aspect_ratio: finalAspectRatio,
      negative_prompt,
      cfg_scale
    }

    console.log('Generating video with Kling model:', { 
      concept: concept || 'Kling Video Generation',
      aspect_ratio: finalAspectRatio,
      duration 
    })

    const result = await fal.subscribe('fal-ai/kling-video/v2.1/standard/image-to-video', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Kling video generation in progress...')
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
        duration,
        aspect_ratio: finalAspectRatio,
        negative_prompt,
        cfg_scale,
        width: dimensions.width,
        height: dimensions.height,
        seed: result.seed,
        inference_time: result.timings?.inference,
        has_nsfw_concepts: result.has_nsfw_concepts,
        api_response: {
          ...result,
          request_input: input,
          request_timestamp: new Date().toISOString(),
          model_used: 'fal-ai/kling-video/v2.1/standard/image-to-video'
        },
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        request_id: `kling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      localPath = await saveVideoWithMetadata(
        result.video.url,
        metadata,
        concept || 'Kling Video Generation',
        currentProjectId
      )

      // Create video metadata for immediate UI update
      videoMetadata = {
        id: metadata.request_id,
        title: concept || 'Kling Video Generation',
        description: prompt,
        filename: localPath.split('/').pop(),
        projectId: currentProjectId,
        createdAt: new Date().toISOString(),
        mediaType: 'video',
        local_path: localPath,
        fal_video_url: result.video.url
      }

      // Immediately sync this specific video to database
      try {
        console.log('🔄 Immediately syncing new video to database...')
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
          console.log('✅ Video immediately synced to database:', syncResult.message)

          // Append this new video to the end of the timeline
          try {
            // Use the request_id we set above as the video ID
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
          console.warn('⚠️ Failed to immediately sync video to database')
        }
      } catch (error) {
        console.warn('⚠️ Error immediately syncing video to database:', error)
      }
    }

    // Enhance the result with dimensions for consistent API response
    const enhancedResult = enhanceVideoApiResponse(result, finalAspectRatio);
    
    return NextResponse.json({
      ...enhancedResult,
      message: save_to_disk ? 'Kling video generated and saved successfully' : 'Kling video generated successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      video_metadata: videoMetadata, // Include metadata for immediate UI refresh
      project_id: currentProjectId,
      should_refresh_gallery: true // Signal to frontend to refresh
    })
  } catch (error) {
    console.error('Error generating Kling video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate Kling video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
} 