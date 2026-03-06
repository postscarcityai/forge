import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { saveImageWithMetadata } from '@/utils/fal-image-generator'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'

// Type definitions for Ideogram Upscale API response
interface FalImage {
  url: string
  width?: number
  height?: number
  content_type?: string
  file_name?: string
  file_size?: number
  local_path?: string
}

interface IdeogramUpscaleResult {
  images: FalImage[]
  seed: number
}

export async function POST(request: NextRequest) {
  try {
    // Configure fal client with database-stored credentials
    const falKey = await getEnvVar('FAL_KEY')
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
    }
    
    fal.config({
      credentials: falKey,
    })

    const body = await request.json()
    const { 
      image_url,
      prompt = "",
      resemblance = 50,
      detail = 50,
      expand_prompt = false,
      seed,
      sync_mode = false,
      save_to_disk = true
    } = body

    // Validate required parameters
    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Validate resemblance and detail values (0-100)
    if (resemblance < 0 || resemblance > 100) {
      return NextResponse.json({ error: 'Resemblance must be between 0 and 100' }, { status: 400 })
    }
    if (detail < 0 || detail > 100) {
      return NextResponse.json({ error: 'Detail must be between 0 and 100' }, { status: 400 })
    }

    // Get current project
    const currentProjectId = getCurrentProjectFromServerSync()

    // Prepare the input for fal.ai API
    const input = {
      image_url,
      prompt,
      resemblance,
      detail,
      expand_prompt,
      sync_mode,
      ...(seed && { seed })
    }

    console.log('Upscaling image with Ideogram:', { 
      image: image_url.substring(image_url.lastIndexOf('/') + 1),
      prompt: prompt || 'no prompt',
      resemblance,
      detail,
      expand_prompt
    })

    const result = await fal.subscribe('fal-ai/ideogram/upscale', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Ideogram upscaling in progress...')
          update.logs.map((log) => log.message).forEach(console.log)
        }
      }
    }) as IdeogramUpscaleResult

    let localPaths: string[] = []
    let savedImages: FalImage[] = []

    if (save_to_disk && result.images?.length > 0) {
      const userAgent = request.headers.get('user-agent')
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      
      // Save each upscaled image
      const savedResults = await Promise.all(
        result.images.map(async (image: FalImage, index: number) => {
          const generationParams = {
            // Core generation parameters (adapted for upscaling)
            prompt: prompt || `Ideogram upscale 2x - ${resemblance}% resemblance, ${detail}% detail`,
            original_prompt: prompt || `Ideogram upscale 2x - ${resemblance}% resemblance, ${detail}% detail`,
            model: 'fal-ai/ideogram/upscale',
            image_size: 'upscaled_2x', // Indicating 2x upscaling
            num_inference_steps: null, // Not applicable for upscaling
            guidance_scale: 0, // Not applicable for upscaling
            num_images: result.images.length,
            enable_safety_checker: false, // Not applicable for upscaling
            output_format: 'png',
            loras: [], // Not applicable for upscaling
            concept: 'ideogram-upscale',
            
            // Ideogram-specific parameters
            source_image_url: input.image_url,
            resemblance: input.resemblance,
            detail: input.detail,
            expand_prompt: input.expand_prompt,
            
            // Generation results
            seed: result.seed,
            inference_time: undefined, // Ideogram doesn't return timing info
            has_nsfw_concepts: [false], // Not applicable for upscaling
            
            // Complete API response payload
            api_response: {
              ...result,
              request_input: input,
              request_timestamp: new Date().toISOString(),
              model_used: 'fal-ai/ideogram/upscale'
            },
            
            // Request metadata
            user_agent: userAgent || undefined,
            ip_address: ipAddress || undefined,
            request_id: `ideogram-upscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
          
          const savedImagePath = await saveImageWithMetadata(
            image.url,
            generationParams,
            currentProjectId,
            index
          )
          
          return {
            ...image,
            local_path: savedImagePath
          }
        })
      )
      
      savedImages = savedResults
      localPaths = savedResults.map(img => img.local_path!).filter(Boolean)
    }

    const response = {
      images: save_to_disk && savedImages.length > 0 ? savedImages : result.images,
      seed: result.seed,
      message: save_to_disk ? 'Images upscaled with Ideogram and saved successfully' : 'Images upscaled with Ideogram successfully',
      saved_to_disk: save_to_disk,
      local_paths: localPaths,
      generation_data: {
        model_used: 'fal-ai/ideogram/upscale',
        input_parameters: {
          prompt: input.prompt || 'no prompt',
          resemblance: input.resemblance,
          detail: input.detail,
          expand_prompt: input.expand_prompt
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error upscaling image with Ideogram:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upscale image with Ideogram',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 