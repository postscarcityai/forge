import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { llmFeedback } from '@/utils/llmFeedback'
import { getProvider, ImageGenerationRequest } from '@/lib/providers'
import { createImageSaveRequest } from '@/types/mediaSaver'
import { mediaSaverService } from '@/services/mediaSaver'
import { extractConceptFromPrompt } from '@/utils/mediaUtils'

// Type definitions for Ideogram API response (maintained for compatibility)
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
      negative_prompt = "",
      save_to_disk = true 
    } = body

    // Validate required parameters
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Get current project
    const currentProjectId = getCurrentProjectFromServerSync()

    // Get project-specific settings
    const [projectMasterPrompt, projectImageSize] = await Promise.all([
      getProjectMasterPrompt(currentProjectId),
      getProjectImageSize(currentProjectId)
    ])

    // Build the final prompt
    let fullPrompt = prompt.trim()
    if (projectMasterPrompt) {
      fullPrompt = `${projectMasterPrompt} ${fullPrompt}`
    }

    // Use project image size or provided aspect_ratio
    const finalAspectRatio = aspect_ratio || projectImageSize

    console.log('Generating image with Ideogram V2:', { 
      concept: concept || 'Single Generation',
      prompt_length: fullPrompt.length,
      aspect_ratio: finalAspectRatio,
      style: style,
      expand_prompt: expand_prompt
    })

    // Create provider request
    const providerRequest: ImageGenerationRequest = {
      prompt: fullPrompt,
      originalPrompt: prompt,
      userPrompt: user_prompt,
      characterName: character_name,
      sceneName: scene_name,
      model: 'ideogram-v2',
      imageSize: finalAspectRatio,
      numImages: 1,
      seed: seed,
      projectId: currentProjectId,
      saveToDisk: false, // We'll handle saving manually to maintain exact compatibility
      concept: concept || extractConceptFromPrompt(prompt),
      // Ideogram-specific parameters stored in the request object
      expandPrompt: expand_prompt,
      style: style,
      negativePrompt: negative_prompt
    }

    // Generate image using provider
    const providerResult = await falProvider.generateImage!(providerRequest)
    
    if (!providerResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to generate image', 
          details: providerResult.error 
        }, 
        { status: 500 }
      )
    }

    // Transform provider result to match original format exactly
    const result: IdeogramResult = {
      images: providerResult.data!.images.map(img => ({
        url: img.url,
        width: img.width,
        height: img.height
      })),
      seed: providerResult.data!.seed || 0
    }

    let localPath: string | null = null

    // Handle saving using MediaSaverService (if requested) to maintain exact compatibility
    if (save_to_disk && result.images?.length > 0) {
      const conceptValue = concept || extractConceptFromPrompt(prompt)
      const requestId = `ideogram-${Date.now()}-${crypto.randomUUID()}`
      
      const saveRequest = createImageSaveRequest(
        result.images[0].url,
        conceptValue,
        fullPrompt,
        prompt,
        'fal',
        'ideogram-v2',
        '/api/ideogram',
        requestId,
        currentProjectId,
        {
          aspect_ratio: finalAspectRatio,
          expand_prompt: expand_prompt,
          style: style,
          negative_prompt: negative_prompt,
          image_size: finalAspectRatio,
          num_images: 1,
          enable_safety_checker: false,
          output_format: 'jpeg'
        },
        {
          seed: result.seed,
          inference_time: null,
          has_nsfw_concepts: []
        },
        providerResult.data!,
        {
          userPrompt: user_prompt,
          characterName: character_name,
          sceneName: scene_name,
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          providerSpecificData: {
            falImageUrl: result.images[0].url,
            aspect_ratio: finalAspectRatio,
            expand_prompt: expand_prompt,
            style: style,
            negative_prompt: negative_prompt,
            characterOutfitIndex: character_outfit_index,
            sceneIndex: scene_index
          }
        }
      )
      
      const saveResult = await mediaSaverService.saveMedia(saveRequest)
      
      if (saveResult.success) {
        localPath = saveResult.filePath
        // Add local path to result
        ;(result.images[0] as Record<string, unknown>).local_path = localPath
      } else {
        console.warn(`⚠️ Failed to save image:`, saveResult.error)
      }
    }

    // Send success feedback to LLM service if generation was successful
    if (result.images?.length > 0) {
      try {
        await llmFeedback('success', {
          action: 'ideogram_generation',
          prompt: fullPrompt,
          concept: concept || extractConceptFromPrompt(prompt),
          model: 'fal-ai/ideogram/v2',
          result: {
            images_generated: result.images.length,
            seed: result.seed,
            style: style
          }
        })
      } catch (feedbackError) {
        console.warn('Failed to send success feedback to LLM service:', feedbackError)
      }
    }

    const response = {
      ...result,
      message: save_to_disk ? 'Image generated and saved successfully' : 'Image generated successfully',
      saved_to_disk: save_to_disk,
      local_path: localPath,
      generation_data: {
        seed: result.seed,
        model_used: 'fal-ai/ideogram/v2',
        input_parameters: {
          aspect_ratio: finalAspectRatio,
          style: style,
          expand_prompt: expand_prompt
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error generating Ideogram image:', error)
    
    // Send error feedback to LLM service
    try {
      await llmFeedback('error', {
        action: 'ideogram_generation',
        error: error instanceof Error ? error.message : 'Unknown error',
        model: 'fal-ai/ideogram/v2'
      })
    } catch (feedbackError) {
      console.warn('Failed to send error feedback to LLM service:', feedbackError)
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}

// extractConceptFromPrompt is now imported from @/utils/mediaUtils 