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

interface ReveEditResponse {
  images: FalImage[]
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prompt,
      image_url,
      num_images = 1,
      output_format = 'png',
      sync_mode = false,
      concept,
      save_to_disk = true
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Validate output_format
    if (!['png', 'jpeg', 'webp'].includes(output_format)) {
      return NextResponse.json({ 
        error: 'Output format must be one of: png, jpeg, webp' 
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
    let processedImageUrl = image_url
    if (image_url.startsWith('/images/') || image_url.startsWith('/videos/')) {
      console.log(`🔄 Detected local file path, uploading to fal.ai: ${image_url}`)
      processedImageUrl = await uploadLocalFileToFal(image_url)
    }

    console.log('Generating image edit with Reve:', {
      concept: concept || 'Reve Edit',
      num_images,
      output_format
    })

    // Call fal.ai Reve Edit API
    // Note: Reve Edit uses 'image_url' (singular) not 'image_urls' (plural)
    const result = await fal.subscribe('fal-ai/reve/edit', {
      input: {
        prompt,
        image_url: processedImageUrl,
        num_images,
        output_format,
        sync_mode
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('🔄 Reve Edit generation in progress...')
          if (update.logs) {
            update.logs.map((log: { message: string }) => log.message).forEach(console.log)
          }
        }
      },
    }) as ReveEditResponse

    console.log('✅ Reve Edit generation complete')

    // Transform to standard format
    const response: ReveEditResponse = {
      images: result.images || [],
      ...result
    }

    // Handle saving using MediaSaverService
    if (save_to_disk && response.images?.length > 0) {
      const savedResults = await Promise.all(
        response.images.map(async (image: FalImage, index: number) => {
          const conceptValue = concept || extractConcept(prompt)
          const requestId = `reve-edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          const saveRequest = createImageSaveRequest(
            image.url,
            conceptValue,
            prompt,
            prompt,
            'fal',
            'reve-edit',
            '/api/reve-edit',
            requestId,
            currentProjectId,
            {
              num_images,
              output_format,
              source_image_url: image_url,
              processed_image_url: processedImageUrl
            },
            {},
            result,
            {
              index,
              userAgent: request.headers.get('user-agent') || undefined,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
              providerSpecificData: {
                falImageUrl: image.url,
                source_image_url: image_url,
                processed_image_url: processedImageUrl
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
    console.error('Error with Reve Edit:', error)
    return NextResponse.json(
      {
        error: 'Failed to edit image with Reve',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function extractConcept(prompt: string): string {
  const words = prompt.split(' ').slice(0, 3).join(' ')
  return words || 'Reve Edit'
}

