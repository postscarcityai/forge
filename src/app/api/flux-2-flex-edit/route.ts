import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getProvider, ImageGenerationRequest } from '@/lib/providers'
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

// Type definitions for fal API response
interface FalImage {
  url: string
  width?: number
  height?: number
  content_type?: string
  local_path?: string
}

interface FalApiResponse {
  images: FalImage[]
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

export async function POST(request: NextRequest) {
  try {
    // Get current project from server state
    const currentProjectId = getCurrentProjectFromServerSync()
    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Configure fal.ai client with database-stored credentials
    const falKey = await getEnvVar('FAL_KEY', currentProjectId)
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL_KEY not configured. Please set it in project settings.' },
        { status: 500 }
      )
    }
    
    fal.config({ credentials: falKey })

    const body = await request.json()
    const {
      prompt,
      image_urls, // Required: array of image URLs
      image_size, // Will be ignored - always use project default or auto
      enable_prompt_expansion = false,
      seed,
      enable_safety_checker = true,
      output_format = 'jpeg',
      sync_mode = false,
      guidance_scale = 3.5,
      num_inference_steps = 28,
      concept,
      save_to_disk = true
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json(
        { error: 'image_urls array is required and must contain at least one image URL' },
        { status: 400 }
      )
    }

    // Process image URLs - upload local files to fal.ai storage
    const processedImageUrls = await processImageUrls(image_urls)
    
    // Always use project default image size or auto
    const finalImageSize = await getProjectImageSize(currentProjectId)
    console.log(`📐 Using project default image size: ${finalImageSize}`)
    
    // Log if someone tried to override the image size
    if (image_size && image_size !== finalImageSize && image_size !== 'auto') {
      console.warn(`⚠️ IGNORING provided image_size parameter: "${image_size}" - using project setting: "${finalImageSize}"`)
    }

    console.log('Generating edited image with Flux 2 Flex:', { 
      concept: concept || 'Flux 2 Flex Edit',
      image_size: finalImageSize,
      num_images: processedImageUrls.length
    })

    // Prepare input for fal.ai API
    const input: Record<string, unknown> = {
      prompt,
      image_urls: processedImageUrls,
      image_size: finalImageSize,
      enable_prompt_expansion,
      enable_safety_checker,
      output_format,
      sync_mode,
      guidance_scale,
      num_inference_steps
    }

    if (seed !== undefined) {
      input.seed = seed
    }

    // Call Fal.ai API
    const result = await fal.subscribe('fal-ai/flux-2-flex/edit', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`🔄 Flux 2 Flex Edit generation in progress...`)
          update.logs.map((log) => log.message).forEach(console.log)
        }
      }
    }) as FalApiResponse

    // Transform result to match expected format
    const transformedResult: FalApiResponse = {
      images: result.images || [],
      seed: result.seed,
      timings: result.timings,
      has_nsfw_concepts: result.has_nsfw_concepts,
      prompt
    }

    // Handle saving using MediaSaverService (if requested)
    if (save_to_disk && transformedResult.images?.length > 0) {
      const savedResults = await Promise.all(
        transformedResult.images.map(async (image: FalImage, index: number) => {
          const conceptValue = concept || extractConceptFromPrompt(prompt)
          const requestId = `flux-2-flex-edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          const saveRequest = createImageSaveRequest(
            image.url,
            conceptValue,
            prompt,
            prompt,
            'fal',
            'flux-2-flex-edit',
            '/api/flux-2-flex-edit',
            requestId,
            currentProjectId,
            {
              image_size: finalImageSize,
              enable_prompt_expansion,
              guidance_scale,
              num_inference_steps,
              enable_safety_checker,
              output_format,
              sync_mode,
              source_image_urls: image_urls,
              processed_image_urls: processedImageUrls
            },
            {
              seed: transformedResult.seed,
              inference_time: transformedResult.timings?.inference,
              has_nsfw_concepts: transformedResult.has_nsfw_concepts
            },
            result,
            {
              index,
              userAgent: request.headers.get('user-agent') || undefined,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
              providerSpecificData: {
                falImageUrl: image.url,
                source_image_urls: image_urls,
                processed_image_urls: processedImageUrls,
                image_size: finalImageSize,
                enable_prompt_expansion,
                guidance_scale,
                num_inference_steps
              }
            }
          )
          
          const saveResult = await mediaSaverService.saveMedia(saveRequest)
          
          if (saveResult.success) {
            return {
              ...image,
              local_path: saveResult.filePath
            }
          } else {
            console.warn(`⚠️ Failed to save image ${index}:`, saveResult.error)
            return image
          }
        })
      )
      
      transformedResult.images = savedResults
    }

    return NextResponse.json({
      ...transformedResult,
      message: save_to_disk ? 'Flux 2 Flex Edit image generated and saved successfully' : 'Flux 2 Flex Edit image generated successfully',
      saved_to_disk: save_to_disk,
      local_paths: transformedResult.images?.map((img: FalImage) => img.local_path).filter(Boolean) || []
    })
  } catch (error) {
    console.error('Error generating Flux 2 Flex Edit image:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate Flux 2 Flex Edit image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}




