import { NextRequest, NextResponse } from 'next/server';
import * as fal from '@fal-ai/serverless-client';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getEnvVar } from '@/lib/envUtils';
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils';

interface AudioGenerationRequest {
  text: string;
  voiceId?: string;
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  model?: string;
  projectId?: string;
  scriptTitle?: string;
}

interface FalAudioResult {
  audio?: {
    url?: string;
    duration?: number;
  };
  audio_url?: string;
  duration?: number;
  timings?: Record<string, number>;
}

export async function POST(request: NextRequest) {
  try {
    const body: AudioGenerationRequest = await request.json();
    
    const { 
      text, 
      voiceId = 'EXAVITQu4vr4xnSDxMaL', // Sarah - default voice
      voiceSettings,
      model = 'elevenlabs-tts',
      projectId,
      scriptTitle
    } = body;
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text is required for audio generation' },
        { status: 400 }
      );
    }

    console.log('🎵 Audio Generation Request:', {
      textLength: text.length,
      voiceId,
      model,
      projectId,
      scriptTitle
    });

    // Get project ID
    const currentProjectId = projectId || getCurrentProjectFromServerSync() || 'default';
    
    // Get FAL_KEY
    const falKey = await getEnvVar('FAL_KEY', currentProjectId);
    if (!falKey) {
      return NextResponse.json(
        { success: false, error: 'FAL_KEY not configured' },
        { status: 500 }
      );
    }

    // Configure fal client
    fal.config({ credentials: falKey });

    // Prepare input for ElevenLabs TTS via fal.ai
    const input: Record<string, unknown> = {
      text: text,
      voice_id: voiceId,
      model_id: model === 'elevenlabs-turbo' ? 'eleven_turbo_v2_5' : 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128'
    };

    // Add voice settings if provided
    if (voiceSettings) {
      input.voice_settings = {
        stability: voiceSettings.stability ?? 0.5,
        similarity_boost: voiceSettings.similarityBoost ?? 0.75,
        style: voiceSettings.style ?? 0.0,
        use_speaker_boost: voiceSettings.useSpeakerBoost ?? true
      };
    }

    console.log('🔄 Calling fal.ai ElevenLabs endpoint...');
    
    // Call fal.ai ElevenLabs endpoint
    const result = await fal.subscribe('fal-ai/elevenlabs/tts/eleven-v3', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('🔄 Audio generation in progress...');
          update.logs.map((log) => log.message).forEach(console.log);
        }
      }
    }) as FalAudioResult;

    // Extract audio URL
    const audioUrl = result.audio?.url || result.audio_url;
    
    if (!audioUrl) {
      return NextResponse.json(
        { success: false, error: 'No audio URL returned from API' },
        { status: 500 }
      );
    }

    console.log('✅ Audio generated successfully:', audioUrl);

    // Save audio file locally
    const audioDir = path.join(process.cwd(), 'public', 'audio', currentProjectId);
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeTitle = (scriptTitle || 'audio').replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50);
    const filename = `${safeTitle}-${timestamp}.mp3`;
    const localPath = path.join(audioDir, filename);
    const publicPath = `/audio/${currentProjectId}/${filename}`;

    // Download and save the audio file
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    await writeFile(localPath, audioBuffer);

    console.log('💾 Audio saved locally:', publicPath);

    // TODO: Save to database when audio table is created

    return NextResponse.json({
      success: true,
      audioUrl: audioUrl,
      localPath: publicPath,
      duration: result.audio?.duration || result.duration,
      filename
    });

  } catch (error) {
    console.error('❌ Audio generation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
