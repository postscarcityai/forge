import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { saveImageWithMetadata } from '@/utils/fal-image-generator'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { llmFeedback } from '@/utils/llmFeedback'

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY
})

// Type definitions for Ideogram API response
interface IdeogramImage {
  url: string
  width?: number
  height?: number
  content_type?: string
  local_path?: string
}

interface IdeogramResult {
  images: IdeogramImage[]
  seed: number
}

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

/**
 * Fetch project data from database to get image size
 */
async function getProjectImageSize(projectId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/projects?id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch project ${projectId}, using default image size`);
      return '1:1';
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn(`No project data found for ${projectId}, using default image size`);
      return '1:1';
    }
    
    // Extract image size from project settings  
    const projectData = result.data;
    const imageSize = projectData.settings?.imagePrompting?.imageSize;
    
    if (!imageSize?.trim()) {
      console.log(`No image size found for project ${projectId}, using default`);
      return '1:1';
    }
    
    console.log(`🖼️ Using project image size for ${projectId}: ${imageSize}`);
    return imageSize.trim();
  } catch (error) {
    console.error(`Error fetching project image size for ${projectId}:`, error);
    return '1:1';
  }
}

function extractConceptFromPrompt(prompt: string): string {
  // Extract a concept from the prompt for naming/categorization
  const words = prompt.toLowerCase().split(' ')
  const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'over', 'under']
  const meaningfulWords = words.filter(word => word.length > 2 && !stopWords.includes(word))
  return meaningfulWords.slice(0, 3).join('-') || 'generated'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { images, save_to_disk = true } = body

    // Validate request body
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        error: 'Images array is required and must not be empty' 
      }, { status: 400 })
    }

    if (images.length > 20) {
      return NextResponse.json({ 
        error: 'Maximum 20 images can be generated in a single batch' 
      }, { status: 400 })
    }

    // Get current project
    const currentProjectId = getCurrentProjectFromServerSync()

    // Get project-specific settings once
    const [projectMasterPrompt, projectImageSize] = await Promise.all([
      getProjectMasterPrompt(currentProjectId),
      getProjectImageSize(currentProjectId)
    ])

    const requestMetadata = {
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    }

    console.log(`🚀 Starting Ideogram batch generation: ${images.length} images`)

    // Prepare all generation requests
    const generationRequests = images.map(async (imageRequest: any, index: number) => {
      const {
        prompt,
        user_prompt,
        character_name,
        scene_name,
        character_outfit_index,
        scene_index,
        concept,
        aspect_ratio,
        expand_prompt = true,
        seed,
        style = "auto",
        negative_prompt = ""
      } = imageRequest

      if (!prompt) {
        throw new Error(`Prompt is required for image ${index + 1}`)
      }

      // Build the final prompt
      let fullPrompt = prompt.trim()
      if (projectMasterPrompt) {
        fullPrompt = `${projectMasterPrompt} ${fullPrompt}`
      }

      // Use project image size or provided aspect_ratio
      const finalAspectRatio = aspect_ratio || projectImageSize

      // Prepare the input for Ideogram API
      const input = {
        prompt: fullPrompt,
        aspect_ratio: finalAspectRatio,
        expand_prompt: expand_prompt,
        style: style,
        negative_prompt: negative_prompt,
        ...(seed && { seed })
      }

      console.log(`Generating image ${index + 1}/${images.length} with Ideogram V2:`, { 
        concept: concept || extractConceptFromPrompt(prompt),
        prompt_length: fullPrompt.length,
        aspect_ratio: finalAspectRatio,
        style: style
      })

      const result = await fal.subscribe('fal-ai/ideogram/v2', {
        input,
        logs: false
      }) as IdeogramResult

      return {
        concept: concept || extractConceptFromPrompt(prompt),
        result,
        input,
        requestMetadata
      }
    })

    // Execute all generation requests in parallel
    const generationResults = await Promise.allSettled(generationRequests)

    console.log(`🎨 Ideogram generation completed: ${generationResults.length} requests processed`)

    // Process results and save to disk if requested
    const processedResults = await Promise.all(
      generationResults.map(async (result, index) => {
        if (result.status === 'fulfilled') {
          const { concept, result: ideogramResult, input, requestMetadata } = result.value
          const typedIdeogramResult = ideogramResult as IdeogramResult
          let localPath = null

          if (save_to_disk && typedIdeogramResult.images && typedIdeogramResult.images[0]) {
            // Create enhanced metadata for Ideogram images
            const enhancedMetadata = {
              // Core generation parameters
              prompt: input.prompt,
              original_prompt: body.images[index].prompt,
              user_prompt: body.images[index].user_prompt,
              character_name: body.images[index].character_name,
              scene_name: body.images[index].scene_name,
              character_outfit_index: body.images[index].character_outfit_index,
              scene_index: body.images[index].scene_index,
              model: 'fal-ai/ideogram/v2',
              image_size: input.aspect_ratio,
              num_inference_steps: null, // Not applicable for Ideogram
              guidance_scale: 0, // Not applicable for Ideogram
              num_images: 1,
              enable_safety_checker: false,
              output_format: 'jpeg',
              loras: [], // Not applicable for Ideogram
              concept: concept || extractConceptFromPrompt(body.images[index].prompt),
              
              // Ideogram-specific parameters
              aspect_ratio: input.aspect_ratio,
              expand_prompt: input.expand_prompt,
              style: input.style,
              negative_prompt: input.negative_prompt,
              
              // Generation results
              seed: typedIdeogramResult.seed,
              inference_time: null,
              has_nsfw_concepts: [],
              
              // Complete API response payload
              api_response: {
                ...typedIdeogramResult,
                request_input: input,
                request_timestamp: new Date().toISOString(),
                model_used: 'fal-ai/ideogram/v2',
                batch_index: index
              },
              
              // Request metadata
              user_agent: requestMetadata.user_agent,
              ip_address: requestMetadata.ip_address,
              request_id: `ideogram-batch-${Date.now()}-${index}-${crypto.randomUUID()}`
            }
            
            localPath = await saveImageWithMetadata(
              typedIdeogramResult.images[0].url, 
              enhancedMetadata,
              currentProjectId,
              index
            )
          }

          return {
            concept,
            status: 'success',
            image: {
              ...typedIdeogramResult.images[0],
              fal_image_url: typedIdeogramResult.images[0].url // Ensure Fal URL is included
            },
            local_path: localPath,
            generation_data: {
              seed: typedIdeogramResult.seed,
              style: input.style,
              aspect_ratio: input.aspect_ratio
            }
          }
        } else {
          return {
            concept: body.images[index].concept || extractConceptFromPrompt(body.images[index].prompt),
            status: 'failed',
            error: result.reason?.message || 'Unknown error',
            image: null,
            local_path: null
          }
        }
      })
    )

    const successCount = processedResults.filter(r => r.status === 'success').length
    const failureCount = processedResults.filter(r => r.status === 'failed').length

    console.log(`Ideogram batch generation completed: ${successCount} successful, ${failureCount} failed`)

    // Send batch completion feedback to LLM service
    try {
      await llmFeedback('success', {
        action: 'ideogram_batch_generation',
        total_images: images.length,
        successful_images: successCount,
        failed_images: failureCount,
        model: 'fal-ai/ideogram/v2',
        batch_metadata: {
          project_id: currentProjectId,
          total_requests: images.length,
          processing_time: Date.now()
        }
      })
    } catch (feedbackError) {
      console.warn('Failed to send batch completion feedback to LLM service:', feedbackError)
    }

    return NextResponse.json({
      success: true,
      message: `Batch generation completed: ${successCount} successful, ${failureCount} failed`,
      results: processedResults,
      summary: {
        total: images.length,
        successful: successCount,
        failed: failureCount,
        saved_to_disk: save_to_disk,
        model_used: 'fal-ai/ideogram/v2'
      }
    })

  } catch (error) {
    console.error('Error in Ideogram batch generation:', error)
    
    // Send error feedback to LLM service
    try {
      await llmFeedback('error', {
        action: 'ideogram_batch_generation',
        error: error instanceof Error ? error.message : 'Unknown error',
        model: 'fal-ai/ideogram/v2'
      })
    } catch (feedbackError) {
      console.warn('Failed to send error feedback to LLM service:', feedbackError)
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process batch generation', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
} 