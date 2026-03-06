/**
 * Audio Service for Forge
 * Manages audio generation and playback via ElevenLabs/fal.ai
 */

export interface AudioMetadata {
  id: string;
  filename: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  fileSize: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
  script?: string;
  voiceId?: string;
  voiceName?: string;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface AudioGenerationOptions {
  text: string;
  voiceId?: string;
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  model?: 'elevenlabs-tts' | 'elevenlabs-multilingual' | 'elevenlabs-turbo';
  projectId?: string;
  scriptTitle?: string;
}

export interface AudioGenerationResult {
  success: boolean;
  audioUrl?: string;
  localPath?: string;
  duration?: number;
  error?: string;
}

// Default ElevenLabs voices (commonly available)
export const DEFAULT_VOICES: ElevenLabsVoice[] = [
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', category: 'premade', description: 'Soft female voice' },
  { voice_id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', category: 'premade', description: 'Young male voice' },
  { voice_id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', category: 'premade', description: 'Warm female voice' },
  { voice_id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', category: 'premade', description: 'Soft female voice' },
  { voice_id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', category: 'premade', description: 'Deep male voice' },
  { voice_id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', category: 'premade', description: 'Conversational male voice' },
  { voice_id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', category: 'premade', description: 'Casual male voice' },
  { voice_id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', category: 'premade', description: 'Warm female voice' },
  { voice_id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', category: 'premade', description: 'Trustworthy male voice' },
  { voice_id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', category: 'premade', description: 'Deep American male voice' }
];

/**
 * Generate audio from text using ElevenLabs via fal.ai
 */
export const generateAudio = async (options: AudioGenerationOptions): Promise<AudioGenerationResult> => {
  try {
    const response = await fetch('/api/audio/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: options.text,
        voiceId: options.voiceId || DEFAULT_VOICES[0].voice_id,
        voiceSettings: options.voiceSettings,
        model: options.model || 'elevenlabs-tts',
        projectId: options.projectId,
        scriptTitle: options.scriptTitle
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      audioUrl: result.audioUrl,
      localPath: result.localPath,
      duration: result.duration
    };
  } catch (error) {
    console.error('Error generating audio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get all audio files for a project
 */
export const getAudioFiles = async (projectId: string = 'default'): Promise<AudioMetadata[]> => {
  try {
    const response = await fetch(`/api/audio/list?projectId=${projectId}`);
    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    }
    
    console.error('Failed to load audio files:', result.error);
    return [];
  } catch (error) {
    console.error('Error loading audio files:', error);
    return [];
  }
};

/**
 * Delete an audio file
 */
export const deleteAudioFile = async (audioId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/audio/${audioId}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return false;
  }
};

/**
 * Get voice list (uses defaults, can be extended for custom voices)
 */
export const getAvailableVoices = (): ElevenLabsVoice[] => {
  return DEFAULT_VOICES;
};
