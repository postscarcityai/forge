import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProjectFromServerSync } from '@/lib/serverStateUtils'
import { extractFrame, saveFrameToDatabase } from '@/utils/videoFrameExtractor'
import path from 'path'
import fs from 'fs'

/**
 * POST /api/video-tools/extract-frame
 * 
 * Extract a specific frame from a video file.
 * Useful for manual frame extraction when chaining videos.
 * 
 * Request body:
 * - video_path: string - Path to video (local /videos/... or full URL)
 * - frame_position: "first" | "last" | "middle" | timestamp string (e.g., "00:00:05.000")
 * - output_format: "jpg" | "png" (default: "jpg")
 * - save_to_gallery: boolean (default: true) - Register in database for gallery visibility
 * - custom_filename: string (optional) - Custom filename without extension
 * 
 * Response:
 * - frame_path: string - Relative path to extracted frame
 * - full_path: string - Full filesystem path
 * - width: number
 * - height: number
 * - saved_to_gallery: boolean
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      video_path,
      frame_position = 'last',
      output_format = 'jpg',
      save_to_gallery = true,
      custom_filename
    } = body

    // Validation
    if (!video_path) {
      return NextResponse.json({ 
        error: 'video_path is required',
        hint: 'Provide a local path like /videos/clips/video.mp4 or a URL'
      }, { status: 400 })
    }

    // Validate frame_position
    const validPositions = ['first', 'last', 'middle']
    const isTimestamp = /^\d{2}:\d{2}:\d{2}/.test(frame_position)
    if (!validPositions.includes(frame_position) && !isTimestamp) {
      return NextResponse.json({ 
        error: 'Invalid frame_position',
        hint: 'Use "first", "last", "middle", or a timestamp like "00:00:05.000"'
      }, { status: 400 })
    }

    // Validate output_format
    if (!['jpg', 'png'].includes(output_format)) {
      return NextResponse.json({ 
        error: 'Invalid output_format',
        hint: 'Use "jpg" or "png"'
      }, { status: 400 })
    }

    // Handle URL downloads if needed
    let localVideoPath = video_path
    let tempFile: string | null = null

    if (video_path.startsWith('http://') || video_path.startsWith('https://')) {
      console.log(`📥 Downloading video from URL: ${video_path.substring(0, 80)}...`)
      
      // Download to temp file
      const response = await fetch(video_path)
      if (!response.ok) {
        return NextResponse.json({ 
          error: `Failed to download video: ${response.statusText}`
        }, { status: 400 })
      }

      const videoBuffer = await response.arrayBuffer()
      const tempDir = path.join(process.cwd(), 'public/videos/temp')
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      tempFile = path.join(tempDir, `temp-${Date.now()}.mp4`)
      fs.writeFileSync(tempFile, Buffer.from(videoBuffer))
      localVideoPath = tempFile
      
      console.log(`✅ Video downloaded to temp file`)
    }

    // Get current project
    const currentProjectId = getCurrentProjectFromServerSync()
    console.log(`🎯 Extracting frame for project: ${currentProjectId}`)

    // Extract the frame
    console.log(`🎞️  Extracting ${frame_position} frame from ${path.basename(localVideoPath)}`)
    
    const extractResult = await extractFrame({
      videoPath: localVideoPath,
      framePosition: frame_position,
      outputFormat: output_format,
      customFilename: custom_filename
    })

    // Clean up temp file if we created one
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile)
      console.log('🧹 Cleaned up temp video file')
    }

    if (!extractResult.success) {
      return NextResponse.json({ 
        error: 'Failed to extract frame',
        details: extractResult.error
      }, { status: 500 })
    }

    // Save to database if requested
    let savedToGallery = false
    if (save_to_gallery && extractResult.framePath) {
      savedToGallery = await saveFrameToDatabase(
        extractResult.framePath,
        video_path, // Original video path for reference
        currentProjectId,
        { 
          width: extractResult.width || 1920, 
          height: extractResult.height || 1080 
        },
        {
          frame_position,
          manual_extraction: true,
          extracted_at: new Date().toISOString()
        }
      )
    }

    console.log(`✅ Frame extraction complete: ${extractResult.framePath}`)

    return NextResponse.json({
      success: true,
      frame_path: extractResult.framePath,
      full_path: extractResult.fullPath,
      width: extractResult.width,
      height: extractResult.height,
      saved_to_gallery: savedToGallery,
      project_id: currentProjectId,
      source_video: video_path,
      frame_position,
      should_refresh_gallery: savedToGallery
    })

  } catch (error) {
    console.error('❌ Frame extraction failed:', error)
    return NextResponse.json({ 
      error: 'Failed to extract frame',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * GET /api/video-tools/extract-frame
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/video-tools/extract-frame',
    method: 'POST',
    description: 'Extract a specific frame from a video file for chaining or other uses',
    parameters: {
      video_path: {
        type: 'string',
        required: true,
        description: 'Path to video (local /videos/... path or HTTP URL)'
      },
      frame_position: {
        type: 'string',
        required: false,
        default: 'last',
        options: ['first', 'last', 'middle', 'HH:MM:SS.mmm timestamp'],
        description: 'Which frame to extract from the video'
      },
      output_format: {
        type: 'string',
        required: false,
        default: 'jpg',
        options: ['jpg', 'png'],
        description: 'Output image format'
      },
      save_to_gallery: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Whether to register the frame in the gallery database'
      },
      custom_filename: {
        type: 'string',
        required: false,
        description: 'Custom filename (without extension) for the extracted frame'
      }
    },
    example_request: {
      video_path: '/videos/clips/my-video.mp4',
      frame_position: 'last',
      output_format: 'jpg',
      save_to_gallery: true
    },
    example_response: {
      success: true,
      frame_path: '/images/extracted-frames/my-video-last-1234567890.jpg',
      width: 1920,
      height: 1080,
      saved_to_gallery: true,
      project_id: 'current-project-id'
    }
  })
}

