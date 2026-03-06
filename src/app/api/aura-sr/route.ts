import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { saveImageWithMetadata } from '@/utils/fal-image-generator'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { getEnvVar } from '@/lib/envUtils'

// Type definitions for AuraSR API response
interface FalImage {
  url: string
  width?: number
  height?: number
  content_type?: string
  file_name?: string
  file_size?: number
  local_path?: string
}

interface AuraSRResult {
  image: FalImage
  timings: {
    inference?: number
  }
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
      upscaling_factor = 4,
      overlapping_tiles = false,
      checkpoint = "v1",
      save_to_disk = true
    } = body

    // Validate required parameters
    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Validate upscaling factor (currently only 4 is supported per API docs)
    if (upscaling_factor !== 4) {
      return NextResponse.json({ error: 'Only upscaling factor of 4 is currently supported' }, { status: 400 })
    }

    // Validate checkpoint
    if (!['v1', 'v2'].includes(checkpoint)) {
      return NextResponse.json({ error: 'Checkpoint must be v1 or v2' }, { status: 400 })
    }

    // Get current project
    const currentProjectId = getCurrentProjectFromServerSync()

    // Prepare the input for fal.ai API
    const input = {
      image_url,
      upscaling_factor,
      overlapping_tiles,
      checkpoint
    }

    console.log('Upscaling image with AuraSR:', { 
      image: image_url.substring(image_url.lastIndexOf('/') + 1),
      upscaling_factor,
      overlapping_tiles,
      checkpoint
    })

    const result = await fal.subscribe('fal-ai/aura-sr', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('AuraSR upscaling in progress...')
          update.logs.map((log) => log.message).forEach(console.log)
        }
      }
    }) as AuraSRResult

    let localPath: string | null = null
    let savedImages: FalImage[] = []

    if (save_to_disk && result.image?.url) {
      const userAgent = request.headers.get('user-agent')
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      
      const generationParams = {
        // Core generation parameters (adapted for upscaling)
        prompt: `Upscale image with AuraSR ${upscaling_factor}x`,
        original_prompt: `Upscale image with AuraSR ${upscaling_factor}x`,
        model: 'fal-ai/aura-sr',
        image_size: 'upscaled_4x', // Indicating 4x upscaling
        num_inference_steps: null, // Not applicable for upscaling
        guidance_scale: 0, // Not applicable for upscaling
        num_images: 1,
        enable_safety_checker: false, // Not applicable for upscaling
        output_format: 'png',
        loras: [], // Not applicable for upscaling
        concept: 'aura-sr-upscale',
        
        // AuraSR-specific parameters
        source_image_url: input.image_url,
        upscaling_factor: input.upscaling_factor,
        overlapping_tiles: input.overlapping_tiles,
        checkpoint: input.checkpoint,
        
        // Generation results
        seed: result.image.file_size, // Using file size as identifier since no seed returned
        inference_time: result.timings?.inference,
        has_nsfw_concepts: [false], // Not applicable for upscaling
        
        // Complete API response payload
        api_response: {
          ...result,
          request_input: input,
          request_timestamp: new Date().toISOString(),
          model_used: 'fal-ai/aura-sr'
        },
        
        // Request metadata
        user_agent: userAgent || undefined,
        ip_address: ipAddress || undefined,
        request_id: `aura-sr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      // Save the upscaled image
      const savedImagePath = await saveImageWithMetadata(
        result.image.url,
        generationParams,
        currentProjectId
      )
      
      const savedImage: FalImage = {
        ...result.image,
        local_path: savedImagePath
      }
      
      savedImages = [savedImage]
      localPath = savedImagePath
    }

    const response = {
      image: save_to_disk && savedImages.length > 0 ? savedImages[0] : result.image,
      timings: result.timings,
      message: save_to_disk ? 'Image upscaled with AuraSR and saved successfully' : 'Image upscaled with AuraSR successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      generation_data: {
        model_used: 'fal-ai/aura-sr',
        input_parameters: {
          upscaling_factor: input.upscaling_factor,
          overlapping_tiles: input.overlapping_tiles,
          checkpoint: input.checkpoint
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error upscaling image with AuraSR:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upscale image with AuraSR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 