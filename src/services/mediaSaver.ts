import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import {
  SaveMediaRequest,
  SaveMediaResult,
  StandardizedMetadata
} from '@/types/mediaSaver'
import {
  extractTagsFromPrompt,
  extractConceptFromPrompt,
  getFileExtension,
  getMediaDirectory,
  getMetadataDirectory,
  generateSafeFilename,
  extractDimensionsFromApiResponse,
  extractDurationFromApiResponse,
  isValidMediaUrl,
  isBase64DataUrl,
  decodeBase64DataUrl,
  cleanMetadataForJson
} from '@/utils/mediaUtils'

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

export class MediaSaverService {
  
  /**
   * Save any media (image/video/audio) with standardized metadata
   */
  async saveMedia(request: SaveMediaRequest): Promise<SaveMediaResult> {
    try {
      console.log(`📱 MediaSaverService: Saving ${request.mediaType} from ${request.provider}`)

      // Validate request
      const validationError = this.validateRequest(request)
      if (validationError) {
        return {
          success: false,
          error: validationError
        }
      }

      // 1. Download media from URL
      const mediaBuffer = await this.downloadMedia(request.mediaUrl)

      // 2. Generate standardized filename
      const filename = this.generateFilename(request)

      // 3. Save media file
      const filePath = await this.saveMediaFile(mediaBuffer, filename, request.mediaType)

      // 4. For videos, generate thumbnail
      let thumbnailPath: string | undefined
      if (request.mediaType === 'video') {
        const fullVideoPath = path.join(process.cwd(), 'public', filePath)
        thumbnailPath = await this.generateVideoThumbnail(fullVideoPath, filename)
      }

      // 5. Create standardized metadata
      const metadata = this.createStandardizedMetadata(request, filename, mediaBuffer.length, thumbnailPath)

      // 6. Save metadata file
      await this.saveMetadataFile(metadata, filename, request.mediaType)

      // 7. Save to database
      const dbSuccess = await this.saveToDatabase(metadata, request.mediaType)

      console.log(`✅ MediaSaverService: Successfully saved ${request.mediaType}: ${filename}`)

      return {
        success: true,
        filePath,
        metadata,
        dbSaved: dbSuccess
      }

    } catch (error) {
      console.error(`❌ MediaSaverService: Failed to save ${request.mediaType}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Validate save media request
   */
  private validateRequest(request: SaveMediaRequest): string | null {
    if (!request.mediaUrl) {
      return 'Media URL is required'
    }
    
    if (!isValidMediaUrl(request.mediaUrl)) {
      return 'Invalid media URL format'
    }
    
    if (!request.concept) {
      return 'Concept is required'
    }
    
    if (!request.provider) {
      return 'Provider is required'
    }
    
    if (!request.model) {
      return 'Model is required'
    }
    
    if (!request.requestId) {
      return 'Request ID is required'
    }
    
    if (!request.projectId) {
      return 'Project ID is required'
    }
    
    return null
  }
  
  /**
   * Download media from URL or decode from base64 data URL
   */
  private async downloadMedia(url: string): Promise<Buffer> {
    // Handle base64 data URLs (returned by nano-banana-pro and similar models)
    if (isBase64DataUrl(url)) {
      console.log(`📦 Decoding base64 data URL (${Math.round(url.length / 1024)}KB)`)
      const { buffer } = decodeBase64DataUrl(url)
      return buffer
    }
    
    // Handle http/https URLs
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.status} ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
  
  /**
   * Generate standardized filename
   */
  private generateFilename(request: SaveMediaRequest): string {
    const timestamp = new Date().toISOString()
    const extension = getFileExtension(request.mediaType)
    
    return generateSafeFilename(
      request.concept,
      timestamp,
      extension,
      request.index
    )
  }
  
  /**
   * Save media file to appropriate directory
   */
  private async saveMediaFile(
    mediaBuffer: Buffer, 
    filename: string, 
    mediaType: 'image' | 'video' | 'audio'
  ): Promise<string> {
    const mediaDir = path.join(process.cwd(), 'public', getMediaDirectory(mediaType))
    
    // Ensure directory exists
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true })
    }
    
    const filePath = path.join(mediaDir, filename)
    fs.writeFileSync(filePath, mediaBuffer)
    
    return path.join(getMediaDirectory(mediaType), filename)
  }
  
  /**
   * Create standardized metadata object
   */
  private createStandardizedMetadata(
    request: SaveMediaRequest,
    filename: string,
    fileSize: number,
    thumbnailPath?: string
  ): StandardizedMetadata {
    const now = new Date().toISOString()
    
    // Extract dimensions and duration from API response
    let dimensions = extractDimensionsFromApiResponse(request.apiResponse)
    
    // Log if dimensions are missing for debugging
    if (!dimensions && request.mediaType === 'image') {
      console.warn(`⚠️ No dimensions found in API response for image. API response structure:`, {
        hasImages: !!request.apiResponse?.images,
        imagesLength: Array.isArray(request.apiResponse?.images) ? request.apiResponse.images.length : 0,
        firstImageKeys: request.apiResponse?.images?.[0] ? Object.keys(request.apiResponse.images[0]) : []
      })
    } else if (dimensions) {
      console.log(`📐 Extracted dimensions from API response: ${dimensions.width}x${dimensions.height}`)
    }
    
    const duration = extractDurationFromApiResponse(request.apiResponse)
    
    // Create the new standardized metadata structure
    const standardizedMetadata: StandardizedMetadata = {
      // Core fields (database-compatible)
      id: request.requestId,
      filename,
      title: request.concept,
      description: request.originalPrompt,
      tags: extractTagsFromPrompt(request.originalPrompt),
      createdAt: now,
      updatedAt: now,
      projectId: request.projectId,
      fileSize,
      mediaType: request.mediaType,

      // Add dimensions/duration if available
      ...(dimensions && { dimensions }),
      ...(duration && { duration }),

      // Add thumbnail path for videos
      ...(thumbnailPath && { thumbnailPath }),

      // Provider information
      provider: request.provider,
      model: request.model,
      
      // Standardized generation metadata
      generation: {
        prompt: request.prompt,
        originalPrompt: request.originalPrompt,
        userPrompt: request.userPrompt,
        characterName: request.characterName,
        sceneName: request.sceneName,
        concept: request.concept,
        parameters: cleanMetadataForJson(request.generationParameters),
        results: cleanMetadataForJson(request.generationResults)
      },
      
      // Request metadata
      request: {
        id: request.requestId,
        timestamp: now,
        userAgent: request.userAgent,
        ipAddress: request.ipAddress,
        route: request.apiRoute
      },
      
      // Provider-specific data (preserved)
      providerData: {
        apiResponse: cleanMetadataForJson(request.apiResponse),
        ...cleanMetadataForJson(request.providerSpecificData || {})
      },
      
      // Prompt analysis (if available)
      ...(request.promptComponents && {
        promptAnalysis: {
          components: request.promptComponents,
          metadata: request.promptMetadata || {}
        }
      })
    }
    
    // Create backward-compatible legacy metadata field
    // This preserves the exact structure that existing code expects
    const legacyMetadata = this.createLegacyMetadata(request, standardizedMetadata)
    standardizedMetadata.metadata = legacyMetadata
    
    return standardizedMetadata
  }
  
  /**
   * Create legacy metadata structure for backward compatibility
   */
  private createLegacyMetadata(
    request: SaveMediaRequest,
    standardizedMetadata: StandardizedMetadata
  ): Record<string, unknown> {
    // This creates the exact metadata structure that existing routes expect
    // Ensures backward compatibility with existing database records and frontend code
    
    const baseLegacyMetadata = {
      // Generation parameters
      prompt: request.prompt,
      original_prompt: request.originalPrompt,
      user_prompt: request.userPrompt,
      character_name: request.characterName,
      scene_name: request.sceneName,
      model: request.model,
      concept: request.concept,
      
      // Provider information (NEW - enhanced)
      provider: request.provider,
      
      // Generation results
      ...cleanMetadataForJson(request.generationResults),
      
      // Complete API response (preserved for debugging)
      api_response: cleanMetadataForJson(request.apiResponse),
      
      // Request metadata
      request_id: request.requestId,
      user_agent: request.userAgent,
      ip_address: request.ipAddress,
      
      // Enhanced metadata (NEW)
      generation_route: request.apiRoute,
      generation_timestamp: standardizedMetadata.createdAt,
      
      // Prompt analysis (if available)
      ...(request.promptComponents && { prompt_components: request.promptComponents }),
      ...(request.promptMetadata && { prompt_metadata: request.promptMetadata }),
      
      // Provider-specific data
      ...cleanMetadataForJson(request.providerSpecificData || {}),
      
      // Map FAL URLs for frontend compatibility
      ...(request.providerSpecificData?.falImageUrl && { 
        fal_image_url: request.providerSpecificData.falImageUrl 
      }),
      ...(request.providerSpecificData?.falVideoUrl && { 
        fal_video_url: request.providerSpecificData.falVideoUrl 
      }),
      
      // Dimensions (for backward compatibility)
      ...(standardizedMetadata.dimensions && { dimensions: standardizedMetadata.dimensions })
    }
    
    // Add media-specific fields for backward compatibility
    if (request.mediaType === 'image') {
      // Add image-specific legacy fields
      return {
        ...baseLegacyMetadata,
        // Add any image-specific legacy fields here
        ...cleanMetadataForJson(request.generationParameters)
      }
    } else if (request.mediaType === 'video') {
      // Add video-specific legacy fields
      return {
        ...baseLegacyMetadata,
        generationParams: cleanMetadataForJson(request.generationParameters),
        // Add any video-specific legacy fields here
      }
    } else if (request.mediaType === 'audio') {
      // Add audio-specific legacy fields
      return {
        ...baseLegacyMetadata,
        // Add any audio-specific legacy fields here
        text: request.prompt,
        ...cleanMetadataForJson(request.generationParameters)
      }
    }
    
    return baseLegacyMetadata
  }
  
  /**
   * Save metadata file to appropriate directory
   */
  private async saveMetadataFile(
    metadata: StandardizedMetadata,
    filename: string,
    mediaType: 'image' | 'video' | 'audio'
  ): Promise<void> {
    const metadataDir = path.join(process.cwd(), 'public', getMetadataDirectory(mediaType))
    
    // Ensure directory exists
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true })
    }
    
    const metadataFilename = `${filename}.meta.json`
    const metadataPath = path.join(metadataDir, metadataFilename)
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  }
  
  /**
   * Save to database using existing databaseService
   */
  private async saveToDatabase(
    metadata: StandardizedMetadata,
    mediaType: 'image' | 'video' | 'audio'
  ): Promise<boolean> {
    try {
      const { databaseService } = await import('@/services/databaseService')

      if (mediaType === 'image') {
        return await databaseService.saveImage(metadata)
      } else if (mediaType === 'video') {
        return await databaseService.saveVideo(metadata)
      } else {
        // For audio, treat as image for now (could add audio table later)
        return await databaseService.saveImage(metadata)
      }
    } catch (error) {
      console.error('Error saving to database:', error)
      return false
    }
  }

  /**
   * Generate thumbnail from video first frame
   */
  private async generateVideoThumbnail(
    videoPath: string,
    videoFilename: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const thumbnailFilename = videoFilename.replace(/\.mp4$/, '-thumb.jpg')
        const thumbnailDir = path.join(process.cwd(), 'public/videos/thumbnails')

        // Ensure thumbnails directory exists
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true })
        }

        console.log(`🎬 Generating thumbnail for: ${videoFilename}`)

        ffmpeg(videoPath)
          .screenshots({
            timestamps: ['00:00:00.5'], // Extract frame at 0.5 seconds (skip black intro)
            filename: thumbnailFilename,
            folder: thumbnailDir,
            size: '1920x?', // Maintain aspect ratio, max width 1920px
          })
          .on('end', () => {
            const thumbnailPath = `/videos/thumbnails/${thumbnailFilename}`
            console.log(`✅ Generated thumbnail: ${thumbnailPath}`)
            resolve(thumbnailPath)
          })
          .on('error', (err) => {
            console.error(`❌ Failed to generate thumbnail for ${videoFilename}:`, err)
            // Don't reject - return empty string to continue without thumbnail
            resolve('')
          })
      } catch (error) {
        console.error(`❌ Thumbnail generation error for ${videoFilename}:`, error)
        resolve('') // Don't fail the whole save operation
      }
    })
  }
}

// Global service instance
export const mediaSaverService = new MediaSaverService() 