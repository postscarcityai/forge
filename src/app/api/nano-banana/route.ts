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

/**
 * Fetch project aspect ratio setting from database and convert to API-compatible format
 */
async function getProjectAspectRatio(projectId: string): Promise<string> {
  try {
    // Use direct database access instead of HTTP fetch
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
    console.log(`📤 Downloading image from URL: ${imageUrl}`)
    
    // Download image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Create a File object for fal.ai
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prompt,
      image_urls,
      num_images = 1,
      output_format = 'png',
      aspect_ratio,
      resolution = '1K',
      sync_mode = false,
      concept,
      save_to_disk = true
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Determine if this is text-to-image or image-to-image
    const isTextToImage = !image_urls || !Array.isArray(image_urls) || image_urls.length === 0

    // Validate resolution for nano-banana-pro
    if (!['0.5K', '1K', '2K', '4K'].includes(resolution)) {
      return NextResponse.json({ 
        error: 'Resolution must be one of: 0.5K, 1K, 2K, 4K' 
      }, { status: 400 })
    }

    // Validate output_format
    if (!['jpeg', 'png', 'webp'].includes(output_format)) {
      return NextResponse.json({ 
        error: 'Output format must be one of: jpeg, png, webp' 
      }, { status: 400 })
    }

    // Validate aspect_ratio if provided
    const validAspectRatios = ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16']
    if (aspect_ratio && !validAspectRatios.includes(aspect_ratio)) {
      return NextResponse.json({ 
        error: `Aspect ratio must be one of: ${validAspectRatios.join(', ')}` 
      }, { status: 400 })
    }

    // Get current project from server state
    const currentProjectId = getCurrentProjectFromServerSync()
    
    // Get FAL_KEY from database-stored environment variables
    const falKey = await getEnvVar('FAL_KEY', currentProjectId)
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
    }
    
    console.log(`🎯 Using current project: ${currentProjectId}`)
    console.log(`🔑 Using FAL_KEY: ${falKey.substring(0, 8)}...${falKey.substring(falKey.length - 8)}`)
    
    // Get project's aspect ratio setting
    const projectAspectRatio = await getProjectAspectRatio(currentProjectId)
    const finalAspectRatio = aspect_ratio || projectAspectRatio
    console.log(`📐 Using aspect ratio: ${finalAspectRatio} (project default: ${projectAspectRatio})`)
    
    // Configure fal.ai client with database credentials
    fal.config({
      credentials: falKey
    })

    let processedImageUrls: string[] = []
    let endpoint = 'fal-ai/nano-banana-2/edit'
    
    if (isTextToImage) {
      endpoint = 'fal-ai/nano-banana-2'
      console.log('Generating text-to-image with nano-banana-2:', {
        concept: concept || 'Nano Banana 2 Generation',
        num_images,
        output_format,
        resolution
      })
    } else {
      // Image-to-image editing - handle local file paths and external URLs
      // fal.ai accepts publicly accessible URLs directly, so we only upload local files
      processedImageUrls = await Promise.all(
        image_urls.map(async (url: string) => {
          if (url.startsWith('/images/') || url.startsWith('/videos/')) {
            console.log(`🔄 Detected local file path, uploading to fal.ai: ${url}`)
            return await uploadLocalFileToFal(url)
          } else if (url.startsWith('http://') || url.startsWith('https://')) {
            // fal.ai can access publicly accessible URLs directly - no upload needed
            // This saves significant time (10-30+ seconds per image)
            console.log(`✅ Using external URL directly (no upload needed): ${url.substring(0, 50)}...`)
            return url
          }
          return url
        })
      )
      
      console.log('Generating image edit with nano-banana-2:', {
        concept: concept || 'Nano Banana 2 Edit',
        num_images,
        output_format
      })
    }

    // Prepare input for nano-banana-pro
    const input: Record<string, unknown> = {
      prompt,
      num_images,
      output_format,
      resolution,
      sync_mode,
      limit_generations: true
    }
    
    // Only add image_urls for image-to-image editing
    if (!isTextToImage && processedImageUrls.length > 0) {
      input.image_urls = processedImageUrls
    }
    
    // Only add aspect_ratio if it's explicitly provided and not 'auto'
    if (finalAspectRatio && finalAspectRatio !== 'auto') {
      input.aspect_ratio = finalAspectRatio
    } else {
      // Default to 'auto' if not set
      input.aspect_ratio = 'auto'
    }

    console.log('📤 Nano Banana 2 API input:', {
      prompt_length: prompt.length,
      num_images,
      output_format,
      image_count: processedImageUrls.length,
      aspect_ratio: input.aspect_ratio || 'auto (default)'
    })

    // Call fal.ai nano-banana-2 API (text-to-image or edit)
    const result = await fal.subscribe(endpoint, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('🔄 Nano Banana 2 generation in progress...')
          if (update.logs) {
            update.logs.map((log: { message: string }) => log.message).forEach(console.log)
          }
        }
      },
    }) as FalApiResponse

    console.log('✅ Nano Banana 2 generation complete')

    // Transform to standard format
    const response: FalApiResponse = {
      images: result.images || [],
      description: result.description || '',
      seed: result.seed,
      timings: result.timings,
      has_nsfw_concepts: result.has_nsfw_concepts,
      prompt,
      model: 'nano-banana-2'
    }

    // Handle saving using MediaSaverService
    if (save_to_disk && response.images?.length > 0) {
      const savedResults = await Promise.all(
        response.images.map(async (image: FalImage, index: number) => {
          const conceptValue = concept || extractConceptFromPrompt(prompt)
          const requestId = `nano-banana-2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          const saveRequest = createImageSaveRequest(
            image.url,
            conceptValue,
            prompt,
            prompt,
            'fal',
                    'nano-banana-2',
                    '/api/nano-banana',
            requestId,
            currentProjectId,
            {
              num_images,
              output_format,
              aspect_ratio: finalAspectRatio,
              source_image_urls: image_urls,
              processed_image_urls: processedImageUrls
            },
            {
              seed: response.seed,
              inference_time: response.timings?.inference,
              has_nsfw_concepts: response.has_nsfw_concepts
            },
            result,
            {
              index,
              userAgent: request.headers.get('user-agent') || undefined,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
              providerSpecificData: {
                falImageUrl: image.url,
                source_image_urls: image_urls,
                processed_image_urls: processedImageUrls
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

      response.images = savedResults
    }

    return NextResponse.json({
      ...response,
      message: save_to_disk ? 'Image edited and saved successfully' : 'Image edited successfully',
      saved_to_disk: save_to_disk,
      local_paths: response.images?.map((img: FalImage) => img.local_path).filter(Boolean) || []
    })
  } catch (error) {
    console.error('❌ Error with nano-banana:', error)
    
    // Try to extract more details from the error
    let errorDetails = 'Unknown error'
    if (error instanceof Error) {
      errorDetails = error.message
      // Check if error has additional properties
      if ((error as any).response) {
        console.error('API Response error:', (error as any).response)
        errorDetails += ` | Response: ${JSON.stringify((error as any).response)}`
      }
      if ((error as any).status) {
        console.error('API Status:', (error as any).status)
        errorDetails += ` | Status: ${(error as any).status}`
      }
    }
    
    return NextResponse.json(
      {
        error: 'Failed to generate image with nano-banana-2',
        details: errorDetails
      },
      { status: 500 }
    )
  }
}
