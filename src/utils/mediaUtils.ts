// Utility functions for media handling in the unified saving system

/**
 * Extract tags from a prompt string
 */
export function extractTagsFromPrompt(prompt: string): string[] {
  if (!prompt) return []
  
  // Simple tag extraction - split by common delimiters and clean up
  const words = prompt
    .toLowerCase()
    .split(/[,\s\n\r]+/)
    .map(word => word.trim())
    .filter(word => word.length > 2 && word.length < 20) // Reasonable word length
    .slice(0, 10) // Limit to 10 tags
  
  return [...new Set(words)] // Remove duplicates
}

/**
 * Extract concept from prompt if not provided
 */
export function extractConceptFromPrompt(prompt: string): string {
  if (!prompt) return 'untitled'
  
  // Take first few words, clean them up
  const concept = prompt
    .split(/[,\n\r.]+/)[0] // Get first sentence/phrase
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .split(/\s+/)
    .slice(0, 3) // Take first 3 words
    .join('-')
    .trim()
  
  return concept || 'untitled'
}

/**
 * Get file extension for media type
 */
export function getFileExtension(mediaType: 'image' | 'video' | 'audio'): string {
  switch (mediaType) {
    case 'image':
      return 'jpg'
    case 'video':
      return 'mp4'
    case 'audio':
      return 'mp3'
    default:
      return 'dat'
  }
}

/**
 * Get appropriate directory for media type
 */
export function getMediaDirectory(mediaType: 'image' | 'video' | 'audio'): string {
  switch (mediaType) {
    case 'image':
      return 'images'
    case 'video':
      return 'videos/clips'
    case 'audio':
      return 'audio'
    default:
      return 'media'
  }
}

/**
 * Get metadata directory for media type
 */
export function getMetadataDirectory(mediaType: 'image' | 'video' | 'audio'): string {
  switch (mediaType) {
    case 'image':
      return 'images/image-info'
    case 'video':
      return 'videos/clips/video-info'
    case 'audio':
      return 'audio/audio-info'
    default:
      return 'media/metadata'
  }
}

/**
 * Generate a safe filename
 */
export function generateSafeFilename(
  concept: string, 
  timestamp: string, 
  extension: string, 
  index?: number
): string {
  const safeConcept = concept.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const safeTimestamp = timestamp.replace(/[:.]/g, '-')
  const indexSuffix = index !== undefined ? `-${index.toString().padStart(2, '0')}` : ''
  
  return `${safeConcept}-${safeTimestamp}${indexSuffix}.${extension}`
}

/**
 * Extract dimensions from API response
 */
export function extractDimensionsFromApiResponse(apiResponse: Record<string, unknown>): { width: number, height: number } | undefined {
  try {
    // Try common patterns for dimensions in API responses
    
    // Pattern 1: images array with width/height
    if (apiResponse.images && Array.isArray(apiResponse.images) && apiResponse.images[0]) {
      const image = apiResponse.images[0] as Record<string, unknown>
      if (typeof image.width === 'number' && typeof image.height === 'number') {
        return { width: image.width, height: image.height }
      }
    }
    
    // Pattern 2: video object with width/height
    if (apiResponse.video && typeof apiResponse.video === 'object') {
      const video = apiResponse.video as Record<string, unknown>
      if (typeof video.width === 'number' && typeof video.height === 'number') {
        return { width: video.width, height: video.height }
      }
    }
    
    // Pattern 3: direct width/height properties
    if (typeof apiResponse.width === 'number' && typeof apiResponse.height === 'number') {
      return { width: apiResponse.width, height: apiResponse.height }
    }
    
    return undefined
  } catch (error) {
    console.warn('Failed to extract dimensions from API response:', error)
    return undefined
  }
}

/**
 * Extract duration from API response (for video/audio)
 */
export function extractDurationFromApiResponse(apiResponse: Record<string, unknown>): number | undefined {
  try {
    // Pattern 1: video object with duration
    if (apiResponse.video && typeof apiResponse.video === 'object') {
      const video = apiResponse.video as Record<string, unknown>
      if (typeof video.duration === 'number') {
        return video.duration
      }
    }
    
    // Pattern 2: audio object with duration
    if (apiResponse.audio && typeof apiResponse.audio === 'object') {
      const audio = apiResponse.audio as Record<string, unknown>
      if (typeof audio.duration === 'number') {
        return audio.duration
      }
    }
    
    // Pattern 3: direct duration property
    if (typeof apiResponse.duration === 'number') {
      return apiResponse.duration
    }
    
    return undefined
  } catch (error) {
    console.warn('Failed to extract duration from API response:', error)
    return undefined
  }
}

/**
 * Check if URL is a base64 data URL
 */
export function isBase64DataUrl(url: string): boolean {
  return url.startsWith('data:image/') || url.startsWith('data:video/') || url.startsWith('data:audio/')
}

/**
 * Extract buffer from base64 data URL
 * Uses indexOf for large strings to avoid regex backtracking issues
 */
export function decodeBase64DataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
  // Use string methods instead of regex to avoid stack overflow with large data
  const dataPrefix = 'data:'
  const base64Marker = ';base64,'
  
  if (!dataUrl.startsWith(dataPrefix)) {
    throw new Error('Invalid base64 data URL format: missing data: prefix')
  }
  
  const base64Index = dataUrl.indexOf(base64Marker)
  if (base64Index === -1) {
    throw new Error('Invalid base64 data URL format: missing ;base64, marker')
  }
  
  const mimeType = dataUrl.substring(dataPrefix.length, base64Index)
  const base64Data = dataUrl.substring(base64Index + base64Marker.length)
  const buffer = Buffer.from(base64Data, 'base64')
  
  return { buffer, mimeType }
}

/**
 * Validate media URL (supports http/https URLs and base64 data URLs)
 */
export function isValidMediaUrl(url: string): boolean {
  // Check for base64 data URLs
  if (isBase64DataUrl(url)) {
    return true
  }
  
  // Check for http/https URLs
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Get MIME type for media type
 */
export function getMimeType(mediaType: 'image' | 'video' | 'audio'): string {
  switch (mediaType) {
    case 'image':
      return 'image/jpeg'
    case 'video':
      return 'video/mp4'
    case 'audio':
      return 'audio/mpeg'
    default:
      return 'application/octet-stream'
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Clean metadata for JSON serialization
 */
export function cleanMetadataForJson(metadata: Record<string, unknown>): Record<string, unknown> {
  try {
    // Convert to JSON and back to remove undefined values and clean up
    return JSON.parse(JSON.stringify(metadata))
  } catch {
    return metadata
  }
} 