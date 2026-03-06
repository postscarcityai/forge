import { NextRequest, NextResponse } from 'next/server'
import { getSavedImages } from '@/utils/fal-image-generator'

/**
 * API Endpoint: Sync Generated Images
 * 
 * This endpoint checks for newly generated images and returns them
 * in a format that can be added to the local image context.
 */

interface ImageData {
  id: string;
  title: string;
  description?: string;
  index: number;
  type: 'timeline' | 'gallery';
  createdAt: number;
  filename: string;
  projectId: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface FalMetadata {
  id: string;
  title?: string;
  description?: string;
  filename: string;
  createdAt: string;
  projectId?: string;
  tags?: string[];
  fileSize?: number;
  metadata?: {
    fal_image_url?: string;
    concept?: string;
    prompt?: string;
    original_prompt?: string;
    model?: string;
    [key: string]: unknown;
  };
}

/**
 * Convert FAL metadata to ImageData format
 */
function convertFalMetadataToImageData(falMetadata: FalMetadata, index: number): ImageData {
  return {
    id: falMetadata.id,
    title: falMetadata.title || falMetadata.filename,
    description: falMetadata.description,
    index,
    type: 'gallery', // New images go to gallery (All Images) by default
    createdAt: new Date(falMetadata.createdAt).getTime(),
    filename: falMetadata.filename,
    projectId: falMetadata.projectId || 'default', // Include project association
    tags: falMetadata.tags || [],
    metadata: {
      ...falMetadata.metadata,
      // Include the FAL image URL and generation details
      fal_image_url: falMetadata.metadata?.fal_image_url,
      concept: falMetadata.metadata?.concept,
      prompt: falMetadata.metadata?.prompt,
      original_prompt: falMetadata.metadata?.original_prompt,
      model: falMetadata.metadata?.model,
      fileSize: falMetadata.fileSize
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const lastSync = url.searchParams.get('lastSync') // ISO timestamp
    const includeAll = url.searchParams.get('includeAll') === 'true' // Get all images
    
    // Get all saved images from FAL directory
    const savedImages = getSavedImages()
    
    // Filter for new images since last sync (unless includeAll is true)
    let newImages = savedImages
    if (lastSync && !includeAll) {
      const lastSyncTime = new Date(lastSync).getTime()
      newImages = savedImages.filter(img => {
        const imgTime = new Date(img.createdAt).getTime()
        return imgTime > lastSyncTime
      })
    }
    
    // Convert to ImageData format
    const imageData = newImages.map((img, index) => 
      convertFalMetadataToImageData(img, index)
    )
    
    return NextResponse.json({
      success: true,
      newImages: imageData,
      count: imageData.length,
      lastChecked: new Date().toISOString(),
      message: includeAll 
        ? `Retrieved ${imageData.length} total images`
        : imageData.length > 0 
          ? `Found ${imageData.length} new images` 
          : 'No new images found'
    })
    
  } catch (error) {
    console.error('Error syncing images:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageIds } = body
    
    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid imageIds array' },
        { status: 400 }
      )
    }
    
    // Get all saved images
    const savedImages = getSavedImages()
    
    // Filter for specific image IDs
    const requestedImages = savedImages.filter(img => 
      imageIds.includes(img.id)
    )
    
    // Convert to ImageData format
    const imageData = requestedImages.map((img, index) => 
      convertFalMetadataToImageData(img, index)
    )
    
    return NextResponse.json({
      success: true,
      images: imageData,
      count: imageData.length,
      message: `Retrieved ${imageData.length} images`
    })
    
  } catch (error) {
    console.error('Error retrieving specific images:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 