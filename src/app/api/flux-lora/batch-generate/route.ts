import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { saveImageWithMetadata } from '@/utils/fal-image-generator'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { llmFeedback } from '@/utils/llmFeedback'
import { databaseService } from '@/services/databaseService'
import { getEnvVar } from '@/lib/envUtils'

interface BatchImageRequest {
  concept: string
  prompt: string
  user_prompt?: string // Original user input for PromptDrawer generations
  prompt_components?: any // Pre-generated prompt components from PromptDrawer
  filename?: string
  // Programmatic parameters
  character_name?: string
  character_outfit?: string | number // Name or index
  scene_name?: string
  // Database-driven option
  use_random_database_selection?: boolean // If true, randomly select character + outfit + scene from database
  // New fields for character and scene IDs
  character_ids?: string[]
  scene_id?: string
  // Character and scene controls for granular parameter control
  character_controls?: Array<{
    age: boolean;
    gender: boolean;
    race: boolean;
    height: boolean;
    hairColor: boolean;
    eyeColor: boolean;
    physicalAppearance: boolean;
    profession: boolean;
    outfit: boolean;
  }>
  character_outfits?: (string | number)[]
  scene_controls?: {
    setting: boolean;
    timeOfDay: boolean;
    lighting: boolean;
    mood: boolean;
    cameraAngle: boolean;
    atmosphere: boolean;
    props: boolean;
  }
}

interface LoRA {
  path: string
  scale: number
}

interface LoRASettings {
  lora1?: {
    enabled?: boolean
    id?: string
    path?: string
    scale?: number
    triggerWords?: string[]
  }
  lora2?: {
    enabled?: boolean
    id?: string
    path?: string
    scale?: number
    triggerWords?: string[]
  }
}

interface BatchGenerationRequest {
  images: BatchImageRequest[]
  save_to_disk?: boolean
  master_prompt?: string
  project_id?: string
  loras?: LoRA[]
}

interface FalResult {
  images: Array<{
    url: string
    width: number
    height: number
    content_type: string
  }>
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

// LoRA ID to path mapping (fallback for legacy support)
// NOTE: These are fallback LoRA files if database lookup fails
const LORA_ID_TO_PATH: Record<string, string> = {
  'retro-hero-flux': 'https://matres.nyc3.cdn.digitaloceanspaces.com/RetroHeroFlux.safetensors',
  'minimal-design': 'https://matres.nyc3.cdn.digitaloceanspaces.com/flux_s_MinimalDesign.safetensors',
  'cute-3d-cartoon': 'https://matres.nyc3.cdn.digitaloceanspaces.com/Cute_3d_Cartoon_Flux.safetensors'
};

/**
 * Convert a LoRA ID to its corresponding path URL
 * First tries to fetch from database, then falls back to hardcoded mapping
 */
async function convertLoRAIdToPath(loraId: string | undefined): Promise<string | undefined> {
  if (!loraId) return undefined;
  
  try {
    // Try to fetch LoRA from database first using direct database access
    const loraData = await databaseService!.getLoRA(loraId);
    
    if (loraData?.safetensorsLink) {
      console.log(`✅ Found LoRA in database for ID "${loraId}": ${loraData.safetensorsLink.split('/').pop()}`);
      return loraData.safetensorsLink;
    }
  } catch (error) {
    console.warn(`Error fetching LoRA "${loraId}" from database:`, error);
  }
  
  // Fall back to hardcoded mapping
  const path = LORA_ID_TO_PATH[loraId];
  if (path) {
    console.log(`✅ Found LoRA in fallback mapping for ID "${loraId}": ${path.split('/').pop()}`);
    return path;
  } else {
    console.warn(`⚠️ LoRA file not found for ID "${loraId}" in database or fallback mapping, this LoRA will be skipped`);
    return undefined;
  }
}

// Removed hardcoded master prompt - now using project settings only



/**
 * Fetch project data from database to get LoRA settings
 */
async function getProjectLoRAs(projectId: string): Promise<LoRA[]> {
  try {
    // Use direct database access instead of HTTP fetch
    const projectData = await databaseService!.getProject(projectId);
    
    if (!projectData) {
      console.warn(`No project data found for ${projectId}, using default LoRAs`);
      return DEFAULT_LORAS;
    }
    
    // Extract LoRAs from project settings
    const loras: LoRASettings | undefined = projectData.settings?.loras as LoRASettings | undefined;
    
    console.log(`📋 Raw LoRA settings from project ${projectId}:`, JSON.stringify(loras, null, 2));
    
    if (!loras) {
      console.log(`No LoRA settings found for project ${projectId}, using defaults`);
      return DEFAULT_LORAS;
    }
    
    // Convert project LoRAs to API format
    const apiLoras: LoRA[] = [];
    
    // Handle both legacy format (path) and new format (id)
    console.log(`🔍 Processing LoRA1 for project ${projectId}:`, {
      enabled: loras.lora1?.enabled,
      id: loras.lora1?.id,
      scale: loras.lora1?.scale,
      existingPath: loras.lora1?.path
    });
    
    if (loras.lora1?.enabled) {
      const loraPath = loras.lora1.path || await convertLoRAIdToPath(loras.lora1.id);
      console.log(`🔍 LoRA1 resolved path: "${loraPath}"`);
      if (loraPath?.trim()) {
        const lora1 = {
          path: loraPath.trim(),
          scale: loras.lora1.scale || 0.8 // Default strength 0.8
        };
        apiLoras.push(lora1);
        console.log(`✅ Added LoRA1 to API list:`, lora1);
      } else {
        console.warn(`⚠️ LoRA1 path is empty, skipping`);
      }
    }
    
    console.log(`🔍 Processing LoRA2 for project ${projectId}:`, {
      enabled: loras.lora2?.enabled,
      id: loras.lora2?.id,
      scale: loras.lora2?.scale,
      existingPath: loras.lora2?.path
    });
    
    if (loras.lora2?.enabled) {
      const loraPath = loras.lora2.path || await convertLoRAIdToPath(loras.lora2.id);
      console.log(`🔍 LoRA2 resolved path: "${loraPath}"`);
      if (loraPath?.trim()) {
        const lora2 = {
          path: loraPath.trim(),
          scale: loras.lora2.scale || 0.8 // Default strength 0.8
        };
        apiLoras.push(lora2);
        console.log(`✅ Added LoRA2 to API list:`, lora2);
      } else {
        console.warn(`⚠️ LoRA2 path is empty, skipping`);
      }
    }
    
    if (apiLoras.length === 0) {
      console.log(`No valid LoRAs found for project ${projectId}, falling back to defaults`);
      return DEFAULT_LORAS; // Fall back to defaults instead of empty array
    }
    
    console.log(`🎨 Using project LoRAs for ${projectId}:`, apiLoras.map(l => ({ 
      filename: l.path.split('/').pop(), 
      fullPath: l.path,
      scale: l.scale 
    })));
    
    return apiLoras;
  } catch (error) {
    console.error(`Error fetching project LoRAs for ${projectId}:`, error);
    return DEFAULT_LORAS;
  }
}

/**
 * Fetch project image orientation setting from database
 */
async function getProjectImageSize(projectId: string): Promise<string> {
  try {
    // Use direct database access instead of HTTP fetch
    const projectData = await databaseService!.getProject(projectId);
    
    if (!projectData) {
      console.warn(`No project data found for ${projectId}, using default portrait orientation`);
      return 'portrait_16_9';
    }
    
    // Extract orientation from project settings
    const orientation = projectData.settings?.defaultImageOrientation || 'portrait';
    
    // Convert project orientation to Fal API image_size format
    switch (orientation) {
      case 'landscape':
        return 'landscape_16_9';
      case 'square':
        return 'square';
      case 'portrait':
      default:
        return 'portrait_16_9';
    }
  } catch (error) {
    console.error(`Error fetching project image orientation for ${projectId}:`, error);
    return 'portrait_16_9';
  }
}

interface RequestMetadata {
  user_agent?: string
  ip_address?: string
}

async function generateSingleImage(imageRequest: BatchImageRequest, loras: LoRA[], imageSize: string, requestMetadata: RequestMetadata, projectId: string) {
  let usedCharacter = imageRequest.character_name;
  let usedOutfit = imageRequest.character_outfit;
  let usedScene = imageRequest.scene_name;
  
  // Track prompt components and metadata
  let promptComponents: any = null;
  let promptMetadata: any = null;
  
  // Handle database-driven random selection
  if (imageRequest.use_random_database_selection) {
    try {
      const { generateRandomCombination } = await import('@/utils/characterPromptGeneration');
      const randomCombo = await generateRandomCombination(projectId);
      
      if (randomCombo) {
        usedCharacter = randomCombo.character;
        usedOutfit = randomCombo.outfit;
        usedScene = randomCombo.scene;
        console.log(`🎲 Random database selection: ${usedCharacter} (outfit ${usedOutfit}) in ${usedScene}`);
      }
    } catch (error) {
      console.error('Error generating random combination:', error);
    }
  }
  
  // Determine prompt handling strategy
  let finalPrompt: string;
  
  // Check if this is a pre-assembled prompt from PromptDrawer
  const isPromptBuilderGeneration = imageRequest.concept === 'Prompt Builder Generation' || imageRequest.concept === 'Structured Prompt Generation';
  
  console.log(`🔍 PROMPT HANDLING DECISION:`, {
    concept: imageRequest.concept,
    isPromptBuilderGeneration,
    promptLength: imageRequest.prompt?.length || 0
  });
  
  if (isPromptBuilderGeneration) {
    // Use the pre-assembled prompt directly from PromptDrawer
    finalPrompt = imageRequest.prompt;
    console.log(`🎨 Using pre-assembled PromptDrawer prompt (${finalPrompt.split(/\s+/).length} words)`);
    console.log(`📝 PromptDrawer prompt: "${finalPrompt.substring(0, 200)}..."`);
    
    // For PromptDrawer generations, check if we have pre-generated components
    if (imageRequest.prompt_components) {
      // Use the pre-generated components directly
      promptComponents = imageRequest.prompt_components;
      console.log(`📊 Using pre-generated PromptDrawer components`);
    } else {
      // Fallback: rebuild the prompt to get components
      // This ensures we have the breakdown for the image metadata
      try {
        const { promptService } = await import('@/services/PromptService');
        
        // Get the actual project object using direct database access
        const project = await databaseService!.getProject(projectId);
        
        if (project) {
        // Get actual character objects if character IDs are provided
        let characters: any[] = [];
        if (imageRequest.character_ids && imageRequest.character_ids.length > 0) {
          const allCharacters = await databaseService!.getCharacters(projectId);
          characters = allCharacters.filter((char: any) => 
            imageRequest.character_ids!.includes(char.id)
          );
        }
        
        // Get actual scene object if scene ID is provided
        let scene: any = undefined;
        if (imageRequest.scene_id) {
          scene = await databaseService!.getScene(imageRequest.scene_id);
        }
        
        // Get trigger words from project LoRA configuration
        const triggerWords: string[] = [];
        const projectLoras = project.settings?.loras as LoRASettings | undefined;
        if (projectLoras?.lora1?.enabled && projectLoras.lora1.triggerWords) {
          triggerWords.push(...projectLoras.lora1.triggerWords);
        }
        if (projectLoras?.lora2?.enabled && projectLoras.lora2.triggerWords) {
          triggerWords.push(...projectLoras.lora2.triggerWords);
        }
        
        // Get the prompt breakdown for metadata
        // Use the original user_prompt if provided, otherwise extract from the full prompt
        const userPromptForRebuild = imageRequest.user_prompt || imageRequest.prompt;
        
        const result = await promptService.buildPrompt({
          userPrompt: userPromptForRebuild,
          project: project as any,
          characters: characters,
          scene: scene,
          characterOutfits: imageRequest.character_outfits || [],
          characterControls: imageRequest.character_controls,
          sceneControls: imageRequest.scene_controls,
          triggerWords: triggerWords,
          includeMasterPrompt: true,
          includeUserInput: true
        });
        
        promptComponents = result.components;
        promptMetadata = result.metadata;
        
        console.log(`📊 PromptDrawer components captured for metadata`);
        }
      } catch (error) {
        console.error('Error capturing prompt components for metadata:', error);
      }
    }
  } else {
    // Zero-injection mode: use only the user-provided prompt
    finalPrompt = imageRequest.prompt;
  }
  
  console.log(`🎯 FINAL PROMPT (${finalPrompt.split(/\s+/).length} words): "${finalPrompt.substring(0, 200)}..."`);
  
  const finalLoRAs = loras.length > 0 ? loras : DEFAULT_LORAS;
  
  console.log(`🎯 FINAL LoRA Configuration for Flux API:`, {
    count: finalLoRAs.length,
    loras: finalLoRAs.map((lora, index) => ({
      index: index + 1,
      filename: lora.path.split('/').pop(),
      fullPath: lora.path,
      scale: lora.scale
    }))
  });

  const input = {
    prompt: finalPrompt,
    image_size: imageSize,
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: false,
    output_format: 'jpeg',
    loras: finalLoRAs
  }
  
  console.log(`🚀 Calling Flux API with ${finalLoRAs.length} LoRAs`);
  
  const result = await fal.subscribe('fal-ai/flux-lora', {
    input,
    logs: false
  })

  return {
    concept: imageRequest.concept,
    filename: imageRequest.filename,
    result,
    input,
    requestMetadata,
    promptComponents,
    promptMetadata
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchGenerationRequest = await request.json()
    
    console.log(`🚀 BATCH GENERATION REQUEST:`, {
      imageCount: body.images?.length || 0,
      concept: body.images?.[0]?.concept,
      promptLength: body.images?.[0]?.prompt?.length || 0,
      projectId: body.project_id
    });
    
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty images array' },
        { status: 400 }
      )
    }

    const saveToDisK = body.save_to_disk !== false // Default to true
    
    // Use project_id from request if provided, otherwise fall back to server state
    const requestProjectId = body.project_id;
    const serverProjectId = getCurrentProjectFromServerSync();
    const currentProjectId = requestProjectId || serverProjectId;
    
    console.log(`🎯 Project ID selection:`, {
      fromRequest: requestProjectId,
      fromServer: serverProjectId,
      using: currentProjectId
    });
    
    // Get FAL_KEY from database-stored environment variables
    const falKey = await getEnvVar('FAL_KEY', currentProjectId)
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
    }
    
    console.log(`🔑 Using FAL_KEY: ${falKey.substring(0, 8)}...${falKey.substring(falKey.length - 8)}`)
    
    // Configure fal.ai client with database credentials
    fal.config({
      credentials: falKey
    })
    
    // Master prompt handling removed - using structured prompts only
    
    // Always use project default image size
    const projectImageSize = await getProjectImageSize(currentProjectId);
    console.log(`📐 Using project default image orientation: ${projectImageSize}`);
    
    // Log that we always ignore any image_size parameter in batch requests
    llmFeedback({
      title: 'BATCH: ALWAYS USING PROJECT IMAGE_SIZE',
      technicalDetails: `Project default: ${projectImageSize} | Individual image_size params are ignored`,
      futureInstructions: 'Do not include image_size in batch requests. Always ignored for project settings consistency.'
    });
    
    // Get LoRAs from project settings or use provided/default LoRAs
    let loras: LoRA[];
    if (body.loras && body.loras.length > 0) {
      loras = body.loras;
      console.log(`🎨 Using LoRAs from request:`, loras.map(l => ({ path: l.path.split('/').pop(), scale: l.scale })));
    } else {
      loras = await getProjectLoRAs(currentProjectId);
    }

    console.log(`Starting batch generation of ${body.images.length} images...`)

    // Generate all images in parallel
    const generationPromises = body.images.map(imageRequest => {
      const userAgent = request.headers.get('user-agent');
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      
      return generateSingleImage(imageRequest, loras, projectImageSize, {
        ...(userAgent && { user_agent: userAgent }),
        ...(ipAddress && { ip_address: ipAddress })
      }, currentProjectId);
    })

    const generationResults = await Promise.allSettled(generationPromises)

    // Process results and optionally save to disk
    const processedResults = await Promise.all(
      generationResults.map(async (result, index) => {
        if (result.status === 'fulfilled') {
          const { concept, result: falResult, input, requestMetadata, promptComponents, promptMetadata } = result.value
          const typedFalResult = falResult as FalResult
          let localPath = null

          if (saveToDisK && typedFalResult.images && typedFalResult.images[0]) {
            localPath = await saveImageWithMetadata(
              typedFalResult.images[0].url, 
              {
                // Core generation parameters
                prompt: input.prompt,
                original_prompt: body.images[index].prompt,
                user_prompt: body.images[index].user_prompt,
                model: 'fal-ai/flux-lora',
                image_size: input.image_size,
                num_inference_steps: input.num_inference_steps,
                guidance_scale: input.guidance_scale,
                num_images: input.num_images,
                enable_safety_checker: input.enable_safety_checker,
                output_format: input.output_format,
                loras: input.loras,
                concept,
                
                // Character and scene metadata
                character_name: body.images[index].character_name,
                scene_name: body.images[index].scene_name,
                character_outfit_index: typeof body.images[index].character_outfit === 'number' ? body.images[index].character_outfit : undefined,
                
                // Generation results
                seed: typedFalResult.seed,
                inference_time: typedFalResult.timings?.inference,
                has_nsfw_concepts: typedFalResult.has_nsfw_concepts,
                
                // Complete API response payload
                api_response: {
                  ...typedFalResult,
                  request_input: input,
                  request_timestamp: new Date().toISOString(),
                  model_used: 'fal-ai/flux-lora',
                  batch_index: index
                },
                
                // Request metadata
                user_agent: requestMetadata.user_agent,
                ip_address: requestMetadata.ip_address,
                request_id: `batch-${Date.now()}-${index}-${crypto.randomUUID()}`,
                
                // Prompt components and metadata
                prompt_components: promptComponents,
                prompt_metadata: promptMetadata
              },
              currentProjectId, // Use current project from server state
              index
            )
          }

          return {
            concept,
            status: 'success',
            image: {
              ...typedFalResult.images[0],
              fal_image_url: typedFalResult.images[0].url // Ensure Fal URL is included
            },
            local_path: localPath,
            generation_data: {
              seed: typedFalResult.seed,
              inference_time: typedFalResult.timings?.inference,
              has_nsfw_concepts: typedFalResult.has_nsfw_concepts
            },
            promptComponents,
            promptMetadata
          }
        } else {
          return {
            concept: body.images[index].concept,
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

    console.log(`Batch generation completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      message: `Batch generation completed: ${successCount}/${body.images.length} successful`,
      total_requested: body.images.length,
      successful: successCount,
      failed: failureCount,
      results: processedResults,
      saved_to_disk: saveToDisK,
      estimated_total_cost: `$${(body.images.length * 0.05).toFixed(2)}` // Rough estimate
    })

  } catch (error) {
    console.error('Error in batch generation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate batch images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 