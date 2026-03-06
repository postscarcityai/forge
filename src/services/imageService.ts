/**
 * Image Service
 * 
 * This service layer mocks what would be actual API calls to your backend.
 * In production, these functions would make HTTP requests to your API endpoints.
 */

import { ImageMetadata, mockImageDatabase } from '@/data/images';
import { dbCache } from '@/lib/indexedDB';
import { databaseService } from './databaseService';

// Simulate network delay for realistic API behavior
const simulateNetworkDelay = (ms: number = 100): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface GeneratedImageResponse {
  id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  projectId: string;
  metadata?: {
    fileSize?: number;
    [key: string]: unknown;
  };
}

/**
 * Get generated images from Fal API
 */
const getGeneratedImages = async (lastSync?: string): Promise<ImageMetadata[]> => {
  try {
    // Use delta sync if lastSync provided, otherwise get all
    const url = lastSync 
      ? `/api/images/sync?lastSync=${encodeURIComponent(lastSync)}`
      : '/api/images/sync?includeAll=true';
      
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success && data.newImages) {
      // Convert generated images to ImageMetadata format
      return data.newImages.map((img: GeneratedImageResponse) => ({
        id: img.id,
        filename: img.filename,
        title: img.title,
        description: img.description,
        tags: img.tags,
        createdAt: new Date(img.createdAt).toISOString(),
        updatedAt: new Date(img.createdAt).toISOString(),
        projectId: img.projectId, // Include project association
        fileSize: img.metadata?.fileSize,
        metadata: img.metadata
      }));
    }
    return [];
  } catch (error) {
    console.warn('Failed to fetch generated images:', error);
    return [];
  }
};

/**
 * Get all images from database for a project (including hidden images)
 * This is needed for the frontend to properly manage hidden/timeline state
 */
export const getAllImagesFromDatabase = async (projectId: string = 'default'): Promise<ImageMetadata[]> => {
  try {
    console.log(`🖼️ Loading all images from database for project: ${projectId}`);
    
    // Include hidden images so frontend can manage complete state
    const response = await fetch(`/api/database/images?projectId=${projectId}&includeHidden=true`);
    const result: ApiResponse<ImageMetadata[]> = await response.json();
    
    if (result.success && result.data) {
      console.log(`✅ Loaded ${result.data.length} images from database (including hidden)`);
      return result.data;
    } else {
      console.error('❌ Failed to load images from database:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading images from database:', error);
    return [];
  }
};

/**
 * Simulated API: Get all images from database (mock + generated)
 * In production: GET /api/images
 */
export const getAllImages = async (lastSync?: string): Promise<ApiResponse<ImageMetadata[]>> => {
  // Create cache key
  const cacheKey = `images:${lastSync || 'all'}`;
  
  try {
    // Try to get from cache first (5 minute TTL for API responses)
    const cachedResponse = await dbCache.getCachedApiResponse('getAllImages', cacheKey);
    if (cachedResponse) {
      return cachedResponse as ApiResponse<ImageMetadata[]>;
    }
    await simulateNetworkDelay(150);
  
    // Get generated images from Fal API (use delta sync if provided)
    const generatedImages = await getGeneratedImages(lastSync);
    
    // For initial load (no lastSync), combine with mock data
    // For delta sync, only return new generated images
    const allImages = lastSync 
      ? generatedImages // Delta: only new generated images
      : [...generatedImages, ...mockImageDatabase]; // Initial: all images
    
    const response: ApiResponse<ImageMetadata[]> = {
      success: true,
      data: allImages,
      timestamp: new Date().toISOString()
    };
    
    // Cache the response (5 minute TTL)
    await dbCache.cacheApiResponse('getAllImages', cacheKey, response, 5 * 60 * 1000);
    
    // Also cache individual images for faster lookups (24 hour TTL) - but only for new images
    if (allImages.length > 0 && !lastSync) {
      // Only cache individual images on initial load, not delta sync
      await dbCache.cacheImages(allImages);
    }
    
    return response;
  } catch (err) {
    console.warn('getAllImages failed:', err);
    
    // Fallback to cache if API fails
    const cachedImages = await dbCache.getAllCachedImages();
    if (cachedImages.length > 0) {
      return {
        success: true,
        data: cachedImages,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      success: false,
      error: 'Failed to fetch images',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Simulated API: Get single image by ID
 * In production: GET /api/images/:id
 */
export const getImageById = async (id: string): Promise<ApiResponse<ImageMetadata>> => {
  try {
    // Try cache first
    const cachedImage = await dbCache.getCachedImage(id);
    if (cachedImage) {
      return {
        success: true,
        data: { ...cachedImage },
        timestamp: new Date().toISOString()
      };
    }
  await simulateNetworkDelay(80);
  
    const image = mockImageDatabase.find(img => img.id === id);
    
    if (!image) {
      return {
        success: false,
        error: `Image with ID ${id} not found`,
        timestamp: new Date().toISOString()
      };
    }
    
    // Cache the image for future requests
    await dbCache.cacheImage(image);
    
    return {
      success: true,
      data: { ...image }, // Clone to prevent mutations
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('❌ getImageById error:', err);
    return {
      success: false,
      error: 'Failed to fetch image',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Simulated API: Get images by tags
 * In production: GET /api/images?tags=tag1,tag2
 */
export const getImagesByTags = async (tags: string[]): Promise<ApiResponse<ImageMetadata[]>> => {
  await simulateNetworkDelay(120);
  
  try {
    const filteredImages = mockImageDatabase.filter(image => 
      image.tags?.some(tag => tags.includes(tag))
    );
    
    return {
      success: true,
      data: filteredImages,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('❌ getImagesByTags error:', err);
    return {
      success: false,
      error: 'Failed to search images by tags',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Simulated API: Search images by title/description
 * In production: GET /api/images/search?q=query
 */
export const searchImages = async (query: string): Promise<ApiResponse<ImageMetadata[]>> => {
  await simulateNetworkDelay(200);
  
  try {
    const lowercaseQuery = query.toLowerCase();
    const filteredImages = mockImageDatabase.filter(image => 
      image.title.toLowerCase().includes(lowercaseQuery) ||
      image.description?.toLowerCase().includes(lowercaseQuery) ||
      image.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    return {
      success: true,
      data: filteredImages,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('❌ searchImages error:', err);
    return {
      success: false,
      error: 'Failed to search images',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Simulated API: Create/upload new image
 * In production: POST /api/images
 */
export const createImage = async (imageData: Omit<ImageMetadata, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ImageMetadata>> => {
  await simulateNetworkDelay(300);
  
  try {
    const newImage: ImageMetadata = {
      ...imageData,
      id: `img-${Date.now()}`, // Generate ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // In a real app, this would persist to database
    // mockImageDatabase.push(newImage);
    
    return {
      success: true,
      data: newImage,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('❌ createImage error:', err);
    return {
      success: false,
      error: 'Failed to create image',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Simulated API: Update image metadata
 * In production: PUT /api/images/:id
 */
export const updateImage = async (id: string, updates: Partial<ImageMetadata>): Promise<ApiResponse<ImageMetadata>> => {
  await simulateNetworkDelay(200);
  
  try {
    const imageIndex = mockImageDatabase.findIndex(img => img.id === id);
    
    if (imageIndex === -1) {
      return {
        success: false,
        error: `Image with ID ${id} not found`,
        timestamp: new Date().toISOString()
      };
    }
    
    const updatedImage: ImageMetadata = {
      ...mockImageDatabase[imageIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // In a real app, this would update the database
    // mockImageDatabase[imageIndex] = updatedImage;
    
    return {
      success: true,
      data: updatedImage,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('❌ updateImage error:', err);
    return {
      success: false,
      error: 'Failed to update image',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Simulated API: Delete image
 * In production: DELETE /api/images/:id
 */
export const deleteImage = async (id: string): Promise<ApiResponse<{ id: string }>> => {
  await simulateNetworkDelay(150);
  
  try {
    const imageIndex = mockImageDatabase.findIndex(img => img.id === id);
    
    if (imageIndex === -1) {
      return {
        success: false,
        error: `Image with ID ${id} not found`,
        timestamp: new Date().toISOString()
      };
    }
    
    // In a real app, this would delete from database
    // mockImageDatabase.splice(imageIndex, 1);
    
    return {
      success: true,
      data: { id },
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('❌ deleteImage error:', err);
    return {
      success: false,
      error: 'Failed to delete image',
      timestamp: new Date().toISOString()
    };
  }
}; 