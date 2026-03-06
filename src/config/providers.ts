import { ProviderConfig, AIServiceType } from '@/lib/providers/types'

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  fal: {
    name: 'fal',
    displayName: 'Fal.ai',
    models: {
      'nano-banana-2': { 
        service: AIServiceType.IMAGE_GENERATION, 
        endpoint: 'fal-ai/nano-banana-2',
        pricing: 0.04 
      },
      'flux-lora': { 
        service: AIServiceType.IMAGE_GENERATION, 
        endpoint: 'fal-ai/flux-lora',
        pricing: 0.05 
      },
      'flux-schnell': { 
        service: AIServiceType.IMAGE_GENERATION, 
        endpoint: 'fal-ai/flux/schnell',
        pricing: 0.03 
      },
      'ideogram-v2': { 
        service: AIServiceType.IMAGE_GENERATION, 
        endpoint: 'fal-ai/ideogram/v2',
        pricing: 0.08 
      },
      'flux-kontext': { 
        service: AIServiceType.IMAGE_GENERATION, 
        endpoint: 'fal-ai/flux-lora-kontext',
        pricing: 0.055 
      },
      'aura-sr': { 
        service: AIServiceType.IMAGE_ENHANCEMENT, 
        endpoint: 'fal-ai/aura-sr',
        pricing: 0.02 
      },
      'ideogram-upscale': { 
        service: AIServiceType.IMAGE_ENHANCEMENT, 
        endpoint: 'fal-ai/clarity-upscaler',
        pricing: 0.025 
      },
      'veo3-fast': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: 'fal-ai/veo3.1/fast/image-to-video',
        pricing: 0.35 
      },
      'framepack': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: 'fal-ai/ltx-video',
        pricing: 0.25 
      },
      'kling-video': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: 'fal-ai/kling-video/v1/standard/text-to-video',
        pricing: 0.3 
      },
      'kling-video-elements': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: 'fal-ai/kling-video/v1/standard/image-to-video',
        pricing: 0.35 
      },
      'luma-dream': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: 'fal-ai/luma-dream-machine',
        pricing: 0.4 
      },
      'minimax-hailuo': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
        pricing: 0.45 
      },
      'wan-flf2v': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: 'fal-ai/wan/flf2v',
        pricing: 0.28 
      },
      'pika-scenes': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: 'fal-ai/pika/scenes',
        pricing: 0.32 
      },
      // ElevenLabs TTS via fal.ai
      'elevenlabs-tts': {
        service: AIServiceType.TEXT_TO_SPEECH,
        endpoint: 'fal-ai/elevenlabs/tts/eleven-v3',
        pricing: 0.24 // per 1k characters
      },
      'elevenlabs-multilingual': {
        service: AIServiceType.TEXT_TO_SPEECH,
        endpoint: 'fal-ai/elevenlabs/tts/eleven-v3',
        pricing: 0.24 // per 1k characters
      },
      'elevenlabs-turbo': {
        service: AIServiceType.TEXT_TO_SPEECH,
        endpoint: 'fal-ai/elevenlabs/tts/eleven-v3',
        pricing: 0.18 // per 1k characters
      }
    },
    pricing: { 
      image: 0.05, 
      video: 0.25,
      upscale: 0.02,
      audio: 0.24
    },
    rateLimit: { 
      rpm: 60, 
      rph: 3600 
    },
    authentication: {
      type: 'api_key',
      keyName: 'FAL_KEY'
    }
  },

  pixverse: {
    name: 'pixverse',
    displayName: 'PixVerse',
    models: {
      'text-to-video': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: '/v1/video/generate',
        pricing: 0.15 
      },
      'image-to-video': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: '/v1/video/animate',
        pricing: 0.18 
      },
      'effects': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: '/v1/video/effects',
        pricing: 0.12 
      },
      'transition': { 
        service: AIServiceType.VIDEO_GENERATION, 
        endpoint: '/v1/video/transition',
        pricing: 0.14 
      }
    },
    pricing: { 
      video: 0.15 
    },
    rateLimit: { 
      rpm: 30, 
      rph: 1800 
    },
    authentication: {
      type: 'api_key',
      keyName: 'PIXVERSE_API_KEY'
    }
  },

  replicate: {
    name: 'replicate',
    displayName: 'Replicate',
    models: {
      'flux-schnell': { 
        service: AIServiceType.IMAGE_GENERATION, 
        model: 'black-forest-labs/flux-schnell',
        pricing: 0.003 
      },
      'flux-dev': { 
        service: AIServiceType.IMAGE_GENERATION, 
        model: 'black-forest-labs/flux-dev',
        pricing: 0.055 
      },
      'sdxl': { 
        service: AIServiceType.IMAGE_GENERATION, 
        model: 'stability-ai/sdxl',
        pricing: 0.02 
      },
      'stable-video': { 
        service: AIServiceType.VIDEO_GENERATION, 
        model: 'stability-ai/stable-video-diffusion',
        pricing: 0.01 
      },
      'runway-gen2': { 
        service: AIServiceType.VIDEO_GENERATION, 
        model: 'runwayml/runway-gen2',
        pricing: 0.12 
      },
      'musicgen': { 
        service: AIServiceType.AUDIO_GENERATION, 
        model: 'meta/musicgen',
        pricing: 0.008 
      }
    },
    pricing: { 
      image: 0.003, 
      video: 0.01,
      audio: 0.008
    },
    rateLimit: { 
      rpm: 50, 
      rph: 3000 
    },
    authentication: {
      type: 'api_key',
      keyName: 'REPLICATE_API_TOKEN'
    }
  },

  elevenlabs: {
    name: 'elevenlabs',
    displayName: 'ElevenLabs',
    models: {
      'multilingual-v2': { 
        service: AIServiceType.TEXT_TO_SPEECH, 
        model: 'eleven_multilingual_v2',
        pricing: 0.24 // per 1k characters
      },
      'turbo-v2': { 
        service: AIServiceType.TEXT_TO_SPEECH, 
        model: 'eleven_turbo_v2_5',
        pricing: 0.18 // per 1k characters
      },
      'english-v1': { 
        service: AIServiceType.TEXT_TO_SPEECH, 
        model: 'eleven_monolingual_v1',
        pricing: 0.22 // per 1k characters
      },
      'voice-clone': { 
        service: AIServiceType.AUDIO_GENERATION, 
        endpoint: '/v1/voice-generation/generate-voice',
        pricing: 1.0 // per voice generation
      }
    },
    pricing: { 
      audio: 0.24 // per 1k characters
    },
    rateLimit: { 
      rpm: 120, 
      rph: 7200 
    },
    authentication: {
      type: 'api_key',
      keyName: 'ELEVENLABS_API_KEY'
    }
  }
} as const

// Helper functions
export function getProviderConfig(providerName: string): ProviderConfig | null {
  return PROVIDER_CONFIGS[providerName] || null
}

export function getAllProviderConfigs(): ProviderConfig[] {
  return Object.values(PROVIDER_CONFIGS)
}

export function getProvidersForService(serviceType: AIServiceType): string[] {
  return Object.entries(PROVIDER_CONFIGS)
    .filter(([_, config]) => 
      Object.values(config.models).some(model => model.service === serviceType)
    )
    .map(([name, _]) => name)
}

export function getModelConfig(providerName: string, modelName: string) {
  const config = getProviderConfig(providerName)
  return config?.models[modelName] || null
}

// Provider capability matrix
export const PROVIDER_CAPABILITIES = {
  [AIServiceType.IMAGE_GENERATION]: ['fal', 'replicate'],
  [AIServiceType.VIDEO_GENERATION]: ['fal', 'pixverse', 'replicate'],
  [AIServiceType.AUDIO_GENERATION]: ['replicate', 'elevenlabs'],
  [AIServiceType.IMAGE_ENHANCEMENT]: ['fal'],
  [AIServiceType.TEXT_TO_SPEECH]: ['fal', 'elevenlabs'],
  [AIServiceType.SPEECH_TO_TEXT]: []
} as const 