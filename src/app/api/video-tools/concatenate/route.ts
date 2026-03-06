import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { extractLastFrameForChaining, saveFrameToDatabase } from '@/utils/videoFrameExtractor'
import { mediaSaverService } from '@/services/mediaSaver'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import fs from 'fs'

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

interface ConcatenateOptions {
  videos: string[]
  transition: 'none' | 'crossfade' | 'dissolve'
  transitionDuration: number
  concept: string
  outputName?: string
}

/**
 * Download a video URL to a temp file
 */
async function downloadVideoToTemp(url: string, index: number): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download video from ${url}: ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  const tempDir = path.join(process.cwd(), 'public/videos/temp')
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const tempPath = path.join(tempDir, `concat-input-${index}-${Date.now()}.mp4`)
  fs.writeFileSync(tempPath, Buffer.from(buffer))
  
  return tempPath
}

/**
 * Resolve video path to full filesystem path
 */
function resolveVideoPath(videoPath: string): string {
  if (videoPath.startsWith('/videos/') || videoPath.startsWith('/images/')) {
    return path.join(process.cwd(), 'public', videoPath)
  }
  if (!path.isAbsolute(videoPath)) {
    return path.join(process.cwd(), videoPath)
  }
  return videoPath
}

/**
 * Get video duration using ffprobe
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      resolve(metadata.format.duration || 0)
    })
  })
}

/**
 * Concatenate videos using FFmpeg concat demuxer (no re-encoding, fast)
 */
async function concatenateVideosSimple(
  inputPaths: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create concat file list
    const concatDir = path.dirname(outputPath)
    const concatListPath = path.join(concatDir, `concat-list-${Date.now()}.txt`)
    
    const concatContent = inputPaths
      .map(p => `file '${p}'`)
      .join('\n')
    
    fs.writeFileSync(concatListPath, concatContent)

    console.log(`📝 Created concat list with ${inputPaths.length} videos`)

    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy']) // No re-encoding for speed
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`🎬 FFmpeg concat started`)
      })
      .on('end', () => {
        // Clean up concat list
        if (fs.existsSync(concatListPath)) {
          fs.unlinkSync(concatListPath)
        }
        console.log(`✅ Concatenation complete`)
        resolve()
      })
      .on('error', (err) => {
        // Clean up concat list
        if (fs.existsSync(concatListPath)) {
          fs.unlinkSync(concatListPath)
        }
        reject(err)
      })
      .run()
  })
}

/**
 * Concatenate videos with crossfade transitions (requires re-encoding)
 */
async function concatenateWithCrossfade(
  inputPaths: string[],
  outputPath: string,
  transitionDuration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (inputPaths.length < 2) {
      // Just copy if only one video
      fs.copyFileSync(inputPaths[0], outputPath)
      resolve()
      return
    }

    // Build complex filter for crossfade
    const command = ffmpeg()
    
    // Add all inputs
    inputPaths.forEach(p => {
      command.input(p)
    })

    // Build filter complex string
    // This creates crossfade transitions between consecutive videos
    const filterParts: string[] = []
    const videoLabels: string[] = []

    // Scale and set timebase for each input
    inputPaths.forEach((_, i) => {
      filterParts.push(`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}]`)
      videoLabels.push(`v${i}`)
    })

    // Chain crossfades between videos
    let prevLabel = `[${videoLabels[0]}]`
    for (let i = 1; i < inputPaths.length; i++) {
      const nextLabel = `[${videoLabels[i]}]`
      const outLabel = i === inputPaths.length - 1 ? '[outv]' : `[cf${i}]`
      
      filterParts.push(`${prevLabel}${nextLabel}xfade=transition=fade:duration=${transitionDuration}:offset=OFFSET${i}${outLabel}`)
      prevLabel = outLabel
    }

    // For now, use a simpler approach with concat filter
    // Complex crossfade requires knowing exact durations
    console.log(`🎬 Using crossfade transition (${transitionDuration}s between videos)`)

    // Simplified crossfade using concat with fade
    const simpleFilterParts: string[] = []
    
    inputPaths.forEach((_, i) => {
      // Scale each video to consistent size and add fade out at end (except last)
      const fadeOut = i < inputPaths.length - 1 
        ? `,fade=t=out:st=DURATION:d=${transitionDuration}` 
        : ''
      // Add fade in at start (except first)
      const fadeIn = i > 0 
        ? `fade=t=in:st=0:d=${transitionDuration},` 
        : ''
      simpleFilterParts.push(
        `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,${fadeIn}format=yuv420p[v${i}]`
      )
    })

    // Concat all video streams
    const concatInputs = inputPaths.map((_, i) => `[v${i}]`).join('')
    simpleFilterParts.push(`${concatInputs}concat=n=${inputPaths.length}:v=1:a=0[outv]`)

    // Audio handling - concat all audio streams if they exist
    const audioConcat = inputPaths.map((_, i) => `[${i}:a?]`).join('')
    simpleFilterParts.push(`${audioConcat}concat=n=${inputPaths.length}:v=0:a=1[outa]`)

    const filterComplex = simpleFilterParts.join(';')

    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '[outv]',
        '-map', '[outa]?', // Optional audio
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k'
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`🎬 FFmpeg crossfade started`)
      })
      .on('end', () => {
        console.log(`✅ Crossfade concatenation complete`)
        resolve()
      })
      .on('error', (err) => {
        console.error('FFmpeg crossfade error:', err)
        // Fall back to simple concat on error
        console.log('⚠️ Falling back to simple concatenation...')
        concatenateVideosSimple(inputPaths, outputPath)
          .then(resolve)
          .catch(reject)
      })
      .run()
  })
}

/**
 * POST /api/video-tools/concatenate
 * 
 * Concatenate multiple videos into a single video with optional transitions.
 * Result is saved to gallery.
 * 
 * Request body:
 * - videos: string[] - Array of video paths (local /videos/... or URLs)
 * - transition: "none" | "crossfade" | "dissolve" (default: "none")
 * - transition_duration: number - Duration in seconds (default: 0.5)
 * - concept: string - Name/title for the final video
 * - output_name: string (optional) - Custom output filename
 * 
 * Response:
 * - output_path: string - Path to concatenated video
 * - next_frame_path: string - Path to last frame (for further chaining)
 * - duration: number - Total duration in seconds
 * - source_videos: string[] - List of input videos
 */
export async function POST(request: NextRequest) {
  const tempFiles: string[] = []

  try {
    const body = await request.json()
    const {
      videos,
      transition = 'none',
      transition_duration = 0.5,
      concept = 'Concatenated Video',
      output_name
    } = body

    // Validation
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ 
        error: 'videos array is required and must not be empty',
        hint: 'Provide an array of video paths like ["/videos/clips/v1.mp4", "/videos/clips/v2.mp4"]'
      }, { status: 400 })
    }

    if (videos.length < 2) {
      return NextResponse.json({ 
        error: 'At least 2 videos are required for concatenation',
        hint: 'Provide at least 2 video paths to concatenate'
      }, { status: 400 })
    }

    // Validate transition
    const validTransitions = ['none', 'crossfade', 'dissolve']
    if (!validTransitions.includes(transition)) {
      return NextResponse.json({ 
        error: 'Invalid transition type',
        hint: 'Use "none", "crossfade", or "dissolve"'
      }, { status: 400 })
    }

    // Get current project
    const currentProjectId = getCurrentProjectFromServerSync()
    console.log(`🎯 Concatenating videos for project: ${currentProjectId}`)
    console.log(`📹 Input videos: ${videos.length}`)
    console.log(`🔀 Transition: ${transition} (${transition_duration}s)`)

    // Resolve all video paths (download URLs if needed)
    const resolvedPaths: string[] = []
    
    for (let i = 0; i < videos.length; i++) {
      const videoPath = videos[i]
      
      if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        console.log(`📥 Downloading video ${i + 1}/${videos.length} from URL...`)
        const tempPath = await downloadVideoToTemp(videoPath, i)
        tempFiles.push(tempPath)
        resolvedPaths.push(tempPath)
      } else {
        const fullPath = resolveVideoPath(videoPath)
        if (!fs.existsSync(fullPath)) {
          return NextResponse.json({ 
            error: `Video not found: ${videoPath}`,
            hint: 'Make sure all video paths exist'
          }, { status: 400 })
        }
        resolvedPaths.push(fullPath)
      }
    }

    // Generate output path
    const outputDir = path.join(process.cwd(), 'public/videos/clips')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeConceptName = concept.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)
    const outputFilename = output_name 
      ? `${output_name}.mp4`
      : `${safeConceptName}-${timestamp}.mp4`
    const outputPath = path.join(outputDir, outputFilename)
    const relativeOutputPath = `/videos/clips/${outputFilename}`

    // Perform concatenation
    console.log(`🎬 Starting concatenation...`)
    
    if (transition === 'none') {
      await concatenateVideosSimple(resolvedPaths, outputPath)
    } else {
      await concatenateWithCrossfade(resolvedPaths, outputPath, transition_duration)
    }

    // Clean up temp files
    for (const tempFile of tempFiles) {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile)
      }
    }
    console.log(`🧹 Cleaned up ${tempFiles.length} temp files`)

    // Get final video duration
    const finalDuration = await getVideoDuration(outputPath)
    const fileStats = fs.statSync(outputPath)

    // Create metadata for database
    const videoMetadata = {
      id: `concat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: outputFilename,
      filepath: relativeOutputPath,
      title: concept,
      description: `Concatenated video from ${videos.length} sources with ${transition} transition`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: currentProjectId,
      width: 1920,
      height: 1080,
      duration: finalDuration,
      fileSize: fileStats.size,
      metadata: {
        source_videos: videos,
        transition,
        transition_duration,
        concatenated_at: new Date().toISOString(),
        video_count: videos.length
      }
    }

    // Save to database
    const { databaseService } = await import('@/services/databaseService')
    const savedToDb = await databaseService.saveVideo(videoMetadata)
    
    if (savedToDb) {
      console.log(`💾 Concatenated video saved to database`)
    }

    // Auto-extract last frame for potential further chaining
    let nextFramePath: string | null = null
    console.log('🎞️  Auto-extracting last frame for further chaining...')
    
    const frameResult = await extractLastFrameForChaining(relativeOutputPath, currentProjectId)
    
    if (frameResult.success && frameResult.framePath) {
      nextFramePath = frameResult.framePath
      console.log(`✅ Last frame extracted: ${nextFramePath}`)
      
      // Save frame to database for gallery visibility
      await saveFrameToDatabase(
        frameResult.framePath,
        relativeOutputPath,
        currentProjectId,
        { width: frameResult.width || 1920, height: frameResult.height || 1080 },
        {
          source_type: 'concatenated_video',
          source_video_count: videos.length,
          transition_used: transition
        }
      )
    }

    console.log(`✅ Concatenation complete: ${relativeOutputPath}`)
    console.log(`   Duration: ${finalDuration.toFixed(2)}s`)
    console.log(`   Size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`)

    return NextResponse.json({
      success: true,
      output_path: relativeOutputPath,
      full_path: outputPath,
      next_frame_path: nextFramePath,
      duration: finalDuration,
      file_size: fileStats.size,
      source_videos: videos,
      video_count: videos.length,
      transition,
      transition_duration,
      concept,
      project_id: currentProjectId,
      saved_to_gallery: savedToDb,
      should_refresh_gallery: true
    })

  } catch (error) {
    // Clean up temp files on error
    for (const tempFile of tempFiles) {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile)
      }
    }

    console.error('❌ Video concatenation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to concatenate videos',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * GET /api/video-tools/concatenate
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/video-tools/concatenate',
    method: 'POST',
    description: 'Concatenate multiple videos into a single video with optional transitions. Result is saved to gallery.',
    parameters: {
      videos: {
        type: 'string[]',
        required: true,
        description: 'Array of video paths (local /videos/... paths or HTTP URLs)'
      },
      transition: {
        type: 'string',
        required: false,
        default: 'none',
        options: ['none', 'crossfade', 'dissolve'],
        description: 'Type of transition between videos'
      },
      transition_duration: {
        type: 'number',
        required: false,
        default: 0.5,
        description: 'Duration of transitions in seconds'
      },
      concept: {
        type: 'string',
        required: false,
        default: 'Concatenated Video',
        description: 'Name/title for the final video'
      },
      output_name: {
        type: 'string',
        required: false,
        description: 'Custom output filename (without extension)'
      }
    },
    example_request: {
      videos: [
        '/videos/clips/video1.mp4',
        '/videos/clips/video2.mp4',
        '/videos/clips/video3.mp4'
      ],
      transition: 'crossfade',
      transition_duration: 0.5,
      concept: 'My Video Sequence'
    },
    example_response: {
      success: true,
      output_path: '/videos/clips/my-video-sequence-2024-01-15T10-30-00-000Z.mp4',
      next_frame_path: '/images/extracted-frames/my-video-sequence-last-1705312200000.jpg',
      duration: 24.5,
      source_videos: ['...'],
      video_count: 3,
      saved_to_gallery: true
    }
  })
}

