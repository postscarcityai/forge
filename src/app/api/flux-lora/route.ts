import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { llmFeedback } from '@/utils/llmFeedback'
import { getEnvVar } from '@/lib/envUtils'
import { getProvider, AIServiceType, ImageGenerationRequest } from '@/lib/providers'
import { createImageSaveRequest } from '@/types/mediaSaver'
import { mediaSaverService } from '@/services/mediaSaver'
import { extractConceptFromPrompt } from '@/utils/mediaUtils'
import { databaseService } from '@/services/databaseService'

interface LoRA {
  path: string
  scale: number
}

// Type definitions for fal API response (maintained for compatibility)
interface FalImage {
  url: string
  width?: number
  height?: number
  content_type?: string
  local_path?: string
}

interface FalResult {
  images: FalImage[]
  timings: {
    inference: number
  }
  seed: number
  has_nsfw_concepts: boolean[]
  prompt: string
}

const DEFAULT_LORAS = [
  {
    path: "https://matres.nyc3.cdn.digitaloceanspaces.com/flux_s_MinimalDesign.safetensors",
    scale: 0.825
  },
  {
    path: "https://matres.nyc3.cdn.digitaloceanspaces.com/Cute_3d_Cartoon_Flux.safetensors", 
    scale: 0.65
  }
]

// Removed hardcoded master prompt - now using project settings only

/**
 * Fetch project data from database to get master prompt
 */
async function getProjectMasterPrompt(projectId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4900'}/api/database/projects?id=${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch project data: ${response.status}`)
      return ''
    }

    const result = await response.json()
    
    // /api/database/projects?id= returns a single project object (not an array)
    if (result.success && result.data) {
      const project = result.data
      return project.settings?.imagePrompting?.masterPrompt || ''
    }
    
    return ''
  } catch (error) {
    console.error(`Error fetching project master prompt for ${projectId}:`, error)
    return ''
  }
}

/**
 * Convert a LoRA ID to its corresponding path URL using direct database access
 */
async function convertLoRAIdToPath(loraId: string): Promise<string | undefined> {
  try {
    console.log(`🔍 Looking up LoRA in database: ${loraId}`)
    const lora = await databaseService.getLoRA(loraId)
    
    if (lora && lora.safetensorsLink) {
      console.log(`✅ Found LoRA in database for ID "${loraId}": ${lora.safetensorsLink.split('/').pop()}`)
      return lora.safetensorsLink
    } else {
      console.warn(`⚠️ LoRA not found in database or missing safetensors link for ID "${loraId}"`)
    }
  } catch (error) {
    console.warn(`Error fetching LoRA "${loraId}" from database:`, error)
  }
  
  console.warn(`⚠️ LoRA file not found for ID "${loraId}", this LoRA will be skipped`)
  return undefined
}

/**
 * Get project-specific LoRAs using direct database access
 */
async function getProjectLoRAs(projectId: string): Promise<LoRA[]> {
  try {
    console.log(`🔍 getProjectLoRAs called for project: ${projectId}`)
    const project = await databaseService.getProject(projectId)
    
    if (!project) {
      console.error(`❌ Project not found: ${projectId}`)
      console.log(`🎨 Using defaults:`, DEFAULT_LORAS.map(l => ({ path: l.path.split('/').pop(), scale: l.scale })))
      return DEFAULT_LORAS
    }

    const loras = project.settings?.loras
    console.log(`🔎 Project has loras config: ${!!loras}`)
    
    if (loras) {
      console.log(`📋 Raw LoRA settings from project ${projectId}:`, JSON.stringify(loras, null, 2))
      
      const apiLoras: LoRA[] = []
      
      // Handle LoRA1
      console.log(`🔸 LoRA1 - enabled: ${loras.lora1?.enabled}, id: ${loras.lora1?.id}`)
      if (loras.lora1?.enabled && loras.lora1.id) {
        console.log(`🔄 Converting LoRA1 ID to path: ${loras.lora1.id}`)
        const loraPath = await convertLoRAIdToPath(loras.lora1.id)
        console.log(`✅ LoRA1 path result: ${loraPath}`)
        if (loraPath) {
          apiLoras.push({
            path: loraPath,
            scale: loras.lora1.scale || loras.lora1.strength || 0.5
          })
        } else {
          console.warn(`⚠️ LoRA1 conversion returned undefined for id: ${loras.lora1.id}`)
        }
      }
      
      // Handle LoRA2
      console.log(`🔹 LoRA2 - enabled: ${loras.lora2?.enabled}, id: ${loras.lora2?.id}`)
      if (loras.lora2?.enabled && loras.lora2.id) {
        console.log(`🔄 Converting LoRA2 ID to path: ${loras.lora2.id}`)
        const loraPath = await convertLoRAIdToPath(loras.lora2.id)
        console.log(`✅ LoRA2 path result: ${loraPath}`)
        if (loraPath) {
          apiLoras.push({
            path: loraPath,
            scale: loras.lora2.scale || loras.lora2.strength || 0.5
          })
        } else {
          console.warn(`⚠️ LoRA2 conversion returned undefined for id: ${loras.lora2.id}`)
        }
      }
      
      console.log(`📊 Total LoRAs found: ${apiLoras.length}`)
      
      if (apiLoras.length > 0) {
        console.log(`🎨 Using project LoRAs:`, apiLoras.map(l => ({ path: l.path.split('/').pop(), scale: l.scale })))
        return apiLoras
      }
    }
    
    console.log(`🎨 No project LoRAs found, using defaults:`, DEFAULT_LORAS.map(l => ({ path: l.path.split('/').pop(), scale: l.scale })))
    return DEFAULT_LORAS
  } catch (error) {
    console.error(`Error fetching project LoRAs for ${projectId}:`, error)
    console.log(`🎨 Error fetching LoRAs, using defaults:`, DEFAULT_LORAS.map(l => ({ path: l.path.split('/').pop(), scale: l.scale })))
    return DEFAULT_LORAS
  }
}

/**
 * Get project-specific image size/orientation using direct database access
 */
async function getProjectImageSize(projectId: string): Promise<string> {
  try {
    console.log(`🔍 getProjectImageSize called for project: ${projectId}`)
    const project = await databaseService.getProject(projectId)
    
    if (!project) {
      console.error(`❌ Project not found: ${projectId}`)
      console.log(`📐 Using default orientation: portrait_16_9`)
      return 'portrait_16_9'
    }

    const orientation = project.settings?.defaultImageOrientation || 'portrait'
    console.log(`📋 Project ${projectId} defaultImageOrientation: ${orientation}`)
    
    // Convert project orientation to Fal API image_size format
    let falImageSize: string
    switch (orientation) {
      case 'landscape':
        falImageSize = 'landscape_16_9'
        break
      case 'square':
        falImageSize = 'square'
        break
      case 'portrait':
      default:
        falImageSize = 'portrait_16_9'
        break
    }
    
    console.log(`✅ Converted orientation "${orientation}" to Fal format: ${falImageSize}`)
    return falImageSize
  } catch (error) {
    console.error(`Error fetching project image orientation for ${projectId}:`, error)
    console.log(`📐 Using default orientation: portrait_16_9`)
    return 'portrait_16_9'
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current project from server state
    const currentProjectId = getCurrentProjectFromServerSync()
    
    // Get the Fal.ai provider from registry
    const falProvider = getProvider('fal')
    if (!falProvider) {
      return NextResponse.json({ error: 'Fal.ai provider not available' }, { status: 500 })
    }

    const body = await request.json()
    const { 
      prompt, 
      master_prompt,
      concept,
      character_name,
      scene_name,
      character_outfit_index,
      scene_index,
      user_prompt,
      image_size, // Will be ignored - always use project default
      num_inference_steps = 28,
      guidance_scale = 3.5,
      num_images = 1,
      enable_safety_checker = false,
      output_format = 'jpeg',
      loras,
      save_to_disk = true,
      seed
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log(`🎯 Using current project from server state: ${currentProjectId}`)
    
    // Always use project default image size - ignore any incoming image_size parameter
    const finalImageSize = await getProjectImageSize(currentProjectId);
    console.log(`📐 Using project default image orientation: ${finalImageSize} (project: ${currentProjectId})`);
    
    // Log if someone tried to override the image size
    if (image_size && image_size !== finalImageSize) {
      console.warn(`⚠️ IGNORING provided image_size parameter: "${image_size}" - using project setting: "${finalImageSize}"`);
      llmFeedback({
        title: 'IGNORING PROVIDED IMAGE_SIZE PARAMETER',
        technicalDetails: `Requested: ${image_size} | Using project default: ${finalImageSize}`,
        futureInstructions: 'Do not include image_size in future API calls. It is always ignored in favor of project settings.'
      });
    }
    
    // Get LoRAs from project settings or use provided/default LoRAs
    let finalLoras: LoRA[];
    if (loras && loras.length > 0) {
      finalLoras = loras;
      console.log(`🎨 Using LoRAs from request:`, finalLoras.map(l => ({ path: l.path.split('/').pop(), scale: l.scale })));
    } else {
      finalLoras = await getProjectLoRAs(currentProjectId);
    }

    // Get trigger words from LoRA database entries
    const triggerWords: string[] = [];
    try {
      const project = await databaseService.getProject(currentProjectId);
      
      if (project?.settings?.loras) {
        // Get trigger words for LoRA1
        if (project.settings.loras.lora1?.enabled && project.settings.loras.lora1.id) {
          const lora1 = await databaseService.getLoRA(project.settings.loras.lora1.id);
          if (lora1?.triggerWords && Array.isArray(lora1.triggerWords)) {
            triggerWords.push(...lora1.triggerWords);
            console.log(`🎯 Added LoRA1 trigger words: ${lora1.triggerWords.join(', ')}`);
          }
        }
        
        // Get trigger words for LoRA2
        if (project.settings.loras.lora2?.enabled && project.settings.loras.lora2.id) {
          const lora2 = await databaseService.getLoRA(project.settings.loras.lora2.id);
          if (lora2?.triggerWords && Array.isArray(lora2.triggerWords)) {
            triggerWords.push(...lora2.triggerWords);
            console.log(`🎯 Added LoRA2 trigger words: ${lora2.triggerWords.join(', ')}`);
          }
        }
      }
      
      // ALWAYS ensure film noir graphic novel aesthetic terms are included
      const essentialTerms = ['film noir', 'graphic novel style', 'high contrast noir aesthetic'];
      essentialTerms.forEach(term => {
        if (!triggerWords.includes(term)) {
          triggerWords.push(term);
        }
      });
      console.log(`📚 Added essential film noir graphic novel terms`);
      
    } catch (error) {
      console.error('Error fetching trigger words:', error);
    }

    // Build the final prompt with trigger words at the end (deduplicated)
    let fullPrompt = prompt.trim();
    if (triggerWords.length > 0) {
      // Remove duplicates while preserving order
      const uniqueTriggerWords = [...new Set(triggerWords)];
      fullPrompt = `${fullPrompt}, ${uniqueTriggerWords.join(', ')}`;
      console.log(`🎯 Added trigger words at end: ${uniqueTriggerWords.join(', ')}`);
    }

    console.log(`📝 Final prompt: ${fullPrompt}`)
    console.log(`🔧 Generation parameters:`, {
      image_size: finalImageSize,
      num_inference_steps,
      guidance_scale,
      num_images,
      enable_safety_checker,
      output_format,
      loras_count: finalLoras.length
    })

    // Create provider request
    const providerRequest: ImageGenerationRequest = {
      prompt: fullPrompt,
      originalPrompt: prompt,
      userPrompt: user_prompt,
      characterName: character_name,
      sceneName: scene_name,
      model: 'flux-lora',
      imageSize: finalImageSize,
      numInferenceSteps: num_inference_steps,
      guidanceScale: guidance_scale,
      numImages: num_images,
      enableSafetyChecker: enable_safety_checker,
      outputFormat: output_format,
      loras: finalLoras,
      seed: seed,
      projectId: currentProjectId,
      saveToDisk: false, // We'll handle saving manually to maintain exact compatibility
      concept: concept || extractConceptFromPrompt(prompt)
    }

    // Generate image using provider
    const providerResult = await falProvider.generateImage!(providerRequest)
    
    if (!providerResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to generate flux-lora image', 
          details: providerResult.error 
        }, 
        { status: 500 }
      )
    }

    // Transform provider result to match original format exactly
    const result: FalResult = {
      images: providerResult.data!.images.map(img => ({
        url: img.url,
        width: img.width,
        height: img.height
      })),
      timings: {
        inference: providerResult.data!.timings?.inference || 0
      },
      seed: providerResult.data!.seed || 0,
      has_nsfw_concepts: providerResult.data!.hasNsfwConcepts || [],
      prompt: fullPrompt
    }

    // Handle saving using MediaSaverService (if requested) to maintain exact compatibility
    if (save_to_disk && result.images?.length > 0) {
      const savedResults = await Promise.all(
        result.images.map(async (image: FalImage, index: number) => {
          const conceptValue = concept || extractConceptFromPrompt(prompt)
          const requestId = `flux-lora-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          const saveRequest = createImageSaveRequest(
            image.url,
            conceptValue,
            fullPrompt,
            prompt,
            'fal',
            'flux-lora',
            '/api/flux-lora',
            requestId,
            currentProjectId,
            {
              image_size: finalImageSize,
              num_inference_steps,
              guidance_scale,
              num_images,
              enable_safety_checker,
              output_format,
              loras: finalLoras
            },
            {
              seed: result.seed,
              inference_time: result.timings?.inference,
              has_nsfw_concepts: result.has_nsfw_concepts
            },
            providerResult.data!,
            {
              userPrompt: user_prompt,
              characterName: character_name,
              sceneName: scene_name,
              index,
              userAgent: request.headers.get('user-agent') || undefined,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
              providerSpecificData: {
                falImageUrl: image.url,
                loras_used: finalLoras.map(l => ({ path: l.path.split('/').pop(), scale: l.scale })),
                characterOutfitIndex: character_outfit_index,
                sceneIndex: scene_index
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

    // Return exact same format as original
    return NextResponse.json({
      ...result,
      message: save_to_disk ? 'Flux-LoRA image generated and saved successfully' : 'Flux-LoRA image generated successfully',
      saved_to_disk: save_to_disk,
      local_paths: result.images?.map((img: FalImage) => img.local_path).filter(Boolean) || [],
      generation_data: {
        seed: result.seed,
        inference_time: result.timings?.inference,
        has_nsfw_concepts: result.has_nsfw_concepts,
        loras_used: finalLoras.map(l => ({ path: l.path.split('/').pop(), scale: l.scale }))
      }
    })
  } catch (error) {
    console.error('Error generating flux-lora image:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate flux-lora image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}

// extractConceptFromPrompt is now imported from @/utils/mediaUtils 