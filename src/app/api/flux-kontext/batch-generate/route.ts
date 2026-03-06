import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { saveImageWithMetadata } from '@/utils/fal-image-generator'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { llmFeedback } from '@/utils/llmFeedback'
import { getEnvVar } from '@/lib/envUtils'
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

interface BatchKontextRequest {
  concept: string
  prompt: string
  image_url: string
  filename?: string
}

interface BatchKontextGenerationRequest {
  images: BatchKontextRequest[]
  save_to_disk?: boolean
  master_prompt?: string
  guidance_scale?: number
  num_images?: number
  safety_tolerance?: string
  output_format?: string
  aspect_ratio?: string
  project_id?: string
}

interface FalKontextResult {
  images: Array<{
    url: string
    width?: number
    height?: number
    content_type?: string
  }>
  seed?: number
  timings?: {
    inference?: number
  }
  has_nsfw_concepts?: boolean[]
}

// Removed hardcoded default kontext prompt - now using project settings only

/**
 * Fetch project data from database to get master prompt
 */
async function getProjectMasterPrompt(projectId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/projects?id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch project ${projectId}, no master prompt available`);
      return '';
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn(`No project data found for ${projectId}, no master prompt available`);
      return '';
    }
    
    // Extract master prompt from project settings
    const projectData = result.data;
    const masterPrompt = projectData.settings?.imagePrompting?.masterPrompt;
    
    if (!masterPrompt?.trim()) {
      console.log(`No master prompt found for project ${projectId}`);
      return '';
    }
    
    console.log(`🎯 Using project master prompt for ${projectId}: "${masterPrompt.substring(0, 100)}..."`);
    return masterPrompt.trim();
  } catch (error) {
    console.error(`Error fetching project master prompt for ${projectId}:`, error);
    return '';
  }
}

interface GlobalSettings {
  guidance_scale?: number
  num_images?: number
  safety_tolerance?: string
  output_format?: string
  aspect_ratio?: string
}

interface RequestMetadata {
  user_agent?: string
  ip_address?: string
}

async function generateSingleKontextImage(
  imageRequest: BatchKontextRequest, 
  masterPrompt: string, 
  globalSettings: GlobalSettings,
  requestMetadata: RequestMetadata
) {
  // Kontext preserves source image style - don't use heavy master prompt
  const fullPrompt = imageRequest.prompt
  
  const input = {
    prompt: fullPrompt,
    image_url: imageRequest.image_url,
    guidance_scale: globalSettings.guidance_scale || 3.5,
    sync_mode: false,
    num_images: globalSettings.num_images || 1,
    safety_tolerance: globalSettings.safety_tolerance || "6",
    output_format: globalSettings.output_format || 'jpeg',
    aspect_ratio: globalSettings.aspect_ratio || '9:16'
  }
  
  console.log(`Generating kontext image for concept: ${imageRequest.concept}`)
  
  const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
    input,
    logs: false,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        console.log(`Kontext generation in progress for: ${imageRequest.concept}`)
      }
    }
  })

  return {
    concept: imageRequest.concept,
    filename: imageRequest.filename,
    result,
    input,
    requestMetadata
  }
}

function extractConceptFromPrompt(prompt: string): string {
  if (prompt.toLowerCase().includes('frame')) {
    const frameMatch = prompt.match(/frame\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i)
    if (frameMatch) {
      return `Animation Frame ${frameMatch[1]}`
    }
  }
  
  const keywords = ['zoom', 'lens', 'telescope', 'eye', 'space', 'portal', 'transform', 'enhance', 'battle', 'squad']
  for (const keyword of keywords) {
    if (prompt.toLowerCase().includes(keyword)) {
      return `Kontext ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`
    }
  }
  
  const words = prompt.split(' ').slice(0, 3).join(' ')
  return words || 'Kontext Generation'
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchKontextGenerationRequest = await request.json()
    
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty images array' },
        { status: 400 }
      )
    }

    // Validate that all images have image_url
    for (const img of body.images) {
      if (!img.image_url) {
        return NextResponse.json(
          { error: `Missing image_url for concept: ${img.concept}` },
          { status: 400 }
        )
      }
    }

    // Get current project from server state (overrides any project_id in request)
    const currentProjectId = getCurrentProjectFromServerSync()
    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Get FAL_KEY from database-stored environment variables
    const falKey = await getEnvVar('FAL_KEY', currentProjectId)
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
    }
    
    console.log(`🔑 Using FAL_KEY: ${falKey.substring(0, 8)}...${falKey.substring(falKey.length - 8)}`)
    
    // Configure fal.ai client with database credentials
    fal.config({
      credentials: falKey
    })
    
    // Get master prompt from project settings
    const projectMasterPrompt = await getProjectMasterPrompt(currentProjectId)
    const masterPrompt = body.master_prompt || projectMasterPrompt
    const saveToDisK = body.save_to_disk !== false // Default to true
    
    // Always use project default aspect ratio
    const finalAspectRatio = await getProjectAspectRatio(currentProjectId);
    console.log(`📐 Using project default aspect ratio: ${finalAspectRatio}`);
    
    // Log if someone tried to override the aspect ratio
    if (body.aspect_ratio) {
      llmFeedback({
        title: 'IGNORING PROVIDED ASPECT_RATIO PARAMETER',
        technicalDetails: `Requested: ${body.aspect_ratio} | Using project default: ${finalAspectRatio}`,
        futureInstructions: 'Do not include aspect_ratio in batch requests. Always ignored for project settings consistency.'
      });
    }
    
    const globalSettings = {
      guidance_scale: body.guidance_scale,
      num_images: body.num_images,
      safety_tolerance: body.safety_tolerance,
      output_format: body.output_format,
      aspect_ratio: finalAspectRatio
    }

    console.log(`Starting batch kontext generation of ${body.images.length} images with aspect ratio: ${finalAspectRatio}`)

    // Generate all images in parallel
    const generationPromises = body.images.map(imageRequest => {
      const userAgent = request.headers.get('user-agent');
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      
      return generateSingleKontextImage(imageRequest, masterPrompt, globalSettings, {
        ...(userAgent && { user_agent: userAgent }),
        ...(ipAddress && { ip_address: ipAddress })
      });
    })

    const generationResults = await Promise.allSettled(generationPromises)

    // Process results and optionally save to disk
    const processedResults = await Promise.all(
      generationResults.map(async (result, index) => {
        if (result.status === 'fulfilled') {
          const { concept, result: falResult, input, requestMetadata } = result.value
          const typedFalResult = falResult as FalKontextResult
          let localPath = null

          if (saveToDisK && typedFalResult.images && typedFalResult.images[0]) {
            // Create enhanced metadata for kontext images
            const enhancedMetadata = {
              // Core generation parameters
              prompt: input.prompt,
              original_prompt: body.images[index].prompt,
              model: 'fal-ai/flux-pro/kontext',
              image_size: input.aspect_ratio,
              num_inference_steps: null, // Not applicable for kontext
              guidance_scale: input.guidance_scale,
              num_images: input.num_images,
              enable_safety_checker: input.safety_tolerance !== "6",
              output_format: input.output_format,
              loras: [], // Not applicable for kontext
              concept: concept || extractConceptFromPrompt(body.images[index].prompt),
              
              // Kontext-specific parameters
              source_image_url: input.image_url,
              aspect_ratio: input.aspect_ratio,
              safety_tolerance: input.safety_tolerance,
              
              // Generation results
              seed: typedFalResult.seed,
              inference_time: typedFalResult.timings?.inference,
              has_nsfw_concepts: typedFalResult.has_nsfw_concepts,
              
              // Complete API response payload
              api_response: {
                ...typedFalResult,
                request_input: input,
                request_timestamp: new Date().toISOString(),
                model_used: 'fal-ai/flux-pro/kontext',
                batch_index: index
              },
              
              // Request metadata
              user_agent: requestMetadata.user_agent,
              ip_address: requestMetadata.ip_address,
              request_id: `kontext-batch-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
            }

            localPath = await saveImageWithMetadata(
              typedFalResult.images[0].url,
              enhancedMetadata,
              currentProjectId, // Use current project from server state
              index
            )
          }

          return {
            concept,
            status: 'success',
            image: {
              ...typedFalResult.images[0],
              fal_image_url: typedFalResult.images[0].url // Ensure Fal URL is included
            },
            local_path: localPath,
            source_image_url: input.image_url,
            generation_data: {
              seed: typedFalResult.seed,
              inference_time: typedFalResult.timings?.inference,
              has_nsfw_concepts: typedFalResult.has_nsfw_concepts
            }
          }
        } else {
          return {
            concept: body.images[index].concept,
            status: 'failed',
            error: result.reason?.message || 'Unknown error',
            image: null,
            local_path: null,
            source_image_url: body.images[index].image_url
          }
        }
      })
    )

    const successCount = processedResults.filter(r => r.status === 'success').length
    const failureCount = processedResults.filter(r => r.status === 'failed').length

    console.log(`Batch kontext generation completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      message: `Batch kontext generation completed: ${successCount}/${body.images.length} successful`,
      total_requested: body.images.length,
      successful: successCount,
      failed: failureCount,
      results: processedResults,
      saved_to_disk: saveToDisK,
      estimated_total_cost: `$${(body.images.length * 0.03).toFixed(2)}` // Rough estimate for kontext
    })

  } catch (error) {
    console.error('Error in batch kontext generation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate batch kontext images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 