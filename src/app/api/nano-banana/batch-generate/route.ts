import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { createImageSaveRequest } from '@/types/mediaSaver'
import { mediaSaverService } from '@/services/mediaSaver'
import { extractConceptFromPrompt } from '@/utils/mediaUtils'
import * as fal from '@fal-ai/serverless-client'
import { getEnvVar } from '@/lib/envUtils'
import { toApiAspectRatio } from '@/config/aspectRatios'
import fs from 'fs'
import path from 'path'

const MAX_BATCH_SIZE = 10

/**
 * Fetch project aspect ratio setting from database and convert to API-compatible format
 */
async function getProjectAspectRatio(projectId: string): Promise<string> {
  try {
    const { databaseService } = await import('@/services/databaseService')
    if (!databaseService) {
      console.warn(`Database service not available for ${projectId}`)
      return '9:16'
    }
    const projectData = await databaseService.getProject(projectId)
    
    if (!projectData) {
      console.warn(`No project data found for ${projectId}, using default portrait orientation`)
      return '9:16'
    }
    
    // Extract orientation from project settings - now supports all aspect ratio formats
    const orientation = projectData.settings?.defaultImageOrientation || '9:16'
    
    // Convert to API-compatible aspect ratio using the centralized config
    return toApiAspectRatio(orientation)
  } catch (error) {
    console.error(`Error fetching project aspect ratio for ${projectId}:`, error)
    return '9:16'
  }
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
    
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    const filename = imageUrl.split('/').pop() || 'image.jpg'
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

interface FalImage {
  url: string
  width?: number
  height?: number
  content_type?: string
  local_path?: string
}

interface FalApiResponse {
  images: FalImage[]
  description?: string
  seed?: number
  timings?: {
    inference?: number
  }
  has_nsfw_concepts?: boolean[]
  prompt?: string
  model?: string
  [key: string]: unknown
}

interface BatchImageRequest {
  prompt: string
  image_urls?: string[]
  concept?: string
  aspect_ratio?: string
  resolution?: '1K' | '2K' | '4K'
  output_format?: 'jpeg' | 'png' | 'webp'
  num_images?: number
}

interface BatchGenerationRequest {
  images: BatchImageRequest[]
  save_to_disk?: boolean
  project_id?: string
}

interface RequestMetadata {
  user_agent?: string
  ip_address?: string
}

/**
 * Generate a single image with nano-banana-pro
 */
async function generateSingleImage(
  imageRequest: BatchImageRequest,
  projectAspectRatio: string,
  requestMetadata: RequestMetadata,
  currentProjectId: string,
  index: number
): Promise<{
  concept: string
  result: FalApiResponse
  input: Record<string, unknown>
  requestMetadata: RequestMetadata
  processedImageUrls: string[]
  originalImageUrls?: string[]
}> {
  const {
    prompt,
    image_urls,
    concept,
    aspect_ratio,
    resolution = '1K',
    output_format = 'png',
    num_images = 1
  } = imageRequest

  // Determine if this is text-to-image or image-to-image
  const isTextToImage = !image_urls || !Array.isArray(image_urls) || image_urls.length === 0
  
  let processedImageUrls: string[] = []
  let endpoint = 'fal-ai/nano-banana-2/edit'
  
  if (isTextToImage) {
    endpoint = 'fal-ai/nano-banana-2'
    console.log(`📸 [${index + 1}] Text-to-image generation:`, {
      concept: concept || extractConceptFromPrompt(prompt),
      resolution,
      output_format
    })
  } else {
    // Process image URLs for image-to-image
    // fal.ai accepts publicly accessible URLs directly, so we only upload local files
    processedImageUrls = await Promise.all(
      image_urls.map(async (url: string) => {
        if (url.startsWith('/images/') || url.startsWith('/videos/')) {
          console.log(`🔄 [${index + 1}] Uploading local file to fal.ai: ${url}`)
          return await uploadLocalFileToFal(url)
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
          // fal.ai can access publicly accessible URLs directly - no upload needed
          // This saves significant time (10-30+ seconds per image)
          console.log(`✅ [${index + 1}] Using external URL directly (no upload needed)`)
          return url
        }
        return url
      })
    )
    
    console.log(`🎨 [${index + 1}] Image-to-image edit:`, {
      concept: concept || extractConceptFromPrompt(prompt),
      source_images: image_urls.length,
      output_format
    })
  }

  // Determine final aspect ratio
  const finalAspectRatio = aspect_ratio || projectAspectRatio

  // Prepare input for nano-banana-pro
  const input: Record<string, unknown> = {
    prompt,
    num_images,
    output_format,
    resolution,
    sync_mode: false,
    limit_generations: true
  }
  
  // Only add image_urls for image-to-image editing
  if (!isTextToImage && processedImageUrls.length > 0) {
    input.image_urls = processedImageUrls
  }
  
  // Set aspect ratio
  if (finalAspectRatio && finalAspectRatio !== 'auto') {
    input.aspect_ratio = finalAspectRatio
  } else {
    input.aspect_ratio = 'auto'
  }

  console.log(`🚀 [${index + 1}] Calling Nano Banana 2 API:`, {
    endpoint,
    prompt_length: prompt.length,
    aspect_ratio: input.aspect_ratio
  })

  // Call fal.ai nano-banana-pro API
  const result = await fal.subscribe(endpoint, {
    input,
    logs: false
  }) as FalApiResponse

  console.log(`✅ [${index + 1}] Generation complete`)

  return {
    concept: concept || extractConceptFromPrompt(prompt),
    result,
    input,
    requestMetadata,
    processedImageUrls,
    originalImageUrls: image_urls
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchGenerationRequest = await request.json()
    const { images, save_to_disk = true, project_id } = body

    // Validate request
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Images array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (images.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} images can be generated in a single batch. You requested ${images.length}.` },
        { status: 400 }
      )
    }

    // Validate each image request
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (!img.prompt) {
        return NextResponse.json(
          { error: `Prompt is required for image ${i + 1}` },
          { status: 400 }
        )
      }
      
      if (img.resolution && !['0.5K', '1K', '2K', '4K'].includes(img.resolution)) {
        return NextResponse.json(
          { error: `Image ${i + 1}: Resolution must be one of: 0.5K, 1K, 2K, 4K` },
          { status: 400 }
        )
      }
      
      if (img.output_format && !['jpeg', 'png', 'webp'].includes(img.output_format)) {
        return NextResponse.json(
          { error: `Image ${i + 1}: Output format must be one of: jpeg, png, webp` },
          { status: 400 }
        )
      }
      
      const validAspectRatios = ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16']
      if (img.aspect_ratio && !validAspectRatios.includes(img.aspect_ratio)) {
        return NextResponse.json(
          { error: `Image ${i + 1}: Aspect ratio must be one of: ${validAspectRatios.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Get current project
    const serverProjectId = getCurrentProjectFromServerSync()
    const currentProjectId = project_id || serverProjectId
    
    console.log(`🎯 Nano Banana 2 Batch: ${images.length} images for project ${currentProjectId}`)

    // Get FAL_KEY from database-stored environment variables
    const falKey = await getEnvVar('FAL_KEY', currentProjectId)
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL_KEY not configured. Please set it in project settings.' },
        { status: 500 }
      )
    }
    
    console.log(`🔑 Using FAL_KEY: ${falKey.substring(0, 8)}...${falKey.substring(falKey.length - 8)}`)
    
    // Configure fal.ai client
    fal.config({
      credentials: falKey
    })

    // Get project aspect ratio
    const projectAspectRatio = await getProjectAspectRatio(currentProjectId)
    console.log(`📐 Project default aspect ratio: ${projectAspectRatio}`)

    // Prepare request metadata
    const requestMetadata: RequestMetadata = {
      user_agent: request.headers.get('user-agent') || undefined,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    }

    console.log(`🚀 Starting batch generation of ${images.length} images...`)

    // Generate all images in parallel
    const generationPromises = images.map((imageRequest, index) =>
      generateSingleImage(
        imageRequest,
        projectAspectRatio,
        requestMetadata,
        currentProjectId,
        index
      )
    )

    const generationResults = await Promise.allSettled(generationPromises)

    // Process results and save to disk
    const processedResults = await Promise.all(
      generationResults.map(async (result, index) => {
        if (result.status === 'fulfilled') {
          const {
            concept,
            result: falResult,
            input,
            requestMetadata: reqMeta,
            processedImageUrls,
            originalImageUrls
          } = result.value
          
          let localPaths: string[] = []

          // Save images to disk if requested
          if (save_to_disk && falResult.images && falResult.images.length > 0) {
            const savedResults = await Promise.all(
              falResult.images.map(async (image: FalImage, imgIndex: number) => {
                const requestId = `nano-banana-2-batch-${Date.now()}-${index}-${imgIndex}-${Math.random().toString(36).substr(2, 9)}`

                const saveRequest = createImageSaveRequest(
                  image.url,
                  concept,
                  input.prompt as string,
                  images[index].prompt,
                  'fal',
                  'nano-banana-2',
                  '/api/nano-banana/batch-generate',
                  requestId,
                  currentProjectId,
                  {
                    num_images: input.num_images,
                    output_format: input.output_format,
                    resolution: input.resolution,
                    aspect_ratio: input.aspect_ratio,
                    source_image_urls: originalImageUrls,
                    processed_image_urls: processedImageUrls,
                    batch_index: index,
                    image_index: imgIndex
                  },
                  {
                    seed: falResult.seed,
                    inference_time: falResult.timings?.inference,
                    has_nsfw_concepts: falResult.has_nsfw_concepts
                  },
                  falResult,
                  {
                    index: imgIndex,
                    userAgent: reqMeta.user_agent,
                    ipAddress: reqMeta.ip_address,
                    providerSpecificData: {
                      falImageUrl: image.url,
                      source_image_urls: originalImageUrls,
                      processed_image_urls: processedImageUrls
                    }
                  }
                )

                const saveResult = await mediaSaverService.saveMedia(saveRequest)

                if (saveResult.success) {
                  return saveResult.filePath
                } else {
                  console.warn(`⚠️ Failed to save image ${index}.${imgIndex}:`, saveResult.error)
                  return null
                }
              })
            )

            localPaths = savedResults.filter((p): p is string => p !== null)
          }

          return {
            concept,
            status: 'success' as const,
            images: falResult.images.map((img, imgIndex) => ({
              ...img,
              fal_image_url: img.url,
              local_path: localPaths[imgIndex] || null
            })),
            local_paths: localPaths,
            generation_data: {
              seed: falResult.seed,
              inference_time: falResult.timings?.inference,
              aspect_ratio: input.aspect_ratio,
              resolution: input.resolution
            }
          }
        } else {
          return {
            concept: images[index].concept || extractConceptFromPrompt(images[index].prompt),
            status: 'failed' as const,
            error: result.reason?.message || 'Unknown error',
            images: [],
            local_paths: []
          }
        }
      })
    )

    const successCount = processedResults.filter(r => r.status === 'success').length
    const failureCount = processedResults.filter(r => r.status === 'failed').length

    console.log(`🎉 Nano Banana 2 batch completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Batch generation completed: ${successCount}/${images.length} successful`,
      total_requested: images.length,
      successful: successCount,
      failed: failureCount,
      results: processedResults,
      saved_to_disk: save_to_disk,
      project_id: currentProjectId,
      estimated_total_cost: `$${(images.length * 0.15).toFixed(2)}`
    })

  } catch (error) {
    console.error('❌ Error in Nano Banana 2 batch generation:', error)
    
    let errorDetails = 'Unknown error'
    if (error instanceof Error) {
      errorDetails = error.message
      if ((error as any).response) {
        errorDetails += ` | Response: ${JSON.stringify((error as any).response)}`
      }
      if ((error as any).status) {
        errorDetails += ` | Status: ${(error as any).status}`
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process Nano Banana 2 batch generation',
        details: errorDetails
      },
      { status: 500 }
    )
  }
}



