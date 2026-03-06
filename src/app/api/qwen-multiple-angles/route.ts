import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { createImageSaveRequest } from '@/types/mediaSaver'
import { mediaSaverService } from '@/services/mediaSaver'
import * as fal from '@fal-ai/serverless-client'
import { getEnvVar } from '@/lib/envUtils'
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

interface FalImage {
  url: string
  width?: number
  height?: number
  content_type?: string
  file_name?: string
  file_size?: number
  local_path?: string
}

interface QwenMultipleAnglesResponse {
  images: FalImage[]
  seed?: number
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      image_urls,
      image_size,
      guidance_scale = 1,
      num_inference_steps = 6,
      acceleration = 'regular',
      negative_prompt = ' ',
      seed,
      sync_mode = false,
      enable_safety_checker = true,
      output_format = 'png',
      num_images = 1,
      rotate_right_left,
      move_forward,
      vertical_angle,
      wide_angle_lens = false,
      lora_scale = 1.25,
      concept,
      save_to_disk = true
    } = body

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json({ error: 'At least one image URL is required' }, { status: 400 })
    }

    // Validate output_format
    if (!['png', 'jpeg', 'webp'].includes(output_format)) {
      return NextResponse.json({ 
        error: 'Output format must be one of: png, jpeg, webp' 
      }, { status: 400 })
    }

    // Validate acceleration
    if (!['none', 'regular'].includes(acceleration)) {
      return NextResponse.json({ 
        error: 'Acceleration must be one of: none, regular' 
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
    
    // Configure fal.ai client with database credentials
    fal.config({
      credentials: falKey
    })

    // Handle local file paths - upload to fal.ai storage
    const processedImageUrls = await Promise.all(
      image_urls.map(async (url: string) => {
        if (url.startsWith('/images/') || url.startsWith('/videos/')) {
          console.log(`🔄 Detected local file path, uploading to fal.ai: ${url}`)
          return await uploadLocalFileToFal(url)
        }
        return url
      })
    )

    // Build input object with camera control parameters
    const input: Record<string, unknown> = {
      image_urls: processedImageUrls,
      guidance_scale,
      num_inference_steps,
      acceleration,
      negative_prompt,
      enable_safety_checker,
      output_format,
      num_images,
      wide_angle_lens,
      lora_scale
    }

    // Add optional camera control parameters if provided
    if (image_size !== undefined) {
      input.image_size = image_size
    }
    if (rotate_right_left !== undefined) {
      input.rotate_right_left = rotate_right_left
    }
    if (move_forward !== undefined) {
      input.move_forward = move_forward
    }
    if (vertical_angle !== undefined) {
      input.vertical_angle = vertical_angle
    }
    if (seed !== undefined) {
      input.seed = seed
    }
    if (sync_mode !== undefined) {
      input.sync_mode = sync_mode
    }

    console.log('Generating image with Qwen Multiple Angles:', {
      concept: concept || 'Qwen Camera Angle',
      num_images,
      output_format,
      rotate_right_left: rotate_right_left !== undefined ? rotate_right_left : 'default',
      move_forward: move_forward !== undefined ? move_forward : 'default',
      vertical_angle: vertical_angle !== undefined ? vertical_angle : 'default',
      wide_angle_lens
    })

    // Call fal.ai Qwen Multiple Angles API
    const result = await fal.subscribe('fal-ai/qwen-image-edit-plus-lora-gallery/multiple-angles', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('🔄 Qwen Multiple Angles generation in progress...')
          if (update.logs) {
            update.logs.map((log: { message: string }) => log.message).forEach(console.log)
          }
        }
      },
    }) as QwenMultipleAnglesResponse

    console.log('✅ Qwen Multiple Angles generation complete')

    // Transform to standard format, preserving dimensions from API response
    const response: QwenMultipleAnglesResponse = {
      images: (result.images || []).map((img: FalImage) => ({
        ...img,
        // Preserve width/height from API response if available
        width: img.width,
        height: img.height
      })),
      seed: result.seed,
      ...result
    }

    // Handle saving using MediaSaverService
    if (save_to_disk && response.images?.length > 0) {
      const savedResults = await Promise.all(
        response.images.map(async (image: FalImage, index: number) => {
          const conceptValue = concept || extractConcept(rotate_right_left, move_forward, vertical_angle)
          const requestId = `qwen-angles-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          const saveRequest = createImageSaveRequest(
            image.url,
            conceptValue,
            `Camera angle control: rotate=${rotate_right_left || 0}, forward=${move_forward || 0}, vertical=${vertical_angle || 0}`,
            `Camera angle control: rotate=${rotate_right_left || 0}, forward=${move_forward || 0}, vertical=${vertical_angle || 0}`,
            'fal',
            'qwen-multiple-angles',
            '/api/qwen-multiple-angles',
            requestId,
            currentProjectId,
            {
              image_size,
              guidance_scale,
              num_inference_steps,
              acceleration,
              negative_prompt,
              output_format,
              num_images,
              rotate_right_left,
              move_forward,
              vertical_angle,
              wide_angle_lens,
              lora_scale,
              source_image_urls: image_urls,
              processed_image_urls: processedImageUrls
            },
            {
              seed: response.seed
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
      message: save_to_disk ? 'Image generated and saved successfully' : 'Image generated successfully',
      saved_to_disk: save_to_disk,
      local_paths: response.images?.map((img: FalImage) => img.local_path).filter(Boolean) || []
    })
  } catch (error) {
    console.error('Error with Qwen Multiple Angles:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image with Qwen Multiple Angles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function extractConcept(rotate?: number, forward?: number, vertical?: number): string {
  const parts: string[] = []
  if (rotate !== undefined && rotate !== 0) {
    parts.push(rotate > 0 ? `rotate-left-${Math.abs(rotate)}` : `rotate-right-${Math.abs(rotate)}`)
  }
  if (forward !== undefined && forward !== 0) {
    parts.push(`forward-${forward}`)
  }
  if (vertical !== undefined && vertical !== 0) {
    if (vertical > 0) {
      parts.push('worms-eye')
    } else {
      parts.push('birds-eye')
    }
  }
  return parts.length > 0 ? parts.join('-') : 'Qwen Camera Angle'
}

