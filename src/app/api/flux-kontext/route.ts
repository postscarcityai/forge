import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { llmFeedback } from '@/utils/llmFeedback'
import { getProvider, ImageGenerationRequest } from '@/lib/providers'
import { createImageSaveRequest } from '@/types/mediaSaver'
import { mediaSaverService } from '@/services/mediaSaver'
import { extractConceptFromPrompt } from '@/utils/mediaUtils'
import { toApiAspectRatio } from '@/config/aspectRatios'
import * as fal from '@fal-ai/serverless-client'
import fs from 'fs'
import path from 'path'

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

// Type definitions for fal API response (maintained for compatibility)
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
  // Additional fields that may come from the API
  prompt?: string
  model?: string
  config?: Record<string, unknown>
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

export async function POST(request: NextRequest) {
  try {
    // Get the Fal.ai provider from registry
    const falProvider = getProvider('fal')
    if (!falProvider) {
      return NextResponse.json({ error: 'Fal.ai provider not available' }, { status: 500 })
    }

    const body = await request.json()
    const {
      prompt,
      image_url,
      model = 'fal-ai/flux-pro/kontext',
      seed,
      guidance_scale = 3.5,
      sync_mode = false,
      num_images = 1,
      safety_tolerance = "6",
      output_format = 'jpeg',
      aspect_ratio, // Will be ignored - always use project default
      concept,
      save_to_disk = true
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required for kontext model' }, { status: 400 })
    }

    // Handle local file paths - upload to fal.ai storage
    let finalImageUrl = image_url
    if (image_url.startsWith('/images/') || image_url.startsWith('/videos/')) {
      console.log(`🔄 Detected local file path, uploading to fal.ai: ${image_url}`)
      finalImageUrl = await uploadLocalFileToFal(image_url)
    }

    // Get current project from server state
    const currentProjectId = getCurrentProjectFromServerSync()
    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Always use project default aspect ratio
    const finalAspectRatio = await getProjectAspectRatio(currentProjectId);
    console.log(`📐 Using project default aspect ratio: ${finalAspectRatio}`);
    
    // Log if someone tried to override the aspect ratio
    if (aspect_ratio) {
      llmFeedback({
        title: 'IGNORING PROVIDED ASPECT_RATIO PARAMETER',
        technicalDetails: `Requested: ${aspect_ratio} | Using project default: ${finalAspectRatio}`,
        futureInstructions: 'Do not include aspect_ratio in future API calls. It is always ignored in favor of project settings.'
      });
    }

    console.log('Generating image with kontext model:', { 
      concept: concept || 'Kontext Generation',
      aspect_ratio: finalAspectRatio,
      model 
    })

    // Create provider request
    const providerRequest: ImageGenerationRequest = {
      prompt,
      originalPrompt: prompt,
      model: 'flux-kontext',
      imageSize: finalAspectRatio,
      guidanceScale: guidance_scale,
      numImages: num_images,
      outputFormat: output_format,
      seed: seed,
      projectId: currentProjectId,
      saveToDisk: false, // We'll handle saving manually to maintain exact compatibility
      concept: concept || extractKontextConcept(prompt),
      // Flux-kontext specific parameters
      imageUrl: finalImageUrl, // Use uploaded URL if it was a local file
      safetyTolerance: safety_tolerance
    } as any

    // Generate image using provider
    const providerResult = await falProvider.generateImage!(providerRequest)
    
    if (!providerResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to generate kontext image', 
          details: providerResult.error 
        }, 
        { status: 500 }
      )
    }

    // Transform provider result to match original format exactly
    const result: FalApiResponse = {
      images: providerResult.data!.images.map(img => ({
        url: img.url,
        width: img.width,
        height: img.height
      })),
      seed: providerResult.data!.seed,
      timings: providerResult.data!.timings,
      has_nsfw_concepts: providerResult.data!.hasNsfwConcepts,
      prompt,
      model
    }

    // Handle saving using MediaSaverService (if requested) to maintain exact compatibility
    if (save_to_disk && result.images?.length > 0) {
      const savedResults = await Promise.all(
        result.images.map(async (image: FalImage, index: number) => {
          const conceptValue = concept || extractKontextConcept(prompt)
          const requestId = `flux-kontext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          const saveRequest = createImageSaveRequest(
            image.url,
            conceptValue,
            prompt,
            prompt,
            'fal',
            'flux-kontext',
            '/api/flux-kontext',
            requestId,
            currentProjectId,
            {
              model,
              image_size: finalAspectRatio,
              guidance_scale,
              sync_mode,
              num_images,
              safety_tolerance,
              output_format,
              aspect_ratio: finalAspectRatio,
              source_image_url: image_url
            },
            {
              seed: result.seed,
              inference_time: result.timings?.inference,
              has_nsfw_concepts: result.has_nsfw_concepts
            },
            providerResult.data!,
            {
              index,
              userAgent: request.headers.get('user-agent') || undefined,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
              providerSpecificData: {
                falImageUrl: image.url,
                source_image_url: image_url,
                source_image_uploaded_url: finalImageUrl, // The actual URL used by fal.ai
                aspect_ratio: finalAspectRatio,
                safety_tolerance
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
      
      result.images = savedResults
    }

    return NextResponse.json({
      ...result,
      message: save_to_disk ? 'Kontext image generated and saved successfully' : 'Kontext image generated successfully',
      saved_to_disk: save_to_disk,
      local_paths: result.images?.map((img: FalImage) => img.local_path).filter(Boolean) || []
    })
  } catch (error) {
    console.error('Error generating kontext image:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate kontext image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}

// extractConceptFromPrompt is now imported from @/utils/mediaUtils
// Keep kontext-specific concept extraction logic by using a local function
function extractKontextConcept(prompt: string): string {
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