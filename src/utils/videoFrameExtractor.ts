import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

export interface ExtractFrameOptions {
  videoPath: string // Full path or relative path starting with /videos/
  framePosition: 'first' | 'last' | 'middle' | string // string for timestamp like "00:00:05.000"
  outputFormat?: 'jpg' | 'png'
  outputDir?: string // Defaults to public/images/extracted-frames
  customFilename?: string // Optional custom filename (without extension)
}

export interface ExtractFrameResult {
  success: boolean
  framePath?: string // Relative path like /images/extracted-frames/...
  fullPath?: string // Full filesystem path
  width?: number
  height?: number
  error?: string
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
      const duration = metadata.format.duration || 0
      resolve(duration)
    })
  })
}

/**
 * Get video dimensions using ffprobe
 */
async function getVideoDimensions(videoPath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      const videoStream = metadata.streams.find(s => s.codec_type === 'video')
      if (videoStream && videoStream.width && videoStream.height) {
        resolve({ width: videoStream.width, height: videoStream.height })
      } else {
        resolve({ width: 1920, height: 1080 }) // Default fallback
      }
    })
  })
}

/**
 * Convert frame position to timestamp string
 */
async function getTimestamp(position: string, videoPath: string): Promise<string> {
  if (position === 'first') {
    return '00:00:00.100' // Skip first 100ms to avoid black frames
  }
  
  if (position === 'last') {
    const duration = await getVideoDuration(videoPath)
    // Get frame at 95% of video duration to ensure we have content
    const lastFrameTime = Math.max(0.1, duration - 0.1)
    const hours = Math.floor(lastFrameTime / 3600)
    const minutes = Math.floor((lastFrameTime % 3600) / 60)
    const seconds = lastFrameTime % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`
  }
  
  if (position === 'middle') {
    const duration = await getVideoDuration(videoPath)
    const middleTime = duration / 2
    const hours = Math.floor(middleTime / 3600)
    const minutes = Math.floor((middleTime % 3600) / 60)
    const seconds = middleTime % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`
  }
  
  // Assume it's already a timestamp string
  return position
}

/**
 * Extract a single frame from a video file
 */
export async function extractFrame(options: ExtractFrameOptions): Promise<ExtractFrameResult> {
  const {
    videoPath,
    framePosition,
    outputFormat = 'jpg',
    outputDir = 'public/images/extracted-frames',
    customFilename
  } = options

  try {
    // Resolve full video path
    let fullVideoPath = videoPath
    if (videoPath.startsWith('/videos/') || videoPath.startsWith('/images/')) {
      fullVideoPath = path.join(process.cwd(), 'public', videoPath)
    } else if (!path.isAbsolute(videoPath)) {
      fullVideoPath = path.join(process.cwd(), videoPath)
    }

    // Verify video exists
    if (!fs.existsSync(fullVideoPath)) {
      return {
        success: false,
        error: `Video file not found: ${fullVideoPath}`
      }
    }

    // Ensure output directory exists
    const fullOutputDir = path.isAbsolute(outputDir) 
      ? outputDir 
      : path.join(process.cwd(), outputDir)
    
    if (!fs.existsSync(fullOutputDir)) {
      fs.mkdirSync(fullOutputDir, { recursive: true })
    }

    // Generate output filename
    const videoBasename = path.basename(videoPath, path.extname(videoPath))
    const timestamp = Date.now()
    const positionSuffix = framePosition === 'last' ? 'last' 
      : framePosition === 'first' ? 'first'
      : framePosition === 'middle' ? 'middle'
      : 'frame'
    
    const outputFilename = customFilename 
      ? `${customFilename}.${outputFormat}`
      : `${videoBasename}-${positionSuffix}-${timestamp}.${outputFormat}`

    const fullOutputPath = path.join(fullOutputDir, outputFilename)

    // Get timestamp for frame extraction
    const extractTimestamp = await getTimestamp(framePosition, fullVideoPath)
    console.log(`🎞️  Extracting frame at ${extractTimestamp} from ${path.basename(videoPath)}`)

    // Get video dimensions for the output
    const dimensions = await getVideoDimensions(fullVideoPath)

    // Extract the frame
    return new Promise((resolve) => {
      ffmpeg(fullVideoPath)
        .seekInput(extractTimestamp)
        .frames(1)
        .outputOptions([
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
          '-q:v', '2' // High quality for JPG
        ])
        .output(fullOutputPath)
        .on('end', () => {
          // Calculate relative path for web serving
          const relativePath = fullOutputPath.includes('public/')
            ? fullOutputPath.split('public')[1]
            : `/images/extracted-frames/${outputFilename}`

          console.log(`✅ Frame extracted: ${relativePath}`)
          
          resolve({
            success: true,
            framePath: relativePath,
            fullPath: fullOutputPath,
            width: dimensions.width,
            height: dimensions.height
          })
        })
        .on('error', (err) => {
          console.error(`❌ Frame extraction failed:`, err)
          resolve({
            success: false,
            error: err.message
          })
        })
        .run()
    })
  } catch (error) {
    console.error(`❌ Frame extraction error:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Extract the last frame from a video and save it for chaining
 * This is a convenience function specifically for video chaining workflows
 */
export async function extractLastFrameForChaining(
  videoPath: string,
  projectId?: string
): Promise<ExtractFrameResult> {
  return extractFrame({
    videoPath,
    framePosition: 'last',
    outputFormat: 'jpg',
    outputDir: 'public/images/extracted-frames'
  })
}

/**
 * Save extracted frame metadata to database
 */
export async function saveFrameToDatabase(
  framePath: string,
  sourceVideoPath: string,
  projectId: string,
  dimensions: { width: number; height: number },
  additionalMetadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const { databaseService } = await import('@/services/databaseService')
    
    const filename = path.basename(framePath)
    const timestamp = new Date().toISOString()
    
    const imageMetadata = {
      id: `extracted-frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename,
      filepath: framePath,
      title: `Extracted Frame`,
      description: `Last frame extracted from ${path.basename(sourceVideoPath)} for video chaining`,
      createdAt: timestamp,
      updatedAt: timestamp,
      projectId,
      width: dimensions.width,
      height: dimensions.height,
      fileSize: 0, // Will be calculated if needed
      metadata: {
        source_video: sourceVideoPath,
        extraction_type: 'last_frame',
        purpose: 'video_chaining',
        extracted_at: timestamp,
        ...additionalMetadata
      }
    }

    const saved = await databaseService.saveImage(imageMetadata)
    if (saved) {
      console.log(`💾 Extracted frame saved to database: ${framePath}`)
    }
    return saved
  } catch (error) {
    console.error('Failed to save extracted frame to database:', error)
    return false
  }
}

