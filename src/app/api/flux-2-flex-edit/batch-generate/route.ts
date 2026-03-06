import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { createImageSaveRequest } from '@/types/mediaSaver'
import { mediaSaverService } from '@/services/mediaSaver'
import { extractConceptFromPrompt } from '@/utils/mediaUtils'
import * as fal from '@fal-ai/serverless-client'
import fs from 'fs'
import path from 'path'
import { getEnvVar } from '@/lib/envUtils'

/**
 * Fetch project image orientation setting from database and convert to image_size format
 */
async function getProjectImageSize(projectId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/projects?id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch project ${projectId}, using default auto image size`);
      return 'auto';
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn(`No project data found for ${projectId}, using default auto image size`);
      return 'auto';
    }
    
    // Extract orientation from project settings
    const projectData = result.data;
    const orientation = projectData.settings?.defaultImageOrientation || 'portrait';
    
    // Convert project orientation to Flux 2 Flex image_size format
    switch (orientation) {
      case 'landscape':
        return 'landscape_16_9';
      case 'square':
        return 'square';
      case 'portrait':
      default:
        return 'portrait_16_9';
    }
  } catch (error) {
    console.error(`Error fetching project image orientation for ${projectId}:`, error);
    return 'auto';
  }
}

interface BatchFlexEditRequest {
  concept: string
  prompt: string
  image_urls: string[] // Array of image URLs for flux-2-flex-edit
  filename?: string
}

interface BatchFlexEditGenerationRequest {
  images: BatchFlexEditRequest[]
  save_to_disk?: boolean
  guidance_scale?: number
  num_inference_steps?: number
  enable_prompt_expansion?: boolean
  enable_safety_checker?: boolean
  output_format?: string
  sync_mode?: boolean
  image_size?: string // Will be ignored - always use project default
  project_id?: string
}

interface FalApiResponse {
  images: Array<{
    url: string
    width?: number
    height?: number
    content_type?: string
    file_name?: string
    file_size?: number
  }>
  seed?: number
  timings?: {
    inference?: number
  }
  has_nsfw_concepts?: boolean[]
  prompt?: string
}

/**
 * Upload local file to fal.ai storage
 */
async function uploadLocalFileToFal(localPath: string): Promise<string> {
  try {
    const cleanPath = localPath.startsWith('/') ? localPath.substring(1) : localPath
    const fullPath = path.join(process.cwd(), 'public', cleanPath)

    console.log(`📤 Uploading local file to fal.ai: ${fullPath}`)

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }

    const fileBuffer = fs.readFileSync(fullPath)
    const ext = path.extname(fullPath).toLowerCase()
    const contentType = ext === '.png' ? 'image/png' :
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.webp' ? 'image/webp' :
                       'application/octet-stream'

    const file = new File([fileBuffer], path.basename(fullPath), { type: contentType })
    const uploadedUrl = await fal.storage.upload(file)
    console.log(`✅ Uploaded to fal.ai: ${uploadedUrl}`)

    return uploadedUrl
  } catch (error) {
    console.error('❌ Failed to upload file to fal.ai:', error)
    throw error
  }
}

/**
 * Process image URLs - upload local files to fal.ai storage
 */
async function processImageUrls(imageUrls: string[]): Promise<string[]> {
  const processedUrls = await Promise.all(
    imageUrls.map(async (url) => {
      if (url.startsWith('/images/') || url.startsWith('/videos/')) {
        console.log(`🔄 Detected local file path, uploading to fal.ai: ${url}`)
        return await uploadLocalFileToFal(url)
      }
      return url
    })
  )
  return processedUrls
}

interface RequestMetadata {
  user_agent?: string
  ip_address?: string
}

async function generateSingleFlexEditImage(
  imageRequest: BatchFlexEditRequest,
  globalSettings: {
    image_size: string
    guidance_scale: number
    num_inference_steps: number
    enable_prompt_expansion: boolean
    enable_safety_checker: boolean
    output_format: string
    sync_mode: boolean
  },
  requestMetadata: RequestMetadata
) {
  // Process image URLs - upload local files to fal.ai storage
  const processedImageUrls = await processImageUrls(imageRequest.image_urls)
  
  const input: Record<string, unknown> = {
    prompt: imageRequest.prompt,
    image_urls: processedImageUrls,
    image_size: globalSettings.image_size,
    enable_prompt_expansion: globalSettings.enable_prompt_expansion,
    enable_safety_checker: globalSettings.enable_safety_checker,
    output_format: globalSettings.output_format,
    sync_mode: globalSettings.sync_mode,
    guidance_scale: globalSettings.guidance_scale,
    num_inference_steps: globalSettings.num_inference_steps
  }
  
  console.log(`Generating Flux 2 Flex Edit image for concept: ${imageRequest.concept}`)
  
  const result = await fal.subscribe('fal-ai/flux-2-flex/edit', {
    input,
    logs: false,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        console.log(`🔄 Flux 2 Flex Edit generation in progress for: ${imageRequest.concept}`)
      }
    }
  }) as FalApiResponse

  return {
    concept: imageRequest.concept,
    filename: imageRequest.filename,
    result,
    input,
    processedImageUrls,
    requestMetadata
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchFlexEditGenerationRequest = await request.json()
    
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty images array' },
        { status: 400 }
      )
    }

    // Validate that all images have image_urls array
    for (const img of body.images) {
      if (!img.image_urls || !Array.isArray(img.image_urls) || img.image_urls.length === 0) {
        return NextResponse.json(
          { error: `Missing or empty image_urls array for concept: ${img.concept}` },
          { status: 400 }
        )
      }
    }

    // Get current project from server state
    const currentProjectId = getCurrentProjectFromServerSync()
    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Get FAL_KEY from database-stored environment variables
    const falKey = await getEnvVar('FAL_KEY', currentProjectId)
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL_KEY not configured. Please set it in project settings.' },
        { status: 500 }
      )
    }
    
    fal.config({ credentials: falKey })

    // Always use project default image size
    const finalImageSize = await getProjectImageSize(currentProjectId)
    console.log(`📐 Using project default image size: ${finalImageSize}`)
    
    // Log if someone tried to override the image size
    if (body.image_size && body.image_size !== finalImageSize && body.image_size !== 'auto') {
      console.warn(`⚠️ IGNORING provided image_size parameter: "${body.image_size}" - using project setting: "${finalImageSize}"`)
    }
    
    const saveToDisk = body.save_to_disk !== false // Default to true
    
    const globalSettings = {
      image_size: finalImageSize,
      guidance_scale: body.guidance_scale || 3.5,
      num_inference_steps: body.num_inference_steps || 28,
      enable_prompt_expansion: body.enable_prompt_expansion !== undefined ? body.enable_prompt_expansion : false,
      enable_safety_checker: body.enable_safety_checker !== false,
      output_format: body.output_format || 'jpeg',
      sync_mode: body.sync_mode || false
    }

    console.log(`🚀 Starting batch Flux 2 Flex Edit generation: ${body.images.length} images`)

    // Generate all images in parallel
    const generationPromises = body.images.map(imageRequest => {
      const userAgent = request.headers.get('user-agent')
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      
      return generateSingleFlexEditImage(imageRequest, globalSettings, {
        ...(userAgent && { user_agent: userAgent }),
        ...(ipAddress && { ip_address: ipAddress })
      })
    })

    const generationResults = await Promise.allSettled(generationPromises)

    // Process results and optionally save to disk
    const processedResults = await Promise.all(
      generationResults.map(async (result, index) => {
        if (result.status === 'fulfilled') {
          const { concept, result: falResult, input, processedImageUrls, requestMetadata } = result.value
          const typedFalResult = falResult as FalApiResponse
          let localPath = null

          if (saveToDisk && typedFalResult.images && typedFalResult.images[0]) {
            const conceptValue = concept || extractConceptFromPrompt(body.images[index].prompt)
            const requestId = `flux-2-flex-edit-batch-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
            
            const saveRequest = createImageSaveRequest(
              typedFalResult.images[0].url,
              conceptValue,
              body.images[index].prompt,
              body.images[index].prompt,
              'fal',
              'flux-2-flex-edit',
              '/api/flux-2-flex-edit/batch-generate',
              requestId,
              currentProjectId,
              {
                image_size: globalSettings.image_size,
                enable_prompt_expansion: globalSettings.enable_prompt_expansion,
                guidance_scale: globalSettings.guidance_scale,
                num_inference_steps: globalSettings.num_inference_steps,
                enable_safety_checker: globalSettings.enable_safety_checker,
                output_format: globalSettings.output_format,
                sync_mode: globalSettings.sync_mode,
                source_image_urls: body.images[index].image_urls,
                processed_image_urls: processedImageUrls
              },
              {
                seed: typedFalResult.seed,
                inference_time: typedFalResult.timings?.inference,
                has_nsfw_concepts: typedFalResult.has_nsfw_concepts
              },
              typedFalResult,
              {
                index,
                userAgent: requestMetadata.user_agent,
                ipAddress: requestMetadata.ip_address,
                providerSpecificData: {
                  falImageUrl: typedFalResult.images[0].url,
                  source_image_urls: body.images[index].image_urls,
                  processed_image_urls: processedImageUrls,
                  image_size: globalSettings.image_size,
                  enable_prompt_expansion: globalSettings.enable_prompt_expansion,
                  guidance_scale: globalSettings.guidance_scale,
                  num_inference_steps: globalSettings.num_inference_steps
                }
              }
            )
            
            const saveResult = await mediaSaverService.saveMedia(saveRequest)
            
            if (saveResult.success) {
              localPath = saveResult.filePath
            } else {
              console.warn(`⚠️ Failed to save image ${index}:`, saveResult.error)
            }
          }

          return {
            concept,
            status: 'success',
            image: {
              ...typedFalResult.images[0],
              fal_image_url: typedFalResult.images[0].url
            },
            local_path: localPath,
            source_image_urls: body.images[index].image_urls,
            processed_image_urls: processedImageUrls,
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
            source_image_urls: body.images[index].image_urls
          }
        }
      })
    )

    const successCount = processedResults.filter(r => r.status === 'success').length
    const failureCount = processedResults.filter(r => r.status === 'failed').length

    console.log(`🎯 Batch Flux 2 Flex Edit generation completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      message: `Batch Flux 2 Flex Edit generation completed: ${successCount}/${body.images.length} successful`,
      total_requested: body.images.length,
      successful: successCount,
      failed: failureCount,
      results: processedResults,
      saved_to_disk: saveToDisk,
      image_size: finalImageSize
    })

  } catch (error) {
    console.error('Error in batch Flux 2 Flex Edit generation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate batch Flux 2 Flex Edit images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}




