import fs from 'fs'
import path from 'path'

interface ImageMetadata {
  prompt: string
  original_prompt: string
  user_prompt?: string
  character_name?: string
  scene_name?: string
  character_outfit_index?: number
  scene_index?: number
  model: string
  image_size: string
  num_inference_steps?: number | null // Optional for kontext
  guidance_scale: number
  num_images: number
  enable_safety_checker: boolean
  output_format: string
  loras: Array<{ path: string; scale: number }>
  concept: string
  seed?: number
  inference_time?: number
  has_nsfw_concepts?: boolean[]
  api_response: Record<string, unknown>
  user_agent?: string
  ip_address?: string
  request_id: string
  
  // Prompt components for structured prompts
  prompt_components?: {
    masterPrompt?: string
    userInput?: string
    characterDescription?: string
    sceneFoundation?: string
    technicalPhotography?: string
    visualStyleAesthetic?: string
    atmosphericEnvironmental?: string
    supportingElements?: string
    postProcessingEffects?: string
    triggerWords?: string
  }
  
  // Prompt metadata
  prompt_metadata?: {
    charactersUsed?: string[]
    sceneUsed?: string
    wordCount?: number
    budgetCompliant?: boolean
  }
  
  // Kontext-specific fields
  source_image_url?: string
  aspect_ratio?: string
  safety_tolerance?: string
}

/**
 * Downloads an image from a URL and saves it with metadata according to the Flux-Kontext requirements
 * @param imageUrl The URL of the image to download
 * @param metadata The metadata to save with the image
 * @param projectId The project ID to associate with this image
 * @param index Optional index for batch processing
 * @returns The local file path of the saved image
 */
export async function saveImageWithMetadata(
  imageUrl: string, 
  metadata: ImageMetadata, 
  projectId: string = 'default',
  index?: number
): Promise<string> {
  try {
    // Ensure directories exist
    const imageDir = path.join(process.cwd(), 'public', 'images')
    const infoDir = path.join(process.cwd(), 'public', 'images', 'image-info')
    
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true })
    }
    if (!fs.existsSync(infoDir)) {
      fs.mkdirSync(infoDir, { recursive: true })
    }

    // Generate filename based on concept and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeConcept = metadata.concept.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const indexSuffix = index !== undefined ? `-${index.toString().padStart(2, '0')}` : ''
    const filename = `${safeConcept}-${timestamp}${indexSuffix}.jpg`
    
    // Download image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    const imagePath = path.join(imageDir, filename)
    
    // Save image
    fs.writeFileSync(imagePath, Buffer.from(imageBuffer))
    
    // Extract dimensions from API response if available
    let dimensions = undefined;
    if (metadata.api_response?.images && Array.isArray(metadata.api_response.images) && metadata.api_response.images[0]) {
      const imageData = metadata.api_response.images[0] as Record<string, unknown>;
      if (typeof imageData.width === 'number' && typeof imageData.height === 'number') {
        dimensions = {
          width: imageData.width,
          height: imageData.height
        };
      }
    }
    
    // Create metadata object following the existing format
    const metadataObject = {
      id: metadata.request_id,
      filename: filename,
      title: metadata.concept,
      description: metadata.original_prompt,
      tags: extractTagsFromPrompt(metadata.original_prompt),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: projectId, // Use the provided project ID
      fileSize: Buffer.from(imageBuffer).length,
      // Add dimensions at the top level for database compatibility
      ...(dimensions && { dimensions }),
      metadata: {
        // Generation parameters
        prompt: metadata.prompt,
        original_prompt: metadata.original_prompt,
        user_prompt: metadata.user_prompt,
        character_name: metadata.character_name,
        scene_name: metadata.scene_name,
        character_outfit_index: metadata.character_outfit_index,
        scene_index: metadata.scene_index,
        model: metadata.model,
        image_size: metadata.image_size,
        num_inference_steps: metadata.num_inference_steps,
        guidance_scale: metadata.guidance_scale,
        num_images: metadata.num_images,
        enable_safety_checker: metadata.enable_safety_checker,
        output_format: metadata.output_format,
        loras: metadata.loras,
        concept: metadata.concept,
        
        // Generation results
        seed: metadata.seed,
        inference_time: metadata.inference_time,
        has_nsfw_concepts: metadata.has_nsfw_concepts,
        
        // Image dimensions (also stored in metadata for backward compatibility)
        ...(dimensions && { dimensions }),
        
        // URLs and references
        fal_image_url: imageUrl, // Ensure Fal image URL is included
        
        // Prompt components (if present)
        ...(metadata.prompt_components && { prompt_components: metadata.prompt_components }),
        ...(metadata.prompt_metadata && { prompt_metadata: metadata.prompt_metadata }),
        
        // Kontext-specific fields (if present)
        ...(metadata.source_image_url && { source_image_url: metadata.source_image_url }),
        ...(metadata.aspect_ratio && { aspect_ratio: metadata.aspect_ratio }),
        ...(metadata.safety_tolerance && { safety_tolerance: metadata.safety_tolerance }),
        
        // Complete API response
        api_response: metadata.api_response,
        
        // Request metadata
        user_agent: metadata.user_agent,
        ip_address: metadata.ip_address,
        request_id: metadata.request_id
      }
    }
    
    // Save metadata file to image-info directory
    const metadataPath = path.join(infoDir, `${filename}.meta.json`)
    fs.writeFileSync(metadataPath, JSON.stringify(metadataObject, null, 2))
    
    // Save to database
    try {
      const { databaseService } = await import('@/services/databaseService');
      const success = await databaseService.saveImage(metadataObject);
      if (success) {
        console.log(`✅ Image saved to database: ${metadataObject.id}`);
      } else {
        console.warn(`⚠️ Failed to save image to database: ${metadataObject.id}`);
      }
    } catch (error) {
      console.error('Error saving image to database:', error);
    }
    
    console.log(`Image saved: ${imagePath}`)
    console.log(`Metadata saved: ${metadataPath}`)
    
    return path.join('images', filename)
    
  } catch (error) {
    console.error('Error saving image with metadata:', error)
    throw error
  }
}

/**
 * Extract tags from a prompt string
 */
function extractTagsFromPrompt(prompt: string): string[] {
  // Simple tag extraction - split by common delimiters and clean up
  const words = prompt
    .toLowerCase()
    .split(/[,\s\n\r]+/)
    .map(word => word.trim())
    .filter(word => word.length > 2)
    .slice(0, 10) // Limit to 10 tags
  
  return [...new Set(words)] // Remove duplicates
}

interface SavedImageMetadata {
  id: string;
  filename: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fileSize: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Get all saved images with metadata
 */
export function getSavedImages(): SavedImageMetadata[] {
  try {
    const infoDir = path.join(process.cwd(), 'public', 'images', 'image-info')
    
    if (!fs.existsSync(infoDir)) {
      return []
    }
    
    const files = fs.readdirSync(infoDir)
    const metadataFiles = files.filter(file => file.endsWith('.meta.json'))
    
    return metadataFiles.map(metaFile => {
      const metadataPath = path.join(infoDir, metaFile)
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
      return metadata
    })
  } catch (error) {
    console.error('Error getting saved images:', error)
    return []
  }
}

/**
 * Update all existing images to have a specific project ID
 * @param projectId The project ID to assign to all existing images
 * @returns Number of images updated
 */
export function updateAllImagesToProject(projectId: string): number {
  try {
    const infoDir = path.join(process.cwd(), 'public', 'images', 'image-info')
    
    if (!fs.existsSync(infoDir)) {
      console.log('No image metadata directory found')
      return 0
    }
    
    const files = fs.readdirSync(infoDir)
    const metadataFiles = files.filter(file => file.endsWith('.meta.json'))
    
    let updatedCount = 0
    
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
    
    console.log(`Successfully updated ${updatedCount} images to project: ${projectId}`)
    return updatedCount
    
  } catch (error) {
    console.error('Error updating images to project:', error)
    return 0
  }
} 