import fs from 'fs'
import path from 'path'

interface SavedVideoMetadata {
  id: string;
  filename: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fileSize?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Get all saved videos with metadata from all video directories
 */
export function getSavedVideos(): SavedVideoMetadata[] {
  try {
    const baseVideosDir = path.join(process.cwd(), 'public', 'videos')
    
    // Define possible video directories and their corresponding metadata directories
    const videoDirectories = [
      { videoDir: baseVideosDir, metadataDir: path.join(baseVideosDir, 'video-info') },
      { videoDir: path.join(baseVideosDir, 'clips'), metadataDir: path.join(baseVideosDir, 'clips', 'video-info') },
      { videoDir: path.join(baseVideosDir, 'raw'), metadataDir: path.join(baseVideosDir, 'raw', 'video-info') },
    ]
    
    const videos: SavedVideoMetadata[] = []
    
    // Scan each directory for videos
    for (const { videoDir, metadataDir } of videoDirectories) {
      if (!fs.existsSync(metadataDir)) {
        // Silently skip missing metadata directories to reduce log noise
        // console.log(`Video info directory does not exist: ${metadataDir}`)
        continue
      }

      const files = fs.readdirSync(metadataDir)
      const metadataFiles = files.filter(file => file.endsWith('.meta.json'))
      
      for (const file of metadataFiles) {
        try {
          const filePath = path.join(metadataDir, file)
          const content = fs.readFileSync(filePath, 'utf-8')
          const rawMetadata = JSON.parse(content)
          
          // Normalize the metadata to handle different field naming conventions
          const normalizedMetadata = normalizeVideoMetadata(rawMetadata)
          
          // Verify the actual video file exists in the corresponding video directory
          if (normalizedMetadata.filename) {
            const videoPath = path.join(videoDir, normalizedMetadata.filename)
            if (fs.existsSync(videoPath)) {
              // Add relative path info to metadata for proper URL construction
              const relativePath = path.relative(baseVideosDir, videoDir)
              normalizedMetadata.metadata = {
                ...normalizedMetadata.metadata,
                relativePath: relativePath || '',
                originalMetadata: rawMetadata
              }
              videos.push(normalizedMetadata)
            } else {
              // Silently skip missing video files to reduce log noise
              // console.warn(`Video file not found: ${videoPath}`)
            }
          } else {
            console.warn(`No filename found in metadata file: ${file}`)
          }
        } catch (error) {
          console.error(`Error reading video metadata file ${file}:`, error)
        }
      }
    }
    
    // Sort by creation date (newest first)
    videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return videos
  } catch (error) {
    console.error('Error getting saved videos:', error)
    return []
  }
}

/**
 * Normalize video metadata to handle different field naming conventions
 */
function normalizeVideoMetadata(rawMetadata: any): SavedVideoMetadata {
  // Handle different filename field names
  const filename = rawMetadata.filename || rawMetadata.fileName || rawMetadata.file_name
  
  // Handle different timestamp field names
  const createdAt = rawMetadata.createdAt || rawMetadata.generatedAt || rawMetadata.created_at || new Date().toISOString()
  const updatedAt = rawMetadata.updatedAt || rawMetadata.updated_at || createdAt
  
  // Generate ID from filename or use existing ID
  const id = rawMetadata.id || filename?.replace(/\.[^/.]+$/, '') || `video-${Date.now()}`
  
  // Extract title from filename or prompt
  const title = rawMetadata.title || 
                rawMetadata.generationParams?.prompt?.slice(0, 50) + '...' ||
                rawMetadata.prompt?.slice(0, 50) + '...' ||
                filename?.replace(/\.[^/.]+$/, '') || 
                'Untitled Video'
  
  // Extract description from prompt
  const description = rawMetadata.description || 
                     rawMetadata.generationParams?.prompt ||
                     rawMetadata.prompt ||
                     undefined
  
  // Extract project ID
  const projectId = rawMetadata.projectId || 
                   rawMetadata.generationParams?.projectId ||
                   rawMetadata.metadata?.projectId ||
                   'default'
  
  // Extract tags from prompt or use existing tags
  const tags = rawMetadata.tags || extractTagsFromPrompt(description || '')
  
  return {
    id,
    filename,
    title,
    description,
    createdAt,
    updatedAt,
    projectId,
    fileSize: rawMetadata.fileSize,
    tags,
    metadata: {
      model: rawMetadata.model,
      generationParams: rawMetadata.generationParams,
      thumbnailPath: rawMetadata.thumbnailPath, // Include thumbnail path
      ...rawMetadata.metadata,
      // Keep the original metadata for reference
      originalFormat: rawMetadata
    }
  }
}

/**
 * Extract tags from a prompt string
 */
function extractTagsFromPrompt(prompt: string): string[] {
  if (!prompt) return []
  
  // Simple tag extraction - split by common delimiters and clean up
  const words = prompt
    .toLowerCase()
    .split(/[,\s\n\r]+/)
    .map(word => word.trim())
    .filter(word => word.length > 2)
    .slice(0, 10) // Limit to 10 tags
  
  return [...new Set(words)] // Remove duplicates
}

/**
 * Update all existing videos to have a specific project ID
 * @param projectId The project ID to assign to all existing videos
 * @returns Number of videos updated
 */
export function updateAllVideosToProject(projectId: string): number {
  try {
    const baseVideosDir = path.join(process.cwd(), 'public', 'videos')
    
    const videoDirectories = [
      path.join(baseVideosDir, 'video-info'),
      path.join(baseVideosDir, 'clips', 'video-info'),
      path.join(baseVideosDir, 'raw', 'video-info'),
    ]
    
    let updatedCount = 0
    
    for (const infoDir of videoDirectories) {
      if (!fs.existsSync(infoDir)) {
        continue
      }
      
      const files = fs.readdirSync(infoDir)
      const metadataFiles = files.filter(file => file.endsWith('.meta.json'))
      
      metadataFiles.forEach(metaFile => {
        const metadataPath = path.join(infoDir, metaFile)
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
        
        // Only update if projectId is missing or different
        if (!metadata.projectId || metadata.projectId !== projectId) {
          metadata.projectId = projectId
          metadata.updatedAt = new Date().toISOString()
          
          // Write back the updated metadata
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
          updatedCount++
          console.log(`Updated ${metaFile} with projectId: ${projectId}`)
        }
      })
    }
    
    console.log(`Successfully updated ${updatedCount} videos to project: ${projectId}`)
    return updatedCount
    
  } catch (error) {
    console.error('Error updating videos to project:', error)
    return 0
  }
} 