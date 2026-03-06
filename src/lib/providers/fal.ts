import { 
  AIProvider, 
  AIServiceType, 
  ProviderCredentials,
  ImageGenerationRequest,
  VideoGenerationRequest,
  AudioGenerationRequest,
  AIResponse,
  ImageResult,
  VideoResult,
  AudioResult
} from './types'
import { mediaSaverService } from '@/services/mediaSaver'
import { createImageSaveRequest, createVideoSaveRequest } from '@/types/mediaSaver'
import { getEnvVar } from '@/lib/envUtils'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { extractConceptFromPrompt } from '@/utils/mediaUtils'

// Import existing Fal.ai client
import * as fal from '@fal-ai/serverless-client'

export class FalProvider implements AIProvider {
  name = 'fal'
  supportedServices = [
    AIServiceType.IMAGE_GENERATION,
    AIServiceType.VIDEO_GENERATION,
    AIServiceType.IMAGE_ENHANCEMENT,
    AIServiceType.TEXT_TO_SPEECH
  ]

  /**
   * Authenticate with Fal.ai
   */
  async authenticate(credentials: ProviderCredentials): Promise<boolean> {
    try {
      const apiKey = credentials.apiKey || await getEnvVar('FAL_KEY')
      if (!apiKey) {
        console.error('❌ FalProvider: No API key found')
        return false
      }
      
      fal.config({
        credentials: apiKey
      })
      
      console.log('✅ FalProvider: Authentication configured')
      return true
    } catch (error) {
      console.error('❌ FalProvider: Authentication failed:', error)
      return false
    }
  }

  /**
   * Generate image using Fal.ai
   */
  async generateImage(request: ImageGenerationRequest): Promise<AIResponse<ImageResult>> {
    try {
      console.log(`🎨 FalProvider: Generating image with model ${request.model}`)
      
      // Authenticate with current project's API key
      const currentProjectId = request.projectId || getCurrentProjectFromServerSync()
      const falKey = await getEnvVar('FAL_KEY', currentProjectId)
      if (!falKey) {
        return {
          success: false,
          error: 'FAL_KEY not configured',
          provider: 'fal',
          model: request.model
        }
      }
      
      fal.config({ credentials: falKey })
      
      // Get the appropriate Fal.ai endpoint for the model
      const endpoint = this.getModelEndpoint(request.model)
      if (!endpoint) {
        return {
          success: false,
          error: `Unsupported model: ${request.model}`,
          provider: 'fal',
          model: request.model
        }
      }
      
      // Prepare input based on model type
      const input = this.prepareImageInput(request)
      
      // Call Fal.ai API
      const result = await fal.subscribe(endpoint, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log(`🔄 FalProvider: ${request.model} generation in progress...`)
            update.logs.map((log) => log.message).forEach(console.log)
          }
        }
      }) as any
      
      // Transform result to standard format
      const transformedResult: ImageResult = {
        images: result.images || [],
        seed: result.seed,
        timings: result.timings,
        hasNsfwConcepts: result.has_nsfw_concepts
      }
      
      // Save to disk if requested
      if (request.saveToDisk && transformedResult.images?.length > 0) {
        await this.saveImages(transformedResult, request, result)
      }
      
      return {
        success: true,
        data: transformedResult,
        provider: 'fal',
        model: request.model,
        usage: {
          inferenceTime: result.timings?.inference,
          requestId: `fal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      }
      
    } catch (error) {
      console.error(`❌ FalProvider: Image generation failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'fal',
        model: request.model
      }
    }
  }

  /**
   * Generate video using Fal.ai
   */
  async generateVideo(request: VideoGenerationRequest): Promise<AIResponse<VideoResult>> {
    try {
      console.log(`🎬 FalProvider: Generating video with model ${request.model}`)
      
      // Authenticate with current project's API key
      const currentProjectId = request.projectId || getCurrentProjectFromServerSync()
      const falKey = await getEnvVar('FAL_KEY', currentProjectId)
      if (!falKey) {
        return {
          success: false,
          error: 'FAL_KEY not configured',
          provider: 'fal',
          model: request.model
        }
      }
      
      fal.config({ credentials: falKey })
      
      // Get the appropriate Fal.ai endpoint for the model
      const endpoint = this.getModelEndpoint(request.model)
      if (!endpoint) {
        return {
          success: false,
          error: `Unsupported model: ${request.model}`,
          provider: 'fal',
          model: request.model
        }
      }
      
      // Prepare input based on model type
      const input = this.prepareVideoInput(request)
      
      // Call Fal.ai API
      const result = await fal.subscribe(endpoint, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log(`🔄 FalProvider: ${request.model} video generation in progress...`)
            update.logs.map((log) => log.message).forEach(console.log)
          }
        }
      }) as any
      
      // Transform result to standard format
      const transformedResult: VideoResult = {
        video: {
          url: result.video?.url || result.video || '',
          duration: result.video?.duration,
          width: result.video?.width,
          height: result.video?.height
        },
        seed: result.seed,
        timings: result.timings
      }
      
      // Save to disk if requested
      if (request.saveToDisk && transformedResult.video?.url) {
        await this.saveVideo(transformedResult, request, result)
      }
      
      return {
        success: true,
        data: transformedResult,
        provider: 'fal',
        model: request.model,
        usage: {
          inferenceTime: result.timings?.inference,
          requestId: `fal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      }
      
    } catch (error) {
      console.error(`❌ FalProvider: Video generation failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'fal',
        model: request.model
      }
    }
  }

  /**
   * Generate audio using Fal.ai ElevenLabs integration
   */
  async generateAudio(request: AudioGenerationRequest): Promise<AIResponse<AudioResult>> {
    try {
      console.log(`🎵 FalProvider: Generating audio with model ${request.model}`)
      
      // Authenticate with current project's API key
      const currentProjectId = request.projectId || getCurrentProjectFromServerSync()
      const falKey = await getEnvVar('FAL_KEY', currentProjectId)
      if (!falKey) {
        return {
          success: false,
          error: 'FAL_KEY not configured',
          provider: 'fal',
          model: request.model
        }
      }
      
      fal.config({ credentials: falKey })
      
      // Get the appropriate Fal.ai endpoint for ElevenLabs
      const endpoint = this.getAudioEndpoint(request.model)
      if (!endpoint) {
        return {
          success: false,
          error: `Unsupported audio model: ${request.model}`,
          provider: 'fal',
          model: request.model
        }
      }
      
      // Prepare input for ElevenLabs TTS
      const input = this.prepareAudioInput(request)
      
      // Call Fal.ai API
      const result = await fal.subscribe(endpoint, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log(`🔄 FalProvider: ${request.model} audio generation in progress...`)
            update.logs.map((log) => log.message).forEach(console.log)
          }
        }
      }) as any
      
      // Transform result to standard format
      const transformedResult: AudioResult = {
        audio: {
          url: result.audio?.url || result.audio_url || '',
          duration: result.audio?.duration || result.duration
        }
      }
      
      return {
        success: true,
        data: transformedResult,
        provider: 'fal',
        model: request.model,
        usage: {
          inferenceTime: result.timings?.inference,
          requestId: `fal-audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      }
      
    } catch (error) {
      console.error(`❌ FalProvider: Audio generation failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'fal',
        model: request.model
      }
    }
  }

  /**
   * Get Fal.ai endpoint for ElevenLabs audio models
   */
  private getAudioEndpoint(model: string): string | null {
    const audioEndpoints: Record<string, string> = {
      'elevenlabs-tts': 'fal-ai/elevenlabs/tts/eleven-v3',
      'elevenlabs-multilingual': 'fal-ai/elevenlabs/tts/eleven-v3',
      'elevenlabs-turbo': 'fal-ai/elevenlabs/tts/eleven-v3'
    }
    
    return audioEndpoints[model] || null
  }

  /**
   * Prepare input for audio generation models
   */
  private prepareAudioInput(request: AudioGenerationRequest): Record<string, unknown> {
    const input: Record<string, unknown> = {
      text: request.text,
      model_id: this.getElevenLabsModelId(request.model)
    }
    
    // Add voice ID if provided
    if (request.voiceId) {
      input.voice_id = request.voiceId
    }
    
    // Add voice settings if provided
    if (request.voiceSettings) {
      input.voice_settings = {
        stability: request.voiceSettings.stability ?? 0.5,
        similarity_boost: request.voiceSettings.similarityBoost ?? 0.75,
        style: request.voiceSettings.style ?? 0.0,
        use_speaker_boost: request.voiceSettings.useSpeakerBoost ?? true
      }
    }
    
    // Add output format
    input.output_format = 'mp3_44100_128'
    
    return input
  }

  /**
   * Get ElevenLabs model ID based on our model name
   */
  private getElevenLabsModelId(model: string): string {
    const modelIds: Record<string, string> = {
      'elevenlabs-tts': 'eleven_multilingual_v2',
      'elevenlabs-multilingual': 'eleven_multilingual_v2',
      'elevenlabs-turbo': 'eleven_turbo_v2_5'
    }
    
    return modelIds[model] || 'eleven_multilingual_v2'
  }

  /**
   * Get supported models for a service type
   */
  getModels(serviceType: AIServiceType): string[] {
    switch (serviceType) {
      case AIServiceType.IMAGE_GENERATION:
        return ['flux-lora', 'flux-schnell', 'ideogram-v2', 'flux-kontext', 'flux-2-flex-edit']
      case AIServiceType.VIDEO_GENERATION:
        return ['framepack', 'kling-video', 'kling-video-elements', 'luma-dream', 'minimax-hailuo', 'wan-flf2v', 'pika-scenes']
      case AIServiceType.IMAGE_ENHANCEMENT:
        return ['aura-sr', 'ideogram-upscale']
      case AIServiceType.TEXT_TO_SPEECH:
        return ['elevenlabs-tts', 'elevenlabs-multilingual', 'elevenlabs-turbo']
      default:
        return []
    }
  }

  /**
   * Check if model is supported for service type
   */
  isModelSupported(model: string, serviceType: AIServiceType): boolean {
    return this.getModels(serviceType).includes(model)
  }

  /**
   * Get Fal.ai endpoint for model
   */
  private getModelEndpoint(model: string): string | null {
    const endpoints: Record<string, string> = {
      // Image models
      'flux-lora': 'fal-ai/flux-lora',
      'flux-schnell': 'fal-ai/flux/schnell',
      'ideogram-v2': 'fal-ai/ideogram/v2',
      'flux-kontext': 'fal-ai/flux-pro/kontext',
      'flux-2-flex-edit': 'fal-ai/flux-2-flex/edit',
      'aura-sr': 'fal-ai/aura-sr',
      'ideogram-upscale': 'fal-ai/clarity-upscaler',
      // Video models
      'framepack': 'fal-ai/ltx-video',
      'kling-video': 'fal-ai/kling-video/v1/standard/text-to-video',
      'kling-video-elements': 'fal-ai/kling-video/v1/standard/image-to-video',
      'luma-dream': 'fal-ai/luma-dream-machine',
      'minimax-hailuo': 'fal-ai/minimax/hailuo-02/standard/image-to-video',
      'wan-flf2v': 'fal-ai/wan/flf2v',
      'pika-scenes': 'fal-ai/pika/scenes',
      // Audio models (ElevenLabs via fal.ai)
      'elevenlabs-tts': 'fal-ai/elevenlabs/tts/eleven-v3',
      'elevenlabs-multilingual': 'fal-ai/elevenlabs/tts/eleven-v3',
      'elevenlabs-turbo': 'fal-ai/elevenlabs/tts/eleven-v3'
    }
    
    return endpoints[model] || null
  }

  /**
   * Prepare input for image generation models
   */
  private prepareImageInput(request: ImageGenerationRequest): Record<string, unknown> {
    // Handle flux-kontext differently
    if (request.model === 'flux-kontext') {
      const kontextInput = {
        prompt: request.prompt,
        image_url: request.imageUrl,
        guidance_scale: request.guidanceScale || 3.5,
        sync_mode: false,
        num_images: request.numImages || 1,
        safety_tolerance: (request as any).safetyTolerance || "2",
        output_format: request.outputFormat || 'jpeg',
        aspect_ratio: request.imageSize || '9:16'
      }

      if (request.seed) {
        Object.assign(kontextInput, { seed: request.seed })
      }

      return kontextInput
    }

    // Handle ideogram-v2 differently
    if (request.model === 'ideogram-v2') {
      const ideogramInput = {
        prompt: request.prompt,
        aspect_ratio: request.imageSize || '1:1',
        expand_prompt: (request as any).expandPrompt !== undefined ? (request as any).expandPrompt : true,
        style: (request as any).style || 'auto',
        negative_prompt: (request as any).negativePrompt || ''
      }

      if (request.seed) {
        Object.assign(ideogramInput, { seed: request.seed })
      }

      return ideogramInput
    }

    // Default handling for other models (flux-lora, etc.)
    const baseInput = {
      prompt: request.prompt,
      image_size: request.imageSize || 'portrait_16_9',
      num_inference_steps: request.numInferenceSteps || 28,
      guidance_scale: request.guidanceScale || 3.5,
      num_images: request.numImages || 1,
      enable_safety_checker: request.enableSafetyChecker !== false,
      output_format: request.outputFormat || 'jpeg'
    }

    // Add model-specific parameters
    if (request.model === 'flux-lora' && request.loras) {
      return { ...baseInput, loras: request.loras }
    }
    
    if (request.seed) {
      return { ...baseInput, seed: request.seed }
    }

    return baseInput
  }

  /**
   * Prepare input for video generation models
   */
  private prepareVideoInput(request: VideoGenerationRequest): Record<string, unknown> {
    const baseInput = {
      prompt: request.prompt
    }

    // Add model-specific parameters
    if (request.imageUrl) {
      Object.assign(baseInput, { image_url: request.imageUrl })
    }

    if (request.duration) {
      Object.assign(baseInput, { duration: request.duration })
    }

    if (request.aspectRatio) {
      Object.assign(baseInput, { aspect_ratio: request.aspectRatio })
    }

    return baseInput
  }

  /**
   * Save generated images using MediaSaverService
   */
  private async saveImages(
    result: ImageResult, 
    request: ImageGenerationRequest, 
    rawResult: any
  ): Promise<void> {
    const currentProjectId = request.projectId || getCurrentProjectFromServerSync()
    
    for (let i = 0; i < result.images.length; i++) {
      const image = result.images[i]
      const concept = request.concept || extractConceptFromPrompt(request.prompt)
      const requestId = `fal-${request.model}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const saveRequest = createImageSaveRequest(
        image.url,
        concept,
        request.prompt,
        request.originalPrompt || request.prompt,
        'fal',
        request.model,
        `/api/fal/${request.model}`,
        requestId,
        currentProjectId,
        {
          imageSize: request.imageSize,
          numInferenceSteps: request.numInferenceSteps,
          guidanceScale: request.guidanceScale,
          numImages: request.numImages,
          enableSafetyChecker: request.enableSafetyChecker,
          outputFormat: request.outputFormat,
          loras: request.loras
        },
        {
          seed: result.seed,
          inferenceTime: result.timings?.inference,
          hasNsfwConcepts: result.hasNsfwConcepts
        },
        rawResult,
        {
          userPrompt: request.userPrompt,
          characterName: request.characterName,
          sceneName: request.sceneName,
          index: i,
          providerSpecificData: {
            falImageUrl: image.url,
            endpoint: this.getModelEndpoint(request.model)
          }
        }
      )
      
      const saveResult = await mediaSaverService.saveMedia(saveRequest)
      if (!saveResult.success) {
        console.warn(`⚠️ FalProvider: Failed to save image ${i}:`, saveResult.error)
      }
    }
  }

  /**
   * Save generated video using MediaSaverService
   */
  private async saveVideo(
    result: VideoResult, 
    request: VideoGenerationRequest, 
    rawResult: any
  ): Promise<void> {
    const currentProjectId = request.projectId || getCurrentProjectFromServerSync()
    const concept = request.concept || extractConceptFromPrompt(request.prompt)
    const requestId = `fal-${request.model}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const saveRequest = createVideoSaveRequest(
      result.video.url,
      concept,
      request.prompt,
      request.originalPrompt || request.prompt,
      'fal',
      request.model,
      `/api/fal/${request.model}`,
      requestId,
      currentProjectId,
      {
        duration: request.duration,
        aspectRatio: request.aspectRatio,
        imageUrl: request.imageUrl
      },
      {
        seed: result.seed,
        inferenceTime: result.timings?.inference,
        videoDuration: result.video.duration,
        videoWidth: result.video.width,
        videoHeight: result.video.height
      },
      rawResult,
      {
        userPrompt: request.userPrompt,
        characterName: request.characterName,
        sceneName: request.sceneName,
        providerSpecificData: {
          falVideoUrl: result.video.url,
          endpoint: this.getModelEndpoint(request.model)
        }
      }
    )
    
    const saveResult = await mediaSaverService.saveMedia(saveRequest)
    if (!saveResult.success) {
      console.warn(`⚠️ FalProvider: Failed to save video:`, saveResult.error)
    }
  }
} 